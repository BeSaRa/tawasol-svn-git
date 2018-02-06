module.exports = function (app) {
    app.controller('smsTemplatePopCtrl', function (smsTemplateService,
                                                   _,
                                                   editMode,
                                                   toast,
                                                   SmsTemplate,
                                                   validationService,
                                                   generator,
                                                   dialog,
                                                   langService,
                                                   smsTemplate,
                                                   applicationUserService) {
        'ngInject';
        var self = this;
        self.controllerName = 'smsTemplatePopCtrl';
        self.editMode = editMode;
        self.smsTemplate = angular.copy(smsTemplate);
        self.model = angular.copy(smsTemplate);

        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name',
            message: 'sms_template_message',
            status: 'status',
            isGlobal: 'global'
        };

        /**
         * @description Add new sms template
         */
        self.addSmsTemplateFromCtrl = function () {
            validationService
                .createValidation('ADD_SMS_TEMPLATE')
                .addStep('check_required', true, generator.checkRequiredFields, self.smsTemplate, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, smsTemplateService.checkDuplicateSmsTemplate, [self.smsTemplate, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    smsTemplateService
                        .addSmsTemplate(self.smsTemplate)
                        .then(function (result) {
                            //dialog.hide(self.smsTemplate);
                            self.editMode = true;
                            self.smsTemplate = angular.copy(result);
                            self.model = angular.copy(self.smsTemplate);
                            //toast.success(langService.get('add_success').change({name: result.getTranslatedName()}));
                            toast.success(langService.get('add_success').change({name: result.getNames()}));
                        });
                })
                .catch(function () {

                });
        };

        /**
         * @description Edit sms template
         */
        self.editSmsTemplateFromCtrl = function () {
            validationService
                .createValidation('EDIT_SMS_TEMPLATE')
                .addStep('check_required', true, generator.checkRequiredFields, self.smsTemplate, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, smsTemplateService.checkDuplicateSmsTemplate, [self.smsTemplate, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    smsTemplateService
                        .updateSmsTemplate(self.smsTemplate)
                        .then(function (result) {
                            toast.success(langService.get('edit_success').change({name: result.getNames()}));
                            dialog.hide(self.smsTemplate);
                        });
                })
                .catch(function () {

                });
        };

        /**
         * @description Open the popup to add sms template subscribers
         * @param $event
         */
        self.selectSmsTemplateSubscribers = function ($event) {
            self.smsTemplateSubscribersCopy = angular.copy(self.model.smstemplateSubscribers);
            applicationUserService
                .controllerMethod
                .selectApplicationUsers(self.model.smstemplateSubscribers, "manage_sms_template_subscribers", $event)
                .then(function (applicationUsers) {
                    self.smsTemplate.smstemplateSubscribers = applicationUsers;
                });
        };


        /**
         * @description Reset the form
         * @param form
         * @param $event
         */
        self.resetModel = function(form, $event){
            generator.resetFields(self.smsTemplate, self.model);
            self.smsTemplate.smstemplateSubscribers = self.model.smstemplateSubscribers = self.smsTemplateSubscribersCopy;
            form.$setUntouched();
        };


        /**
         * @description Close the popup
         */
        self.closeSmsTemplatePopupFromCtrl = function () {
            dialog.cancel();
        }
    });
};