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
                                             gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'internalCtrl';
        contextHelpService.setHelpTo('add-internal');

        self.isDemoBuild = generator.isDemoBuild;

        self.employeeService = employeeService;
        // current employee
        self.employee = employeeService.getEmployee();
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

        // internal document
        self.internal = /*demoInternal;*/
            new Internal({
                ou: self.employee.getOUID(),
                addMethod: 0,
                createdOn: new Date(),
                docDate: new Date(),
                registryOU: self.employee.getRegistryOUID(),
                securityLevel: lookups.securityLevels[0]
            });

        if (editAfterApproved) {
            self.internal = editAfterApproved.metaData;
            self.documentInformation = editAfterApproved.content;
            self.editContent = true;
        } else if (duplicateVersion) {
            self.internal = duplicateVersion.metaData;
            self.documentInformation = self.internal.hasContent() ? duplicateVersion.content : null;
            self.editContent = true;
            // console.log('duplicateVersion.content', duplicateVersion.content);
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
        self.saveCorrespondence = function (status) {
            if (status && !self.documentInformation) {
                toast.error(langService.get('cannot_save_as_draft_without_content'));
                return;
            }
            self.saveInProgress = true;
            var promise = null;
            //var isDocHasVsId = angular.copy(self.internal).hasVsId();

            /*No document information(No prepare document selected)*/

            if (self.documentInformation && !self.internal.addMethod) {
                if (status) {
                    self.internal.docStatus = queueStatusService.getDocumentStatus(status);
                }
                promise = self.internal
                    .saveDocumentWithContent(self.documentInformation);

                return true;
            } else {
                promise = self.internal
                    .saveDocument(status)
                return  promise.then(function (result) {
                    self.internal = result;
                    self.model = angular.copy(self.internal);
                    self.documentInformationExist = !!angular.copy(self.documentInformation);


                    /*If content file was attached */
                    if (self.internal.contentFile) {
                        return  self.internal.addDocumentContentFile()
                            .then(function () {
                                self.contentFileExist = !!(self.internal.hasOwnProperty('contentFile') && self.internal.contentFile);
                                self.contentFileSizeExist = !!(self.contentFileExist && self.internal.contentFile.size);

                                saveCorrespondenceFinished(status);
                            })
                    } else if (duplicateVersion && self.internal.hasContent() && self.internal.addMethod) {
                        return   self.internal
                            .attacheContentUrl(self.documentInformation)
                            .then(function () {
                                self.contentFileExist = true;
                                self.contentFileSizeExist = true;
                                saveCorrespondenceFinished(status);
                            });
                    } else {
                        self.contentFileExist = false;
                        self.contentFileSizeExist = false;

                        saveCorrespondenceFinished(status);
                        return  true;
                    }
                }).catch(function (error) {
                        self.saveInProgress = false;
                        return $q.reject(error);
                    });
            }
        };

        self.saveCorrespondenceAndPrintBarcode = function ($event) {
          self.saveCorrespondence()
              .then(function () {
                  self.docActionPrintBarcode(self.internal,$event);
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
            }
            else {
                var successKey = 'internal_metadata_saved_success';
                if (self.documentInformation) {
                    self.internal.contentSize = 1;
                    successKey = 'save_success';
                }
                else if (self.internal.contentFile && self.internal.contentFile.size) {
                    self.internal.contentSize = self.internal.contentFile.size;
                    successKey = 'save_success';
                }

                self.requestCompleted = true;
                self.saveInProgress = false;
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
                    isVisible = gridService.checkToShowAction(action) && info.isPaper; //Don't show if its electronic internal
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
         * @description Reset the Add internal form
         * @param $event
         */
        self.resetAddCorrespondence = function ($event) {
            //ou: self.employee.organization.ouid,
            self.internal = new Internal({
                ou: self.employee.getOUID(),
                addMethod: 0,
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
