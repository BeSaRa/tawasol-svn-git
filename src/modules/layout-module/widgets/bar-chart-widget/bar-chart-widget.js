module.exports = function (app) {
    app.directive('barChartWidget', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./bar-chart-widget-template.html'),
            replace: true,
            controller: 'barChartWidgetCtrl',
            controllerAs: 'ctrl'
        }
    })
};