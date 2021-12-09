module.exports = function (app) {
    app.factory('LangWatcher', function (langService) {
        'ngInject';
        return function LangWatcher(scope) {
            scope.lang = langService.getCurrentTranslate();
            langService.listeningToChange(function (current) {
                scope.lang = langService.getCurrentTranslate();
            });
        }
    });
};