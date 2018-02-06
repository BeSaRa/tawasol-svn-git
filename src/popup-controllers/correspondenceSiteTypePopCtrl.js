module.exports = function (app) {
    app.controller('correspondenceSiteTypePopCtrl', function (lookupService,
                                                              correspondenceSiteTypeService,
                                                              correspondenceSiteType,
                                                              $q,
                                                              langService,
                                                              toast,
                                                              dialog,
                                                              CorrespondenceSiteType,
                                                              editMode,
                                                              validationService,
                                                              generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'correspondenceSiteTypePopCtrl';
        self.editMode = editMode;
        self.correspondenceSiteType = correspondenceSiteType;
        self.lookupStrKey = angular.copy(self.correspondenceSiteType.lookupStrKey);
        self.model = angular.copy(self.correspondenceSiteType);
        //self.documentClasses = lookupService.returnLookups(lookupService.documentClass);
        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name'
        };
        /**
         * Add new documentStatus
         */
        self.addCorrespondenceSiteTypeFromCtrl = function () {
            validationService
                .createValidation('ADD_CORRESPONDENCE_TYPE')
                .addStep('check_required', true, generator.checkRequiredFields, self.correspondenceSiteType, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, correspondenceSiteTypeService.checkDuplicateCorrespondenceSiteType, [self.correspondenceSiteType, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('check_numbers', true, generator.checkNameNumbers, [self.correspondenceSiteType, ['arName', 'enName']], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('arabic_english_cannot_be_just_numbers'));
                })
                /*.addStep('check_item_order_duplicate', true, correspondenceSiteTypeService.checkDuplicateCorrespondenceSiteTypeItemOrder, [self.correspondenceSiteType, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('item_order_duplicated'));
                })*/
                .validate()
                .then(function () {
                    correspondenceSiteTypeService.addCorrespondenceSiteType(self.correspondenceSiteType).then(function () {
                        dialog.hide(self.correspondenceSiteType);
                    });
                })
                .catch(function () {

                })
        };
        /**
         *
         */
        self.editCorrespondenceSiteTypeFromCtrl = function () {
            self.correspondenceSiteType.lookupStrKey = self.lookupStrKey;
            validationService
                .createValidation('ADD_CORRESPONDENCE_TYPE')
                .addStep('check_required', true, generator.checkRequiredFields, self.correspondenceSiteType, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, correspondenceSiteTypeService.checkDuplicateCorrespondenceSiteType, [self.correspondenceSiteType, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('check_numbers', true, generator.checkNameNumbers, [self.correspondenceSiteType, ['arName', 'enName']], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('arabic_english_cannot_be_just_numbers'));
                })
                .validate()
                .then(function () {
                    correspondenceSiteTypeService.updateCorrespondenceSiteType(self.correspondenceSiteType).then(function () {
                        dialog.hide(self.correspondenceSiteType);
                    });
                })
                .catch(function () {

                })
        };

        /**
         * @description Reset the model to original values
         * @param form
         * @param $event
         */
        self.resetModel = function (form, $event) {
            generator.resetFields(self.correspondenceSiteType, self.model);
            //self.smsTemplate.smstemplateSubscribers = self.model.smstemplateSubscribers = self.smsTemplateSubscribersCopy;
            form.$setUntouched();
        };

        /**
         * @description close the popup
         */
        self.closePopUp = function () {
            dialog.cancel();
        };
    });
};