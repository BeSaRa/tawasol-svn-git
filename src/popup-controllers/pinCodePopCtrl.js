module.exports = function (app) {
    app.controller('pinCodePopCtrl', function (toast,
                                               langService,
                                               dialog) {
        'ngInject';
        var self = this;
        self.controllerName = 'pinCodePopCtrl';
        self.pinCode = null;

        self.submitPinCode = function () {
            if (!self.pinCode) {
                toast.info(langService.get('check_this_fields') + ' : ' + langService.get('pin'));
            }
            dialog.hide(self.pinCode);
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        }
    });
};
