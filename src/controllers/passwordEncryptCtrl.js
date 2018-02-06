module.exports = function (app) {
    app.controller('passwordEncryptCtrl', function ($http, dialog, langService, urlService) {
        'ngInject';
        var self = this;
        self.controllerName = 'passwordEncryptCtrl';

        self.password = null;

        self.encrypted = null;

        self.encryptPassword = function () {
            self.loading = true;
            return $http.post(urlService.encryptPassword, {password: self.password})
                .then(function (result) {
                    self.encrypted = result.data.rs;
                    self.loading = false;
                })
                .catch(function () {
                    dialog.errorMessage(langService.get('error_messages'));
                    self.loading = false;
                });
        }

    });
};