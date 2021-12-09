module.exports = function (app) {
    app.directive('userSubscriptionDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('user-subscription-template.html'),
            replace: true,
            bindToController: true,
            controller: 'userSubscriptionDirectiveCtrl',
            controllerAs: 'ctrl',
            scope: true
        }
    })
};
