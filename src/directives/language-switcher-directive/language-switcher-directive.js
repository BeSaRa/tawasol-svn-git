module.exports = function (app) {
    app.directive('languageSwitcherDirective', function (cmsTemplate) {
        'ngInject';
        return {
            replace: true,
            restrict: 'E',
            controller: 'languageSwitcherDirectiveCtrl',
            controllerAs: 'language',
            templateUrl: cmsTemplate.getDirective('language-switcher-template')
        }
    })
};
