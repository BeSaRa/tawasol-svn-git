module.exports = function (app) {
    app.directive('organizationMenuDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            templateUrl: cmsTemplate.getDirective('organization-menu-template.html'),
            scope: {
                node: '=',
                orgChart: '=',
                reloadCallback: '&'
            },
            controller: 'organizationMenuDirectiveCtrl',
            controllerAs: 'orgMenuCtrl',
            bindToController: true
        }
    })
};
