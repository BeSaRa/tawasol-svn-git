module.exports = function (app) {
    /**
     * @description Validates input for min or max number value
     */
    app.directive('minMaxNumberDirective', function ($q) {
        'ngInject';
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function ($scope, $element, attrs, ngModelCtrl) {
                ngModelCtrl.$asyncValidators["min"] = function (modelValue, viewValue) {
                    var minValue = Number($scope.$eval(attrs.min));
                    var defer = $q.defer();
                    var validationPassed = true;
                    if (minValue) {
                        if (viewValue) {
                            if (Number(minValue) > Number(viewValue)) {
                                validationPassed = false;
                            }
                        }
                    }
                    validationPassed ? defer.resolve() : defer.reject();
                    return defer.promise;
                };
                ngModelCtrl.$asyncValidators["max"] = function (modelValue, viewValue) {
                    var maxValue = Number($scope.$eval(attrs.max));
                    var defer = $q.defer();
                    var validationPassed = true;
                    if (maxValue) {
                        if (viewValue) {
                            if (Number(maxValue) < Number(viewValue)) {
                                validationPassed = false;
                            }
                        }
                    }
                    validationPassed ? defer.resolve() : defer.reject();
                    return defer.promise;
                };
            }
        }
    })
};