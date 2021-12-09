module.exports = function (app) {
    app.controller('documentTypePopCtrl', function (documentTypeService,
                                                    _,
                                                    editMode,
                                                    toast,
                                                    DocumentType,
                                                    lookupService,
                                                    validationService,
                                                    generator,
                                                    dialog,
                                                    langService,
                                                    documentType,
                                                    documentClassFromUser) {
        'ngInject';
        var self = this;
        self.controllerName = 'documentTypePopCtrl';
        self.editMode = editMode;
        self.documentType = angular.copy(documentType);
        self.model = angular.copy(documentType);
        self.documentClasses = lookupService.returnLookups(lookupService.documentClass);

        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name',
            lookupStrKey: 'document_class',
            itemOrder: 'item_order'
        };

        self.documentTypes = documentTypeService.documentTypes;

        /**
         * @description Add new document type
         */
        self.addDocumentTypeFromCtrl = function () {
            validationService
                .createValidation('ADD_DOCUMENT_TYPE')
                .addStep('check_required', true, generator.checkRequiredFields, self.documentType, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, documentTypeService.checkDuplicateDocumentType, [self.documentType, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('checkItemOrder', true, generator.checkDuplicateItemOrder, [self.documentType, self.documentTypes, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('item_order_duplicated'));
                })
                .validate()
                .then(function () {
                    documentTypeService
                        .addDocumentType(self.documentType)
                        .then(function (result) {
                            dialog.hide(result);
                        });
                })
                .catch(function () {

                });
        };

        /**
         * @description Edit document type
         */
        self.editDocumentTypeFromCtrl = function () {
            validationService
                .createValidation('EDIT_DOCUMENT_TYPE')
                .addStep('check_required', true, generator.checkRequiredFields, self.documentType, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, documentTypeService.checkDuplicateDocumentType, [self.documentType, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('checkItemOrder', true, generator.checkDuplicateItemOrder, [self.documentType, self.documentTypes, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('item_order_duplicated'));
                })
                .validate()
                .then(function () {
                    documentTypeService
                        .updateDocumentType(self.documentType)
                        .then(function () {
                            dialog.hide(self.documentType);
                        });
                })
                .catch(function () {

                });
        };

        /**
         * @description Check if option in dropdown is checked
         * @returns {boolean}
         */
        self.isChecked = function () {
            return !!(self.documentType.lookupStrKey && self.documentType.lookupStrKey.length === self.documentClasses.length);
        };

        /**
         * @description Check if some of options in dropdown are selected
         * @returns {boolean}
         */
        self.isIndeterminate = function () {
            return !!(self.documentType.lookupStrKey && self.documentType.lookupStrKey.length < self.documentClasses.length);
        };

        self.isDefaultDocumentClass = function (documentClass) {
            if (!!documentClassFromUser) {
                var isDefault = false;
                for (var i = 0; i < documentClassFromUser.length; i++) {
                    isDefault = documentClassFromUser[i].lookupStrKey.toLowerCase() === documentClass.lookupStrKey.toLowerCase();
                    if (isDefault)
                        break;
                }
                return isDefault;
            } else {
                return false;
            }
        };

        /**
         * @description Toggle the selection for options in dropdown
         * @param $event
         */
        self.toggleAll = function ($event) {
            if (self.documentType.lookupStrKey) {
                if (self.documentType.lookupStrKey.length === self.documentClasses.length) {
                    if (documentClassFromUser && documentClassFromUser.length) {
                        self.documentType.lookupStrKey = angular.copy(documentClassFromUser);
                    } else {
                        self.documentType.lookupStrKey = null;
                    }
                } else {
                    self.documentType.lookupStrKey = angular.copy(self.documentClasses);
                }
            } else {
                self.documentType.lookupStrKey = angular.copy(self.documentClasses);
            }
        };

        /**
         * @description Close the popup
         */
        self.closeDocumentTypePopupFromCtrl = function () {
            dialog.cancel();
        };
        self.resetModel = function () {
            generator.resetFields(self.documentType, self.model);
        };
    });
};
