module.exports = function (app) {
    require('./organization-node-style.scss');
    app.directive('organizationNodeDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'organizationNodeDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            templateUrl: cmsTemplate.getDirective('organization-node-template.html'),
            scope: {
                node: '='
            }
        }
    })
};
