module.exports = function (app) {
    app
        .directive('enterSubmitDirective', function () {
            'ngInject';
            return function (scope, element, attrs, ctrl) {
                var form = angular.element(element);
                form.on('keydown', function (e) {
                    var code = e.keyCode || e.which;
                    if (code === 13) {
                        e.preventDefault();
                        angular.element('#' + attrs.enterSubmitDirective).click();
                    }
                });
            }
        })
        .directive('ngEnter', function () {
            'ngInject';
            return function (scope, element, attrs) {
                element.on('keydown keypres', function (e) {
                    var code = e.keyCode || e.which;
                    if (code === 13) {
                        scope.$apply(function () {
                            scope.$eval(attrs.ngEnter);
                        });
                        e.preventDefault();
                    }
                })
            }
        })
};