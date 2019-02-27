module.exports = function (app) {
    app.controller('simpleIncomingCtrl', function (Incoming,
                                                   // classifications,
                                                   $state,
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
                                                   mailNotificationService,
                                                   correspondenceService) {
        'ngInject';
        var self = this;
        self.controllerName = 'simpleIncomingCtrl';
        contextHelpService.setHelpTo('simple-add-incoming');
        self.employeeService = employeeService;
        // current employee
        self.employee = employeeService.getEmployee();
        // validation for accordion
        self.validation = false;
        // collapse from label
        self.collapse = true;
        // current mode
        self.editMode = !!(receive || receiveG2G);
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
            self.incoming = receive.metaData;
            self.model = angular.copy(self.incoming);
            self.documentInformation = receive.content;
        }
        if (receiveG2G) {
            self.receiveG2G = true;
            self.receive = false;
            self.incoming = receiveG2G.metaData;
            self.model = angular.copy(self.incoming);
            self.documentInformation = receiveG2G.content;
        }


        self.preventPropagation = function ($event) {
            $event.stopPropagation();
        };


        self.saveCorrespondence = function (status) {
            if (status && !self.documentInformation) {
                toast.error(langService.get('cannot_save_as_draft_without_content'));
                return;
            }
            var promise = null;
            //var isDocHasVsId = angular.copy(self.incoming).hasVsId();
            if (self.receive) {
                promise = self.incoming.receiveDocument($stateParams.workItem);
            }
            else if (self.receiveG2G) {
                promise = self.incoming.receiveG2GDocument($stateParams.vsId);
            }
            else {
                promise = self.incoming
                    .saveDocument(status);
            }

            promise.then(function (result) {
                self.incoming = result;
                self.model = angular.copy(self.incoming);
                self.documentInformationExist = !!angular.copy(self.documentInformation);

                var newId = self.model.vsId;

                /*If content file was attached */
                if (self.incoming.contentFile) {
                    self.incoming.addDocumentContentFile()
                        .then(function () {
                            self.contentFileExist = !!(self.incoming.hasOwnProperty('contentFile') && self.incoming.contentFile);
                            self.contentFileSizeExist = !!(self.contentFileExist && self.incoming.contentFile.size);

                            saveCorrespondenceFinished(status, newId);
                        })
                }
                else {
                    self.contentFileExist = false;
                    self.contentFileSizeExist = false;

                    saveCorrespondenceFinished(status, newId);
                }

            }).catch(function (error) {
                toast.error(error);
            });
        };

        self.requestCompleted = false;
        var saveCorrespondenceFinished = function (status, newId) {
            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
            counterService.loadCounters();
            if (status) {// || (self.incoming.contentFile)
                toast.success(langService.get('save_success'));
                /*$timeout(function () {
                    $state.go('app.incoming.draft');
                })*/
            }
            else {
                var successKey = 'incoming_metadata_saved_success';
                if (self.documentInformation) {
                    self.incoming.contentSize = 1;
                    successKey = 'save_success';
                }
                else if (self.incoming.contentFile && self.incoming.contentFile.size) {
                    self.incoming.contentSize = self.incoming.contentFile.size;
                    successKey = 'save_success';
                }
                self.requestCompleted = true;
                toast.success(langService.get(successKey));
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

        self.docActionLaunchDistributionWorkflow = function (document, $event) {
            if (!self.incoming.hasContent()) {
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
                }
                else if (angular.isArray(action.permissionKey) && action.permissionKey.length) {
                    if (action.hasOwnProperty('checkAnyPermission')) {
                        hasPermission = employeeService.getEmployee().hasAnyPermissions(action.permissionKey);
                    }
                    else {
                        hasPermission = employeeService.getEmployee().hasThesePermissions(action.permissionKey);
                    }
                }
            }
            return (!action.hide) && hasPermission;
        };

        var isVisible = false;
        self.documentActions = [
            //Print Barcode
            {
                text: langService.get('content_action_print_barcode'),
                callback: self.docActionPrintBarcode,
                class: "action-green",
                permissionKey: "PRINT_BARCODE",
                checkShow: function (action, model, index) {
                    isVisible = self.checkToShowAction(action, model); //Incoming is always a paper, so no need to check paper/electronic
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
            //Configure Security
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
         * @description Reset the Add Incoming form
         * @param $event
         */
        self.resetAddCorrespondence = function ($event) {
            self.incoming = new Incoming({
                ou: centralArchives ? null : self.employee.getOUID(),
                addMethod: 1,
                createdOn: new Date(),
                docDate: generator.convertDateToString(new Date(), self.defaultDateFormat),
                refDocDate:generator.convertDateToString(new Date(), self.defaultDateFormat),
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

            self.simpleViewUrl = null;
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
