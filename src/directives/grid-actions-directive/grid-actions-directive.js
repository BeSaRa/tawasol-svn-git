module.exports = function (app) {
    require('./grid-actions-directive-style.scss');
    app.directive('gridActionsDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./grid-actions-template.html'),
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