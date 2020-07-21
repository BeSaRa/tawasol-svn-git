module.exports = function (app) {
    app.controller('documentStampPopCtrl', function (documentStampService,
                                                     _,
                                                     editMode,
                                                     toast,
                                                     validationService,
                                                     generator,
                                                     dialog,
                                                     langService,
                                                     documentStamp,
                                                     $timeout,
                                                     attachmentService,
                                                     $scope) {
        'ngInject';
        var self = this, fileExtensionGroup = 'png_jpg';
        self.controllerName = 'documentStampPopCtrl';
        self.editMode = editMode;
        self.documentStamp = angular.copy(documentStamp);
        self.model = angular.copy(documentStamp);
        self.stampUrl = angular.copy(self.documentStamp.contentElementUrl ? self.documentStamp.contentElementUrl : null);

        self.validateLabels = {
            docSubject: 'arabic_name',
            documentTitle: 'english_name',
            status: 'status'
        };

        self.docStampFile = null;
        self.allowedDocStampFormats = attachmentService.getExtensionGroup(fileExtensionGroup).join(', ');
        self.isDocStampAttached = false;

        /**
         * @description Opens the browser file window
         */
        self.openBrowseFile = function () {
            angular.element('#docStampFile').click();
        };

        self.checkFile = function (docStampFiles, element) {
            if (docStampFiles.length) {
                attachmentService
                    .validateBeforeUpload(fileExtensionGroup, docStampFiles[0])
                    .then(function (file) {
                        self.docStampFile = file;
                        self.isDocStampAttached = true;

                        var url = window.URL || window.webkitURL;
                        self.stampUrl = url.createObjectURL(file);
                    })
                    .catch(function (availableExtensions) {
                        _resetFile();
                        dialog.errorMessage(langService.get('invalid_uploaded_file').addLineBreak(availableExtensions.join(', ')));
                    });


            } else {
                $timeout(function () {
                    self.docStampFile = null;
                    self.isDocStampAttached = false;
                });
            }

        };

        self.saveDocumentStamp = function ($event) {
            if (!self.editMode) {
                self.addDocumentStampFromCtrl($event);
            } else {
                self.updateDocumentStampFromCtrl($event);
            }
        };

        /**
         * @description Add new document stamp
         */
        self.addDocumentStampFromCtrl = function ($event) {
            if (!self.isValidForm()) {
                return;
            }
            validationService
                .createValidation('ADD_DOCUMENT_STAMP')
                .addStep('check_required', true, generator.checkRequiredFields, self.documentStamp, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, documentStampService.checkDuplicateDocumentStamp, [self.documentStamp, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    documentStampService
                        .addDocumentStamp(self.documentStamp, self.docStampFile)
                        .then(function () {
                            dialog.hide(self.documentStamp);
                        });
                })
                .catch(function () {

                });
        };

        /**
         * @description Update document stamp
         */
        self.updateDocumentStampFromCtrl = function ($event) {
            if (!self.isValidForm()) {
                return;
            }
            validationService
                .createValidation('EDIT_DOCUMENT_STAMP')
                .addStep('check_required', true, generator.checkRequiredFields, self.documentStamp, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, documentStampService.checkDuplicateDocumentStamp, [self.documentStamp, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    documentStampService
                        .updateDocumentStamp(self.documentStamp, self.docStampFile)
                        .then(function () {
                            dialog.hide(self.documentStamp);
                        });
                })
                .catch(function () {

                });
        };

        self.isValidForm = function (form) {
            form = form || self.documentStampForm;
            var isValid = false;
            if (!self.editMode) {
                isValid = form.$valid && self.isDocStampAttached && !!self.docStampFile;
            } else {
                isValid = form.$valid;
            }
            return isValid;
        };

        function _resetFile() {
            self.docStampFile = null;
            self.isDocStampAttached = false;
            self.stampUrl = angular.copy(self.documentStamp.contentElementUrl);
            angular.element('#docStampFile').val(null);
        }

        self.resetModel = function () {
            generator.resetFields(self.documentStamp, self.model);
            _resetFile();
            self.documentStampForm.$setUntouched();
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        };

        self.$onInit = function () {
            $timeout(function () {
                self.documentStampForm = $scope.documentStampForm;
            })
        }
    });
};
