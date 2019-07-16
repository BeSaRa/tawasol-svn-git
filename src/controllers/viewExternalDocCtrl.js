module.exports = function (app) {
    app.controller('viewExternalDocCtrl', function (correspondenceService) {
        'ngInject';
        var self = this;
        self.controllerName = 'viewExternalDocCtrl';

        var _openOtpPopup = function () {
            correspondenceService.openOtpDialog();
        };
        _openOtpPopup();

    });
};
