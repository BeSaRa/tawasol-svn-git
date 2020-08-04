module.exports = function (app) {
    require('./grid-context-menu-style.scss');
    app.directive('gridContextMenuDirective', function () {
        'ngInject';
        return {
            restrict: 'A',
            controller: 'gridContextMenuDirectiveCtrl',
            controllerAs: 'contextCtrl'
        }
    })
};
