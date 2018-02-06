module.exports = function (app) {
    require('./sidebar-menu-style.scss');
    app.directive('sidebarMenuDirective', function () {
        'ngInject';
        return {
            restrict: "E",
            replace: true,
            template: require('./sidebar-menu-template.html'),
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