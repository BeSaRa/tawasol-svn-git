module.exports = function (app) {
    app
        .directive('enterSubmitDirective', function () {
            'ngInject';
            return function (scope, element, attrs, ctrl) {
                var form = angular.element(element);
                form.on('keydown', function (e) {
                    var code = e.keyCode || e.which;
                    var formInScope = scope[attrs.name];
                    if (code === 13 && formInScope.$valid) {
                        e.preventDefault();
                        angular.element('#' + attrs['enterSubmitDirective']).click();
                    }
                });
            }
        })
        .directive('ngEnter', function () {
            'ngInject';
            return function (scope, element, attrs) {
                element.on('keydown keypress', function (e) {
                    var code = e.keyCode || e.which;
                    if (code === 13) {
                        scope.$apply(function () {
                            scope.$eval(attrs['ngEnter']);
                        });
                        e.preventDefault();
                    }
                })
            }
        })
};