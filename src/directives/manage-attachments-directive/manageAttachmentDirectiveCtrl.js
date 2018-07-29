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
                                                              errorCode) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageAttachmentDirectiveCtrl';
        LangWatcher($scope); // to watch the languages
        self.allowScanner = true;
        self.allowUpload = true;
        self.attachment = null;
        // all attachments types
        self.attachmentTypes = attachmentTypeService.returnAttachmentTypes();

        // current document file
        self.document = null;

        $timeout(function () {
            // all security level
            self.securityLevel = correspondenceService.getLookup(self.document.getInfo().documentClass, 'securityLevels');
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
            order: 'arName', // default sorting order
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
            }
            else if (securityLevel.hasOwnProperty('id')) {
                securityLevel = securityLevel.id;
            }
            return new Attachment({
                file: file,
                securityLevel: self.document ? securityLevel : null
            });
        }

        self.hideButton = function (buttonType) {
            self[self.buttons[buttonType]] = false;
            self[buttonType] = true;
        };

        self.showButtons = function () {
            self.upload = true;
            self.scanner = true;
        };
        /**
         * to display scanner dialog
         * @param buttonType
         * @param $event
         */
        self.openScannerDialog = function (buttonType, $event) {
            self.hideButton(buttonType);
            scannerService
                .openScanner(false, $event)
                .then(function () {
                    var result = scannerService.getStoredImages();
                    console.log('result', result);
                    self.attachment = _createAttachmentFile(result.file);
                })
                .catch(function (error) {
                    self.showButtons();
                });
        };
        /**
         * @description open dialog from
         */
        self.openDragDropDialog = function ($event) {
            attachmentService
                .dragDropDialog(self.document, $event)
                .then(function (attachments) {
                    self.attachments = self.attachments.concat(attachments);
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
        /**
         * send the document to the grid
         */
        self.addFileToAttachments = function () {
            self.attachment = self.setNameToAttachment(self.attachment);
            var promise = null;
            if (self.vsId) {
                promise = attachmentService.addAttachmentWithVsId(self.vsId, self.documentClass, self.attachment);
            } else {
                promise = attachmentService.addAttachmentWithOutVsId(self.documentClass, self.attachment);
            }

            promise
                .then(function (attachment) {
                    toast.success(langService.get('add_success').change({name: attachment.documentTitle}));
                    self.attachments.push(attachment);
                    self.model = angular.copy(self.attachments);
                    self.attachment = null;
                })
                .catch(function (error) {
                    errorCode.checkIf(error, 'SIZE_EXTENSION_NOT_ALLOWED', function () {
                        dialog.errorMessage(langService.get('file_with_size_extension_not_allowed'));
                    });
                })
                .finally(function () {
                    self.showButtons();
                });
        };

        self.deleteDocumentAttachment = function (attachment, $event) {
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
                        self.model = angular.copy(self.attachments);
                    });
                });

        };

        self.deleteBulkAttachments = function ($event) {
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
                            self.model = angular.copy(self.attachments);
                        });
                });
        };

        self.openViewDocumentAttachment = function (attachment, $event) {
            //correspondenceService.viewAttachment(attachment, self.documentClass);
            attachmentService.viewAttachment(attachment, self.documentClass);
        };
        /**
         * to upload the files
         * @param files
         * @param element
         */
        self.uploadAttachmentFile = function (files, element) {
            console.log(files);
            attachmentService
                .validateBeforeUpload('attachmentUpload', files[0])
                .then(function (file) {
                    self.attachment = _createAttachmentFile(file);
                })
                .catch(function (availableExtensions) {
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

        $scope.$watch(function () {
            return self.model;
        }, function (newVal) {
            if (newVal && self.fromDialog)
                self.sourceModel = newVal;
        });


    });
};