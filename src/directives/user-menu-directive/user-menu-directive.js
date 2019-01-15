module.exports = function (app) {
    app.directive('userMenuDirective', function (cmsTemplate) {
        'ngInject';
        return {
            replace: true,
            restrict: 'E',
            controller: 'userMenuDirectiveCtrl',
            controllerAs: 'userMenu',
            templateUrl: cmsTemplate.getDirective('user-menu-template')
        }
    });


};
