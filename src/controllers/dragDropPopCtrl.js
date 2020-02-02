module.exports = function (app) {
    app.controller('dragDropPopCtrl', function ($element,
                                                _,
                                                dialog,
                                                langService,
                                                FileIcon,
                                                toast,
                                                correspondence,
                                                attachment,
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
                                                employeeService,
                                                $q,
                                                attachmentCopy) {
        'ngInject';
        var self = this;
        self.controllerName = 'dragDropPopCtrl';
        self.attachment = attachment;
        // dop area element
        self.dropArea = $element.find('#drop-area');
        // valid files in array
        self.validFiles = [];

        var info = correspondence.getInfo();
        self.securityLevels = correspondenceService.getLookup(info.documentClass, 'securityLevels');
        // all attachment types
        self.attachmentTypes = attachmentTypeService.returnAttachmentTypes(info.documentClass);
        // the selected security level.
        //self.securityLevel = correspondence.securityLevel;

        var securityLevel = correspondence.securityLevel;
        if (securityLevel) {
            if (correspondence.securityLevel.hasOwnProperty('lookupKey'))
                securityLevel = correspondence.securityLevel.lookupKey;
            else if (correspondence.securityLevel.hasOwnProperty('id'))
                securityLevel = correspondence.securityLevel.id;
        }
        self.securityLevel = lookupService.getLookupByLookupKey(lookupService.securityLevel, securityLevel);
        // attachment title for all
        self.attachmentTitle = null;

        // the selected attachment type.
        var activeAttachmentTypes = _.filter(self.attachmentTypes, function (attachmentType) {
            return attachmentType.status;
        });
        self.attachmentType = activeAttachmentTypes.length ? activeAttachmentTypes[0] : null;
        // all update action status
        self.attachmentUpdateActions = lookupService.returnLookups(lookupService.attachmentUpdateAction);
        self.priorityLevels = lookupService.returnLookups(lookupService.attachmentPriority);
        // the selected updateActionStatus
        self.updateActionStatus = self.attachmentUpdateActions[0];
        self.priorityLevel = self.priorityLevels[0];
        self.exportStatus = false;

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
            }),
            excel: new FileIcon({
                icon: 'file-excel',
                extensions: ['xls', 'xlsx'],
                mimeTypes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
            }),
            unknownFile: new FileIcon({
                icon: 'file',
                extensions: [],
                mimeTypes: []
            })
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
            if (attachment.hasOwnProperty('file')) {
                var icon = _getFileIcon(attachment);
                if (icon)
                    return icon.icon;
                return self.icons.unknownFile.icon;
            }
            return 'folder-remove';
            //return attachment.hasOwnProperty('file') ? _getFileIcon(attachment).icon : 'folder-remove';
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

                // if edit attachment, accept only one attachment
                if (self.attachment) {
                    if (files.length > 1) {
                        toast.info(langService.get('only_one_file_accepted').change({filename: files[0].name}));
                    }
                    if (attachmentService.validateBeforeUpload('attachmentUpload', files[0], true)) {
                        var attachment = self.attachment;

                        if (!_.find(activeAttachmentTypes, function (activeAttachmentType) {
                            return activeAttachmentType.lookupKey === attachment.attachmentType.lookupKey
                        })) {
                            attachment.attachmentType = self.attachmentType;
                        }

                        attachment.file = files[0];
                        self.validFiles = [];
                        self.validFiles.push(attachment);
                    }
                } else {
                    attachmentService.validateBeforeUploadBulk('attachmentUpload', files)
                        .then(function (resultExtension) {
                            var failedFiles = [];
                            for (var i = 0; i < files.length; i++) {
                                if (resultExtension.result[i]) {
                                    self.validFiles.push(new Attachment({
                                        file: files[i],
                                        securityLevel: self.securityLevel,
                                        attachmentType: self.attachmentType,
                                        priorityLevel: self.priorityLevel,
                                        updateActionStatus: self.updateActionStatus,
                                        documentTitle: files[i].name,
                                        docSubject: files[i].name,
                                        progress: 0
                                    }));
                                } else {
                                    failedFiles.push(files[i]);
                                }
                            }
                            if (failedFiles.length) {
                                dialog.errorMessage(langService.get('invalid_uploaded_file').addLineBreak(resultExtension.allowedExtensions.join(', ')));
                            }
                        })
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

        self.isAttachmentDeletable = function (attachment) {
            return attachmentService.checkAttachmentIsDeletable(correspondence.getInfo(), attachment);
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
                    errorCode.checkIf(error, 'FAILED_INSERT_DOCUMENT', function () {
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
                var info = correspondence.getInfo();
                /*var document = {
                    vsId: info.vsId,
                    docClassName: info.documentClass
                };*/
                return attachmentService.addAttachment(info, attachment, function (progress) {
                    attachment.progress = progress;
                }).then(function (attachment) {
                    if (single)
                        toast.success(langService.get('add_success').change({name: attachment.documentTitle}));

                    // push the successfully uploaded file to the successFilesUploaded array and remove from validFiles array
                    self.validFiles = _.filter(self.validFiles, function (item) {
                        if (item.vsId === attachment.vsId) {
                            item.isDeletable = self.isAttachmentDeletable(attachment);
                            self.successFilesUploaded.push(item);
                            return false;
                        }
                        return true;
                    });
                }).catch(function (error) {
                    if (single)
                        errorCode.checkIf(error, 'FAILED_INSERT_DOCUMENT', function () {
                            dialog.errorMessage(langService.get('file_with_size_extension_not_allowed'));
                        });
                    else
                        return $q.reject(error);
                });
            })(attachment);
        };


        self.setNameToAttachment = function (attachment) {
            var name = langService.get('attachment_file');

            if (attachment.documentTitle.trim() === '') {
                var count = 1;
                while (self.attachmentNameExists(name + ' ' + count)) {
                    count++;
                }
                attachment.documentTitle = name + ' ' + count;
            }
            attachment.docSubject = attachment.documentTitle;
            return attachment;
        };

        self.editDragAttachment = function (attachment) {
            var file = attachment.file;
            self.attachment = angular.copy(attachment);
            self.attachment.file = file;
        };

        self.cancelUpdate = function () {
            self.attachment = null;
        };

        self.updateAttachment = function () {
            var info = correspondence.getInfo();
            /*var document = {
                vsId: info.vsId,
                docClassName: info.documentClass
            };*/

            self.attachment = self.setNameToAttachment(self.attachment);
            return attachmentService.updateAttachment(info, self.attachment, function (progress) {
                self.attachment.progress = progress;
            }).then(function (updatedAttachment) {
                toast.success(langService.get('edit_success').change({name: updatedAttachment.documentTitle}));
                if (attachment) {
                    self.attachment = null;
                    self.closeDrag(updatedAttachment);
                } else {
                    //replace the attachment in successFilesUploaded array
                    var index = _.findIndex(self.successFilesUploaded, function (attachment) {
                        return (updatedAttachment.vsId === attachment.vsId);
                    });
                    self.successFilesUploaded.splice(index, 1, updatedAttachment);
                    self.attachment = null;
                }
            }).catch(function (error) {
                errorCode.checkIf(error, 'FAILED_INSERT_DOCUMENT', function () {
                    dialog.errorMessage(langService.get('file_with_size_extension_not_allowed'));
                });
            });
        };

        /**
         * close drag and drop dialog
         */
        self.closeDrag = function (updatedAttachment) {
            updatedAttachment = updatedAttachment ? [updatedAttachment] : self.successFilesUploaded;
            dialog.hide(updatedAttachment);
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

        };

        /**
         * @description Checks if attachment type will be available in drop down or not
         * If edit mode for attachment, show the selected value and all other active attachment types only
         * If add mode for attachment, show the active attachment types only
         * @param type
         * @returns {*}
         */
        self.checkAttachmentTypeIsAvailable = function (type) {
            if (self.attachment) {
                var attachmentType = self.attachment.attachmentType;
                var typeCopy = angular.copy(type);
                if (typeCopy.hasOwnProperty('lookupKey'))
                    typeCopy = typeCopy.lookupKey;
                if (attachmentType && attachmentType.hasOwnProperty('lookupKey'))
                    attachmentType = attachmentType.lookupKey;

                if (attachmentType)
                    return (attachmentType === typeCopy || type.status);
                return type.status;
            }
            return false;
        };

        self.checkValidAttachmentFields = function () {
            return !!(self.attachmentType && self.updateActionStatus && self.securityLevel);
        };
    });
};
