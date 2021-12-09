module.exports = function (app) {
    app.controller('otpPopCtrl', function (dialog, toast, langService, downloadService) {
        'ngInject';
        var self = this;
        self.otp = null;
        self.inProgress = false;

        self.viewDocument = function (form, $event) {
            self.inProgress = true;

            if (!self.otp || form.$invalid) {
                toast.error(langService.get('enter_otp'));
                return;
            }
            downloadService.viewOTPDocument(self.otp)
                .then(function () {
                    self.inProgress = false;
                }).catch(function () {
                self.inProgress = false;
            });
        };

        self.closeOtpPopup = function () {
            dialog.cancel('close');
        }
    });
};
