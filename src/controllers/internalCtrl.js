module.exports = function (app) {
    app.controller('internalCtrl', function (Internal,
                                             // classifications,
                                             $state,
                                             $q,
                                             internalService,
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
                                             langService,
                                             toast,
                                             employeeService,
                                             $timeout,
                                             // templates,
                                             lookupService,
                                             contextHelpService,
                                             organizations,
                                             cmsTemplate,
                                             lookups,
                                             dialog,
                                             draftInternalService,
                                             editAfterApproved,
                                             duplicateVersion,
                                             mailNotificationService,
                                             gridService,
                                             replyTo,
                                             $stateParams,
                                             correspondenceService,
                                             rootEntity,
                                             configurationService) {
        'ngInject';
        var self = this;
        self.controllerName = 'internalCtrl';
        contextHelpService.setHelpTo('add-internal');

        self.isDemoBuild = generator.isDemoBuild;

        self.employeeService = employeeService;
        // current employee
        self.employee = employeeService.getEmployee();

        self.hasPSPDFViewer = rootEntity.hasPSPDFViewer();
        self.annotationPermission = configurationService.ANNOTATE_DOCUMENT_PERMISSION;

        // validation for accordion
        self.validation = true;
        // collapse from label
        self.collapse = true;
        // current mode
        self.editMode = !!(editAfterApproved || duplicateVersion);
        // self.editMode = false;
        // copy of the current internal if saved.
        // self.model = angular.copy(demoInternal);
        self.model = null;
        if (editAfterApproved) {
            self.model = angular.copy(editAfterApproved.metaData);
        } else if (duplicateVersion) {
            self.model = angular.copy(duplicateVersion.metaData);
            self.duplicateVersion = true;
        }
        self.editContent = false;


        self.maxCreateDate = new Date();
        // all system organizations
        self.organizations = organizations;


        self.templates = lookups.templates;

        self.documentInformation = null;
        self.isNewDocument = false;
        self.action = null;
        // internal document
        self.internal =
            new Internal({
                ou: self.employee.getOUID(),
                addMethod: self.employee.isBacklogMode() ? 1 : 0,
                createdOn: new Date(),
                docDate: new Date(),
                registryOU: self.employee.getRegistryOUID(),
                securityLevel: lookups.securityLevels[0],
                linkedDocs: (replyTo && $stateParams.createAsAttachment !== "true") ? [replyTo] : [],
                attachments: (replyTo && $stateParams.createAsAttachment === "true") ? [replyTo] : []
            });

        if (replyTo) {
            self.internal = replyTo;
            self.replyToOriginalName = angular.copy(replyTo.getTranslatedName());
            self.action = 'replyTo';
        }

        if (editAfterApproved) {
            self.internal = editAfterApproved.metaData;
            self.documentInformation = editAfterApproved.content;
            self.editContent = true;
            self.action = 'editAfterApproved';
        } else if (duplicateVersion) {
            self.internal = duplicateVersion.metaData;
            self.documentInformation = self.internal.hasContent() ? duplicateVersion.content : null;
            self.editContent = true;
            self.action = 'duplicateVersion';
        }

        self.preventPropagation = function ($event) {
            $event.stopPropagation();
        };

        /**
         * @description Handle the change of paper/electronic switch
         * @returns {*}
         */
        self.checkChangeInternalType = function () {
            if (self.documentInformation || self.internal.contentFile) {
                return dialog
                    .confirmMessage(langService.get('content_will_remove_confirm'))
                    .then(function () {
                        self.documentInformation = null;
                        self.internal.contentFile = null;
                    })
                    .catch(function () {
                        //self.internal.addMethod = !self.internal.addMethod;
                        self.internal.addMethod = 1 - self.internal.addMethod;
                    })
            }
            return self.documentInformation = null;
        };

        self.requestCompleted = false;
        self.saveInProgress = false;
        self.saveCorrespondence = function (status, ignoreLaunch) {
            if (status && !self.documentInformation) {
                toast.error(langService.get('cannot_save_as_draft_without_content'));
                return;
            }
            self.saveInProgress = true;
            var promise = null;
            var defer = $q.defer();
            if (replyTo && $stateParams.wobNum) {
                dialog.confirmMessage(langService.get('prompt_terminate').change({name: self.replyToOriginalName}), langService.get('yes'), langService.get('no'))
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
                var method = (replyTo && !self.internal.vsId) ? methods.createReply : methods.normal,
                    vsId = replyTo ? $stateParams.vsId : false;

                /*No document information(No prepare document selected)*/
                if (self.documentInformation && !self.internal.addMethod) {
                    // Save Document With Content
                    if (status) {
                        self.internal.docStatus = queueStatusService.getDocumentStatus(status);
                    }
                    promise = self.internal[method.withContent](self.documentInformation, vsId);
                } else {
                    // Save Document
                    promise = self.internal[method.metaData](status, vsId);
                }
                return promise.then(function (result) {
                    self.internal = result;
                    self.model = angular.copy(self.internal);
                    self.documentInformationExist = !!angular.copy(self.documentInformation);


                    /*If content file was attached */
                    if (self.internal.contentFile) {
                        return self.internal.addDocumentContentFile()
                            .then(function () {
                                self.contentFileExist = !!(self.internal.hasOwnProperty('contentFile') && self.internal.contentFile);
                                self.contentFileSizeExist = !!(self.contentFileExist && self.internal.contentFile.size);

                                saveCorrespondenceFinished(status, ignoreLaunch);
                            })
                    } else if (duplicateVersion && self.internal.hasContent() && self.internal.addMethod) {
                        return self.internal
                            .attacheContentUrl(self.documentInformation)
                            .then(function () {
                                self.contentFileExist = true;
                                self.contentFileSizeExist = true;
                                saveCorrespondenceFinished(status, ignoreLaunch);
                            });
                    } else {
                        self.contentFileExist = false;
                        self.contentFileSizeExist = false;
                        saveCorrespondenceFinished(status, ignoreLaunch);
                        return true;
                    }
                }).catch(function (error) {
                    self.saveInProgress = false;
                    return $q.reject(error);
                });
            })
        };

        self.saveCorrespondenceAndPrintBarcode = function ($event) {
            self.saveCorrespondence(false, true)
                .then(function () {
                    self.docActionPrintBarcode(self.internal, $event);
                })
        };

        var saveCorrespondenceFinished = function (status, ignoreLaunch) {
            counterService.loadCounters();
            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
            if (replyTo) {
                replyTo = false;
            }
            self.internal.updateDocumentVersion();

            if (self.terminateAfterCreateReply) {
                correspondenceService.terminateWorkItemBehindScene($stateParams.wobNum, 'incoming', langService.get('terminated_after_create_reply'))
            }

            if (status) {// || (self.internal.contentFile)
                toast.success(langService.get('save_success'));
                $timeout(function () {
                    $state.go('app.internal.draft');
                })
            } else {
                var successKey = 'internal_metadata_saved_success';
                if (self.documentInformation) {
                    self.internal.contentSize = 1;
                    successKey = 'save_success';
                } else if (self.internal.contentFile && self.internal.contentFile.size) {
                    self.internal.contentSize = self.internal.contentFile.size;
                    successKey = 'save_success';
                }

                self.requestCompleted = true;
                self.saveInProgress = false;
                toast.success(langService.get(successKey));

                if (ignoreLaunch) {
                    return;
                }
                _launchAfterSave();
            }
        };

        function _launchAfterSave() {
            if (employeeService.hasPermissionTo('LAUNCH_DISTRIBUTION_WORKFLOW') && _hasContent()) {
                dialog.confirmMessage(langService.get('confirm_launch_distribution_workflow'))
                    .then(function () {
                        self.docActionLaunchDistributionWorkflow(self.internal);
                    });
            }
        }

        self.saveAndAnnotateDocument = function ($event) {
            self.saveCorrespondence(false, true).then(function () {
                self.internal.openForAnnotation()
                    .then(function (result) {
                        if (result !== 'DOCUMENT_LAUNCHED_ALREADY') {
                            _launchAfterSave();
                            if (result.hasOwnProperty('type') && result.type === 'ATTACHMENT') {
                                self.internal.attachments.push(result.attachment);
                            }
                        } else {
                            self.resetAddCorrespondence();
                        }
                    });
            });
        };

        /**
         * demo manage document tags
         * @param $event
         */
        self.openManageDocumentTags = function ($event) {
            managerService
                .manageDocumentTags(self.internal.vsId, self.internal.docClassName, self.internal.docSubject, $event)
                .then(function (tags) {
                    self.internal.tags = tags;
                })
                .catch(function (tags) {
                    self.internal.tags = tags;
                });
        };
        /**
         * demo for manage document attachments.
         * @param $event
         */
        self.openManageDocumentAttachments = function ($event) {
            managerService
                .manageDocumentAttachments(self.internal.vsId, self.internal.docClassName, self.internal.docSubject, $event)
                .then(function (attachments) {
                    self.internal.attachments = attachments;
                })
                .catch(function (attachments) {
                    self.internal.attachments = attachments;
                });
        };
        /**
         * demo for manage document comments .
         * @param $event
         */
        self.openManageDocumentComments = function ($event) {
            self.internal.manageDocumentComments($event)
                .then(function (documentComments) {
                    self.internal.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    self.internal.documentComments = documentComments;
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
                .manageDocumentProperties(self.internal.vsId, self.internal.docClassName, self.internal.docSubject, $event)
                .then(function (document) {
                    self.internal = generator.preserveProperties(properties, self.internal, document);
                })
                .catch(function (document) {
                    self.internal = generator.preserveProperties(properties, self.internal, document);
                });
        };

        self.docActionPrintBarcode = function (document, $event) {
            document.barcodePrint(document);
        };

        self.docActionLaunchDistributionWorkflow = function (document, $event) {
            if (!self.internal.hasContent()) {
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
            if (!self.internal.hasContent()) {
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

        /**
         * @description Launch distribution workflow with sequential workflow
         * @param document
         * @param $event
         */
        self.launchSequentialWorkflow = function (document, $event) {
            if (!self.internal.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            document.openLaunchSequentialWorkflowDialog($event)
                .then(function () {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
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
         * @description approve and send the document
         * @param model
         * @param $event
         * @param defer
         * @return {*}
         */
        self.signESignatureAndSend = function (model, $event, defer) {
            if (!self.internal.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }

            model.approveDocument($event, defer, false, true)
                .then(function (result) {
                    model.launchWorkFlow($event, 'forward', 'favorites')
                        .then(function () {
                            counterService.loadCounters();
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            self.resetAddCorrespondence();
                        });
                })
        };

        self.docActionSendToReview = function (document, $event) {
            draftInternalService.controllerMethod
                .draftInternalSendToReview(self.internal, $event);
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

        /**
         * @description add correspondence To My FollowUp
         * @param document
         * @param $event
         */
        self.addToDirectFollowUp = function (document, $event) {
            document.addToMyDirectFollowUp()
                .then(function () {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    //self.resetAddCorrespondence();
                });
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
            self.documentAction.callback(self.internal, $event);
        };
        var _hasContent = function () {
            return (!!self.documentInformationExist || !!(self.contentFileExist && self.contentFileSizeExist));
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
                    isVisible = gridService.checkToShowAction(action) && !!info.isPaper; //Don't show if its electronic internal
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
            // Launch Sequential Workflow
            {
                text: langService.get('grid_action_launch_sequential_workflow'),
                callback: self.launchSequentialWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_SEQ_WF',
                checkShow: function (action, model, index) {
                    isVisible = gridService.checkToShowAction(action) && _hasContent() && rootEntity.hasPSPDFViewer() && !model.hasActiveSeqWF();
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
            // Approve and send
            {
                text: langService.get('grid_action_electronic_approve_and_send'),
                callback: self.signESignatureAndSend,
                class: "action-green",
                permissionKey: ['ELECTRONIC_SIGNATURE_MEMO', 'LAUNCH_DISTRIBUTION_WORKFLOW'],
                checkShow: function (action, model, index) {
                    var info = model.getInfo();
                    isVisible = gridService.checkToShowAction(action) && !info.isPaper && _hasContent();
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
                class: "action-red",
                hide: true,
                checkShow: function (action, model, index) {
                    var info = model.getInfo();
                    isVisible = gridService.checkToShowAction(action) && info.isPaper && !model.isPrivateSecurityLevel(); //Don't show if its electronic internal
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }
            },
            // Approve
            {
                text: langService.get('grid_action_approve'),
                callback: self.docActionApprove,
                class: "action-green",
                permissionKey: "ELECTRONIC_SIGNATURE_MEMO",
                checkShow: function (action, model, index) {
                    var info = model.getInfo();
                    isVisible = !model.hasActiveSeqWF() && gridService.checkToShowAction(action) && !info.isPaper && _hasContent() && !model.isPrivateSecurityLevel() && !model.isInternalPersonal(); //Don't show if its paper internal
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
            },
            // add to my follow up
            {
                text: langService.get('add_to_my_direct_followup'),
                callback: self.addToDirectFollowUp,
                permissionKey: 'USER_FOLLOWUP_BOOKS',
                class: "action-green",
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
         * @description confirm message when reset the Add internal form
         * @param $event
         */
        self.confirmResetAddCorrespondence = function ($event) {
            dialog.confirmMessage(langService.get('confirm_reset_add'))
                .then(function () {
                    self.resetAddCorrespondence($event);
                });
        };


        /**
         * @description Reset the Add internal form
         * @param $event
         */
        self.resetAddCorrespondence = function ($event) {
            //ou: self.employee.organization.ouid,
            self.internal = new Internal({
                ou: self.employee.getOUID(),
                addMethod: self.employee.isBacklogMode() ? 1 : 0,
                createdOn: new Date(),
                docDate: new Date(),
                registryOU: self.employee.getRegistryOUID(),
                securityLevel: lookups.securityLevels[0]
            });

            self.documentInformation = null;
            self.documentAction = null;
            self.documentInformationExist = false;
            self.contentFileExist = false;
            self.contentFileSizeExist = false;
            self.editContent = false;
            self.document_properties.$setUntouched();

            self.isNewDocument = true;
        };

        /**
         * @description Checks if data is valid to save
         * @param actionType
         * @param contentRequired
         * pass true, if content is always required for save
         * @returns {boolean}
         */
        self.isSaveValid = function (actionType, contentRequired) {
            if (!self.document_properties || self.document_properties.$invalid || self.saveInProgress) {
                return false;
            }
            if (actionType && actionType.toLower() === 'saveandinsert' && !self.internal.userCanAnnotate()) {
                return false;
            }
            var isValid = true;
            // contentRequired is true if (save and insert) or (save as draft), then content must be added
            if (contentRequired) {
                isValid = (self.documentInformation || self.internal.contentFile);
            }

            if (!isValid) {
                return false;
            }

            if (!self.internal.vsId) {
                return isValid;
            } else {
                // if content is added once, check if it is still added
                if (_hasContent()) {
                    isValid = self.documentInformation || self.internal.contentFile;
                }
                return isValid;
            }
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


        self.isDocumentTypeSwitchDisabled = function () {
            return !!self.internal.vsId || self.duplicateVersion || !self.employeeService.hasPermissionTo('INTERNAL_PAPER') || self.employee.isBacklogMode();
        }

    });
};
