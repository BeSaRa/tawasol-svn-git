module.exports = function (app) {
    app.controller('attachmentTypePopCtrl', function (attachmentTypeService,
                                                      _,
                                                      editMode,
                                                      toast,
                                                      AttachmentType,
                                                      lookupService,
                                                      validationService,
                                                      generator,
                                                      dialog,
                                                      langService,
                                                      attachmentType) {
        'ngInject';
        var self = this;
        self.controllerName = 'attachmentTypePopCtrl';
        self.editMode = editMode;
        self.attachmentType = angular.copy(attachmentType);
        self.model = angular.copy(attachmentType);

        self.documentClasses = lookupService.returnLookups(lookupService.documentClass);

        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name',
            lookupStrKey: 'attachment_class',
            itemOrder: 'item_order'
        };

        /**
         * @description Add new attachment type
         */
        self.addAttachmentTypeFromCtrl = function () {
            validationService
                .createValidation('ADD_ATTACHMENT_TYPE')
                .addStep('check_required', true, generator.checkRequiredFields, self.attachmentType, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, attachmentTypeService.checkDuplicateAttachmentType, [self.attachmentType, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    attachmentTypeService
                        .addAttachmentType(self.attachmentType)
                        .then(function () {
                            dialog.hide(self.attachmentType);
                        });
                })
                .catch(function () {

                });
        };

        /**
         * @description Edit attachment type
         */
        self.editAttachmentTypeFromCtrl = function () {
            validationService
                .createValidation('EDIT_ATTACHMENT_TYPE')
                .addStep('check_required', true, generator.checkRequiredFields, self.attachmentType, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, attachmentTypeService.checkDuplicateAttachmentType, [self.attachmentType, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    attachmentTypeService
                        .updateAttachmentType(self.attachmentType)
                        .then(function () {
                            dialog.hide(self.attachmentType);
                        });
                })
                .catch(function () {

                });
        };

        /**
         * @description Close the popup
         */
        self.closeAttachmentTypePopupFromCtrl = function () {
            dialog.cancel();
        }
    });
};