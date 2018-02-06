module.exports = function (app) {
    require('./organization-without-reg-tree-view-style.scss');
    app.directive('organizationWithoutRegTreeViewDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'organizationWithoutRegTreeViewDirectiveCtrl',
            controllerAs: 'ctrl',
            template: require('./organization-without-reg-tree-view-template.html'),
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