module.exports = function (app) {
    app.directive('organizationHierarchyViewDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('organization-hierarchy-view-template.html'),
            controller: 'organizationHierarchyViewDirectiveCtrl',
            controllerAs: 'ctrl'
        }
    });
};
