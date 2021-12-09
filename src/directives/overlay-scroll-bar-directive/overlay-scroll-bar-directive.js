module.exports = function (app) {
    require('overlayscrollbars/css/OverlayScrollbars.min.css');
    require('overlayscrollbars/js/OverlayScrollbars.min');
    app.directive('overlayScrollBarDirective', function (langService) {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                OverlayScrollbars(element, {
                    scrollbars: {
                        autoHide: 'leave',
                        autoHideDelay: 300
                    },
                    callbacks: {
                        onScroll: function (e) {
                            var table = element.parent().find('table:not(.clone)');
                            if (!table) {
                                return;
                            }
                            var scrollValue = e.srcElement.scrollLeft,
                                viewport = element.width(),
                                tableWidth = table.width();

                            scrollValue = langService.current === 'en' ? -scrollValue : ((tableWidth - viewport) - scrollValue);

                            angular
                                .element(element.parent().find('table.clone thead'))
                                .css({
                                    transform: 'translateX(' + scrollValue + 'px)'
                                });
                        }
                    }
                });
            }
        }
    })
};
