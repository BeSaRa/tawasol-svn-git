module.exports = function (app) {
    app.directive('tableHeightDirective', function ($window) {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element) {
                var position = angular.element(element).offset();

                var mHeight = position.top + 70;
                _calculate();

                function _calculate() {
                    element.css({
                        overflow: 'auto',
                        maxHeight: (window.innerHeight - mHeight)
                    });
                }

                $window.addEventListener('resize', _calculate);
                element.on('$destroy', function () {
                    $window.removeEventListener('resize', _calculate);
                });


            }
        }
    })
};
