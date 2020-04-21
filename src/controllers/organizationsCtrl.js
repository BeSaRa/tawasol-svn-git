module.exports = function (app) {
    app.controller('organizationsCtrl', function (organizationService,
                                                  $scope,
                                                  _,
                                                  cmsTemplate,
                                                  dialog,
                                                  $element,
                                                  toast,
                                                  organizations,
                                                  organizationChartService,
                                                  langService,
                                                  referencePlanNumberService,
                                                  contextHelpService,
                                                  $timeout) {
        'ngInject';
        var self = this;
        self.controllerName = 'organizationsCtrl';
        organizationChartService.createHierarchy(organizations);
        self.organizationChartService = organizationChartService;
        self.selectedFilter = self.organizationChartService.rootOrganizations;
        self.selectedItem = null;
        contextHelpService.setHelpTo('organizations');

        self.needSync = _checkOrganizationsNeedSync(organizations);

        self.organizationsList = angular.copy(organizations);

        self.resetView = false; // set to true when reset view button is clicked.

        self.selectedTabIndex = 0;
        self.selectedTabName = "chart";
        self.tabsToShow = [
            'chart',
            'grid'
        ];
        self.showTab = function (tabName) {
            return self.tabsToShow.indexOf(tabName) > -1;
        };

        /**
         * @description Set the current tab name
         * @param tabName
         */
        self.setCurrentTab = function (tabName) {
            self.selectedTabName = tabName;
        };

        function _checkOrganizationsNeedSync(organizations) {
            return _.some(organizations, function (org) {
                return !org.isFnSynched;
            });
        }


        self.reloadOrganizations = function (ignoreLoadOrganizations) {
            return referencePlanNumberService
                .loadReferencePlanNumbers()
                .then(function () {
                    if (ignoreLoadOrganizations)
                        return;
                    return organizationService
                        .loadAllOrganizationsStructure()
                        .then(function (result) {
                            self.needSync = _checkOrganizationsNeedSync(result);
                            self.organizationsList = angular.copy(result);
                            $scope.$broadcast('organizations-loaded');
                            return result;
                        });
                })
        };

        self.selectOrganizationToAdd = function () {
            return dialog
                .showDialog({
                    controller: function () {

                    },
                    templateUrl: cmsTemplate.getPopup('select-organization')
                })
        };

        self.exportOrganizations = function () {
            organizationService
                .exportOrganizations()
                .then(function (result) {
                    window.open(result.data.rs);
                });
        };

        self.importOrganizations = function ($event) {
            organizationService
                .controllerMethod
                .organizationImport($event)
                .then(function (result) {

                });
        };

        self.selectedItemChange = function (selected) {
            if (selected) {
                self.reloadOrganizations(true).then(function () {
                    organizationService.loadHierarchy(selected).then(function (result) {
                        organizationChartService.createHierarchy(result, selected);
                        self.selectedFilter = self.organizationChartService.rootOrganizations;
                    });
                });
            } else {
                self.reloadOrganizations(false);
            }
        };

        self.querySearch = function (searchText) {
            if (!searchText)
                return organizationService.allOrganizationsStructure;
            searchText = searchText.toLowerCase();
            return _.filter(organizationService.allOrganizationsStructure, function (item) {
                return item.arName.toLowerCase().indexOf(searchText) !== -1 || item.enName.toLowerCase().indexOf(searchText) !== -1
            });
        };

        self.syncOrganizations = function () {
            organizationService.syncFNOrganizations().then(function () {
                self.reloadOrganizations(false).then(function () {
                    toast.success(langService.get('organizations_synced_done'));
                });
            }).catch(function (error) {
                toast.error(encodeURI(error.data.eo[langService.current + 'Name']));
            })
        };

        self.resetViewCallback = function () {
            $element.find('.orgchart').css('transform', '');

            // set reset view = true to inform internal directive to take action
            self.resetView = true;

            $timeout(function () {
                self.resetView = false;
            });
        };

    });
};
