module.exports = function (app) {
    /**
     * @description
     */

    app.directive('maxDateDirective', function (generator, moment, $q) {
        'ngInject';
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function ($scope, $element, attrs, ngModelCtrl) {
                var dateValue = (attrs.maxDateDirective) ? attrs.maxDateDirective : moment(new Date()).format(generator.defaultDateFormat);

                ngModelCtrl.$asyncValidators.maxDate = function (modelView, viewValue) {
                    var defer = $q.defer();
                    var validationPassed = false;

                    validationPassed = ((new Date(viewValue)).valueOf() <= (new Date(dateValue)).valueOf());

                    validationPassed ? defer.resolve() : defer.reject();
                    return defer.promise;
                };
            }
        }

    });
};