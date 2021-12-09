module.exports = function (app) {
    require('./organization-chart-d-3-style.scss');
    app.directive('organizationChartD3Directive', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: 'organizationChartD3DirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                reloadCallback: '='
            },
            templateUrl: cmsTemplate.getDirective('organization-chart-d-3-directive-template.html')
        }
    })
};
