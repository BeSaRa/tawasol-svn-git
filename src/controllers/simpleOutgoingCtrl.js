module.exports = function (app) {
    app.controller('simpleOutgoingCtrl', function (Outgoing,
                                                   $state,
                                                   $stateParams,
                                                   outgoingService,
                                                   queueStatusService,
                                                   loadingIndicatorService,
                                                   organizationService,
                                                   configurationService,
                                                   // documentTypes,
                                                   officeWebAppService,
                                                   counterService,
                                                   generator,
                                                   $q,
                                                   // documentFiles,
                                                   managerService,
                                                   documentTypeService,
                                                   validationService,
                                                   toast,
                                                   employeeService,
                                                   $timeout,
                                                   // templates,
                                                   lookupService,
                                                   // demoOutgoing,
                                                   langService,
                                                   contextHelpService,
                                                   organizations,
                                                   cmsTemplate,
                                                   dialog,
                                                   draftOutgoingService,
                                                   replyTo,
                                                   editAfterApproved,
                                                   editAfterExport,
                                                   centralArchives,
                                                   mailNotificationService,
                                                   lookups, // new injector for all lookups can user access
                                                   correspondenceService,
                                                   ResolveDefer,
                                                   gridService,
                                                   _,
                                                   downloadService) {
        'ngInject';
        var self = this;
        self.controllerName = 'simpleOutgoingCtrl';
        contextHelpService.setHelpTo('simple-add-outgoing');
        self.employeeService = employeeService;
        self.emptySubSites = false;
        // current employee
        self.employee = employeeService.getEmployee();
        // validation for accordion
        self.validation = false;
        // collapse from label
        self.collapse = true;
        // current mode
        self.editMode = !!(editAfterApproved || editAfterExport);
        // self.editMode = false;
        // copy of the current outgoing if saved.
        // self.model = angular.copy(demoOutgoing);
        self.model = null;
        if (editAfterApproved) {
            self.model = angular.copy(editAfterApproved.metaData);
        } else if (editAfterExport) {
            self.model = angular.copy(editAfterExport.metaData);
        }
        self.editContent = false;
        //is in simple add mode
        self.simpleAdd = true;

        self.maxCreateDate = new Date();
        // all system organizations
        self.organizations = angular.copy(organizations);
        // in case of central archive.
        self.registryOrganizations = [];

        // all shortcut for the screen
        self.templates = lookups.templates;

        self.documentInformation = null;
        self.isNewDocument = false;

        self.outgoing =
            new Outgoing({
                ou: self.employee.getOUID(),
                addMethod: self.employee.isBacklogMode() ? 1 : 0,
                createdOn: new Date(),
                docDate: generator.convertDateToString(new Date()),
                registryOU: self.employee.getRegistryOUID(),
                securityLevel: lookups.securityLevels[0],
                linkedDocs: (replyTo && $stateParams.createAsAttachment !== "true") ? [replyTo] : [],
                attachments: (replyTo && $stateParams.createAsAttachment === "true") ? [replyTo] : []
            });

        if (replyTo) {
            self.outgoing = replyTo;
            if (self.outgoing.docDate) {
                self.outgoing.docDate = generator.convertDateToString(self.outgoing.docDate);
            }
            self.replyToOriginalName = angular.copy(replyTo.getTranslatedName());
            self.action = 'createReply';
        }

        if (editAfterApproved) {
            self.outgoing = editAfterApproved.metaData;
            self.documentInformation = editAfterApproved.content;
            self.editContent = true;
            self.action = 'editAfterApproved';
        } else if (editAfterExport) {
            self.outgoing = editAfterExport.metaData;
            self.documentInformation = editAfterExport.content;
            self.editContent = true;
            self.action = 'editAfterExport';
        }

        self.followUpStatuses = lookupService.returnLookups(lookupService.followupStatus);

        /**
         * @description Finds the property configuration by symbolic name
         * @param symbolicName
         * @returns {*|null}
         * @private
         */
        var _findPropertyConfiguration = function (symbolicName) {
            if (!symbolicName) {
                return null;
            }
            return _.find(properties, function (item) {
                return item.symbolicName.toLowerCase() === symbolicName.toLowerCase();
            }) || null;
        };

        var properties = angular.copy(lookupService.getPropertyConfigurations('outgoing'));
        var followupStatusConfiguration = _findPropertyConfiguration('FollowupStatus');
        var isNeedReplyFromConfiguration = followupStatusConfiguration ? followupStatusConfiguration.isMandatory : false;

        self.isDocumentTypeSwitchDisabled = function () {
            return !!self.outgoing.vsId || self.duplicateVersion || !employeeService.hasPermissionTo('OUTGOING_PAPER') || self.employee.isBacklogMode();
        };

        self.preventPropagation = function ($event) {
            $event.stopPropagation();
        };
        /**
         * @description to check central archive
         */
        self.checkCentralArchive = function () {
            // if employee in central archive and the outgoing is paper base
            if (employeeService.isCentralArchive() && self.outgoing.addMethod && centralArchives.length) {
                self.registryOrganizations = centralArchives;
                self.outgoing.emptyOrganizations();
            } else {
                var reg = employeeService.getEmployee().getRegistryOUID();
                self.organizations = organizationService.organizations;
                self.outgoing.ou = employeeService.getEmployee().getOUID();
                self.outgoing.registryOU = reg.hasOwnProperty('id') ? reg.id : reg;
            }
        };

        self.checkChangeOutgoingType = function () {
            if (self.documentInformation || self.outgoing.contentFile) {
                return dialog
                    .confirmMessage(langService.get('content_will_remove_confirm'))
                    .then(function () {
                        self.checkCentralArchive();
                        self.documentInformation = null;
                        self.outgoing.contentFile = null;
                        self.simpleViewUrl = null;
                    })
                    .catch(function () {
                        self.outgoing.addMethod = !self.outgoing.addMethod;
                    })
            }
            self.checkCentralArchive();
            return self.documentInformation = null;
        };


        self.requestCompleted = false;

        self.saveCorrespondence = function (status) {
            self.saveInProgress = true;
           // loadingIndicatorService.loading = true;
            if (status && !self.documentInformation) {
                toast.error(langService.get('cannot_save_as_draft_without_content'));
                self.saveInProgress = false;
                return;
            }

            var promise = null;
            var defer = $q.defer();
            if (replyTo && $stateParams.wobNum) {
                dialog.confirmMessage(langService.get('prompt_terminate').change({name: self.replyToOriginalName}), langService.get('yes'), langService.get('no'))
                    .then(function () {
                        self.terminateAfterCreateReply = true;
                        loadingIndicatorService.loading = true;
                        defer.resolve(true);
                    })
                    .catch(function (error) {
                        self.terminateAfterCreateReply = false;
                        loadingIndicatorService.loading = true;
                        defer.resolve(true);
                    })
            } else {
                self.terminateAfterCreateReply = false;
                defer.resolve(true);
            }
            return defer.promise.then(function () {
                var methods = {
                    createReply: {
                        key: 'createReplySave',
                        withContent: 'saveCreateReplyDocumentWithContent',
                        metaData: 'saveCreateReplyDocument'
                    },
                    normal: {
                        key: 'normalSave',
                        withContent: 'saveDocumentWithContent',
                        metaData: 'saveDocument'
                    }
                };

                // replyTo gets false after save for first time
                var method = (replyTo && !self.outgoing.vsId) ? methods.createReply : methods.normal,
                    vsId = replyTo ? $stateParams.vsId : false;

                /*No document information(No prepare document selected)*/
                if (self.documentInformation && !self.outgoing.addMethod) {
                    // Save Document With Content
                    if (status) {
                        self.outgoing.docStatus = queueStatusService.getDocumentStatus(status);
                    }
                    angular.element('iframe#document-viewer').remove();
                    var defer = $q.defer();
                    promise = defer.promise;
                    $timeout(function () {
                        self.outgoing[method.withContent](self.documentInformation, vsId)
                            .then(function (result) {
                                defer.resolve(result);
                            });
                    }, configurationService.OFFICE_ONLINE_DELAY);
                } else {
                    // Save Document
                    promise = self.outgoing[method.metaData](status, vsId);
                }
                return promise.then(function (result) {
                    self.outgoing = result;
                    self.model = angular.copy(self.outgoing);
                    self.documentInformationExist = !!angular.copy(self.documentInformation);

                    var newId = self.model.vsId;

                    /*If content file was attached */
                    if (self.outgoing.contentFile) {
                        return self.outgoing.addDocumentContentFile()
                            .then(function () {
                                self.contentFileExist = !!(self.outgoing.hasOwnProperty('contentFile') && self.outgoing.contentFile);
                                self.contentFileSizeExist = !!(self.contentFileExist && self.outgoing.contentFile.size);

                                saveCorrespondenceFinished(status);
                            })
                    } else {
                        self.contentFileExist = false;
                        self.contentFileSizeExist = false;
                        saveCorrespondenceFinished(status);
                        return true;
                    }
                })
                    .catch(function (error) {
                        self.saveInProgress = false;
                        if (typeof error === 'string') {
                            toast.error(error);
                        } else {
                            return $q.reject(error);
                        }
                    });
            });
        };

        self.saveCorrespondenceAndPrintBarcode = function ($event) {
            self.saveCorrespondence().then(function () {
                self.docActionPrintBarcode(self.outgoing, $event);
            })
        };

        var saveCorrespondenceFinished = function (status) {
            counterService.loadCounters();
            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
            if (replyTo) {
                replyTo = false;
            }
            self.outgoing.updateDocumentVersion();

            if (self.terminateAfterCreateReply) {
                correspondenceService.terminateWorkItemBehindScene($stateParams.wobNum, 'incoming', langService.get('terminated_after_create_reply'))
            }

            if (status) {// || (self.outgoing.contentFile)
                toast.success(langService.get('save_success'));
                $timeout(function () {
                    $state.go('app.outgoing.draft');
                })
            } else {
                var successKey = 'outgoing_metadata_saved_success';
                if (self.documentInformation) {
                    self.outgoing.contentSize = 1;
                    successKey = 'save_success'
                } else if (self.outgoing.contentFile && self.outgoing.contentFile.size) {
                    self.outgoing.contentSize = self.outgoing.contentFile.size;
                    successKey = 'save_success';
                }

                if (employeeService.hasPermissionTo('LAUNCH_DISTRIBUTION_WORKFLOW') && (!!self.documentInformationExist || !!(self.contentFileExist && self.contentFileSizeExist))) {
                    dialog.confirmMessage(langService.get('confirm_launch_distribution_workflow'))
                        .then(function () {
                            self.docActionLaunchDistributionWorkflow(self.outgoing);
                        });
                }

                self.requestCompleted = true;
                self.saveInProgress = false;
                toast.success(langService.get(successKey));
            }
        };

        /**
         * @description manage document tags
         * @param $event
         */
        self.openManageDocumentTags = function ($event) {
            managerService
                .manageDocumentTags(self.outgoing.vsId, self.outgoing.docClassName, self.outgoing.docSubject, $event)
                .then(function (tags) {
                    self.outgoing.tags = tags;
                })
                .catch(function (tags) {
                    self.outgoing.tags = tags;
                });
        };
        /**
         * demo for manage document attachments.
         * @param $event
         */
        self.openManageDocumentAttachments = function ($event) {
            managerService
                .manageDocumentAttachments(self.outgoing.vsId, self.outgoing.docClassName, self.outgoing.docSubject, $event)
                .then(function (attachments) {
                    self.outgoing.attachments = attachments;
                })
                .catch(function (attachments) {
                    self.outgoing.attachments = attachments;
                });
        };
        /**
         * demo for manage document comments .
         * @param $event
         */
        self.openManageDocumentComments = function ($event) {
            self.outgoing.manageDocumentComments($event)
                .then(function (documentComments) {
                    self.outgoing.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    self.outgoing.documentComments = documentComments;
                });
        };

        self.openManageDocumentProperties = function ($event) {
            // properties to preserve from override.
            var properties = [
                'attachments',
                'linkedEntities',
                'documentComments',
                'linkedDocs',
                'sitesInfoTo',
                'sitesInfoCC'
            ];

            managerService
                .manageDocumentProperties(self.outgoing.vsId, self.outgoing.docClassName, self.outgoing.docSubject, $event)
                .then(function (document) {
                    self.outgoing = generator.preserveProperties(properties, self.outgoing, document);
                })
                .catch(function (document) {
                    self.outgoing = generator.preserveProperties(properties, self.outgoing, document);
                });
        };


        self.docActionPrintBarcode = function (document, $event) {
            document.barcodePrint(document);
        };

        self.docActionLaunchDistributionWorkflow = function (document, $event) {
            //console.log('launch distribution workflow', document);
            if (!self.outgoing.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            document.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.resetAddCorrespondence();
                });
        };

        self.docActionQuickSend = function (document, $event) {
            if (!self.outgoing.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            document.quickSendLaunchWorkflow($event, 'favorites')
                .then(function () {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.resetAddCorrespondence();
                });
        };


        self.docActionSendToReview = function (document, $event) {
            //console.log('send to review', document);
            draftOutgoingService.controllerMethod
                .draftOutgoingSendToReview(self.outgoing, $event)
                .then(function () {
                    counterService.loadCounters();
                    self.resetAddCorrespondence();
                });
        };

        self.docActionSendToReadyToExport = function (model, $event, defer) {
            model.sendToReadyToExport($event)
                .then(function () {
                    toast.success(langService.get('export_success'));
                    new ResolveDefer(defer);
                    self.resetAddCorrespondence();
                })
        };

        /**
         * @description Send Link To Document By Email
         * @param model
         * @param $event
         * @param defer
         */
        self.docActionSendLinkToDocumentByEmail = function (model, $event, defer) {
            model
                .getMainDocumentEmailContent($event);
        };

        /**
         * @description export and send action
         * @param model
         * @param $event
         * @param defer
         */
        self.docActionExportAndSend = function (model, $event, defer) {
            model.exportDocument($event, false)
                .then(function () {
                    model.launchWorkFlow($event, 'forward', 'favorites').then(function () {
                        new ResolveDefer(defer);
                        counterService.loadCounters();
                        mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        self.resetAddCorrespondence();
                    }).catch(function () {
                        new ResolveDefer(defer);
                        counterService.loadCounters();
                        mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        self.resetAddCorrespondence();
                    });
                })
                .catch(function (error) {
                    if (error)
                        toast.error(langService.get('export_failed'));
                });
        };

        self.docActionCentralArchiveSendToReadyToExport = function (model, $event, defer) {
            return model.sendToCentralArchive(false, $event).then(function () {
                new ResolveDefer(defer);
                self.resetAddCorrespondence();
            });
        };
        /**
         * @description Approve the document
         * @param model
         * @param $event
         * @param defer
         * @returns {*}
         */
        self.docActionApprove = function (model, $event, defer) {
            if (_hasContent()) {
                model.approveDocument($event, defer, false)
                    .then(function (result) {
                        counterService.loadCounters();
                        mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        self.resetAddCorrespondence();
                    })
            }
        };
        /**
         * @description Approve and export the document
         * @param model
         * @param $event
         * @param defer
         * @returns {*}
         */
        self.docActionApproveAndExport = function (model, $event, defer) {
            if (_hasContent()) {
                model.approveDocument($event, defer, false)
                    .then(function (result) {
                        if (result === 'FULLY_AUTHORIZED') {
                            model.exportDocument($event, true)
                                .then(function () {
                                    new ResolveDefer(defer);
                                    counterService.loadCounters();
                                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                                    self.resetAddCorrespondence();
                                })
                                .catch(function (error) {
                                    if (error)
                                        toast.error(langService.get('export_failed'));
                                });
                        }
                    })
            }
        };

        self.docActionManageTasks = function (document, $event) {
            console.log('manage tasks', document);
        };

        self.docActionConfigureSecurity = function (document, $event) {
            console.log('configure document security', document);
        };

        self.docActionExportDocument = function (document, $event) {
            document.exportDocument($event, true)
                .then(function () {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.resetAddCorrespondence();
                })
                .catch(function (error) {
                    if (error)
                        toast.error(langService.get('export_failed'));
                });
        };

        /**
         * @description Archive the document to icn
         * @param document
         * @param $event
         */
        self.addToIcnArchive = function (document, $event) {
            document.addToIcnArchiveDialog($event)
                .then(function () {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    //self.resetAddCorrespondence();
                });
        };

        self.documentAction = null;
        self.performDocumentAction = function ($event) {
            self.documentAction.callback(self.outgoing, $event);
        };
        var _hasContent = function () {
            return (!!self.documentInformationExist || !!(self.contentFileExist && self.contentFileSizeExist));
        };

        var _hasSingleSignature = function (document) {
            return document.signaturesCount && document.signaturesCount === 1;
        };

        var _hasExternalOrG2GSite = function (model) {
            return !!(_.find([].concat(model.sitesInfoTo, model.sitesInfoCC), function (item) {
                return _.startsWith(item.subSiteId.toString(), '2') || _.startsWith(item.subSiteId.toString(), '3');
            }))
        };

        self.visibilityArray = [];
        self.isActionsAvailable = false;

        var isVisible = false;
        self.documentActions = [
            // Print Barcode
            {
                text: langService.get('content_action_print_barcode'),
                callback: self.docActionPrintBarcode,
                class: "action-green",
                permissionKey: "PRINT_BARCODE",
                checkShow: function (action, model, index) {
                    var info = model.getInfo();
                    isVisible = gridService.checkToShowAction(action) && !!info.isPaper; //Don't show if its electronic outgoing
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }
            },
            // Launch Distribution Workflow
            {
                text: langService.get('content_action_launch_distribution_workflow'),
                callback: self.docActionLaunchDistributionWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
                checkShow: function (action, model, index) {
                    isVisible = gridService.checkToShowAction(action) && _hasContent();
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }
            },
            // Quick Send
            {
                text: langService.get('grid_action_quick_send'),
                callback: self.docActionQuickSend,
                class: "action-green",
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
                checkShow: function (action, model, index) {
                    isVisible = gridService.checkToShowAction(action) && _hasContent();
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }
            },
            // Send To Review
            {
                text: langService.get('content_action_send_to_review'),
                callback: self.docActionSendToReview,
                class: "action-red",
                hide: true,
                checkShow: function (action, model, index) {
                    isVisible = gridService.checkToShowAction(action) && _hasContent();
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }
            },
            // Manage Tasks
            {
                text: langService.get('content_action_manage_tasks'),
                callback: self.docActionManageTasks,
                class: "action-red",
                hide: true,
                permissionKey: 'MANAGE_TASKS',
                checkShow: function (action, model, index) {
                    isVisible = gridService.checkToShowAction(action);
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }
            },
            // Configure Security
            {
                text: langService.get('content_action_configure_security'),
                callback: self.docActionConfigureSecurity,
                class: "action-red",
                hide: true,
                checkShow: function (action, model, index) {
                    isVisible = gridService.checkToShowAction(action);
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }
            },
            // Export
            {
                text: langService.get('content_action_export'),
                callback: self.docActionExportDocument,
                class: "action-green",
                permissionKey: "OPEN_DEPARTMENT’S_READY_TO_EXPORT_QUEUE",
                checkShow: function (action, model, index) {
                    var info = model.getInfo();
                    isVisible = gridService.checkToShowAction(action) && !model.isPrivateSecurityLevel() && !!info.isPaper && _hasContent() && (!_hasExternalOrG2GSite(model) || (_hasExternalOrG2GSite(model) && !employeeService.isCurrentOuLinkedToArchive())); //Don't show if its electronic outgoing
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }
            },
            // Send to ready to export
            {
                text: langService.get('grid_action_send_to_ready_to_export'),
                callback: self.docActionSendToReadyToExport,
                class: "action-green",
                permissionKey: 'SEND_TO_READY_TO_EXPORT_QUEUE',
                checkShow: function (action, model, index) {
                    // paper, not private security level, has content
                    var info = model.getInfo();
                    isVisible = gridService.checkToShowAction(action) && !model.isPrivateSecurityLevel() && info.isPaper && _hasContent();
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }
            },
            // Link To Document By Email
            {
                text: langService.get('grid_action_link_to_document_by_email'),
                callback: self.docActionSendLinkToDocumentByEmail,
                class: "action-green",
                permissionKey: 'SEND_COMPOSITE_DOCUMENT_BY_EMAIL',
                checkShow: function (action, model, index) {
                    // paper, not private security level, has content
                    var info = model.getInfo();
                    isVisible = gridService.checkToShowAction(action) && !model.isPrivateSecurityLevel() && info.isPaper && _hasContent();
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }
            },
            // export and send
            {
                text: langService.get('grid_action_export_and_send'),
                callback: self.docActionExportAndSend,
                class: "action-green",
                permissionKey: ['LAUNCH_DISTRIBUTION_WORKFLOW', 'OPEN_DEPARTMENT’S_READY_TO_EXPORT_QUEUE'],
                checkShow: function (action, model, index) {
                    var info = model.getInfo();
                    isVisible = gridService.checkToShowAction(action) && !model.isPrivateSecurityLevel() && !!info.isPaper && _hasContent() && (!_hasExternalOrG2GSite(model) || (_hasExternalOrG2GSite(model) && !employeeService.isCurrentOuLinkedToArchive())); //Don't show if its electronic outgoing
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }
            },
            // Send to central archive ready to export
            {
                text: langService.get('grid_action_send_to_central_archive'),
                callback: self.docActionCentralArchiveSendToReadyToExport,
                class: "action-green",
                permissionKey: 'SEND_TO_READY_TO_EXPORT_QUEUE',
                checkShow: function (action, model, index) {
                    // paper, not private security level, has content, (has external or g2g site), in central archive
                    var info = model.getInfo();
                    isVisible = gridService.checkToShowAction(action) && !model.isPrivateSecurityLevel()
                        && info.isPaper && _hasContent() && _hasExternalOrG2GSite(model) && employeeService.getEmployee().inCentralArchive();
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }
            },
            // Approve
            {
                text: langService.get('grid_action_approve'),
                callback: self.docActionApprove,
                class: "action-green",
                permissionKey: "ELECTRONIC_SIGNATURE",
                checkShow: function (action, model, index) {
                    var info = model.getInfo();
                    //Don't show if its paper outgoing  or signatures count more than 1 or personal/private security level
                    isVisible = gridService.checkToShowAction(action) && !info.isPaper && _hasContent() && _hasSingleSignature(model) && !model.isPrivateSecurityLevel();
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }
            },
            // Approve and export
            {
                text: langService.get('grid_action_approve_and_export'),
                callback: self.docActionApproveAndExport,
                class: "action-green",
                checkShow: function (action, model, index) {
                    var employee = employeeService.getEmployee();
                    if (!employee.hasPermissionTo('ELECTRONIC_SIGNATURE') || !employee.hasPermissionTo('OPEN_DEPARTMENT’S_READY_TO_EXPORT_QUEUE'))
                        return false;

                    var info = model.getInfo();
                    //Don't show if its paper outgoing or any site is external/g2g or signatures count more than 1 or personal/private security level
                    isVisible = gridService.checkToShowAction(action) && !model.isPrivateSecurityLevel() && !info.isPaper && !_hasExternalOrG2GSite(model) && _hasContent() && _hasSingleSignature(model);
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }
            },
            // Add To ICN Archive
            {
                text: langService.get('grid_action_icn_archive'),
                callback: self.addToIcnArchive,
                class: "action-green",
                permissionKey: 'ICN_ENTRY_TEMPLATE',
                checkShow: function (action, model, index) {
                    isVisible = gridService.checkToShowAction(action) && _hasContent();
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }
            }
        ];

        /**
         * @description Sets the availability for the dropdown of actions. If any action is available, dropdown is available.
         * @param actionIndex
         * @param isActionVisible
         */
        self.setDropdownAvailability = function (actionIndex, isActionVisible) {
            if (actionIndex === 0)
                self.visibilityArray = [];
            self.visibilityArray.push(isActionVisible);
            if (actionIndex + 1 === self.documentActions.length) {
                self.isActionsAvailable = !self.visibilityArray.length ? false : self.visibilityArray.indexOf(true) > -1;
            }
        };

        /**
         * @description confirm message when reset the Add Outgoing form
         * @param $event
         */
        self.confirmResetAddCorrespondence = function ($event) {
            dialog.confirmMessage(langService.get('confirm_reset_add'))
                .then(function () {
                    self.resetAddCorrespondence($event);
                });
        };


        /**
         * @description Reset the Add Outgoing form
         * @param $event
         */
        self.resetAddCorrespondence = function ($event) {
            self.outgoing = new Outgoing({
                ou: self.employee.getOUID(),
                addMethod: 0,
                createdOn: new Date(),
                docDate: generator.convertDateToString(new Date(), self.defaultDateFormat),
                registryOU: self.employee.getRegistryOUID(),
                securityLevel: lookups.securityLevels[0],
                sitesInfoTo: [],
                sitesInfoCC: [],
                ccSitesList: [],
                toSitesList: []
            });

            self.emptySubSites = true;
            self.emptySiteSearch = true;
            self.documentInformation = null;
            self.documentAction = null;
            self.documentInformationExist = false;
            self.contentFileExist = false;
            self.contentFileSizeExist = false;

            self.document_properties.$setUntouched();

            self.simpleViewUrl = null;
            self.isNewDocument = true;
        };

        /**
         * @description Redirects the user to landing-page
         * @param $event
         */
        self.cancelAddCorrespondence = function ($event) {
            $timeout(function () {
                if (employeeService.hasPermissionTo('LANDING_PAGE'))
                    $state.go('app.landing-page');
                else
                    $state.go('app.inbox.user-inbox');
            })
        };

        /**
         * @description Manage the attachments
         * @param $event
         */
        self.manageAttachments = function ($event) {
            self.outgoing.manageDocumentAttachments($event, true)
                .then(function (result) {
                    self.outgoing.attachments = result;
                })
                .catch(function (result) {
                    self.outgoing.attachments = result;
                });
        };

        /**
         * @description Manage the linked documents
         * @param $event
         */
        self.manageLinkedDocuments = function ($event) {
            self.outgoing.manageDocumentLinkedDocuments($event, true)
                .then(function (result) {
                    self.outgoing.linkedDocs = result;
                })
                .catch(function (result) {
                    self.outgoing.linkedDocs = result;
                });
        };

        /**
         * @description Manage linked entities
         * @param $event
         */
        self.manageLinkedEntities = function ($event) {
            self.outgoing
                .manageDocumentEntities($event, true)
                .then(function (result) {
                    self.outgoing.linkedEntities = result;
                }).catch(function (result) {
                self.outgoing.linkedEntities = result;
            })
        };

        self.needReply = function (status) {
            return (status && status.lookupStrKey === 'NEED_REPLY');
        };

        var _isValidFirstSubSite = function () {
            if (!isNeedReplyFromConfiguration) {
                return true;
            }

            var isValid = true;
            if (self.needReply(self.outgoing.sitesInfoTo[0].followupStatus)) {
                isValid = !!self.outgoing.sitesInfoTo[0].followupDate;
            }

            return isValid;
        };

        /**
         * @description Checks if form is invalid
         * @param form
         * @returns {boolean|boolean}
         */
        self.isInValidForm = function (form) {
            if (!form) {
                return true;
            }

            return form.$invalid
                || self.saveInProgress || !self.outgoing.sitesInfoTo.length || !_isValidFirstSubSite()
                || ((self.documentInformationExist || (self.contentFileExist && self.contentFileSizeExist))
                    && !(self.documentInformation || self.outgoing.contentFile));
        };

        self.$onInit = function () {
            if (self.employee.isBacklogMode()) {
                self.checkChangeOutgoingType();
            }
        };

    });
};
