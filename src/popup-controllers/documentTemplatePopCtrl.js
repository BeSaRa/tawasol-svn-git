module.exports = function (app) {
    app.controller('documentTemplatePopCtrl', function (documentTemplateService,
                                                        _,
                                                        editMode,
                                                        toast,
                                                        DocumentTemplate,
                                                        validationService,
                                                        attachmentService,
                                                        generator,
                                                        dialog,
                                                        langService,
                                                        documentTemplate,
                                                        organizations,
                                                        documentTypes,
                                                        templateTypes,
                                                        selectedOrganization,
                                                        $timeout) {
        'ngInject';
        var self = this;
        self.controllerName = 'documentTemplatePopCtrl';
        self.editMode = editMode;
        self.documentTemplate = angular.copy(documentTemplate);
        self.model = angular.copy(documentTemplate);
        self.organizations = organizations;
        self.documentTypes = documentTypes;
        self.templateTypes = templateTypes;

        /**
         * @description Contains the labels for the fields for validation purpose
         */
        self.validateLabels = {
            docSubject: 'document_subject',
            documentTitle: 'document_title',
            docType: 'document_type',
            signaturesCount: 'signatures_count',
            templateType: 'template_type',
            isGlobal: 'global'//,
            //ou: 'organization_unit'
        };

        /**
         * @description Contains the names of disabled fields
         */
        self.disabledFields = [];


        /*self.changeGlobal = function () {
            if (self.documentTemplate.global) {
                self.documentTemplate.ou = null;
            }
            else {
                self.documentTemplate.ou = selectedOrganization;
            }
        };*/

        self.docTemplateFile = null;
        self.allowedDocTemplateFormats = "application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

        /**
         * @description Opens the browser file window
         */
        self.openBrowseFile = function () {
            angular.element('#docTemplateFile').click();
        };

        /**
         * @description Check if file is attached and is valid
         * @type {boolean}
         */
        self.isDocFileAttached = false;
        self.docTemplateFile = null;
        self.checkFile = function (docTemplateFiles) {
            if (docTemplateFiles.length) {
                attachmentService
                    .validateBeforeUpload('wordDocument', docTemplateFiles[0])
                    .then(function (file) {
                        self.docTemplateFile = file;
                        self.isDocFileAttached = true;
                    })
                    .catch(function (availableExtensions) {
                        self.docTemplateFile = null;
                        self.isDocFileAttached = false;
                        dialog.errorMessage(langService.get('invalid_uploaded_file').addLineBreak(availableExtensions.join(', ')));
                    });


            } else {
                $timeout(function () {
                    self.docTemplateFile = null;
                    self.isDocFileAttached = false;
                });
            }

        };

        /**
         * @description Add new document template
         */
        self.addDocumentTemplateFromCtrl = function () {
            if (self.isDocFileAttached && self.docTemplateFile) {
                validationService
                    .createValidation('ADD_DOCUMENT_TEMPLATE')
                    .addStep('check_required', true, generator.checkRequiredFields, self.documentTemplate, function (result) {
                        return !result.length;
                    })
                    .notifyFailure(function (step, result) {
                        var labels = _.map(result, function (label) {
                            return self.validateLabels[label];
                        });
                        generator.generateErrorFields('check_this_fields', labels);
                    })
                    .addStep('check_duplicate', true, documentTemplateService.checkDuplicateDocumentTemplate, [self.documentTemplate, false], function (result) {
                        return !result;
                    }, true)
                    .notifyFailure(function () {
                        toast.error(langService.get('duplicate_doc_subject_title'));
                    })
                    .validate()
                    .then(function () {
                        documentTemplateService
                            .addDocumentTemplate(self.documentTemplate, self.docTemplateFile)
                            .then(function () {
                                dialog.hide(self.documentTemplate);
                            });
                    })
                    .catch(function () {

                    });
            }
            else {
                toast.error(langService.get('file_required'));
            }
        };

        /**
         * @description Edit document template
         */
        self.editDocumentTemplateFromCtrl = function () {
            validationService
                .createValidation('EDIT_DOCUMENT_TEMPLATE')
                .addStep('check_required', true, generator.checkRequiredFields, self.documentTemplate, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, documentTemplateService.checkDuplicateDocumentTemplate, [self.documentTemplate, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('duplicate_doc_subject_title'));
                })
                .validate()
                .then(function () {
                    documentTemplateService
                        .updateDocumentTemplate(self.documentTemplate, self.docTemplateFile)
                        .then(function () {
                            dialog.hide(self.documentTemplate);
                        });
                })
                .catch(function () {

                });
        };

        /**
         * @description Close the popup
         */
        self.closeDocumentTemplatePopupFromCtrl = function () {
            dialog.cancel();
        };

        self.resetModel = function () {
            generator.resetFields(self.documentTemplate, self.model);
            self.isDocFileAttached = false;
            self.docTemplateFile = null;
        };


    });
};