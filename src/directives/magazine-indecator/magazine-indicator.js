module.exports = function (app) {
    app.directive('magazineIndicator', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'magazineIndicatorCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            templateUrl: cmsTemplate.getDirective('magazine-indicator-template.html'),
            scope: {
                // the workItem or the Correspondence model
                model: '=',
                // lang key to display it before value of indicator
                key: '@?',
                // the icon for the indicator
                icon: '@',
                // tooltip to diplay it when user hover on the indicator [ it is working when no key provide]
                showTooltip: '=',
                // the call back for display the value of the indicator
                callback: '=',
                // color of the icon
                color: '@?',
                // color callback to display the color for icon depend on some conditions it  takes the model as params.
                colorCallback: '=',
                // icon callback to diplay the icon depend on some conditions it takes the model as params.
                iconCallback: '='
            }
        }
    })
};
