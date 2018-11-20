module.exports = function (app) {
    app.directive('langKeyExistsDirective', function (langService, $q) {
        'ngInject';
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {
                ngModel.$asyncValidators.lang_key_exists = function (modelValue, viewValue) {
                    return langService
                        .checkLangKeyIfExists(viewValue)
                        .then(function (result) {
                            if (result)
                                return $q.reject('Lang Key Exists');
                            return true;
                        });
                }
            }
        }
    });
};