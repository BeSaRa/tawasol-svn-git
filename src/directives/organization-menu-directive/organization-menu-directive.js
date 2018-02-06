module.exports = function (app) {
    app.directive('organizationMenuDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            template: require('./organization-menu-template.html'),
            scope: {
                node: '='
            },
            controller: 'organizationMenuDirectiveCtrl',
            controllerAs: 'orgMenuCtrl',
            bindToController: true
        }
    })
};