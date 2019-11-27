module.exports = function (app) {
    app.controller('organizationsCtrl', function (organizationService,
                                                  _,
                                                  cmsTemplate,
                                                  $scope,
                                                  dialog,
                                                  $element,
                                                  toast,
                                                  organizations,
                                                  organizationChartService,
                                                  langService,
                                                  referencePlanNumberService,
                                                  contextHelpService) {
        'ngInject';
        var self = this;
        self.controllerName = 'organizationsCtrl';
        organizationChartService.createHierarchy(organizations);
        self.organizationChartService = organizationChartService;
        self.selectedFilter = self.organizationChartService.rootOrganizations;

        contextHelpService.setHelpTo('organizations');

        self.needSync = _checkOrganizationsNeedSync(organizations);


        function _checkOrganizationsNeedSync(organizations) {
            return _.some(organizations, function (org) {
                return !org.isFnSynched;
            });
        }


        self.reloadOrganizations = function () {
            return referencePlanNumberService
                .loadReferencePlanNumbers()
                .then(function () {
                    organizationService
                        .loadAllOrganizationsStructure()
                        .then(function (result) {
                            self.needSync = _checkOrganizationsNeedSync(result);
                            organizationChartService.createHierarchy(result);
                            self.selectedFilter = self.organizationChartService.rootOrganizations;
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
                self.selectedFilter = [selected];
            } else {
                self.selectedFilter = self.organizationChartService.rootOrganizations;
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
                self.reloadOrganizations().then(function () {
                    toast.success(langService.get('organizations_synced_done'));
                });
            }).catch(function (error) {
                toast.error(encodeURI(error.data.eo[langService.current + 'Name']));
            })
        };

        self.resetView = function () {
            $element.find('.orgchart').css('transform', '');
        };

        $scope.$watch(function () {
            return self.selectedItem;
        }, function (newVal) {
            self.selectedItemChange(newVal);
        })


    });
};
