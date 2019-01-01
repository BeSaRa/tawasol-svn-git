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
    })
};


/**
 * CUSTOM VALIDATION FOR ONE VALIDATION TYPE
 * @param app
 */
/*module.exports = function(app){
    app.directive('customValidateDirective', function($q, customValidationService){
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function($scope, $element, attrs, ngModelCtrl){
                var type = attrs.customValidateDirective;
                var regex = customValidationService.regex;

                //Check validation asynchronously
                ngModelCtrl.$asyncValidators[type] = function(modelValue, viewValue){
                    var defer = $q.defer();
                    if(viewValue){
                        if(type == "serverName"){
                            (regex["url"].test(viewValue) || regex["ip"].test(viewValue)) ? defer.resolve() : defer.reject();
                        }
                        else{
                            regex[type].test(viewValue) ? defer.resolve() : defer.reject();
                        }
                    }
                    return defer.promise
                }
            }
        }
    })
};*/
