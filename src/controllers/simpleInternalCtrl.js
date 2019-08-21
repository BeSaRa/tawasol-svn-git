module.exports = function (app) {
    app.controller('simpleInternalCtrl', function (Internal,
                                                   // classifications,
                                                   $state,
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
                                                   mailNotificationService,
                                                   gridService) {
        'ngInject';
        var self = this;

        self.controllerName = 'simpleInternalCtrl';
        contextHelpService.setHelpTo('simple-add-internal');
        self.employeeService = employeeService;
        // current employee
        self.employee = employeeService.getEmployee();
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
        self.internal = /*demoInternal;*/
            new Internal({
                ou: self.employee.getOUID(),
                addMethod: 0,
                createdOn: new Date(),
                docDate: generator.convertDateToString(new Date()),
                registryOU: self.employee.getRegistryOUID(),
                securityLevel: lookups.securityLevels[0]
            });

        if (editAfterApproved) {
            self.internal = editAfterApproved.metaData;
            self.documentInformation = editAfterApproved.content;
            self.editContent = true;
        }

        self.preventPropagation = function ($event) {
            $event.stopPropagation();
        };

        self.requestCompleted = false;
        self.saveCorrespondence = function (status) {
            if (status && !self.documentInformation) {
                toast.error(langService.get('cannot_save_as_draft_without_content'));
                return;
            }
            var promise = null;
            //var isDocHasVsId = angular.copy(self.internal).hasVsId();

            /*No document information(No prepare document selected)*/

            if (self.documentInformation) {
                if (status) {
                    self.internal.docStatus = queueStatusService.getDocumentStatus(status);
                }
                angular.element('iframe#document-viewer').remove();
                promise = $timeout(function () {
                    return self.internal
                        .saveDocumentWithContent(self.documentInformation);
                }, 1000);

            } else {
                promise = self.internal
                    .saveDocument(status)
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

                            saveCorrespondenceFinished(status);
                        })
                } else {
                    self.contentFileExist = false;
                    self.contentFileSizeExist = false;

                    saveCorrespondenceFinished(status);
                    return true;
                }
            });
        };

        self.saveCorrespondenceAndPrintBarcode = function ($event) {
            self.saveCorrespondence()
                .then(function () {
                    self.docActionPrintBarcode(self.internal, $event);
                })
        };

        var saveCorrespondenceFinished = function (status) {
            counterService.loadCounters();
            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
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


                if (employeeService.hasPermissionTo('LAUNCH_DISTRIBUTION_WORKFLOW') && (!!self.documentInformationExist || !!(self.contentFileExist && self.contentFileSizeExist))) {
                    dialog.confirmMessage(langService.get('confirm_launch_distribution_workflow'))
                        .then(function () {
                            self.docActionLaunchDistributionWorkflow(self.internal);
                        });
                }

                self.requestCompleted = true;
                toast.success(langService.get(successKey));
            }
            /*
             if (status) {// || (self.internal.contentFile)
             counterService.loadCounters();
             toast.success(langService.get('internal_metadata_saved_success'));
             $timeout(function () {
             $state.go('app.internal.draft');
             })
             }
             else {
             /!*correspondenceService
             .loadCorrespondenceById(newId, self.internal.docClassName)
             .then(function (result) {
             self.internal = result;
             self.model = angular.copy(self.internal);
             self.requestCompleted = true;
             counterService.loadCounters();
             toast.success(langService.get('internal_metadata_saved_success'));

             });*!/

             /!*correspondenceService
             .loadCorrespondenceByVsIdClass(self.internal.vsId, self.internal.docClassName)
             .then(function (result) {
             self.internal = result;
             self.model = angular.copy(self.internal);
             self.requestCompleted = true;
             counterService.loadCounters();
             toast.success(langService.get('internal_metadata_saved_success'));

             });*!/
             }*/
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
            managerService
                .manageDocumentComments(self.internal.vsId, self.internal.docSubject, $event)
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
            if (_hasContent()){
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
                    self.resetAddCorrespondence();
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
                    isVisible = gridService.checkToShowAction(action) && (!!self.documentInformationExist || !!(self.contentFileExist && self.contentFileSizeExist));
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
                    isVisible = gridService.checkToShowAction(action) && (!!self.documentInformationExist || !!(self.contentFileExist && self.contentFileSizeExist));
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
                permissionKey: "ELECTRONIC_SIGNATURE",
                checkShow: function (action, model, index) {
                    var info = model.getInfo();
                    isVisible = gridService.checkToShowAction(action) && !info.isPaper && _hasContent() && !model.isPrivateSecurityLevel() && !model.isInternalPersonal(); //Don't show if its paper outgoing
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
                    isVisible = gridService.checkToShowAction(action);
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
                addMethod: 0,
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
        }
    });
};
