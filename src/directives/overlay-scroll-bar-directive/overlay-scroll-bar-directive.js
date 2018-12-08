module.exports = function (app) {
    require('overlayscrollbars/css/OverlayScrollbars.min.css');
    require('overlayscrollbars/js/OverlayScrollbars.min');
    app.directive('overlayScrollBarDirective', function () {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                OverlayScrollbars(element, {
                    scrollbars: {
                        autoHide: 'leave',
                        autoHideDelay: 300
                    }
                });
            }
        }
    })
};