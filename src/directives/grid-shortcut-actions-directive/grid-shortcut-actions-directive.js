module.exports = function (app) {
    require('./grid-shortcut-actions-style.scss');
    app.directive('gridShortcutActionsDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('grid-shortcut-actions-template.html'),
            controller: 'gridShortcutActionsDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                model: '=',
                actions: '=?'
            }
        }
    })
};
