module.exports = function (app) {
    require('./organization-node-style.scss');
    app.directive('organizationNodeDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'organizationNodeDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            template: require('./organization-node-template.html'),
            scope: {
                node: '='
            }
        }
    })
};