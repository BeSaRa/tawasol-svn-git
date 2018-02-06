module.exports = function (app) {
    app.directive('sidebarRightDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: 'sidebarRightDirectiveCtrl',
            controllerAs: 'ctrl',
            template: require('./sidebar-right-template.html')
        }
    })
};