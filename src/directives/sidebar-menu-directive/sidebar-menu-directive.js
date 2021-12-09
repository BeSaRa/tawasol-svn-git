module.exports = function (app) {
    require('./sidebar-menu-style.scss');
    app.directive('sidebarMenuDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: "E",
            replace: true,
            templateUrl: cmsTemplate.getDirective('sidebar-menu-template.html'),
            scope: {
                items: '=',
                lang: '=',
                level: '=',
                search: '='
            },
            controller: 'sidebarMenuDirectiveCtrl',
            controllerAs: 'menu',
            bindToController: true
        };

    });
};
