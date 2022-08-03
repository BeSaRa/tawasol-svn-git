module.exports = function (app) {
    /**
     * @description Check if current value is less than or equal to given date
     */

    app.directive('maxDateDirective', function (generator, moment, $q, $timeout) {
        'ngInject';
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function ($scope, $element, attrs, ngModelCtrl) {
                ngModelCtrl.$asyncValidators.maxDate = function (modelView, viewValue) {
                    return $timeout(function () {
                        var dateValue = (attrs.maxDateDirective) ? attrs.maxDateDirective : moment(new Date()).format(generator.defaultDateFormat);
                        var defer = $q.defer();
                        var validationPassed = false;

                        validationPassed = ((new Date(viewValue)).valueOf() <= (new Date(dateValue)).valueOf());

                        validationPassed ? defer.resolve() : defer.reject();
                        return defer.promise;
                    });
                };
            }
        }

    });
};
