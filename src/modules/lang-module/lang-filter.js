module.exports = function (app) {
    app.filter('lang', function (langService) {
        'ngInject';
        function langFilter(langKey) {
            return langService.get(langKey, true);
        }

        langFilter.$stateful = true;
        return langFilter;
    })
};