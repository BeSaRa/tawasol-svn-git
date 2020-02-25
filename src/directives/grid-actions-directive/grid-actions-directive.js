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
                contextActions: '=?',
                actionsDirection: '@?',
                model: '=',
                shortcutActions: '=?',
                gridActionRowClass: '@?'
            },
            link: function (scope, elem, attrs, controller) {
                controller.actionsDirection = controller.actionsDirection || 'horizontal';
                controller.gridActionsCopy = angular.copy(controller.gridActions);
            }
        }
    })
};
