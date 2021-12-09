module.exports = function (app) {
    app
        .directive('enterSubmitDirective', function (_) {
            'ngInject';
            return function (scope, element, attrs, ctrl) {
                var form = angular.element(element);
                form.on('keydown', function (e) {
                    var code = e.keyCode || e.which;
                    var formInScope = scope[attrs.name];
                    var hasNgEnter = _.find(e.target.attributes, function (attribute) {
                        return attribute.name === 'ng-enter';
                    });
                    // don't click submit button if element has ng-enter directive.
                    if (code === 13 && (!e.shiftKey && !e.altKey && !e.ctrlKey) && formInScope.$valid && !hasNgEnter) {
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
                    if (code === 13 && (!e.shiftKey && !e.altKey && !e.ctrlKey)) {
                        scope.$apply(function () {
                            scope.$eval(attrs['ngEnter']);
                        });
                        e.preventDefault();
                    }
                })
            }
        })
};
