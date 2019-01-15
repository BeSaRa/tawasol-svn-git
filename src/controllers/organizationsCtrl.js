module.exports = function (app) {
    app.controller('organizationsCtrl', function (organizationService,
                                                  _,
                                                  cmsTemplate,
                                                  $scope,
                                                  dialog,
                                                  organizations,
                                                  organizationChartService,
                                                  referencePlanNumberService,
                                                  contextHelpService) {
        'ngInject';
        var self = this;
        self.controllerName = 'organizationsCtrl';
        organizationChartService.createHierarchy(organizations);
        self.organizationChartService = organizationChartService;
        self.selectedFilter = self.organizationChartService.rootOrganizations;

        contextHelpService.setHelpTo('organizations');

        self.reloadOrganizations = function () {
            return referencePlanNumberService
                .loadReferencePlanNumbers()
                .then(function () {
                    organizationService
                        .loadOrganizations()
                        .then(function (result) {
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
                return organizationService.organizations;
            searchText = searchText.toLowerCase();
            return _.filter(organizationService.organizations, function (item) {
                return item.arName.toLowerCase().indexOf(searchText) !== -1 || item.enName.toLowerCase().indexOf(searchText) !== -1
            });
        };

        $scope.$watch(function () {
            return self.selectedItem;
        }, function (newVal) {
            self.selectedItemChange(newVal);
        })


    });
};
