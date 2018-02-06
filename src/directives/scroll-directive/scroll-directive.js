module.exports = function (app) {
    require('./scroll-directive-style.scss');
    app.directive('scrollDirective', function (perfectScrollbar, $timeout, langService) {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, ele, attrs) {
                var status = true;
                var element = ele[0];

                ele.addClass('scrollable-element');

                perfectScrollbar.initialize(element);

                ele.on('mouseenter', function () {
                    perfectScrollbar.update(element);
                });

                if (attrs.destroyScroll) {
                    scope.$watch('destroyScroll', function (value) {
                        scope.destroyScroll = value;
                        if (value === true && status) {
                            perfectScrollbar.destroy(element);
                            status = !status;
                            ele.removeClass('scrollable-element');
                        } else if (value === false && !status) {
                            ele.addClass('scrollable-element');
                            perfectScrollbar.initialize(element);
                            status = !status;
                        }
                    });
                }


                function _destroy() {
                    return $timeout(function () {
                        perfectScrollbar.destroy(element);
                    });
                }

                function _create() {
                    return $timeout(function () {
                        perfectScrollbar.initialize(element);
                    })
                }

                scope.$watch(function () {
                    langService.current
                }, function () {
                    _destroy().then(function () {
                        _create();
                    });
                });
            }
        }
    })
};