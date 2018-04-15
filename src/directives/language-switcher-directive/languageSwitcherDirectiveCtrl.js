module.exports = function (app) {
    app.controller('languageSwitcherDirectiveCtrl', function (langService, employeeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'languageSwitcherDirectiveCtrl';

        self.service = langService;

        self.selectLanguage = function (language) {
            langService.setSelectedLanguage(language);

            if (employeeService.isAdminUser() || employeeService.isCloudUser())
                return;

            employeeService
                .getEmployee()
                .updateLanguage(language);
        }


    });
};
