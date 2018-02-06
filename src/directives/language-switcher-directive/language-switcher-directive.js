module.exports = function (app) {
    app.directive('languageSwitcherDirective', function (cmsTemplate) {
        'ngInject';
        return {
            replace: true,
            restrict: 'E',
            controller: 'languageSwitcherDirectiveCtrl',
            controllerAs: 'language',
            template: cmsTemplate.getDirective('language-switcher-directive/language-switcher-template')
        }
    })
};