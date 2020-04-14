module.exports = function (app) {
    app.directive('tableHeightDirective', function ($window, $timeout) {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element) {

                $timeout(function () {
                    _calculate();
                },1000);

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


            }
        }
    })
};
