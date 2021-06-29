module.exports = function (app) {
    app.directive('mainSiteSubSiteDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('main-site-sub-site-directive.html'),
            controller: 'mainSiteSubSiteDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            scope: {
                item: '=',
                type: '@?',
                showIndicator: '='
            }
        }
    });
};
