module.exports = function (app) {
    app.directive('magazineIndicator', function () {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'magazineIndicatorCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            template: require('./magazine-indicator-template.html'),
            scope: {
                model: '=',
                key: '@?',
                icon: '@',
                showTooltip: '=',
                callback: '=',
                color: '@?',
                colorCallback: '='
            }
        }
    })
};