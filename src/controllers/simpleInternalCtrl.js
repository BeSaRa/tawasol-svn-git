module.exports = function (app) {
    app.controller('simpleInternalCtrl', function (Internal,
                                                   PDFViewer,
                                                   $rootScope,
                                                   // classifications,
                                                   $state,
                                                   $compile,
                                                   $scope,
                                                   internalService,
                                                   queueStatusService,
                                                   organizationService,
                                                   configurationService,
                                                   loadingIndicatorService,
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
                                                   mailNotificationService,
                                                   gridService,
                                                   replyTo,
                                                   $stateParams,
                                                   correspondenceService,
                                                   $q,
                                                   rootEntity,
                                                   downloadService,
                                                   errorCode) {
        'ngInject';
        var self = this;

        self.controllerName = 'simpleInternalCtrl';
        contextHelpService.setHelpTo('simple-add-internal');
        self.employeeService = employeeService;
        // current employee
        self.employee = employeeService.getEmployee();

        self.hasPSPDFViewer = rootEntity.hasPSPDFViewer();
        self.annotationPermission = configurationService.ANNOTATE_DOCUMENT_PERMISSION;

        // validation for accordion
        self.validation = false;
        // collapse from label
        self.collapse = true;
        // current mode
        self.editMode = !!(editAfterApproved);
        // self.editMode = false;
        // copy of the current internal if saved.
        // self.model = angular.copy(demoInternal);
        self.model = editAfterApproved ? angular.copy(editAfterApproved.metaData) : null;

        self.editContent = false;
        //is in simple add mode
        self.simpleAdd = true;
        self.activeDocumentViewer = true;

        self.maxCreateDate = new Date();
        // all system organizations
        self.organizations = organizations;


        self.templates = lookups.templates;

        self.documentInformation = null;
        self.isNewDocument = false;

        // internal document
        self.internal =
            new Internal({
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
            self.internal = replyTo;
            if (self.internal.docDate) {
                self.internal.docDate = generator.convertDateToString(self.internal.docDate);
            }
            self.replyToOriginalName = angular.copy(replyTo.getTranslatedName());
            self.action = 'replyTo';
        }

        if (editAfterApproved) {
            self.internal = editAfterApproved.metaData;
            self.documentInformation = editAfterApproved.content;
            self.editContent = true;
            self.action = 'editAfterApproved';
        }

        self.isDocumentTypeSwitchDisabled = function () {
            return !!self.internal.vsId || self.duplicateVersion || !employeeService.hasPermissionTo('INTERNAL_PAPER') || self.employee.isBacklogMode();
        };

        self.preventPropagation = function ($event) {
            $event.stopPropagation();
        };

        self.requestCompleted = false;
        self.saveCorrespondence = function (status, ignoreLaunch) {
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
                var method = (replyTo && !self.internal.vsId) ? methods.createReply : methods.normal,
                    vsId = replyTo ? $stateParams.vsId : false;

                /*No document information(No prepare document selected)*/
                if (self.documentInformation && !self.internal.addMethod) {
                    // Save Document With Content
                    if (status) {
                        self.internal.docStatus = queueStatusService.getDocumentStatus(status);
                    }
                    angular.element('iframe#document-viewer').remove();
                    var defer = $q.defer();
                    promise = defer.promise;
                    $timeout(function () {
                        self.internal[method.withContent](self.documentInformation, vsId)
                            .then(function (result) {
                                defer.resolve(result);
                            });
                    }, configurationService.OFFICE_ONLINE_DELAY);

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
                    } else {
                        self.contentFileExist = false;
                        self.contentFileSizeExist = false;
                        saveCorrespondenceFinished(status, ignoreLaunch);
                        return true;
                    }
                }).catch(function (error) {
                    self.saveInProgress = false;
                    if (errorCode.checkIf(error, 'CANNOT_EXPORT_TOO_MANY_ATTACHMENTS_OR_LINKED_DOCUMENTS') === true) {
                        dialog.errorMessage(generator.getTranslatedError(error));
                    }

                    return $q.reject(error);
                });
            });
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
                _launchAfterSave()
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
                        if (result && result.action && result.action === PDFViewer.ADD_ATTACHMENT) {
                            self.internal.attachments.push(result.content);
                            self.internal.updateDocumentVersion();
                            _launchAfterSave();
                        } else if (result && result.action && (result.action === PDFViewer.CANCEL_LAUNCH || result.action === PDFViewer.UPDATE_DOCUMENT_CONTENT)) {
                            self.internal.updateDocumentVersion();
                            if (self.internal.addMethod) {
                                self.internal.contentFile = result.content;
                            }
                            if (result.action !== PDFViewer.CANCEL_LAUNCH) {
                                _launchAfterSave();
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

        var _hasSingleSignature = function (document) {
            return document.signaturesCount && document.signaturesCount === 1;
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
                    isVisible = gridService.checkToShowAction(action) && _hasContent() && !model.hasActiveSeqWF();
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
                    isVisible = gridService.checkToShowAction(action) && _hasContent() && rootEntity.hasPSPDFViewer() && !model.hasActiveSeqWF() && !model.isCorrespondenceApprovedBefore();
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
                    isVisible = gridService.checkToShowAction(action) && info.isPaper && !model.isPrivateSecurityLevel() && !model.hasActiveSeqWF(); //Don't show if its electronic internal
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
                    isVisible = !model.hasActiveSeqWF() && gridService.checkToShowAction(action)
                        && !info.isPaper && _hasContent() && _hasSingleSignature(model)
                        //&& !model.isPrivateSecurityLevel()
                        && !model.isInternalPersonal();
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
                    isVisible = !model.hasActiveSeqWF() && gridService.checkToShowAction(action)
                        && !info.isPaper && _hasContent() && _hasSingleSignature(model)
                        //&& !model.isPrivateSecurityLevel()
                        && !model.isInternalPersonal();
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
                docDate: generator.convertDateToString(new Date(), self.defaultDateFormat),
                registryOU: self.employee.getRegistryOUID(),
                securityLevel: lookups.securityLevels[0]
            });

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

        self.toggleDocumentViewer = function ($event) {
            self.activeDocumentViewer = !self.activeDocumentViewer;
        };

        self.checkChangeInternalType = function () {
            if (self.employee.isBacklogMode()) {
                return;
            }
            // self.checkCentralArchive();
            if (self.documentInformation || self.internal.contentFile) {
                return dialog
                    .confirmMessage(langService.get('content_will_remove_confirm'))
                    .then(function () {
                        self.documentInformation = null;
                        self.internal.contentFile = null;
                        self.simpleViewUrl = null;
                    })
                    .catch(function () {
                        self.internal.addMethod = !self.internal.addMethod;
                    })
            }
            return self.documentInformation = null;
        };

        /**
         * @description Manage the attachments
         * @param $event
         */
        self.manageAttachments = function ($event) {
            self.internal.manageDocumentAttachments($event, true)
                .then(function (result) {
                    self.internal.attachments = result;
                })
                .catch(function (result) {
                    self.internal.attachments = result;
                });
        };

        /**
         * @description Manage the linked documents
         * @param $event
         */
        self.manageLinkedDocuments = function ($event) {
            self.internal.manageDocumentLinkedDocuments($event, true)
                .then(function (result) {
                    self.internal.linkedDocs = result;
                })
                .catch(function (result) {
                    self.internal.linkedDocs = result;
                });
        };

        /**
         * @description Manage linked entities
         * @param $event
         */
        self.manageLinkedEntities = function ($event) {
            self.internal
                .manageDocumentEntities($event, true)
                .then(function (result) {
                    self.internal.linkedEntities = result;
                }).catch(function (result) {
                self.internal.linkedEntities = result;
            })
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
                || self.saveInProgress || ((self.documentInformationExist
                    || (self.contentFileExist && self.contentFileSizeExist)) && !(self.documentInformation || self.internal.contentFile))
        };

        /**
         * @description Checks if data is valid to save
         * @param form
         * @param actionType
         * @param contentRequired
         * pass true, if content is always required for save
         * @returns {boolean}
         */
        self.isSaveValid = function (form, actionType, contentRequired) {
            if (!form || form.$invalid || self.saveInProgress) {
                return false;
            }
            if (actionType && actionType.toLowerCase() === 'saveandinsert' && !self.internal.userCanAnnotate()) {
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

        self.injectIframe = function () {
            var iframe = '<iframe class="simple-viewer-iframe" id="document-viewer"\n' +
                '                                                    ng-show="ctrl.simpleViewUrl"\n' +
                '                                                    ng-src="{{ctrl.simpleViewUrl}}"\n' +
                '                                                    flex\n' +
                '                                                    frameborder="0"></iframe>';


            if (!angular.element('#document-viewer').length)
                angular.element('#iframe-inject-area').append($compile(iframe)($scope));
        };

        $rootScope.$on('SEQ_LAUNCH_SUCCESS', function () {
            self.resetAddCorrespondence();
        });
    });
};
