module.exports = function (app) {
    require('./grid-actions-directive-style.scss');
    app.directive('gridActionsDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('grid-actions-template.html'),
            controller: 'gridActionsDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                gridActions: '=',
                menuDirection: '@',
                model:'=',
                shortcut: '='
            }
        }
    })
};
