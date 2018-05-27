module.exports = function (app) {
    app.directive('userSubscriptionDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./user-subscription-template.html'),
            replace: true,
            bindToController: true,
            controller: 'userSubscriptionDirectiveCtrl',
            controllerAs: 'ctrl',
            scope: true
        }
    })
};