module.exports = function (app) {
    app.controller('manageAttachmentDirectiveCtrl', function ($scope,
                                                              $element,
                                                              $timeout,
                                                              attachmentTypeService,
                                                              Attachment,
                                                              AnnotationType,
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
                                                              userExternalDataSourceService,
                                                              cmsTemplate,
                                                              employeeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageAttachmentDirectiveCtrl';
        LangWatcher($scope); // to watch the languages
        self.employeeService = employeeService;

        self.allowScanner = true;
        self.allowUpload = true;
        self.attachment = null;

        self.rootEntity = rootEntity;
        // current document file
        self.document = null;
        self.attachmentToBeSignedExtensions = ['.pdf'];

        $timeout(function () {
            // all attachments types
            self.attachmentTypes = attachmentTypeService.returnAttachmentTypes(self.documentClass);
            // all security level
            self.securityLevel = correspondenceService.getLookup(self.documentClass, 'securityLevels');
            self.attachmentUpdateActions = lookupService.returnLookups(lookupService.attachmentUpdateAction);
            self.priorityLevels = lookupService.returnLookups(lookupService.attachmentPriority);
            self.getSortedData();
            if (_checkReceiveG2G()) {
                self.receiveG2GDocumentCopy = angular.copy(self.document);
                self.receiveG2GDocumentCopy.ou = self.receiveG2gOuId;
                self.isLimitedCentralUnitAccess = correspondenceService.isLimitedCentralUnitAccess(self.receiveG2GDocumentCopy);
            } else {
                self.isLimitedCentralUnitAccess = correspondenceService.isLimitedCentralUnitAccess(self.document);
            }
        });

        // to hide buttons when one of the process work.
        self.buttons = {
            upload: 'scanner',
            scanner: 'upload',
            externalImport: 'externalImport'
        };
        // our process on the current controller.
        self.upload = true;
        self.scanner = true;
        self.externalImport = true;
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
        self.hasPSPDFViewer = rootEntity.hasPSPDFViewer();

        function _createAttachmentFile(file, externalImportData) {
            var securityLevel = self.document.securityLevel, attachment;
            if (securityLevel.hasOwnProperty('lookupKey')) {
                securityLevel = securityLevel.lookupKey;
            } else if (securityLevel.hasOwnProperty('id')) {
                securityLevel = securityLevel.id;
            }
            securityLevel = lookupService.getLookupByLookupKey(lookupService.securityLevel, securityLevel);
            if (self.attachment && self.attachment.vsId) {
                if (externalImportData) {
                    attachment = new Attachment(self.attachment);
                } else {
                    attachment = new Attachment(self.attachment);
                    attachment.file = file;
                }
            } else {
                var activeAttachmentTypes = _.filter(self.attachmentTypes, function (type) {
                    return type.status;
                });

                if (externalImportData) {
                    attachment = new Attachment({
                        securityLevel: self.document ? securityLevel : null,
                        updateActionStatus: self.attachmentUpdateActions[0],
                        attachmentType: (activeAttachmentTypes.length) ? activeAttachmentTypes[0] : null,
                        priorityLevel: self.priorityLevels[0],
                        exportStatus: (self.document.getInfo().documentClass === 'outgoing')
                    });
                } else {
                    attachment = new Attachment({
                        file: file,
                        securityLevel: self.document ? securityLevel : null,
                        updateActionStatus: self.attachmentUpdateActions[0],
                        attachmentType: (activeAttachmentTypes.length) ? activeAttachmentTypes[0] : null,
                        priorityLevel: self.priorityLevels[0],
                        exportStatus: (self.document.getInfo().documentClass === 'outgoing')
                    });
                }
            }
            attachment.externalImportData = externalImportData || null;
            return attachment;
        }

        self.hideButton = function (buttonType) {
            self[self.buttons[buttonType]] = false;
            self[buttonType] = true;
        };

        self.showButtons = function () {
            self.upload = true;
            self.scanner = true;
            self.externalImport = true;
        };

        function _checkReceiveG2G() {
            return self.receiveG2g;
        }

        self.checkReceiveOrReceiveG2G = function () {
            return (self.receive || self.receiveG2g);
        };

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
                    self.attachment = _createAttachmentFile(result.file, null);
                    self.activeAttachment = self.attachment;
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
                                self.activeAttachment = null;
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

        /**
         * @description Opens dialog to import from external data sources
         * @param $event
         */
        self.openExternalImportDialog = function ($event) {
            if (_checkReceiveG2G()) {
                return;
            }

            userExternalDataSourceService.openExternalImportDialog($event)
                .then(function (importResult) {
                    if (!importResult) {
                        return;
                    }
                    self.attachment = _createAttachmentFile(null, importResult);
                    self.activeAttachment = self.attachment;
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
                    self.attachments = self.checkReceiveOrReceiveG2G() ? self.document.filterLinkedDocuments(result) : result;
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
            self.activeAttachment = self.attachment;
            if (!self.isAttachmentExtensionValid()) {
                dialog.errorMessage(langService.get('invalid_uploaded_file').addLineBreak(self.attachmentToBeSignedExtensions.join(', ')));
                return;
            }

            var info = self.document.getInfo();
            var promise = attachmentService.addAttachment(self.document, self.attachment);

            promise
                .then(function (attachment) {
                    if (self.vsId) {
                        self.attachment = null;
                        self.activeAttachment = null;
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
                        self.activeAttachment = null;
                    }
                    self.attachmentCopyBeforeEdit = null;
                })
                .catch(function (error) {
                    errorCode.checkIf(error, 'MAIP_PROTECTED_TEMPLATE', function () {
                        dialog.errorMessage(langService.get('protected_template'));
                    });
                    errorCode.checkIf(error, 'FAILED_INSERT_DOCUMENT', function () {
                        dialog.errorMessage(langService.get('file_with_size_extension_not_allowed'));
                    });
                    errorCode.checkIf(error, 'INVALID_CONTRACT_AS_CONTENT', function () {
                        dialog.errorMessage(generator.getTranslatedError(error));
                    });
                    if (self.attachment.checkMaxValidAttachmentsSize()) {
                        dialog.errorMessage(langService.get('file_with_size_extension_not_allowed'));
                    }
                })
                .finally(function () {
                    self.showButtons();
                });
        };

        self.deleteDocumentAttachment = function (attachment, $event) {
            if (!self.isAttachmentDeletable(attachment, false)) {
                return;
            }
            var linkedExportedAttachments = [];
            dialog
                .confirmMessage(langService.get('confirm_delete').change({name: attachment.documentTitle}), null, null, $event)
                .then(function () {
                    var attachments = angular.copy(self.attachments);
                    if (attachments) {
                        var attachmentIndex = _.findIndex(self.attachments, function (item) {
                            return item.vsId === attachment.vsId;
                        });
                        if (attachmentIndex > -1) {
                            attachments.splice(attachmentIndex, 1);
                        }
                    }
                    linkedExportedAttachments = angular.copy(self.linkedExportedAttachments);
                    if (attachment.refVSID) {
                        var linkedExportedIndex = _.findIndex(linkedExportedAttachments, function (linkedExportedAttachment) {
                            return linkedExportedAttachment.vsId === attachment.vsId;
                        });
                        if (linkedExportedIndex > -1) {
                            linkedExportedAttachments.splice(linkedExportedIndex, 1);
                        }
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
            if (self.disableEverything) {
                return false;
            }
            if (self.allowAddFromCorrespondence) {
                return true;
            }

            var isDeletable = attachmentService.checkAttachmentIsDeletable(self.document.getInfo(), attachment, self.checkReceiveOrReceiveG2G()),
                isEditable = attachmentService.checkAttachmentIsEditable(self.document.getInfo(), attachment, self.checkReceiveOrReceiveG2G());

            isDeletable = self.checkReceiveOrReceiveG2G() ? isDeletable : (!attachment.refVSID && isDeletable);

            isEditable = !attachment.refVSID && isEditable && !self.isLinkedExportedDocAttachment;

            return (editAttachment ? isEditable : isDeletable);
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
            if (!self.isEnabledDeleteBulkAttachments()) {
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
            if (attachment.isViewable() && employeeService.hasPermissionTo("DOWNLOAD_ATTACHMENT_WITHOUT_WATERMARK")) {
                var buttonsList = [
                    {id: 1, type: "yes", text: "yes", value: true, cssClass: ""},
                    {id: 2, type: "no", text: "no", value: false, cssClass: ""}
                ];

                return dialog.confirmMessageWithDynamicButtonsList(langService.get('do_you_want_to_download_without_watermark'), buttonsList, '')
                    .then(function (selectedLabel) {
                        return _downloadAttachment(attachment, selectedLabel.value);
                    })
            } else {
                return _downloadAttachment(attachment);
            }
        };

        function _downloadAttachment(attachment, withoutWatermark) {
            var info = self.document.getInfo();
            downloadService.controllerMethod
                .attachmentDownload(attachment.vsId, info.docClassId, info.vsId, withoutWatermark);
        }

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
                    self.attachment = _createAttachmentFile(file, null);
                    self.activeAttachment = self.attachment;
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
                    self.activeAttachment = null;
                    self.attachmentCopyBeforeEdit = null;
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

            self.activeAttachment = self.attachment;
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
                                    self.activeAttachment = null;
                                });
                        });
                });

        };

        self.cancelEditAttachment = function () {
            self.attachment = null;
            self.activeAttachment = null;
            self.attachmentCopyBeforeEdit = null;
        };

        self.updateAttachment = function () {
            self.attachment = self.setNameToAttachment(self.attachment);
            self.activeAttachment = self.attachment;
            if (!self.isAttachmentExtensionValid()) {
                dialog.errorMessage(langService.get('invalid_uploaded_file').addLineBreak(self.attachmentToBeSignedExtensions.join(', ')));
                return;
            }

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
                                self.activeAttachment = null;
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
                        self.activeAttachment = null;
                    }
                    self.attachmentCopyBeforeEdit = null;
                })
                .catch(function (error) {
                    errorCode.checkIf(error, 'MAIP_PROTECTED_TEMPLATE', function () {
                        dialog.errorMessage(langService.get('protected_template'));
                    });
                    errorCode.checkIf(error, 'FAILED_INSERT_DOCUMENT', function () {
                        dialog.errorMessage(langService.get('file_with_size_extension_not_allowed'));
                    });
                    errorCode.checkIf(error, 'INVALID_CONTRACT_AS_CONTENT', function () {
                        dialog.errorMessage(generator.getTranslatedError(error));
                    });
                    if (self.attachment.checkMaxValidAttachmentsSize()) {
                        dialog.errorMessage(langService.get('file_with_size_extension_not_allowed'));
                    }
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
                            self.activeAttachment = null;
                        })
                })
        };

        self.openAnnotateAttachment = function (attachment, $event) {
            correspondenceService
                .annotateCorrespondence(attachment, AnnotationType.ANNOTATION, self.document);
        };

        /**
         * @description view correspondence .
         * @param correspondence
         * @param $event
         */
        self.viewCorrespondence = function (correspondence, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            if (correspondence.isLimitedCentralUnitAccess()) {
                dialog.infoMessage(langService.get('archive_secure_document_content'));
                return;
            }
            correspondenceService.viewCorrespondence(correspondence, [], true, true);
        };

        /**
         * @description open search dialog
         * @param $event
         */
        self.openSearchDialog = function ($event) {
            correspondenceService.openLinkedDocsSearchDialog(self.vsId, [], self.viewCorrespondence, false, true, $event)
                .then(function (result) {
                    if (self.vsId) {
                        _copyAttachments(angular.copy(result));
                    }
                });
        };

        function _copyAttachments(selectedCopies) {
            attachmentService.copyAttachmentsFromCorrespondence(self.document, selectedCopies.correspondence, selectedCopies.attachments)
                .then(function (result) {
                    toast.success(langService.get('add_success'));
                    self.reloadAttachments();
                });
        }

        /**
         * @description open signature popup for approval
         */
        self.openApproveAttachment = function (attachment, $event) {
            attachmentService.openAttachmentSignaturePopup(self.document, attachment, $event)
                .then(function (result) {
                    if (result) {
                        self.reloadAttachments().then(function () {
                            toast.success(langService.get('sign_specific_success').change({name: attachment.getTranslatedName()}));
                        })
                    }
                })
        }

        /**
         * @description validate if attachment to be signed enable should be only pdf uploaded
         * @returns {boolean}
         */
        self.isAttachmentExtensionValid = function () {
            return !(rootEntity.isSigningContractsEnabled() && self.attachment.isContract &&
                self.attachment.file &&
                self.attachmentToBeSignedExtensions.indexOf('.'.concat(self.attachment.getExtension().ext)) === -1);
        }

        self.$onInit = function () {
            self.isImportFromExDataSourceAllowed = false;
            self.isPaper = self.document.getInfo().isPaper;

            if (rootEntity.returnRootEntity().rootEntity.importDataSourceStatus) {
                userExternalDataSourceService.loadActiveUserExternalDataSources()
                    .then(function (result) {
                        self.isImportFromExDataSourceAllowed = result.length > 0;
                        return result;
                    });
            }
        }
    });
};
