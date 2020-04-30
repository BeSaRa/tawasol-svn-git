module.exports = function (app) {
    app.controller('manageContentDirectiveCtrl', function (officeWebAppService,
                                                           $scope,
                                                           _,
                                                           $q,
                                                           LangWatcher,
                                                           lookupService,
                                                           generator,
                                                           outgoingService,
                                                           EditInDesktopCallback,
                                                           urlService,
                                                           langService,
                                                           scannerService,
                                                           errorCode,
                                                           dialog,
                                                           $sce,
                                                           cmsTemplate,
                                                           rootEntity,
                                                           attachmentService,
                                                           correspondenceService,
                                                           employeeService,
                                                           $timeout,
                                                           validationService,
                                                           documentTemplateService) {
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

        self.isDefaultEditModeBoth = (employeeService.getEmployee().getDefaultEditMode() === correspondenceService.documentEditModes.desktopOfficeOnline);

        self.simpleViewUrl = null;

        LangWatcher($scope);

        function _isMandatory(propertyName) {
            return self.required[propertyName.toLowerCase()];
        }

        /**
         * @description to create the url schema depend on document class and vsId if found.
         * @param vsId
         * @param documentClass
         * @param extension
         * @return {string}
         * @private
         */
        function _createUrlSchema(vsId, documentClass, extension) {
            var url = [urlService.correspondence];
            vsId = (vsId ? vsId : null);
            documentClass = documentClass ? documentClass.toLowerCase() : null;
            if (documentClass)
                url.push(documentClass);
            if (vsId)
                url.push(vsId);
            if (extension)
                url.push(extension);
            return url.join('/');
        }

        self.checkRequired = function ($event) {
            var method = 'resolve';
            var labels = [];
            self.validateLabels = {
                ou: 'organization_unit',
                securityLevel: 'security_level',
                docDate: self.document.hasDocumentClass('incoming') ? 'incoming_date' : 'document_date',
                mainClassification: 'outgoing_main_classification',
                subClassification: 'outgoing_sub_classification',
                docSubject: 'document_subject',
                priorityLevel: 'outgoing_priority_level',
                docType: 'document_type',
                fileId: 'outgoing_file',
                fileCode: 'outgoing_file_code',
                fileSerial: 'outgoing_file_serial',
                sitesInfoTo: 'correspondence_sites'
            };

            var properties = self.document.getMainProperties();
            self.propertyConfigurations = lookupService.getPropertyConfigurations(self.document.docClassName);

            _.map(self.propertyConfigurations, function (item) {
                self.required[item.symbolicName.toLowerCase()] = item.isMandatory;
            });

            _.map(properties, function (item) {
                if (_isMandatory(item) && !self.document[item]) {
                    method = 'reject';
                    labels.push(item);
                }
            });

            if (!self.document.hasDocumentClass('outgoing')) {
                if (method === 'reject') {
                    labels = _.map(labels, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                }
                return $q[method](true);
            }

            // check siteInfoTo if outgoing document class
            return validationService
                .createValidation('ADD_CORRESPONDENCE_SITES')
                .addStep('check_required', false, self.document, function (result) {
                    return result.sitesInfoTo.length;
                })
                .notifyFailure(function (step, result) {
                    method = 'reject';
                    labels.push("sitesInfoTo");
                })
                .validate()
                .then(function (result) {
                    if (method === 'reject') {
                        labels = _.map(labels, function (label) {
                            return self.validateLabels[label];
                        });
                        generator.generateErrorFields('check_this_fields', labels);
                    }
                    return $q[method](true);
                })
        };

        self.openPrepareTemplateDialog = function ($event) {
            self.checkRequired($event).then(function () {
                if (self.editContent && self.documentInformation) {
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
                    templateUrl: cmsTemplate.getPopup('document-editor'),
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
                                .then(function () {
                                    self.document.updateDocumentVersion();
                                });
                        }
                    } else {
                        self.removeTemplateOrContentFile();
                    }
                });
        };

        /**
         * @description Checks whether to show/hide scan button
         * @returns {boolean|*}
         */
        self.checkToShowScanButton = function (document) {
            var docClass = document.getInfo().documentClass.toUpperCase();
            return !self.displayPrepare && !self.receiveDocument && employeeService.hasPermissionTo(docClass + '_SCAN_DOCUMENT');
        };

        /**
         * @description start PrepareCorrespondence Template.
         * @param $event
         */
        self.startPrepareCorrespondence = function ($event) {
            var defer = $q.defer();
            if (self.templates && self.templates.length) {
                defer.resolve(self.templates);
            } else {
                documentTemplateService.loadDocumentTemplates(employeeService.getEmployee().getRegistryOUID(), self.document.getInfo().documentClass)
                    .then(function (templates) {
                        defer.resolve(templates);
                    })
            }
            defer.promise.then(function (templates) {
                return officeWebAppService
                    .displayTemplates(templates, $event)
                    .then(function (template) {
                        self.template = template;

                        if (self.isSimpleAdd) {
                            return self.getTrustViewUrl(template.getSubjectTitle(), $event);
                        } else {
                            return self.openPreparedTemplate(template.getSubjectTitle(), $event);
                        }
                    });
            })
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

                if (info.documentClass.toLowerCase() === 'incoming' || info.isPaper) {
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
                                            errorCode.checkIf(error, 'MAIP_PROTECTED_TEMPLATE', function () {
                                                dialog.errorMessage(langService.get('protected_template'));
                                            });
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


        self.openScannerDialog = function (buttonType, $event) {
            scannerService
                .openScanner(true, $event)
                .then(function () {
                    var result = scannerService.getStoredImages();
                    result.file.name = result.file.name + '.pdf';
                    return self.checkContentFile([result.file]);
                })
        };

        self.showEditContentInEditPopup = function () {
            var info = self.document.getInfo();
            return (self.fromDialog && info.documentClass.toLowerCase() !== 'incoming' && !info.isPaper && self.document.contentSize && info.docStatus < 24) && !self.editContent;
        };
        /**
         * @description open edit correspondence when editAfterApproved = true.
         */
        self.openCorrespondenceToEdit = function (justView) {
            if (!self.documentInformation.editURL) {
                self.documentInformation.editURL = angular.copy(self.documentInformation.viewURL);
            }
            self.documentInformation.viewURL = typeof self.documentInformation.viewURL === 'object' ? self.documentInformation.viewURL : $sce.trustAsResourceUrl(self.documentInformation.viewURL);
            self.documentInformation.editURL = typeof self.documentInformation.editURL === 'object' ? self.documentInformation.editURL : $sce.trustAsResourceUrl(self.documentInformation.editURL);
            self.trusted = true;

            if (justView) {
                return self.editInOfficeOnlineAfterApprove();
            }

            if (employeeService.getEmployee().defaultEditMode === correspondenceService.documentEditModes.desktop) {
                // edit in desktop
                self.editInDesktopAfterApprove();
            } else if (employeeService.getEmployee().defaultEditMode === correspondenceService.documentEditModes.officeOnline) {
                // edit in office online
                self.editInOfficeOnlineAfterApprove();
            } else {
                // confirmation to select which edit mode
                _defaultBehavior();
            }
        };

        function _defaultBehavior() {
            var message = langService.getConcatenated(['short_edit_in_desktop_confirmation_1', 'short_edit_in_desktop_confirmation_2']);
            dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('edit-in-desktop-confirm-template'),
                    controller: function (dialog) {
                        'ngInject';
                        var ctrl = this;

                        ctrl.editInDesktopCallback = function () {
                            self.editInDesktopAfterApprove();
                            dialog.hide();
                        };

                        ctrl.editInOfficeOnlineCallback = function () {
                            self.editInOfficeOnlineAfterApprove();
                            dialog.hide();
                        };

                        ctrl.cancelCallback = function () {
                            dialog.cancel();
                        }
                    },
                    controllerAs: 'ctrl',
                    bindToController: true,
                    locals: {
                        content: message
                    }
                });
        }


        self.editInDesktopAfterApprove = function () {
            var info = self.document.getInfo();
            var desktop = new EditInDesktopCallback({
                url: _createUrlSchema(info.vsId, info.documentClass, 'with-content'),
                type: 'correspondence'
            });
            self.document.editCorrespondenceInDesktop(self.editInOfficeOnlineAfterApprove)
                .then(function () {
                    dialog.showDialog({
                        templateUrl: cmsTemplate.getPopup('reload-content-overlay'),
                        controllerAs: 'ctrl',
                        controller: function ($scope, LangWatcher) {
                            'ngInject';
                            var ctrl = this;
                            LangWatcher($scope);
                            ctrl.reloadCallback = function () {
                                desktop.reloadContent(true).then(function (correspondence) {
                                    self.document.minorVersionNumber = correspondence.metaData.minorVersionNumber;
                                    self.document.majorVersionNumber = correspondence.metaData.majorVersionNumber;
                                    self.documentInformation = angular.copy(correspondence.content);
                                    dialog.hide();
                                });
                            }
                        }
                    })
                });
        };

        self.editInOfficeOnlineAfterApprove = function () {
            return correspondenceService
                .openCorrespondenceEditor(self.documentInformation)
                .then(function (information) {
                    self.documentInformation = information;
                });
        };


        /**
         * @description Opens the document in edit mode by checking the default edit mode.
         * @returns {undefined}
         */
        self.editContentInEditPopup = function ($event) {
            if (employeeService.getEmployee().defaultEditMode === correspondenceService.documentEditModes.desktop) {
                self.editInDesktop($event);
            } else if (employeeService.getEmployee().defaultEditMode === correspondenceService.documentEditModes.officeOnline) {
                self.editInOfficeOnline($event);
            }

            /*self.document.openInEditMode = true;
            return correspondenceService.viewCorrespondence(self.document, [], true, true);*/
        };


        self.editInDesktop = function ($event) {
            self.document.editCorrespondenceInDesktop()
                .catch(function (error) {
                    if (error === 'EDIT_IN_DESKTOP_MISSING') {
                        dialog.confirmMessage(langService.get('missing_edit_in_desktop_tool_contact_admin'), langService.get('try_again'), langService.get('cancel'), $event)
                            .then(function () {
                                self.editInDesktop($event);
                            })
                    }
                });
        };

        self.editInOfficeOnline = function ($event) {
            self.document.editCorrespondenceInOfficeOnline($event);
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
                self.documentInformation = self.lastTemplate;
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
