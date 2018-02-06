module.exports = function (app) {
    app.factory('LangWatcher', function (langService) {
        'ngInject';
        return function LangWatcher(scope) {
            scope.lang = langService.getCurrentTranslate();
            scope.$watch(function () {
                return langService.current;
            }, function (newVal) {
                scope.lang = langService.getCurrentTranslate();
            });

            scope.$on('$languagePrepared',function () {
                scope.lang = langService.getCurrentTranslate();
            })
        }
    });
};