module.exports = function (app) {
    app.controller('sendEmailReminderPopCtrl', function (toast,
                                                         langService,
                                                         correspondenceService,
                                                         dialog) {
        'ngInject';
        var self = this;
        self.controllerName = 'sendEmailReminderPopCtrl';
        self.comment = null;

        self.sendReminderEmail = function ($event) {
            correspondenceService.sendEmailReminder(self.correspondence, self.comment)
                .then(function (result) {
                    dialog.hide();
                    toast.success(langService.get('success_sending_reminder_email'));
                }).catch(function () {
                toast.error(langService.get('failed_sending_reminder'))
            })
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        };
    });
};
