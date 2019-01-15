module.exports = function (app) {
    app.directive('sidebarRightDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: 'sidebarRightDirectiveCtrl',
            controllerAs: 'ctrl',
            templateUrl: cmsTemplate.getDirective('sidebar-right-template.html')
        }
    })
};
