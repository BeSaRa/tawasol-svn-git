module.exports = function (app) {
    app.controller('dragDropPopCtrl', function ($element,
                                                _,
                                                dialog,
                                                langService,
                                                FileIcon,
                                                toast,
                                                correspondence,
                                                Attachment,
                                                attachmentTypeService,
                                                lookupService,
                                                correspondenceService,
                                                validationService,
                                                attachmentService,
                                                $scope,
                                                rootEntity,
                                                $timeout,
                                                errorCode,
                                                $q) {
        'ngInject';
        var self = this;
        self.controllerName = 'dragDropPopCtrl';
        // dop area element
        self.dropArea = $element.find('#drop-area');
        // valid files in array
        self.validFiles = [];
        // all attachment types
        self.attachmentTypes = attachmentTypeService.returnAttachmentTypes();

        var info = correspondence.getInfo();
        self.securityLevels = correspondenceService.getLookup(info.documentClass, 'securityLevels');
        // the selected security level.
        //self.securityLevel = correspondence.securityLevel;
        self.securityLevel = lookupService.getLookupByLookupKey(lookupService.securityLevel, correspondence.securityLevel);
        // attachment title for all
        self.attachmentTitle = null;

        // the selected attachment type.
        self.attachmentType = self.attachmentTypes[0];
        // the uploaded Files
        self.successFilesUploaded = [];
        // the failed uploaded.
        self.failsFilesUploaded = [];
        // get inherit Security for attachment from GlobalSettings
        self.inheritSecurity = rootEntity.getGlobalSettings().attachmentInheritSecurity;

        self.icons = {
            pdf: new FileIcon({
                icon: 'file-pdf',
                extensions: ['pdf'],
                mimeTypes: ['application/pdf']
            }),
            image: new FileIcon({
                icon: 'file-image',
                extensions: ['png', 'gif', 'tiff', 'jpg', 'jpeg', 'tif'],
                mimeTypes: ['image/png', 'image/gif', 'image/tiff', 'image/jpg']
            }),
            word: new FileIcon({
                icon: 'file-word',
                extensions: ['doc', 'docx'],
                mimeTypes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            })/*,
            excel: 'file-excel',
            power: 'file-powerpoint',
            unknown: 'folder-remove'*/
        };


        function _getExtension(file) {
            return {
                ext: file.name.split('.').pop(),
                type: file.type
            }
        }

        function _getFileIcon(attachment) {
            var ext = _getExtension(attachment.file);
            return _.find(self.icons, function (icon) {
                return icon.checkExtension(ext);
            })
        }

        function _fileIcon(attachment) {
            return attachment.hasOwnProperty('file') ? _getFileIcon(attachment).icon : 'folder-remove';
        }

        /**
         * empty given keys from self.
         * @param keys
         */
        self.emptyFiles = function (keys) {
            _.map(keys, function (key) {
                self[key] = [];
            });
        };
        // create event listener for drop area
        self.dropArea.on({
            dragenter: function (e) {
                e.preventDefault();
            },
            dragover: function (e) {
                e.preventDefault();
            },
            dragleav: function (e) {
                e.preventDefault();
            }
        });
        // when drop files on the drop area.
        self.dropArea[0].addEventListener('drop', function (e) {
            e.preventDefault();
            var files = e.dataTransfer.files;
            $scope.$apply(function () {
                //self.emptyFiles(['validFiles', 'invalidFiles']);
                for (var i = 0; i < files.length; i++) {
                    if (attachmentService.validateBeforeUpload('attachmentUpload', files[i], true)) {
                        self.validFiles.push(new Attachment({
                            file: files[i],
                            securityLevel: self.securityLevel,
                            attachmentType: self.attachmentType,
                            documentTitle: files[i].name,
                            docSubject: files[i].name,
                            progress: 0
                        }));
                    }
                }
            });

        }, false);

        /**
         * @description change the value of property .
         * @param property
         * @param value
         */
        self.changeValueOf = function (property, value) {
            _.map(self.validFiles, function (v, index) {
                self.validFiles[index][property] = value
            });
        };
        /**
         * to change the value of attachment property.
         * @param property
         * @param attachment
         * @param value
         */
        self.changeValueOfFor = function (property, attachment, value) {
            attachment[property] = value;
        };
        /**
         * @description to get icon for files.
         * @param attachment
         */
        self.getFileIcon = function (attachment) {
            return _fileIcon(attachment);
        };

        /**
         * @description start upload bulk files
         */
        self.startUploadAttachments = function () {
            if (!self.validFiles.length)
                return;
            self
                .startUploadAttachment(self.validFiles[0])
                .then(function () {
                    if (self.validFiles.length) {
                        self.startUploadAttachments();
                    } else {
                        toast.success(langService.get('add_success').change({name: langService.get('attachments')}));
                    }
                })
                .catch(function (error) {
                    errorCode.checkIf(error, 'SIZE_EXTENSION_NOT_ALLOWED', function () {
                        dialog.errorMessage(langService.get('file_with_size_extension_not_allowed'));
                    });
                });
        };
        /**
         * @description upload one file
         * @param attachment
         * @param single
         */
        self.startUploadAttachment = function (attachment, single) {
            return (function (attachment) {
                //return attachmentService.addAttachment(correspondence, attachment, function (progress) {
                var info = correspondence.getInfo();
                var document = {
                    vsId: info.vsId,
                    docClassName: info.documentClass
                };
                return attachmentService.addAttachment(document, attachment, function (progress) {
                    attachment.progress = progress;
                }).then(function (attachment) {
                    if (single)
                        toast.success(langService.get('add_success').change({name: attachment.documentTitle}));

                    self.validFiles = _.filter(self.validFiles, function (item) {
                        if (item.vsId === attachment.vsId) {
                            self.successFilesUploaded.push(item);
                            return false;
                        }
                        return true;
                    });
                })
                    .catch(function (error) {
                        if (single)
                            errorCode.checkIf(error, 'SIZE_EXTENSION_NOT_ALLOWED', function () {
                                dialog.errorMessage(langService.get('file_with_size_extension_not_allowed'));
                            });
                        else
                            return $q.reject(error);
                    });
            })(attachment);
        };
        /**
         * close drag and drop dialog
         */
        self.closeDrag = function () {
            dialog.hide(self.successFilesUploaded);
        };
        /**
         * @description delete dragged attachments.
         * @param attachment
         * @param $event
         */
        self.deleteDragAttachment = function (attachment, $event) {
            dialog
                .confirmMessage(langService.get('confirm_delete').change({name: attachment.documentTitle}))
                .then(function () {
                    attachmentService
                        .deleteAttachment(info.vsId, info.documentClass, attachment)
                        .then(function () {
                            self.successFilesUploaded = _.filter(self.successFilesUploaded, function (uploadedFile) {
                                return uploadedFile.vsId !== attachment.vsId;
                            });
                            toast.success(langService.get('delete_success').change({name: attachment.documentTitle}));
                        });
                });

        }


    });
};