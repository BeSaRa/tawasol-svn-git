module.exports = function (app) {
    app.controller('organizationMenuDirectiveCtrl', function ($scope,
                                                              langService,
                                                              referencePlanNumberService,
                                                              organizationService,
                                                              $rootScope,
                                                              $element) {
        'ngInject';
        var self = this;
        self.controllerName = 'organizationMenuDirectiveCtrl';
        $scope.lang = langService.getCurrentTranslate();

        self.openAddDialog = function (organization, $event) {
            self.chartElement = $element.parents('.orgchart');
            self.style = self.chartElement.attr('style');
            organizationService
                .controllerMethod
                .organizationAdd(organization, $event)
                .then(function () {
                    self.chartElement.attr('style', self.style);
                })
                .catch(function () {
                    self.chartElement.attr('style', self.style);
                });
        };

        self.openEditDialog = function (organization, $event) {
            organizationService
                .controllerMethod
                .organizationEdit(organization, $event)
                .then(function () {
                    referencePlanNumberService
                        .loadReferencePlanNumbers()
                        .then(function () {
                            organizationService.loadOrganizations();
                        })
                })
                .catch(function () {

                })
        };

        self.deleteOrganizationFromCtrl = function (organization, $event) {
            organizationService
                .controllerMethod
                .organizationDelete(organization, $event)
        }


    });
};