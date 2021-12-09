module.exports = function (app) {
    app.directive('tableHeightDirective', function ($window, $interval, $timeout) {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element) {
                var dispatchCount = 0;
                $timeout(function () {
                    _calculate();
                }, 1000);

                function _calculate() {
                    var position = angular.element(element).offset();

                    var mHeight = position.top + 70;
                    element.css({
                        overflow: 'auto',
                        maxHeight: (window.innerHeight - mHeight)
                    });
                }

                $window.addEventListener('resize', _calculate);
                element.on('$destroy', function () {
                    $window.removeEventListener('resize', _calculate);
                });

                var intervalID = $interval(function () {
                    $window.dispatchEvent(new Event('resize'));
                    ++dispatchCount;
                    if (dispatchCount === 5) {
                        $interval.cancel(intervalID);
                    }
                }, 2000);
            }
        }
    })
};
