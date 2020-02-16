module.exports = function (app) {
    app.controller('manageAttachmentDirectiveCtrl', function ($scope,
                                                              $element,
                                                              $timeout,
                                                              attachmentTypeService,
                                                              Attachment,
                                                              scannerService,
                                                              rootEntity,
                                                              $q,
                                                              dialog,
                                                              LangWatcher,
                                                              attachmentService,
                                                              toast,
                                                              langService,
                                                              correspondenceService,
                                                              errorCode,
                                                              $filter,
                                                              lookupService,
                                                              generator,
                                                              downloadService,
                                                              _,
                                                              managerService,
                                                              employeeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageAttachmentDirectiveCtrl';
        LangWatcher($scope); // to watch the languages
        self.employeeService = employeeService;

        self.allowScanner = true;
        self.allowUpload = true;
        self.attachment = null;

        // current document file
        self.document = null;

        $timeout(function () {
            // all attachments types
            self.attachmentTypes = attachmentTypeService.returnAttachmentTypes(self.documentClass);
            // all security level
            self.securityLevel = correspondenceService.getLookup(self.documentClass, 'securityLevels');
            self.attachmentUpdateActions = lookupService.returnLookups(lookupService.attachmentUpdateAction);
            self.priorityLevels = lookupService.returnLookups(lookupService.attachmentPriority);
            self.getSortedData();
        });

        // to hide buttons when one of the process work.
        self.buttons = {
            upload: 'scanner',
            scanner: 'upload'
        };
        // our process on the current controller.
        self.upload = true;
        self.scanner = true;
        self.progress = null;

        self.selectedAttachments = [];

        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '-priorityLevel.lookupKey', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.attachments.length + 21);
                    }
                }
            ]
        };
        // get inherit Security for attachment from GlobalSettings
        self.inheritSecurity = rootEntity.getGlobalSettings().attachmentInheritSecurity;


        function _createAttachmentFile(file) {
            var securityLevel = self.document.securityLevel;
            if (securityLevel.hasOwnProperty('lookupKey')) {
                securityLevel = securityLevel.lookupKey;
            } else if (securityLevel.hasOwnProperty('id')) {
                securityLevel = securityLevel.id;
            }
            securityLevel = lookupService.getLookupByLookupKey(lookupService.securityLevel, securityLevel);
            if (self.attachment && self.attachment.vsId) {
                var attachment = new Attachment(self.attachment);
                attachment.file = file;
                return attachment;
            } else {
                var activeAttachmentTypes = _.filter(self.attachmentTypes, function (type) {
                    return type.status;
                });

                return new Attachment({
                    file: file,
                    securityLevel: self.document ? securityLevel : null,
                    updateActionStatus: self.attachmentUpdateActions[0],
                    attachmentType: (activeAttachmentTypes.length) ? activeAttachmentTypes[0] : null,
                    priorityLevel: self.priorityLevels[0],
                    exportStatus: (self.document.getInfo().documentClass === 'outgoing')
                });
            }
        }

        self.hideButton = function (buttonType) {
            self[self.buttons[buttonType]] = false;
            self[buttonType] = true;
        };

        self.showButtons = function () {
            self.upload = true;
            self.scanner = true;
        };

        function _checkReceiveG2G() {
            return self.receiveG2g;
        }

        /**
         * to display scanner dialog
         * @param buttonType
         * @param $event
         */
        self.openScannerDialog = function (buttonType, $event) {
            if (_checkReceiveG2G()) {
                return;
            }
            self.hideButton(buttonType);
            scannerService
                .openScanner(true, $event)
                .then(function () {
                    var result = scannerService.getStoredImages();
                    self.attachment = _createAttachmentFile(result.file);
                    self.attachment.sourceType = 2; // scanned attachment.
                })
                .catch(function (error) {
                    self.showButtons();
                });
        };
        /**
         * @description open dialog from
         */
        self.openDragDropDialog = function ($event) {
            if (_checkReceiveG2G()) {
                return;
            }
            attachmentService
                .dragDropDialog(self.document, self.attachment, $event)
                .then(function (attachments) {
                    if (self.vsId) {
                        self.reloadAttachments()
                            .then(function (result) {
                                self.attachment = null;
                            })
                    } else {
                        if (attachments && attachments.length) {
                            if (self.attachment) {
                                var index = _.findIndex(self.attachments, function (existingAttachment) {
                                    return attachments[0].vsId === existingAttachment.vsId;
                                });
                                self.attachments.splice(index, 1, attachments[0]);
                            } else {
                                self.attachments = self.attachments.concat(attachments);
                            }
                            self.getSortedData();
                        }
                    }
                });
        };

        self.openFileUploadDialog = function (buttonType) {
            self.hideButton(buttonType);
        };

        self.attachmentNameExists = function (name) {
            return _.find(self.attachments, function (attachment) {
                return attachment.documentTitle === name
            });
        };

        self.setNameToAttachment = function (attachment, forIcn) {
            var name = langService.get('attachment_file');
            if (forIcn) {
                attachment = {documentTitle: '', docSubject: ''};
            }
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

        self.reloadAttachments = function () {
            return attachmentService.loadDocumentAttachments(self.vsId, self.documentClass)
                .then(function (result) {
                    self.attachments = result;
                    self.model = managerService.deepCopyAttachments(self.attachments);
                    self.getSortedData();
                    self.selectedAttachments = [];
                    return result;
                });
        };

        /**
         * send the document to the grid
         */
        self.addFileToAttachments = function () {
            self.attachment = self.setNameToAttachment(self.attachment);
            var promise = null;

            /*if (self.vsId) {
                promise = attachmentService.addAttachmentWithVsId(self.vsId, self.documentClass, self.attachment);
            } else {
                promise = attachmentService.addAttachmentWithOutVsId(self.documentClass, self.attachment);
            }*/
            var info = self.document.getInfo();
            promise = attachmentService.addAttachment(info, self.attachment);

            promise
                .then(function (attachment) {
                    if (self.vsId) {
                        self.attachment = null;
                        self.reloadAttachments()
                            .then(function (result) {
                                toast.success(langService.get('add_success').change({name: attachment.documentTitle}));
                            })
                    } else {
                        toast.success(langService.get('add_success').change({name: attachment.documentTitle}));
                        attachment.isDeletable = self.isAttachmentDeletable(attachment);
                        self.attachments.push(attachment);
                        self.model = managerService.deepCopyAttachments(self.attachments);
                        self.getSortedData();
                        self.attachment = null;
                    }
                })
                .catch(function (error) {
                    errorCode.checkIf(error, 'MAIP_PROTECTED_TEMPLATE', function () {
                        dialog.errorMessage(langService.get('protected_template'));
                    });
                    errorCode.checkIf(error, 'FAILED_INSERT_DOCUMENT', function () {
                        dialog.errorMessage(langService.get('file_with_size_extension_not_allowed'));
                    });
                })
                .finally(function () {
                    self.showButtons();
                });
        };

        self.deleteDocumentAttachment = function (attachment, $event) {
            if (_checkReceiveG2G()) {
                return;
            }
            var linkedExportedAttachments = [];
            dialog
                .confirmMessage(langService.get('confirm_delete').change({name: attachment.documentTitle}), null, null, $event)
                .then(function () {
                    var attachments = angular.copy(self.attachments);
                    linkedExportedAttachments = angular.copy(self.linkedExportedAttachments);
                    attachments.splice(self.attachments.indexOf(attachment), 1);
                    if (attachment.refVSID) {
                        var index = _.findIndex(linkedExportedAttachments, function (linkedExportedAttachment) {
                            return linkedExportedAttachment.vsId === attachment.vsId;
                        });
                        linkedExportedAttachments.splice(index, 1);
                    }
                    attachmentService
                        .deleteAttachment(self.vsId, self.documentClass, attachment).then(function () {
                        return attachments;
                    }).then(function (attachments) {
                        toast.success(langService.get('delete_success'));
                        self.attachments = attachments;
                        self.linkedExportedAttachments = linkedExportedAttachments;
                        self.model = managerService.deepCopyAttachments(self.attachments);
                        self.selectedAttachments = [];
                    });
                });
        };

        self.isAttachmentDeletable = function (attachment, editAttachment) {
            var isDeletable = !self.disableEverything && !attachment.refVSID && !_checkReceiveG2G()
                && attachmentService.checkAttachmentIsDeletable(self.document.getInfo(), attachment);
            if (editAttachment) {
                isDeletable = isDeletable && !self.isLinkedExportedDocAttachment;
            }
            return isDeletable;
        };

        self.isEnabledDeleteBulkAttachments = function ($event) {
            var isDeletableMap = _.map(self.selectedAttachments, function (attachment) {
                return self.isAttachmentDeletable(attachment, false);
            });
            return _.some(isDeletableMap, function (isDeletable) {
                return isDeletable;
            })

            /*return _.every(self.selectedAttachments, function (attachment) {
                return attachment.isDeletable;
            });*/
        };

        self.deleteBulkAttachments = function ($event) {
            if (_checkReceiveG2G()) {
                return;
            }
            dialog
                .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event)
                .then(function () {
                    var ids = _.map(self.selectedAttachments, 'vsId');
                    var attachments = _.filter(self.attachments, function (attachment) {
                        return ids.indexOf(attachment.vsId) === -1;
                    });
                    var linkedExportedAttachments = _.filter(self.linkedExportedAttachments, function (attachment) {
                        return ids.indexOf(attachment.vsId) === -1;
                    });

                    attachmentService
                        .deleteBulkAttachments(self.vsId, self.documentClass, self.selectedAttachments)
                        .then(function () {
                            toast.success(langService.get('delete_success'));
                            self.attachments = attachments;
                            self.linkedExportedAttachments = linkedExportedAttachments;
                            self.selectedAttachments = [];
                            self.model = managerService.deepCopyAttachments(self.attachments);
                        });
                });
        };

        self.openViewDocumentAttachment = function (attachment, $event) {
            attachmentService.viewAttachment(attachment, self.documentClass);
        };

        self.downloadAttachment = function (attachment, $event) {
            downloadService.controllerMethod
                .attachmentDownload(attachment.vsId);
        };

        /**
         * to upload the files
         * @param files
         * @param element
         */
        self.uploadAttachmentFile = function (files, element) {
            if (_checkReceiveG2G()) {
                return;
            }
            attachmentService
                .validateBeforeUpload('attachmentUpload', files[0])
                .then(function (file) {
                    self.attachment = _createAttachmentFile(file);
                })
                .catch(function (availableExtensions) {
                    // console.log(availableExtensions);
                    dialog.errorMessage(langService.get('invalid_uploaded_file').addLineBreak(availableExtensions.join(', ')));
                })

        };

        self.removeCurrentAttachedFile = function ($event) {
            dialog
                .confirmMessage(langService.get('attachment_remove_confirm'))
                .then(function () {
                    self.attachment = null;
                })
        };

        self.openEditDocumentAttachment = function (attachment, $event) {
            if (_checkReceiveG2G()) {
                return;
            }
            var file = attachment.file;
            self.attachment = angular.copy(attachment);
            self.attachmentCopyBeforeEdit = angular.copy(attachment);
            self.attachment.file = file;
            self.attachmentCopyBeforeEdit.file = file;
        };

        self.openEditAttachmentContent = function (attachment, $event) {
            if (_checkReceiveG2G()) {
                return;

            }
            return attachmentService.downloadDocumentContent(attachment.vsId)
                .then(function (content) {
                    scannerService
                        .openScannerForEdit(true, content, $event)
                        .then(function (file) {
                            attachment.file = file.file;
                            attachment.sourceType = 2; // scanned attachment.
                            attachmentService
                                .updateAttachment(self.document, attachment)
                                .then(function () {
                                    toast.success(langService.get('edit_success').change({name: attachment.documentTitle}));
                                    self.attachment = null;
                                });
                        });
                });

        };

        self.cancelEditAttachment = function () {
            self.attachment = null;
        };

        self.updateAttachment = function () {
            self.attachment = self.setNameToAttachment(self.attachment);
            var promise = null;
            /*if (self.vsId) {
                promise = attachmentService.updateAttachmentForDocWithVsId(self.vsId, self.documentClass, self.attachment);
            } else {
                promise = attachmentService.updateAttachmentForDocWithoutVsId(self.documentClass, self.attachment);
            }*/
            var info = self.document.getInfo();
            promise = attachmentService.updateAttachment(info, self.attachment);

            promise
                .then(function (attachment) {
                    if (self.vsId) {
                        self.reloadAttachments()
                            .then(function (result) {
                                toast.success(langService.get('edit_success').change({name: attachment.documentTitle}));
                                self.attachment = null;
                            })
                    } else {
                        toast.success(langService.get('edit_success').change({name: attachment.documentTitle}));
                        var existingAttachmentIndex = _.findIndex(self.attachments, function (existingAttachment) {
                            return existingAttachment.vsId === attachment.vsId;
                        });
                        self.attachments.splice(existingAttachmentIndex, 1, attachment);
                        self.model = managerService.deepCopyAttachments(self.attachments);
                        self.getSortedData();
                        self.attachment = null;
                    }
                })
                .catch(function (error) {
                    errorCode.checkIf(error, 'MAIP_PROTECTED_TEMPLATE', function () {
                        dialog.errorMessage(langService.get('protected_template'));
                    });
                    errorCode.checkIf(error, 'FAILED_INSERT_DOCUMENT', function () {
                        dialog.errorMessage(langService.get('file_with_size_extension_not_allowed'));
                    });
                })
                .finally(function () {
                    self.showButtons();
                });
        };

        $scope.$watch(function () {
            return self.model;
        }, function (newVal) {
            if (newVal && self.fromDialog)
                self.sourceModel = newVal;
        });

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.attachments = $filter('orderBy')(self.attachments, self.grid.order);
        };

        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };


        /**
         * @description Checks if attachment type will be available in drop down or not
         * If edit mode for attachment, show the selected value and all other active attachment types only
         * If add mode for attachment, show the active attachment types only
         * @param type
         * @returns {*}
         */
        self.checkAttachmentTypeIsAvailable = function (type) {
            if (self.attachmentCopyBeforeEdit) {
                var attachmentType = self.attachmentCopyBeforeEdit.attachmentType;
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

        /**
         * @description Opens the attachment options popup before opening icn search template popup
         * @param $event
         */
        self.openAttachmentIcnDialog = function ($event) {
            if (!self.vsId || !employeeService.hasPermissionTo('ICN_SEARCH_TEMPLATE')) {
                return;
            }
            attachmentService.openIcnAttachmentOptionsDialog(self.document, self.setNameToAttachment(null, true).documentTitle, $event)
                .then(function (result) {
                    self.reloadAttachments()
                        .then(function (result) {
                            self.attachment = null;
                        })
                })
        }
    });
};
