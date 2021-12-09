module.exports = function (app) {
    require('./grid-context-menu-style.scss');
    app.directive('gridContextMenuDirective', function () {
        'ngInject';
        return {
            restrict: 'A',
            controller: 'gridContextMenuDirectiveCtrl',
            controllerAs: 'contextCtrl'
        }
    }).directive('mdMenuDefaultScroll', function ($window) {
        'ngInject';
        return {
            restrict: 'AC',
            link: function (scope, element, attrs) {
                var menuListener = scope.$on('$mdMenuOpen', () => {
                    $window.requestAnimationFrame(() => {
                        // Using parent() method to get parent wrapper with .md-open-menu-container class and adding custom class.
                        element.parent().addClass('menu-default-scroll');
                        menuListener();
                    });
                });
            }
        }
    })
};
