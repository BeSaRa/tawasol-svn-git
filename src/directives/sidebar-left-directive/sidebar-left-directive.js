module.exports = function (app) {
    app.directive('sidebarLeftDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: 'sidebarLeftDirectiveCtrl',
            controllerAs: 'sidebar',
            template: cmsTemplate.getDirective('sidebar-left-directive/sidebar-left-template')
        }
    });
};
