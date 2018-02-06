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
                                                    documentType) {
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
                .addStep('checkItemOrder', true, generator.checkDuplicateItemOrder, [self.documentType, self.documentTypes, false] , function(result){
                    return !result;
                },true)
                .notifyFailure(function () {
                    toast.error(langService.get('item_order_duplicated'));
                })
                .validate()
                .then(function () {
                    documentTypeService
                        .addDocumentType(self.documentType)
                        .then(function () {
                            dialog.hide(self.documentType);
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
                .addStep('checkItemOrder', true, generator.checkDuplicateItemOrder, [self.documentType, self.documentTypes, true] , function(result){
                    return !result;
                },true)
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