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
                                                   smsTemplate) {
        'ngInject';
        var self = this;
        self.controllerName = 'smsTemplatePopCtrl';
        self.editMode = editMode;
        self.smsTemplate = angular.copy(smsTemplate);
        self.model = angular.copy(self.smsTemplate);

        self.smsVariables = [
            'DocumentSubject',
            'CurrentDate',
            'DocumentCreationDate',
            'DocumentApprovalDate',
            'EntityName',
            'EntityAddress',
            'DocumentFullSerial',
            'EntityAddress',
            'PriorityLevel'
        ];

        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name',
            arMessage: 'arabic_body_text',
            enMessage: 'english_body_text',
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
                            toast.success(langService.get('add_success').change({name: result.getNames()}));
                        });
                })
                .catch(function () {

                });
        };

        /**
         * @description Update sms template
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
                            self.model = angular.copy(result);
                            toast.success(langService.get('edit_success').change({name: result.getNames()}));
                            dialog.hide(self.smsTemplate);
                        });
                })
                .catch(function () {

                });
        };

        /**
         * @description Reset the form
         * @param form
         * @param $event
         */
        self.resetModel = function (form, $event) {
            generator.resetFields(self.smsTemplate, self.model);
            form.$setUntouched();
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        };
    });
};
