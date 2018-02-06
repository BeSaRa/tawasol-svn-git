module.exports = function (app) {
    app.controller('languageSwitcherDirectiveCtrl', function (langService) {
        'ngInject';
        var self = this;
        self.controllerName = 'languageSwitcherDirectiveCtrl';

        self.service = langService;

        self.selectLanguage = function (language) {
            langService.setSelectedLanguage(language);
        }


    });
};
