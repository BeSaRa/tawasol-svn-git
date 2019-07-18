module.exports = function (app) {
    app.controller('otpPopCtrl', function (dialog, toast, langService, downloadService) {
        'ngInject';
        var self = this;
        self.otp = null;

        self.viewDocument = function (form, $event) {
            if (!self.otp || form.$invalid) {
                toast.error(langService.get('enter_otp'));
                return;
            }
            downloadService.viewOTPDocument(self.otp);
        };

        self.closeOtpPopup = function () {
            dialog.cancel('close');
        }
    });
};
