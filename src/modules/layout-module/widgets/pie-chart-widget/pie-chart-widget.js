module.exports = function (app) {
    app.directive('pieChartWidget', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./pie-chart-widget-template.html'),
            replace: true,
            controller: 'pieChartWidgetCtrl',
            controllerAs: 'ctrl',
            link: function (scope) {

            }
        }
    })
};