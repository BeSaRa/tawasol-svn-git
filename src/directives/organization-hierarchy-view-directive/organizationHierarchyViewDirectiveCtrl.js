module.exports = function (app) {
    app.controller('organizationHierarchyViewDirectiveCtrl', function (organizationChartService,
                                                                       organizationService) {
        'ngInject';
        var self = this;
        self.controllerName = 'organizationHierarchyViewDirectiveCtrl';

        self.organizations = organizationChartService.createHierarchy(organizationService.organizations);



    });
};