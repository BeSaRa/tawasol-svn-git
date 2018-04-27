module.exports = function (app) {
    app.directive('magazineIndicator', function () {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'magazineIndicatorCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            template: require('./magazine-template.html'),
            scope: {
                model: '=',
                icon: '@',
                showTooltip: '=',
                callback: '=',
                keyCallback: '=',
                showKey: '=',
                color: '@'
            }
        }
    })
};