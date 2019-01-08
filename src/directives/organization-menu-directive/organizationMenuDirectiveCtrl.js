module.exports = function (app) {
    app.controller('organizationMenuDirectiveCtrl', function ($scope,
                                                              langService,
                                                              referencePlanNumberService,
                                                              organizationService,
                                                              organizationChartService,
                                                              $element,
                                                              helper,
                                                              $q) {
        'ngInject';
        var self = this;
        self.controllerName = 'organizationMenuDirectiveCtrl';
        $scope.lang = langService.getCurrentTranslate();

        self.openAddDialog = function (organization, $event) {
            organizationService
                .controllerMethod
                .organizationAdd(organization, $event)
                .finally(function () {
                    self.reloadCallback();
                });
        };

        self.openEditDialog = function (organization, $event) {
            organizationService
                .controllerMethod
                .organizationEdit(organization, $event)
                .then(function () {
                    self.reloadCallback();
                })
        };

        self.deleteOrganizationFromCtrl = function (organization, $event) {
            organizationService
                .controllerMethod
                .organizationDelete(organization, $event)
        };


        $scope.$on('$destroy', function () {
            console.log("Destroy");
        });

    });
};
