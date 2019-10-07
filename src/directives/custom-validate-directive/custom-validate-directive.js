/**
 * CUSTOM VALIDATION FOR MORE THAN ONE VALIDATION TYPE DELIMITED BY |
 * @param app
 */

module.exports = function (app) {
    /**
     * @description Validates input with user defined validations delimited by |
     */
    app.directive('customValidateDirective', function ($q, customValidationService) {
        'ngInject';
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function ($scope, $element, attrs, ngModelCtrl) {

                var type = attrs.customValidateDirective;
                if (!type)
                    return;
                var regex = customValidationService.regex;
                ngModelCtrl.$asyncValidators[type] = function (modelValue, viewValue) {
                    var defer = $q.defer();
                    var typesList = type.split('|');
                    var validationPassed = false;
                    for (var i = 0; i < typesList.length; i++) {
                        if (viewValue) {
                            if (typesList[i] !== 'number') {
                                if (regex[typesList[i]].test(viewValue)) {
                                    validationPassed = true;
                                    break;
                                }
                            } else {
                                if ((/^[0-9\u0660-\u0669]+$/g).test(viewValue)) {
                                    validationPassed = true;
                                    break;
                                }
                            }
                        }
                        else {
                            validationPassed = true;
                        }
                    }
                    validationPassed ? defer.resolve() : defer.reject();
                    return defer.promise;
                };
            }
        }
    });


    /*app.directive('customValidateDirective', function ($q, customValidationService, _) {
        'ngInject';
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function ($scope, $element, attrs, ngModelCtrl) {

                var type = attrs.customValidateDirective;
                if (!type)
                    return;

                var regex = customValidationService.regex,
                    validationOperator = 'AND';

                type = type.split(';');
                if (type.length > 1) {
                    validationOperator = (type[1] === '&' ? 'AND' : 'OR');
                }
                type = type[0];

                ngModelCtrl.$asyncValidators[type] = function (modelValue, viewValue) {
                    var defer = $q.defer(), validationResult = [], validationPassed = false;

                    if (!viewValue) {
                        validationResult = [true];
                    } else {
                        var typesList = type.split(',');

                        for (var i = 0; i < typesList.length; i++) {
                            if (typesList[i] !== 'number') {
                                if (regex[typesList[i]].test(viewValue)) {
                                    validationResult.push(true);
                                } else {
                                    validationResult.push(false);
                                }
                            } else {
                                if ((/^[0-9\u0660-\u0669]+$/g).test(viewValue)) {
                                    validationResult.push(true);
                                } else {
                                    validationResult.push(false);
                                }
                            }
                        }
                    }

                    if (validationOperator === 'AND'){
                        validationPassed = _.every(validationResult, function(e){ return !!e; });
                    } else {
                        validationPassed = _.some(validationResult, function(e){ return !!e; })
                    }
                    validationPassed ? defer.resolve() : defer.reject();
                    return defer.promise;
                };
            }
        }
    })*/
};
