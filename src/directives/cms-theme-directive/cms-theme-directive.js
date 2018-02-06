module.exports = function (app) {
    app.directive('cmsThemeDirective', function () {
        'ngInject';
        return {
            restrict: 'A',
            controller: 'cmsThemeDirectiveCtrl',
            controllerAs: 'ctrl',
            scope: true
        }
    })
};