module.exports = function (app) {
    app.directive('capsLockDetectionDirective', function ($timeout) {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element) {

                element[0].addEventListener('keydown', function (event) {
                    if (typeof event.getModifierState === 'function') {
                        $timeout(function () {
                            scope.capsLockOn = event.getModifierState("CapsLock");
                        });
                    }
                }, true);
                element[0].addEventListener('click', function (event) {
                    if (typeof event.getModifierState === 'function') {
                        $timeout(function () {
                            scope.capsLockOn = event.getModifierState("CapsLock");
                        });
                    }
                }, true);

            }
        }
    })
};
