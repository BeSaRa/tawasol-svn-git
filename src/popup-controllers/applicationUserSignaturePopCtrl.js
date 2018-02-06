module.exports = function (app) {
    app.controller('applicationUserSignaturePopCtrl', function (applicationUserSignatureService,
                                                                _,
                                                                editMode,
                                                                toast,
                                                                ApplicationUserSignature,
                                                                validationService,
                                                                generator,
                                                                dialog,
                                                                langService,
                                                                applicationUserSignature,
                                                                applicationUserSignatures,
                                                                $scope,
                                                                attachmentService) {
        'ngInject';
        var self = this;
        self.controllerName = 'applicationUserSignaturePopCtrl';
        self.editMode = editMode;

        self.applicationUserSignature = angular.copy(applicationUserSignature);
        self.model = angular.copy(applicationUserSignature);

        //console.log(self.applicationUserSignature);
        /**
         * @description Contains the labels for the fields for validation purpose
         */
        self.validateLabels = {
            docSubject: 'subject',
            documentTitle: 'title',
            fileUrl: 'upload_signature'
        };

        /**
         * @description Contains the names of disabled fields
         */
        self.disabledFields = [];

        self.selectedExtension = ['png'];
        self.selectedFile = null;
        self.fileUrl = self.applicationUserSignature.contentElementUrl ? self.applicationUserSignature.contentElementUrl : null;
        self.viewImage = function (files) {
            attachmentService
                .validateBeforeUpload('userSignature', files[0])
                .then(function (file) {
                    var image;
                    self.selectedFile = file;
                    self.fileUrl = window.URL.createObjectURL(file);
                    var reader = new FileReader();
                    reader.onload = function () {
                        image = new Blob([reader.result], {type: file.type});
                        if (!$scope.$$phase)
                            $scope.$apply();
                    };
                    reader.readAsArrayBuffer(file);
                    self.enableAdd = true;
                })
                .catch(function (availableExtensions) {
                    self.fileUrl = null;
                    self.selectedFile = null;
                    dialog.errorMessage(langService.get('invalid_uploaded_file').addLineBreak(availableExtensions.join(', ')));
                });
        };
        /**
         * @description check upload file
         * @return {Array}
         */
        /*self.checkRequiredFile = function () {
            var result = [];
            if (!self.fileUrl)
                result.push('fileUrl');
            return result;
        };*/
        self.checkRequiredFile = function () {
            return self.selectedFile;
        };

        /**
         * @description Add new signature
         */
        self.addApplicationUserSignatureFromCtrl = function () {
            if (!self.selectedFile) {
                toast.error(langService.get('file_required'));
            }
            else {
                validationService
                    .createValidation('ADD_APPLICATION_USER_SIGNATURE')
                    .addStep('check_required_fields', true, generator.checkRequiredFields, self.applicationUserSignature, function (result) {
                        return !result.length;
                    })
                    .notifyFailure(function (step, result) {
                        var labels = _.map(result, function (label) {
                            return self.validateLabels[label];
                        });
                        generator.generateErrorFields('check_this_fields', labels);
                    })
                    .addStep('check_required_file', true, self.checkRequiredFile, function (result) {
                        return !result.length;
                    })
                    .notifyFailure(function (step, result) {
                        var labels = _.map(result, function (label) {
                            return self.validateLabels[label];
                        });
                        generator.generateErrorFields('check_this_fields', labels);
                    })
                    .addStep('check_duplicate', true, applicationUserSignatureService.checkDuplicateApplicationUserSignature, [self.applicationUserSignature, false], function (result) {
                        return !result;
                    }, true)
                    .notifyFailure(function () {
                        toast.error(langService.get('subject_duplication_message'));
                    })
                    .validate()
                    .then(function () {
                        attachmentService
                            .validateBeforeUpload('userSignature', self.selectedFile)
                            .then(function (file) {
                                applicationUserSignatureService
                                    .addApplicationUserSignature(self.applicationUserSignature)
                                    .then(function () {
                                        dialog.hide(self.applicationUserSignature);
                                    });
                            }).catch(function (availableExtensions) {

                            dialog.errorMessage(langService.get('invalid_uploaded_file').addLineBreak(availableExtensions.join(', ')));
                        });
                    })
                    .catch(function () {

                    });
            }
        };

        /**
         * @description Edit signature
         */
        self.editApplicationUserSignatureFromCtrl = function () {
            if (!self.selectedFile) {
                toast.error(langService.get('file_required'));
            }
            else {
                //generator.replaceWithOriginalValues(self.applicationUserSignature, self.model, self.disabledFields);
                validationService
                    .createValidation('EDIT_APPLICATION_USER_SIGNATURE')
                    .addStep('check_required', true, generator.checkRequiredFields, self.applicationUserSignature, function (result) {
                        return !result.length;
                    })
                    .notifyFailure(function (step, result) {
                        var labels = _.map(result, function (label) {
                            return self.validateLabels[label];
                        });
                        generator.generateErrorFields('check_this_fields', labels);
                    })
                    .addStep('check_file_required', true, self.checkRequiredFile, function (result) {
                        return !result.length;
                    })
                    .notifyFailure(function (step, result) {
                        var labels = _.map(result, function (label) {
                            return self.validateLabels[label];
                        });
                        generator.generateErrorFields('check_this_fields', labels);
                    })
                    .addStep('check_duplicate', true, applicationUserSignatureService.checkDuplicateApplicationUserSignature, [self.applicationUserSignature, true], function (result) {
                        return !result;
                    }, true)
                    .notifyFailure(function () {
                        toast.error(langService.get('name_duplication_message'));
                    })
                    .validate()
                    .then(function () {
                        applicationUserSignatureService
                            .updateApplicationUserSignature(self.applicationUserSignature, self.selectedFile)
                            .then(function () {
                                dialog.hide(self.applicationUserSignature);
                            });

                    })
                /* .catch(function () {

                 });*/
            }
        };

        /**
         * @description Close the popup
         */
        self.closeApplicationUserSignaturePopupFromCtrl = function () {
            dialog.cancel();
        }
    });
};