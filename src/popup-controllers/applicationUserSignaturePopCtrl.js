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
                                                                rootEntity,
                                                                attachmentService,
                                                                $timeout) {
        'ngInject';
        var self = this;
        self.controllerName = 'applicationUserSignaturePopCtrl';
        self.editMode = editMode;

        self.applicationUserSignature = angular.copy(applicationUserSignature);
        self.model = angular.copy(applicationUserSignature);
        self.rootEntity = rootEntity;

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
        //self.imageDimensionsInfo = langService.get('image_dimensions_info').change({height: 283, width: 283});
        self.selectedExtension = ['png'];
        self.selectedFile = null;
        self.fileUrlCopy = self.fileUrl = angular.copy(self.applicationUserSignature.contentElementUrl ? self.applicationUserSignature.contentElementUrl : null);
        self.viewImage = function (files, element) {
            attachmentService
                .validateBeforeUpload('userSignature', files[0])
                .then(function (file) {
                    /*var image;
                     self.selectedFile = file;
                     self.fileUrl = window.URL.createObjectURL(file);
                     var reader = new FileReader();
                     reader.onload = function () {
                     image = new Blob([reader.result], {type: file.type});
                     if (!$scope.$$phase)
                     $scope.$apply();
                     };
                     reader.readAsArrayBuffer(file);
                     self.enableAdd = true;*/

                    self.selectedFile = file;
                    var url = window.URL || window.webkitURL;
                    var img = new Image();
                    img.src = self.fileUrl = url.createObjectURL(file);

                    img.onload = function () {
                        /*if (element[0].name === 'upload-sign') {
                            var width = this.naturalWidth || this.width;
                            var height = this.naturalHeight || this.height;
                            if (width > 283 && height > 283) {
                                toast.error(langService.get('image_dimensions_info').change({width: 283, height: 283}));
                                self.fileUrl = self.fileUrlCopy;
                                self.selectedFile = null;
                                self.enableAdd = false;
                                return false;
                            }
                        }*/
                        $timeout(function () {
                            self.enableAdd = true;
                        })
                    };
                })
                .catch(function (availableExtensions) {
                    self.fileUrl = self.fileUrlCopy;
                    self.selectedFile = null;
                    self.enableAdd = false;
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
            } else {
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
            /*if (!self.selectedFile) {
                toast.error(langService.get('file_required'));
            }
            else {*/
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
                /*.addStep('check_file_required', true, self.checkRequiredFile, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })*/
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

                });
            //}
        };

        /**
         * @description Close the popup
         */
        self.closeApplicationUserSignaturePopupFromCtrl = function () {
            dialog.cancel();
        }
    });
};
