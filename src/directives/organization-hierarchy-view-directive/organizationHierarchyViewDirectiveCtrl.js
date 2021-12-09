module.exports = function (app) {
    app.controller('organizationHierarchyViewDirectiveCtrl', function (organizationChartService,
                                                                       rootEntity,
                                                                       Entity,
                                                                       organizationService) {
        'ngInject';
        var self = this;
        self.controllerName = 'organizationHierarchyViewDirectiveCtrl';

        self.organizations = organizationChartService.createHierarchy(organizationService.organizations);

        self.root = new Entity(angular.copy(rootEntity.returnRootEntity().rootEntity));

        self.root.children = self.organizations;

        self.root.itIsRoot = true;
        

    });
};