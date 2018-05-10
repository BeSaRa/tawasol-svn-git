module.exports = function (app) {
    app
        .directive('enterSubmitDirective', function () {
            'ngInject';
            return function (scope, element, attrs, ctrl) {
                var form = angular.element(element);
                var formInScope = scope[attrs.name];
                form.on('keydown', function (e) {
                    var code = e.keyCode || e.which;
                    if (code === 13 && formInScope.$valid) {
                        e.preventDefault();
                        console.log(scope[attrs.name]);
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