module.exports = function (app) {
    require('./legend-indicators-style.scss');
    app.directive('legendIndicatorsDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('legend-indicators-template.html'),
            controller: 'legendIndicatorsDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            scope: {
                gridLegends: '=',
                visibleCount: '@?'
            }
        }
    })
};
