module.exports = function (app) {
    app.directive('langDirective', function (langService, employeeService, tokenService, rootEntity, themeService, authenticationService, $http, $rootScope) {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element) {
                scope.currentEntity = rootEntity;
                $rootScope.languages = langService.languages;
                $rootScope.langService = langService;
                scope.tokenService = tokenService;
                employeeService.setRootEntityService(rootEntity);
                tokenService.setRequireServices($http, authenticationService, themeService, rootEntity);

                function loadUpdateLang() {
                    langService.getLanguages().then(function (lang) {
                        $rootScope.lang = lang;
                    });
                }

                $rootScope.$watch(function () {
                    return langService.current;
                }, function (newValue, oldValue) {
                    if (!newValue)
                        return;

                    loadUpdateLang();

                    if (newValue !== oldValue && !!newValue) {
                        element.attr('lang', newValue);
                        if (newValue === 'ar') {
                            element.attr('dir', 'rtl').addClass('rtl');
                        } else {
                            element.removeAttr('dir').removeClass('rtl');
                        }
                    }
                });


            }
        }
    })
};