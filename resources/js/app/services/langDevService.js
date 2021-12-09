(function (app) {
    app.service('langDevService', function ($http) {
        'ngInject';
        var self = this;
        self.languages = null;

        self.loadLanguages = function () {
            return $http.get('api.php?action=load_languages').then(function (result) {
                self.languages = result.data;
                return self.languages;
            })
        };

        self.getLangKey = function (langKey, translate) {
            return (translate) ?
                (self.languages.hasOwnProperty(langKey) && self.languages[langKey].hasOwnProperty(translate) ? self.languages[langKey][translate] : null)
                :
                (self.languages.hasOwnProperty(langKey) ? self.languages[langKey]['ar'] + ' - ' + self.languages[langKey]['en'] : null);
        }
    });
})(app);