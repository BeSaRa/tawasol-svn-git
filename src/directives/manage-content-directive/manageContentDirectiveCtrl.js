module.exports = function (app) {
    app.controller('manageContentDirectiveCtrl', function (officeWebAppService,
                                                           $scope,
                                                           _,
                                                           $q,
                                                           LangWatcher,
                                                           lookupService,
                                                           generator,
                                                           outgoingService,
                                                           langService,
                                                           scannerService,
                                                           errorCode,
                                                           dialog,
                                                           $sce,
                                                           cmsTemplate,
                                                           rootEntity,
                                                           attachmentService,
                                                           correspondenceService,
                                                           $timeout) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageContentDirectiveCtrl';
        self.template = null;
        self.model = null;
        self.documentInformation = null;
        self.lastTemplate = null;

        self.document = null;
        self.editContent = false;
        self.propertyConfigurations = [];

        self.required = {};


        self.simpleViewUrl = null;

        LangWatcher($scope);

        function _isMandatory(propertyName) {
            return self.required[propertyName.toLowerCase()];
        }


        self.checkRequired = function ($event) {
            var method = 'resolve';
            var properties = self.document.getMainProperties();
            self.propertyConfigurations = lookupService.getPropertyConfigurations(self.document.docClassName);

            _.map(self.propertyConfigurations, function (item) {
                self.required[item.symbolicName.toLowerCase()] = item.isMandatory;
            });


            _.map(properties, function (item) {
                if (_isMandatory(item) && !self.document[item]) {
                    method = 'reject';
                }
            });

            if (method === 'reject') {
                dialog.errorMessage(langService.get('some_properties_required'), null, null, $event);
            }
            return $q[method](true);
        };

        self.openPrepareTemplateDialog = function ($event) {
            self.checkRequired($event).then(function () {
                if (self.editContent) {
                    return dialog
                        .confirmMessage(langService.get('content_will_remove_confirm'))
                        .then(function () {
                            self.startPrepareCorrespondence($event);
                        });
                }

                return self.startPrepareCorrespondence($event);
            });
        };

        self.openPreparedTemplate = function (templateOrFileName, $event, information) {
            return dialog
                .showDialog({
                    template: cmsTemplate.getPopup('document-editor'),
                    controller: 'documentEditorPopCtrl',
                    bindToController: true,
                    controllerAs: 'ctrl',
                    escapeToClose: false,
                    resolve: {
                        documentUrl: function () {
                            'ngInject';
                            if (information) {
                                self.lastTemplate = information;
                                self.signaturesCount = 1;
                                return $sce.trustAsResourceUrl(information.viewURL);
                            }
                            self.model = angular.copy(self.document);
                            self.model.classDescription = self.document.docClassName;

                            return officeWebAppService.getTemplateToPrepare(self.template, generator.interceptSendInstance(['Correspondence', 'Outgoing'], self.model))
                                .then(function (result) {
                                    self.lastTemplate = result;
                                    self.signaturesCount = self.template.signaturesCount;
                                    return $sce.trustAsResourceUrl(result.viewURL);
                                });
                        }
                    }
                })
                .then(function (result) {
                    if (result) {
                        self.documentInformation = self.lastTemplate;
                        self.templateOrFileName = templateOrFileName;
                        if (self.vsId && !self.fromDialog) {
                            correspondenceService
                                .updateCorrespondenceWithContent(self.document, self.documentInformation)
                        }
                    } else {
                        self.removeTemplateOrContentFile();
                    }
                });
        };

        /**
         * @description start PrepareCorrespondence Template.
         * @param $event
         */
        self.startPrepareCorrespondence = function ($event) {
            return officeWebAppService
                .displayTemplates(self.templates, $event)
                .then(function (template) {
                    self.template = template;

                    if (self.isSimpleAdd) {
                        return self.getTrustViewUrl(template.getSubjectTitle(), $event);
                    } else {
                        return self.openPreparedTemplate(template.getSubjectTitle(), $event);
                    }
                });
        };

        /**
         * @description Checks the file for the allowed file formats
         * @param contentFiles
         * @param element
         */
        self.checkContentFile = function (contentFiles, element) {
            if (contentFiles.length) {
                var info = self.document.getInfo();
                //Electronic Document - only word document is allowed
                var allowedDocument = "wordDocument";
                //Paper Document - Check global settings for allowed types
                var availableTypes = rootEntity.getGlobalSettings().getAvailableTypes();
                var extensions = _.map(availableTypes, function (value, key) {
                    return '.' + availableTypes[key].extension;
                });

                if (info.isPaper) {
                    allowedDocument = 'Paper' + info.documentClass;
                    // create run time group extensions to check it later beforeUpload function.
                    attachmentService.getProvider().addExtensionGroup(allowedDocument, extensions).prepareExtensions();
                } else {
                    // send uploaded file to the service and open popup to edit the uploaded file.
                    return self.checkRequired(null)
                        .then(function () {
                            attachmentService
                                .validateBeforeUpload(allowedDocument, contentFiles[0])
                                .then(function (file) {
                                    return correspondenceService
                                        .sendUploadedFileToPrepare(file, self.document)
                                        .then(function (result) {
                                            if (self.isSimpleAdd)
                                                return self.getTrustViewUrl(file.name, null, result);

                                            else
                                                return self.openPreparedTemplate(file.name, null, result);
                                        })
                                        .catch(function (error) {
                                            errorCode.checkIf(error, 'FILE_NOT_ALLOWED', function () {
                                                dialog.errorMessage(langService.get('invalid_template'));
                                            })

                                        })
                                })
                                .catch(function (availableExtensions) {
                                    self.document.contentFile = null;
                                    self.isContentFileAttached = false;
                                    dialog.errorMessage(langService.get('invalid_uploaded_file').addLineBreak(availableExtensions.join(', ')));
                                });

                        });
                }
                var fileName = angular.copy(contentFiles[0].name);
                return attachmentService
                    .validateBeforeUpload(allowedDocument, contentFiles[0])
                    .then(function (file) {
                        self.document.contentFile = file;
                        self.isContentFileAttached = true;
                        self.templateOrFileName = fileName;

                        if (self.isSimpleAdd) {
                            // available viewer
                            var availableViewer = ['jpg', 'jpeg', 'gif', 'png'];
                            if (availableViewer.indexOf(file.name.split('.').pop().toLowerCase()) === -1) {
                                return file;
                            }
                            var reader = new FileReader();
                            reader.onload = function () {
                                var bytesArray = new Uint8Array(reader.result);
                                var blob = new Blob([bytesArray], {
                                    type: file.type
                                });
                                $timeout(function () {
                                    self.simpleViewUrl = $sce.trustAsResourceUrl(URL.createObjectURL(blob));
                                });
                            };
                            reader.readAsArrayBuffer(file);
                        }

                        return file;
                    })
                    .catch(function (availableExtensions) {
                        self.document.contentFile = null;
                        self.isContentFileAttached = false;
                        self.templateOrFileName = null;
                        dialog.errorMessage(langService.get('invalid_uploaded_file').addLineBreak(availableExtensions.join(', ')));
                    });
            } else {
                $timeout(function () {
                    self.document.contentFile = null;
                    self.isContentFileAttached = false;
                })
            }
        };

        /**
         * @description Remove the attached file from the file uploader
         * @param $event
         */
        self.removeTemplateOrContentFile = function ($event) {
            self.template = null;
            self.templateOrFileName = null;
            self.documentInformation = null;
            self.contentFile = self.document.contentFile = null;
            self.isContentFileAttached = false;
            self.simpleViewUrl = null;
        };
        /**
         * @description open edit correspondence when editAfterApproved = true.
         */
        self.openCorrespondenceToEdit = function () {
            if (!self.trusted)
                self.documentInformation.viewURL = $sce.trustAsResourceUrl(self.documentInformation.viewURL);

            self.trusted = true;
            return correspondenceService
                .openCorrespondenceEditor(self.documentInformation)
                .then(function (information) {
                    self.documentInformation = information;
                });
        };

        self.openScannerDialog = function (buttonType, $event) {
            scannerService
                .openScanner(false, $event)
                .then(function (result) {
                    result.file.name = result.file.name + '.pdf';
                    return self.checkContentFile([result.file]);
                })
        };

        self.showEditContentInEditPopup = function () {
            return (self.fromDialog && !self.document.getInfo().isPaper && self.document.contentSize && self.document.getInfo().docStatus < 24) && !self.editContent;
        };

        self.openEditContentInEditPopup = function () {
            return correspondenceService.viewCorrespondence(self.document, [], true, true);
        };


        self.savePreparedDocument = function () {
            self.documentInformation = self.docInfo;
            self.templateOrFileName = self.docName;
            if (self.simpleViewUrl) {
                if (self.vsId && !self.fromDialog) {
                    correspondenceService
                        .updateCorrespondenceWithContent(self.document, self.documentInformation)
                }
            } else {
                self.removeTemplateOrContentFile();
            }
        };

        self.getTrustViewUrl = function (templateOrFileName, $event, information) {
            self.docName = templateOrFileName;

            if (information) {
                self.lastTemplate = information;
                self.docInfo = information;
                self.signaturesCount = 1;

                self.simpleViewUrl = $sce.trustAsResourceUrl(information.viewURL);
                return self.simpleViewUrl;
            }

            self.model = angular.copy(self.document);
            self.model.classDescription = self.document.docClassName;

            return officeWebAppService.getTemplateToPrepare(self.template, generator.interceptSendInstance(['Correspondence', 'Outgoing'], self.model))
                .then(function (result) {
                    self.lastTemplate = result;
                    self.docInfo = result;
                    self.documentInformation = self.lastTemplate;
                    self.signaturesCount = self.template.signaturesCount;
                    self.simpleViewUrl = $sce.trustAsResourceUrl(result.viewURL);
                    self.templateOrFileName = self.document.getTranslatedName();
                    return self.simpleViewUrl;
                });
        }
    });
};