module.exports = function (app) {
    app.controller('sendSmsPopCtrl', function (smsTemplateService,
                                               _,
                                               toast,
                                               langService,
                                               dialog,
                                               correspondenceService) {
        'ngInject';
        var self = this;
        self.controllerName = 'sendSmsPopCtrl';

        var _resetSMSMessage = function () {
            self.smsMessage = {
                linkedEntity: null,
                smsTemplate: null,
                mobileNumber: self.mobileNumber || null,
                message: null
            };
        };

        /**
         * @description Handles on change of linked entity
         * @param $event
         * @returns {string}
         */
        self.onChangeLinkedEntity = function ($event) {
            self.smsMessage.mobileNumber = angular.copy(self.smsMessage.linkedEntity.mobileNumber);
        };

        /**
         * @description Handles on change of sms template
         * @param $event
         */
        self.onChangeSmsTemplate = function ($event) {

        };

        self.getMessageFromTemplate = function ($event) {
            if (!self.smsMessage.smsTemplate) {
                return;
            }
            correspondenceService.parseSMSTemplate(self.record, self.smsMessage)
                .then(function (result) {
                    self.smsMessage.message = result;
                })
                .catch(function (error) {
                    toast.error(langService.get('something_went_wrong_while_processing'));
                })
        };

        self.sendSMS = function (form, $event) {
            if (form.$invalid) {
                return;
            }
            correspondenceService.sendSMSMessage(self.record, self.smsMessage)
                .then(function () {
                    toast.success(langService.get('sent_successfully').change({name: langService.get('sms')}));
                    dialog.hide(true);
                })
                .catch(function (error) {
                    toast.error(langService.get('something_went_wrong_while_processing'));
                })
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        };

        self.$onInit = function () {
            _resetSMSMessage();
        }
    });
};
