module.exports = function (app) {
    app.controller('outgoingCtrl', function (Outgoing,
                                             $state,
                                             $stateParams,
                                             outgoingService,
                                             queueStatusService,
                                             organizationService,
                                             // documentTypes,
                                             officeWebAppService,
                                             counterService,
                                             generator,
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
                                             $q,
                                             draftOutgoingService,
                                             replyTo,
                                             editAfterApproved,
                                             editAfterExport,
                                             duplicateVersion,
                                             centralArchives,
                                             mailNotificationService,
                                             userSubscriptionService,
                                             lookups, // new injector for all lookups can user access
                                             correspondenceService,
                                             ResolveDefer) {
        'ngInject';
        var self = this;
        self.controllerName = 'outgoingCtrl';
        contextHelpService.setHelpTo('add-outgoing');

        self.isDemoBuild = generator.isDemoBuild;

        self.employeeService = employeeService;
        self.emptySubSites = false;
        // current employee
        self.employee = employeeService.getEmployee();
        // validation for accordion
        self.validation = true;
        // collapse from label
        self.collapse = true;
        // current mode
        self.editMode = !!(editAfterApproved || editAfterExport || duplicateVersion);
        // self.editMode = false;
        // copy of the current outgoing if saved.
        // self.model = angular.copy(demoOutgoing);
        self.model = null;
        if (editAfterApproved) {
            self.model = angular.copy(editAfterApproved.metaData);
        } else if (editAfterExport) {
            self.model = angular.copy(editAfterExport.metaData);
        } else if (duplicateVersion) {
            self.model = angular.copy(duplicateVersion.metaData);
        }
        self.editContent = false;

        self.maxCreateDate = new Date();
        // all system organizations
        self.organizations = angular.copy(organizations);
        // in case of central archive.
        self.registryOrganizations = [];

        // all shortcut for the screen
        self.templates = lookups.templates;

        self.documentInformation = null;


        self.outgoing =
            new Outgoing({
                ou: self.employee.getOUID(),
                addMethod: 0,
                createdOn: new Date(),
                docDate: new Date(),
                registryOU: self.employee.getRegistryOUID(),
                securityLevel: lookups.securityLevels[0],
                linkedDocs: replyTo ? [replyTo] : []
            });

        if (replyTo) {
            self.outgoing = replyTo;
            self.replyToOriginalName = angular.copy(replyTo.getTranslatedName());
        }

        if (editAfterApproved) {
            self.outgoing = editAfterApproved.metaData;
            self.documentInformation = editAfterApproved.content;
            self.editContent = true;
        } else if (editAfterExport) {
            self.outgoing = editAfterExport.metaData;
            self.documentInformation = editAfterExport.content;
            self.editContent = true;
        } else if (duplicateVersion) {
            self.outgoing = duplicateVersion.metaData;
            self.documentInformation = self.outgoing.hasContent() ? duplicateVersion.content : null;
            self.editContent = self.outgoing.hasContent();// true;
            self.duplicateVersion = true;
        }

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

        /**
         * @description Handle the change of paper/electronic switch
         * @returns {*}
         */
        self.checkChangeOutgoingType = function () {
            // self.checkCentralArchive();
            if (self.documentInformation || self.outgoing.contentFile) {
                return dialog
                    .confirmMessage(langService.get('content_will_remove_confirm'))
                    .then(function () {
                        self.checkCentralArchive();
                        self.documentInformation = null;
                        self.outgoing.contentFile = null;
                    })
                    .catch(function () {
                        //self.outgoing.addMethod = !self.outgoing.addMethod;
                        self.outgoing.addMethod = 1 - self.outgoing.addMethod;
                    })
            }
            self.checkCentralArchive();
            return self.documentInformation = null;
        };


        self.requestCompleted = false;
        self.saveInProgress = false;
        self.saveCorrespondence = function (status) {
            if (status && !self.documentInformation) {
                toast.error(langService.get('cannot_save_as_draft_without_content'));
                return;
            }
            self.saveInProgress = true;
            var promise = null;
            var defer = $q.defer();
            //var isDocHasVsId = angular.copy(self.outgoing).hasVsId();
            if (replyTo && $stateParams.workItem) {
                dialog.confirmMessage(langService.get('prompt_terminate').change({name: self.replyToOriginalName}), 'yes', 'no')
                    .then(function () {
                        self.terminateAfterCreateReply = true;
                        defer.resolve(true);
                    })
                    .catch(function (error) {
                        self.terminateAfterCreateReply = false;
                        defer.resolve(true);
                    })
            } else {
                self.terminateAfterCreateReply = false;
                defer.resolve(true);
            }
            defer.promise.then(function () {
                /*No document information(No prepare document selected)*/
                if (self.documentInformation && !self.outgoing.addMethod) {
                    if (status) {
                        self.outgoing.docStatus = queueStatusService.getDocumentStatus(status);
                    }
                    promise = self.outgoing
                        .saveDocumentWithContent(self.documentInformation);
                } else {
                    promise = self.outgoing
                        .saveDocument(status)
                }
                promise.then(function (result) {
                    self.outgoing = result;
                    self.model = angular.copy(self.outgoing);
                    self.documentInformationExist = !!angular.copy(self.documentInformation);

                    var newId = self.model.vsId;

                    /*If content file was attached */
                    if (self.outgoing.contentFile) {
                        self.outgoing.addDocumentContentFile()
                            .then(function () {
                                self.contentFileExist = !!(self.outgoing.hasOwnProperty('contentFile') && self.outgoing.contentFile);
                                self.contentFileSizeExist = !!(self.contentFileExist && self.outgoing.contentFile.size);

                                saveCorrespondenceFinished(status, newId);
                            })
                    } else if (duplicateVersion && self.outgoing.hasContent() && self.outgoing.addMethod) {
                        self.outgoing
                            .attacheContentUrl(self.documentInformation)
                            .then(function () {
                                self.contentFileExist = true;
                                self.contentFileSizeExist = true;
                                saveCorrespondenceFinished(status, newId);
                            });
                    } else {
                        self.contentFileExist = false;
                        self.contentFileSizeExist = false;
                        saveCorrespondenceFinished(status, newId);
                    }
                })
                    .catch(function (error) {
                        self.saveInProgress = false;
                        toast.error(error);
                    });
            })
        };

        var saveCorrespondenceFinished = function (status, newId) {
            counterService.loadCounters();
            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
            if (replyTo) {
                userSubscriptionService.loadUserSubscriptions();
            }

            if (self.terminateAfterCreateReply) {
                correspondenceService.terminateWorkItemBehindScene($stateParams.workItem, 'incoming', langService.get('terminated_after_create_reply'))
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
                    successKey = 'save_success'
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
            managerService
                .manageDocumentComments(self.outgoing.vsId, self.outgoing.docSubject, $event)
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
            if (model.fromCentralArchiveWhileAdd(employeeService.getEmployee().getOUID()))
                return model.sendToCentralArchive(false, $event).then(function () {
                    new ResolveDefer(defer);
                    self.resetAddCorrespondence();
                });

            model.sendToReadyToExport($event)
                .then(function () {
                    toast.success(langService.get('export_success'));
                    new ResolveDefer(defer);
                    self.resetAddCorrespondence();
                })
        };

        self.docActionManageTasks = function (document, $event) {
            console.log('manage tasks', document);
        };

        self.docActionConfigureSecurity = function (document, $event) {
            console.log('configure document security', document);
        };

        self.docActionExportDocument = function (document, $event) {
            console.log('export', document);
        };

        self.documentAction = null;
        self.performDocumentAction = function ($event) {
            self.documentAction.callback(self.outgoing, $event);
        };

        self.visibilityArray = [];
        self.isActionsAvailable = false;

        /**
         * @description Check if action will be shown in dropdown or not
         * @param action
         * @param model
         * @returns {boolean}
         */
        self.checkToShowAction = function (action, model) {
            var hasPermission = true;
            if (action.hasOwnProperty('permissionKey')) {
                if (typeof action.permissionKey === 'string') {
                    hasPermission = employeeService.hasPermissionTo(action.permissionKey);
                } else if (angular.isArray(action.permissionKey) && action.permissionKey.length) {
                    if (action.hasOwnProperty('checkAnyPermission')) {
                        hasPermission = employeeService.getEmployee().hasAnyPermissions(action.permissionKey);
                    } else {
                        hasPermission = employeeService.getEmployee().hasThesePermissions(action.permissionKey);
                    }
                }
            }
            return (!action.hide) && hasPermission;
        };

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
                    isVisible = self.checkToShowAction(action, model) && !!info.isPaper; //Don't show if its electronic outgoing
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
                    isVisible = self.checkToShowAction(action, model) && (!!self.documentInformationExist || !!(self.contentFileExist && self.contentFileSizeExist));
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
                    isVisible = self.checkToShowAction(action, model) && (!!self.documentInformationExist || !!(self.contentFileExist && self.contentFileSizeExist));
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
                    isVisible = self.checkToShowAction(action, model);
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
                    isVisible = self.checkToShowAction(action, model);
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }
            },
            // Export
            {
                text: langService.get('content_action_export'),
                callback: self.docActionExportDocument,
                class: "action-red",
                hide: true,
                checkShow: function (action, model, index) {
                    var info = model.getInfo();
                    isVisible = self.checkToShowAction(action, model) && !!info.isPaper; //Don't show if its electronic outgoing
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }
            },
            // Export (Send to ready to export)
            {
                text: langService.get('grid_action_send_to_ready_to_export'),
                callback: self.docActionSendToReadyToExport,
                class: "action-green",
                permissionKey: 'SEND_TO_READY_TO_EXPORT_QUEUE',
                textCallback: function (model) {
                    return model.fromCentralArchiveWhileAdd(employeeService.getEmployee().getOUID()) ? 'grid_action_send_to_central_archive' : 'grid_action_send_to_ready_to_export';
                },
                checkShow: function (action, model, index) {
                    var info = model.getInfo();
                    isVisible = self.checkToShowAction(action, model) && info.isPaper && (!!self.documentInformationExist || !!(self.contentFileExist && self.contentFileSizeExist));
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
         * @description Reset the Add Outgoing form
         * @param $event
         */
        self.resetAddCorrespondence = function ($event) {
            self.outgoing = new Outgoing({
                ou: self.employee.getOUID(),
                addMethod: 0,
                createdOn: new Date(),
                docDate: new Date(),
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
        };

        self.compositeChange = function () {
            if (self.documentInformation) {
                dialog
                    .confirmMessage(langService.get('please_reselect_content'))
                    .then(function () {
                        self.documentInformation = null;
                    })
                    .catch(function () {
                        self.outgoing.isComposite = !self.outgoing.isComposite;
                    });
            }
        };

        /**
         * @description Redirects the user to landing-page
         * @param $event
         */
        self.cancelAddCorrespondence = function ($event) {
            $timeout(function () {
                $state.go('app.landing-page');
            })
        };


        /**
         * @description Get the text of action according to selected language
         * @param action
         */
        self.getActionText = function (action) {
            if (typeof action !== 'undefined') {
                if (action.hasOwnProperty('textCallback') && angular.isFunction(action.textCallback)) {
                    return langService.get(action.textCallback(self.model));
                } else {
                    return action.text;
                }
            }

        };
    });
};
