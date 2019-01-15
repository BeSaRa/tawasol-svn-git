module.exports = function (app) {
    require('./grid-indicator-directive-style.scss');
    app.directive('gridIndicatorDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('grid-indicator-template.html'),
            controller: 'gridIndicatorDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                record: '=',
                indicatorType: '@',
                recordType: '=',
                showIndicator: '@?',
                spanClass: '@?',
                iconClass: '@?',
                displayType: '@?',
                callback: '='
            }
        }
    })
};
