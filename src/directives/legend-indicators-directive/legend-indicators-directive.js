module.exports = function (app) {
    app.directive('legendIndicatorsDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'legendIndicatorsDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            templateUrl: cmsTemplate.getDirective('legend-indicators-template.html'),
            scope: {
                gridLegends: '=',
                visibleCount: '@?'
            }
        }
    })
};