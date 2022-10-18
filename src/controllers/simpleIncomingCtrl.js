module.exports = function (app) {
    app.controller('simpleIncomingCtrl', function (Incoming,
                                                   PDFViewer,
                                                   $rootScope,
                                                   // classifications,
                                                   $state,
                                                   $q,
                                                   incomingService,
                                                   queueStatusService,
                                                   organizationService,
                                                   configurationService,
                                                   loadingIndicatorService,
                                                   // documentTypes,
                                                   officeWebAppService,
                                                   counterService,
                                                   correspondenceService,
                                                   generator,
                                                   $stateParams,
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
                                                   centralArchives,
                                                   contextHelpService,
                                                   organizations,
                                                   cmsTemplate,
                                                   lookups,
                                                   dialog,
                                                   receive, // available when the normal receive.
                                                   receiveG2G, // available when g2g receive
                                                   mailNotificationService,
                                                   gridService,
                                                   errorCode,
                                                   downloadService,
                                                   _,
                                                   simpleEdit,
                                                   rootEntity) {
        'ngInject';
        var self = this;
        self.controllerName = 'simpleIncomingCtrl';
        contextHelpService.setHelpTo('simple-add-incoming');
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
        self.editMode = !!(receive || receiveG2G || simpleEdit);
        // self.editMode = false;
        // copy of the current incoming if saved.
        // self.model = angular.copy(demoOutgoing);
        self.model = null;

        self.emptySubSites = false;

        self.maxCreateDate = new Date();
        // all system organizations
        self.organizations = angular.copy(organizations);
        // in case of central archive.
        self.registryOrganizations = centralArchives;

        self.templates = lookups.templates;

        self.documentInformation = null;
        self.isNewDocument = false;

        //is in simple add mode
        self.simpleAdd = true;

        // incoming document
        self.incoming = /*demoOutgoing;*/
            new Incoming({
                ou: centralArchives ? null : self.employee.getOUID(),
                addMethod: 1,//Paper document
                createdOn: new Date(),
                docDate: generator.convertDateToString(new Date()),
                registryOU: centralArchives ? null : self.employee.getRegistryOUID(),
                securityLevel: lookups.securityLevels[0]
            });

        if (receive) {
            self.receive = true;
            self.receiveG2G = false;
            self.simpleEdit = false;
            self.incoming = receive.metaData;
            self.model = angular.copy(self.incoming);
            self.documentInformation = receive.content;
        }
        if (receiveG2G) {
            self.receiveG2G = true;
            self.receive = false;
            self.simpleEdit = false;
            self.incoming = receiveG2G.metaData;
            self.model = angular.copy(self.incoming);
            self.documentInformation = receiveG2G.content;
        }

        if (simpleEdit) {
            self.incoming = simpleEdit.metaData;
            self.model = angular.copy(self.incoming);
            self.documentInformation = simpleEdit.content;
            self.action = 'simpleEdit';
            self.simpleEdit = true;
            self.receiveG2G = false;
            self.receive = false;
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

        var properties = angular.copy(lookupService.getPropertyConfigurations('incoming'));
        var followupStatusConfiguration = _findPropertyConfiguration('FollowupStatus');
        var isNeedReplyFromConfiguration = followupStatusConfiguration ? followupStatusConfiguration.isMandatory : false;


        self.preventPropagation = function ($event) {
            $event.stopPropagation();
        };


        self.saveCorrespondence = function (status, skipCheck, ignoreLaunch) {
            self.saveInProgress = true;
            loadingIndicatorService.loading = true;
            if (status && !self.documentInformation) {
                toast.error(langService.get('cannot_save_as_draft_without_content'));
                self.saveInProgress = false;
                return;
            }
            var promise = null;
            //var isDocHasVsId = angular.copy(self.incoming).hasVsId();
            if (self.receive) {
                promise = self.incoming.receiveDocument($stateParams.wobNum);
            } else if (self.receiveG2G) {
                promise = self.incoming.receiveG2GDocument($stateParams.vsId);
            } else {
                promise = self.incoming
                    .saveDocument(status, !!skipCheck, self.simpleEdit);
            }

            return promise.then(function (result) {
                self.incoming.vsId = result.vsId;
                self.model = angular.copy(self.incoming);
                self.documentInformationExist = !!angular.copy(self.documentInformation);

                //var newId = self.model.vsId;

                /*If content file was attached */
                if (self.incoming.contentFile) {
                    return self.incoming.addDocumentContentFile()
                        .then(function () {
                            self.contentFileExist = true;
                            saveCorrespondenceFinished(status, ignoreLaunch);
                            return true;
                        })
                } else {
                    self.contentFileExist = false;
                    saveCorrespondenceFinished(status, ignoreLaunch);
                    return true;
                }

            }).catch(function (error) {
                self.saveInProgress = false;
                if (ignoreLaunch) {
                    return $q.reject(error);
                }
                if (errorCode.checkIf(error, 'ALREADY_EXISTS_INCOMING_BOOK_WITH_SAME_REFERENCE_NUMBER') === true) {
                    dialog.confirmMessage(langService.get('incoming_book_exists_same_number_site_year') + "<br/>" + langService.get('confirm_continue_message'))
                        .then(function () {
                            return self.saveCorrespondence(status, true, ignoreLaunch);
                        }).catch(function () {
                        return $q.reject(error);
                    });
                } else if (errorCode.checkIf(error, 'CANNOT_EXPORT_TOO_MANY_ATTACHMENTS_OR_LINKED_DOCUMENTS') === true) {
                    dialog.errorMessage(generator.getTranslatedError(error));

                    return $q.reject(error);
                } else {
                    if (error)
                        toast.error(error);

                    return $q.reject(error);
                }
            });
        };

        self.saveCorrespondenceAndPrintBarcode = function ($event) {
            self.saveCorrespondence(null, false, true)
                .then(function () {
                    self.docActionPrintBarcode(self.incoming, $event);
                })
                .catch(function (error) {
                    if (errorCode.checkIf(error, 'ALREADY_EXISTS_INCOMING_BOOK_WITH_SAME_REFERENCE_NUMBER') === true) {
                        dialog.confirmMessage(langService.get('incoming_book_exists_same_number_site_year') + "<br/>" + langService.get('confirm_continue_message'))
                            .then(function () {
                                self.saveCorrespondence(null, true, true)
                                    .then(function () {
                                        self.docActionPrintBarcode(self.incoming, $event);
                                    })
                            }).catch(function () {
                            return $q.reject(error);
                        });
                    }
                })
        };

        self.requestCompleted = false;
        var saveCorrespondenceFinished = function (status, ignoreLaunch) {
            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
            counterService.loadCounters();
            self.incoming.updateDocumentVersion();
            if (status) {
                toast.success(langService.get('save_success'));
            } else {
                var successKey = 'incoming_metadata_saved_success';
                if (self.documentInformation) {
                    self.incoming.contentSize = 1; // dummy content size
                    successKey = 'save_success';
                } else if (self.incoming.contentFile) {
                    if (self.incoming.externalImportData) {
                        self.incoming.contentSize = 1; // dummy content size
                    } else {
                        self.incoming.contentSize = self.incoming.contentFile.size;
                    }
                    successKey = 'save_success';
                }

                self.requestCompleted = true;
                self.saveInProgress = false;
                toast.success(langService.get(successKey));

                if (ignoreLaunch) {
                    return;
                }
                if (self.simpleEdit) {
                    $state.go($stateParams.prevPage === 'userInbox' ? 'app.inbox.user-inbox' : 'app.search-screen');
                    return;
                }
                _launchAfterSave();
            }
        };

        function _launchAfterSave() {
            if (employeeService.hasPermissionTo('LAUNCH_DISTRIBUTION_WORKFLOW')) {
                if (centralArchives && self.incoming.hasContent()) {
                    self.docActionLaunchDistributionWorkflow(self.incoming, false);
                } else if (!!self.documentInformationExist || !!self.contentFileExist) {
                    dialog.confirmMessage(langService.get('confirm_launch_distribution_workflow'))
                        .then(function () {
                            self.docActionLaunchDistributionWorkflow(self.incoming);
                        });
                }
            }
        }

        self.canSaveAndAnnotate = function () {
            return self.hasPSPDFViewer && employeeService.hasPermissionTo(self.annotationPermission) && !correspondenceService.isLimitedCentralUnitAccess(self.incoming);
        };

        self.saveAndAnnotateDocument = function ($event) {
            self.saveCorrespondence(null, false, true)
                .then(function () {
                    self.incoming.openForAnnotation()
                        .then(function (result) {
                            if (result && result.action && result.action === PDFViewer.ADD_ATTACHMENT) {
                                self.incoming.attachments.push(result.content);
                                self.incoming.updateDocumentVersion();
                                _launchAfterSave();
                            } else if (result && result.action && (result.action === PDFViewer.CANCEL_LAUNCH || result.action === PDFViewer.UPDATE_DOCUMENT_CONTENT)) {
                                self.incoming.updateDocumentVersion();
                                if (self.incoming.addMethod) {
                                    self.incoming.contentFile = result.content;
                                }
                                if (result.action !== PDFViewer.CANCEL_LAUNCH) {
                                    _launchAfterSave();
                                }
                            } else {
                                self.resetAddCorrespondence();
                            }
                        });
                })
                .catch(function (error) {
                    if (errorCode.checkIf(error, 'ALREADY_EXISTS_INCOMING_BOOK_WITH_SAME_REFERENCE_NUMBER') === true) {
                        dialog.confirmMessage(langService.get('incoming_book_exists_same_number_site_year') + "<br/>" + langService.get('confirm_continue_message'))
                            .then(function () {
                                self.saveCorrespondence(null, true, true)
                                    .then(function () {
                                        self.incoming.openForAnnotation()
                                            .then(function () {
                                                self.incoming.updateDocumentVersion();
                                                _launchAfterSave();
                                            });
                                    })
                            }).catch(function () {
                            return $q.reject(error);
                        });
                    }
                });
        };

        /**
         * demo manage document tags
         * @param $event
         */
        self.openManageDocumentTags = function ($event) {
            managerService
                .manageDocumentTags(self.incoming.vsId, self.incoming.docClassName, self.incoming.docSubject, $event)
                .then(function (tags) {
                    self.incoming.tags = tags;
                })
                .catch(function (tags) {
                    self.incoming.tags = tags;
                });
        };
        /**
         * demo for manage document attachments.
         * @param $event
         */
        self.openManageDocumentAttachments = function ($event) {
            managerService
                .manageDocumentAttachments(self.incoming.vsId, self.incoming.docClassName, self.incoming.docSubject, $event)
                .then(function (attachments) {
                    self.incoming.attachments = attachments;
                })
                .catch(function (attachments) {
                    self.incoming.attachments = attachments;
                });
        };
        /**
         * demo for manage document comments .
         * @param $event
         */
        self.openManageDocumentComments = function ($event) {
            self.incoming.manageDocumentComments($event)
                .then(function (documentComments) {
                    self.incoming.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    self.incoming.documentComments = documentComments;
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
                .manageDocumentProperties(self.incoming.vsId, self.incoming.docClassName, self.incoming.docSubject, $event)
                .then(function (document) {
                    self.incoming = generator.preserveProperties(properties, self.incoming, document);
                })
                .catch(function (document) {
                    self.incoming = generator.preserveProperties(properties, self.incoming, document);
                });
        };


        self.docActionPrintBarcode = function (document, $event) {
            document.barcodePrint(document);
        };

        self.docActionLaunchDistributionWorkflow = function (document, $event) {
            if (!self.incoming.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            var defaultTab = self.employee.isDefaultTabFavoriteAtLaunch() ? 'favorites' : 'users';
            if (centralArchives && self.incoming.hasContent()) {
                defaultTab = {
                    tab: 'registry_organizations',
                    registryOU: self.incoming.registryOU,
                    ou: self.incoming.ou || self.incoming.registryOU
                };
            }
            document.launchWorkFlow($event, 'forward', defaultTab, null, self.resetAddCorrespondence)
                .then(function () {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.resetAddCorrespondence();
                });
        };

        self.docActionQuickSend = function (document, $event) {
            if (!self.incoming.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            var defaultTab = self.employee.isDefaultTabFavoriteAtLaunch() ? 'favorites' : 'users';
            if (centralArchives && self.incoming.hasContent()) {
                defaultTab = {
                    tab: 'registry_organizations',
                    registryOU: self.incoming.registryOU,
                    ou: self.incoming.ou || self.incoming.registryOU
                };
            }
            document.quickSendLaunchWorkflow($event, defaultTab)
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
            if (!self.incoming.hasContent()) {
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

        self.docActionManageTasks = function (document, $event) {
            console.log('manage tasks', document);
        };

        self.docActionConfigureSecurity = function (document, $event) {
            console.log('configure document security', document);
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

        /**
         * @description Print Correspondence Receipt
         * @param document
         * @param $event
         */
        self.printCorrespondenceReceipt = function (document, $event) {
            document.printReceipt($event);
        }

        self.documentAction = null;
        self.performDocumentAction = function ($event) {
            self.documentAction.callback(self.incoming, $event);
        };

        var _hasContent = function () {
            return (!!self.documentInformationExist || !!self.contentFileExist);
        };

        self.visibilityArray = [];
        self.isActionsAvailable = false;

        var isVisible = false;
        self.documentActions = [
            //Print Barcode
            {
                text: langService.get('content_action_print_barcode'),
                callback: self.docActionPrintBarcode,
                class: "action-green",
                permissionKey: "PRINT_BARCODE",
                checkShow: function (action, model, index) {
                    isVisible = gridService.checkToShowAction(action); //Incoming is always a paper, so no need to check paper/electronic
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
                    //Show if content is uploaded
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
            //Configure Security
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
            },
            // print correspondence receipt
            {
                text: langService.get('print_receipt'),
                callback: self.printCorrespondenceReceipt,
                class: "action-green",
                checkShow: function (action, model, index) {
                    isVisible = gridService.checkToShowAction(action) && _hasContent() && rootEntity.getGlobalSettings().isAllowPrintCorrespondenceReceipt();
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
         * @description confirm message when reset the Add Incoming form
         * @param $event
         */
        self.confirmResetAddCorrespondence = function ($event) {
            dialog.confirmMessage(langService.get('confirm_reset_add'))
                .then(function () {
                    self.resetAddCorrespondence($event);
                });
        };

        /**
         * @description Reset the Add Incoming form
         * @param $event
         */
        self.resetAddCorrespondence = function ($event) {
            self.incoming = new Incoming({
                ou: centralArchives ? null : self.employee.getOUID(),
                addMethod: 1,
                createdOn: new Date(),
                docDate: generator.convertDateToString(new Date(), self.defaultDateFormat),
                refDocDate: generator.convertDateToString(new Date(), self.defaultDateFormat),
                registryOU: centralArchives ? null : self.employee.getRegistryOUID(),
                securityLevel: lookups.securityLevels[0],
                site: null
            });
            self.emptySubSites = true;
            self.documentInformation = null;
            self.documentAction = null;
            self.documentInformationExist = false;
            self.contentFileExist = false;
            self.document_properties.$setUntouched();
            $timeout(function () {
                if (self.document_properties) {
                    generator.validateRequiredSelectFields(self.document_properties, true);
                }
            });

            self.simpleEdit = false;
            self.receiveG2G = false;
            self.receive = false;

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
            self.incoming.manageDocumentAttachments($event, true)
                .then(function (result) {
                    self.incoming.attachments = result;
                })
                .catch(function (result) {
                    self.incoming.attachments = result;
                });
        };

        /**
         * @description Manage the linked documents
         * @param $event
         */
        self.manageLinkedDocuments = function ($event) {
            self.incoming.manageDocumentLinkedDocuments($event, true)
                .then(function (result) {
                    self.incoming.linkedDocs = result;
                })
                .catch(function (result) {
                    self.incoming.linkedDocs = result;
                });
        };

        /**
         * @description Manage linked entities
         * @param $event
         */
        self.manageLinkedEntities = function ($event) {
            self.incoming
                .manageDocumentEntities($event, true)
                .then(function (result) {
                    self.incoming.linkedEntities = result;
                }).catch(function (result) {
                self.incoming.linkedEntities = result;
            })
        };

        self.needReply = function (status) {
            return (status && status.lookupStrKey === 'NEED_REPLY');
        };

        var _isValidSubSite = function () {
            if (!isNeedReplyFromConfiguration) {
                return true;
            }
            var isValid = true;
            if (self.needReply(self.incoming.site.followupStatus)) {
                isValid = !!self.incoming.site.followupDate;
            }

            return isValid;
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
            if (!form || form.$invalid || self.saveInProgress || !self.incoming.site || !_isValidSubSite()) {
                return false;
            }
            if (actionType && actionType.toLowerCase() === 'saveandinsert' && !self.incoming.userCanAnnotate()) {
                return false;
            }
            var isValid = true;
            // contentRequired is true if (save and insert), then content must be added
            if (contentRequired) {
                isValid = (self.documentInformation || self.incoming.contentFile);
            }

            if (!isValid) {
                return false;
            }

            if (!self.incoming.vsId) {
                return isValid;
            } else {
                // if content is added once, check if it is still added
                if (_hasContent()) {
                    isValid = self.documentInformation || self.incoming.contentFile;
                }
                return isValid;
            }
        };
        $rootScope.$on('SEQ_LAUNCH_SUCCESS', function () {
            self.resetAddCorrespondence();
        });


        self.$onInit = function () {
            $timeout(function () {
                if (self.document_properties) {
                    generator.validateRequiredSelectFields(self.document_properties, true);
                }
            }, 500);
        }
    });
};
