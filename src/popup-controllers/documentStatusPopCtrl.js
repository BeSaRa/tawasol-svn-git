module.exports = function (app) {
    app.controller('documentStatusPopCtrl', function (documentStatusService,
                                                      _,
                                                      editMode,
                                                      toast,
                                                      documentStatus,
                                                      DocumentStatus,
                                                      lookupService,
                                                      validationService,
                                                      generator,
                                                      dialog,
                                                      langService) {
        'ngInject';
        var self = this;
        self.controllerName = 'documentStatusPopCtrl';

        self.editMode = editMode;
        self.documentStatus = documentStatus ;
        self.model = angular.copy(self.documentStatus);
        self.documentClasses = lookupService.returnLookups(lookupService.documentClass);

        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name',
            lookupStrKey: 'document_class',
            itemOrder: 'item_order'
        };
        /**
         * Add new documentStatus
         */
        self.addDocumentStatusFromCtrl = function () {
            validationService
                .createValidation('ADD_DOCUMENT_TYPE')
                .addStep('check_required', true, generator.checkRequiredFields, self.documentStatus, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, documentStatusService.checkDuplicateDocumentStatus, [self.documentStatus,false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    documentStatusService.addDocumentStatus(self.documentStatus).then(function(){
                        dialog.hide(self.documentStatus);
                    });
                })
                .catch(function () {

                })

        };
        /**
         *
         */
        self.editDocumentStatusFromCtrl = function () {
            validationService
                .createValidation('ADD_DOCUMENT_TYPE')
                .addStep('check_required', true, generator.checkRequiredFields, self.documentStatus, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, documentStatusService.checkDuplicateDocumentStatus, [self.documentStatus, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    documentStatusService.updateDocumentStatus(self.documentStatus).then(function () {
                        dialog.hide(self.documentStatus);
                    });
                })
                .catch(function () {

                })
        };
        /**
         * @description close the popup
         */
        self.closePopUp=function () {
            dialog.cancel();
        };
    });
};