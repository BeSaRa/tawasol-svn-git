module.exports = function (app) {
    app.controller('incomingCtrl', function (Incoming,
                                             // classifications,
                                             $state,
                                             $q,
                                             incomingService,
                                             queueStatusService,
                                             organizationService,
                                             // documentTypes,
                                             officeWebAppService,
                                             counterService,
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
                                             duplicateVersion,
                                             mailNotificationService,
                                             gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'incomingCtrl';
        contextHelpService.setHelpTo('add-incoming');

        self.isDemoBuild = generator.isDemoBuild;

        self.employeeService = employeeService;
        // current employee
        self.employee = employeeService.getEmployee();
        // validation for accordion
        self.validation = true;
        // collapse from label
        self.collapse = true;
        // current mode
        self.editMode = !!(receive || receiveG2G || duplicateVersion);
        // self.editMode = false;
        // copy of the current incoming if saved.
        // self.model = angular.copy(demoOutgoing);
        self.model = null;

        self.emptySubSites = false;
        // all system organizations
        self.organizations = angular.copy(organizations);
        // in case of central archive.
        self.registryOrganizations = centralArchives;

        self.templates = lookups.templates;

        self.documentInformation = null;
        self.isNewDocument = false;
        // incoming document
        self.incoming = new Incoming({
            ou: centralArchives ? null : self.employee.getOUID(),
            addMethod: 1,//Paper document
            createdOn: new Date(),
            docDate: new Date(),
            registryOU: centralArchives ? null : self.employee.getRegistryOUID(),
            securityLevel: lookups.securityLevels[0]
        });

        //self.isReceiveG2G = false;

        if (receive) {
            self.receive = true;
            self.receiveG2G = false;
            self.incoming = receive.metaData;
            self.model = angular.copy(self.incoming);
            self.documentInformation = receive.content;
            //self.isReceiveG2G = false;
        }
        if (receiveG2G) {
            self.receiveG2G = true;
            self.receive = false;
            self.incoming = receiveG2G.metaData;
            // depend on our discussion with Ahmed Abu Al Nasser.
            if (centralArchives) {
                self.incoming.registryOU = null;
                self.incoming.ou = null;
            }
            self.model = angular.copy(self.incoming);
            self.documentInformation = receiveG2G.content;
            //self.isReceiveG2G = true;
        }

        if (duplicateVersion) {
            self.receiveG2G = false;
            self.receive = false;
            self.incoming = duplicateVersion.metaData;
            self.model = angular.copy(self.incoming);
            self.documentInformation = self.incoming.hasContent() ? duplicateVersion.content : null;
            //self.isReceiveG2G = false;
        }


        self.maxCreateDate = new Date();
        // if the current incoming refDocDate not provided means it is a new incoming document
        // we should put the same refDocDate as today
        if (!self.incoming.refDocDate) {
            self.incoming.refDocDate = self.maxCreateDate;
        }


        self.preventPropagation = function ($event) {
            $event.stopPropagation();
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
            //var isDocHasVsId = angular.copy(self.incoming).hasVsId();
            if (self.receive) {
                promise = self.incoming.receiveDocument($stateParams.workItem);
            } else if (self.receiveG2G) {
                promise = self.incoming.receiveG2GDocument();
            } else {
                promise = self.incoming
                    .saveDocument(status);
            }

         return    promise.then(function (result) {
                self.incoming = result;
                self.model = angular.copy(self.incoming);
                self.documentInformationExist = !!angular.copy(self.documentInformation);

                var newId = self.model.vsId;

                /*If content file was attached */
                if (self.incoming.contentFile) {
                 return self.incoming.addDocumentContentFile()
                        .then(function () {
                            self.contentFileExist = !!(self.incoming.hasOwnProperty('contentFile') && self.incoming.contentFile);
                            self.contentFileSizeExist = !!(self.contentFileExist && self.incoming.contentFile.size);

                            saveCorrespondenceFinished(status, newId);
                        })
                } else if (duplicateVersion && self.incoming.hasContent()) {
                  return   self.incoming
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
                    return  true;
                }

            })
                .catch(function (error) {
                    self.saveInProgress = false;
                    // don't show the error in g2g receive becouse handled by error dialog
                    if (!self.receiveG2G)
                        toast.error(error);

                    return $q.reject(error);
                });
        };


        self.saveCorrespondenceAndPrintBarcode =function ($event) {
            self.saveCorrespondence()
                .then(function () {
                    self.docActionPrintBarcode(self.incoming,$event);
                })
        };

        var saveCorrespondenceFinished = function (status, newId) {
            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
            counterService.loadCounters();
            // once saved/received, don't consider the request as receive/receiveG2G
            self.receive = false;
            self.receiveG2G = false;
            if (status) {// || (self.incoming.contentFile)
                toast.success(langService.get('save_success'));
                /*$timeout(function () {
                    $state.go('app.incoming.draft');
                })*/
                self.requestCompleted = true;
                self.saveInProgress = false;
            } else {
                var successKey = 'incoming_metadata_saved_success';
                if (self.documentInformation) {
                    self.incoming.contentSize = 1;
                    successKey = 'save_success';
                } else if (self.incoming.contentFile && self.incoming.contentFile.size) {
                    self.incoming.contentSize = self.incoming.contentFile.size;
                    successKey = 'save_success';
                }

                if (employeeService.hasPermissionTo('LAUNCH_DISTRIBUTION_WORKFLOW') && (!!self.documentInformationExist || !!(self.contentFileExist && self.contentFileSizeExist))) {
                    dialog.confirmMessage(langService.get('confirm_launch_distribution_workflow'))
                        .then(function () {
                            self.docActionLaunchDistributionWorkflow(self.incoming);
                        });
                }

                self.requestCompleted = true;
                self.saveInProgress = false;
                toast.success(langService.get(successKey));

                if (centralArchives && self.incoming.hasContent()) {
                    self.docActionLaunchDistributionWorkflow(self.incoming, false, {
                        tab: 'registry_organizations',
                        registryOU: self.incoming.registryOU,
                        ou: self.incoming.ou
                    });
                }
            }
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
            managerService
                .manageDocumentComments(self.incoming.vsId, self.incoming.docSubject, $event)
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

        self.docActionLaunchDistributionWorkflow = function (document, $event, defaultTab) {
            defaultTab = defaultTab ? defaultTab : 'favorites';
            if (!self.incoming.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            document.launchWorkFlow($event, 'forward', defaultTab)
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

        self.documentAction = null;
        self.performDocumentAction = function ($event) {
            self.documentAction.callback(self.incoming, $event);
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
                docDate: new Date(),
                refDocDate: new Date(),
                registryOU: centralArchives ? null : self.employee.getRegistryOUID(),
                securityLevel: lookups.securityLevels[0],
                site: null
            });
            self.emptySubSites = true;
            self.documentInformation = null;
            self.documentAction = null;
            self.documentInformationExist = false;
            self.contentFileExist = false;
            self.contentFileSizeExist = false;
            self.document_properties.$setUntouched();
            //self.isReceiveG2G = false;
            self.receiveG2G = false;
            self.receive = false;

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

    });
};
