module.exports = function (app) {
    require('./organization-without-reg-tree-view-style.scss');
    app.directive('organizationWithoutRegTreeViewDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'organizationWithoutRegTreeViewDirectiveCtrl',
            controllerAs: 'ctrl',
            templateUrl: cmsTemplate.getDirective('organization-without-reg-tree-view-template.html'),
            bindToController: true,
            scope: {
                ouApplicationUsers: '=',
                selectedNode: '=',
                organizations: '=',
                selectedOrganizations: '=selectedOrganizations'
            }
        };
    });
};
