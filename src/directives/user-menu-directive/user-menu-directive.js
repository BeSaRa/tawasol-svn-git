module.exports = function (app) {
    app.directive('userMenuDirective', function (cmsTemplate) {
        'ngInject';
        return {
            replace: true,
            restrict: 'E',
            controller: 'userMenuDirectiveCtrl',
            controllerAs: 'userMenu',
            template: cmsTemplate.getDirective('user-menu-directive/user-menu-template')
        }
    });


};