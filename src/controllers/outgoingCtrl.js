module.exports = function (app) {
    app.controller('outgoingCtrl', function (Outgoing,
                                             // classifications,
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
                                             documentFileService,
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
                                             distributionWorkflowService,
                                             draftOutgoingService,
                                             replyTo,
                                             editAfterApproved,
                                             lookups, // new injector for all lookups can user access
                                             correspondenceService) {
        'ngInject';
        var self = this;
        self.controllerName = 'outgoingCtrl';
        contextHelpService.setHelpTo('add-outgoing');
        self.employeeService = employeeService;
        self.emptySubSites = false;
        // current employee
        self.employee = employeeService.getEmployee();
        // validation for accordion
        self.validation = true;
        // collapse from label
        self.collapse = true;
        // current mode
        self.editMode = !!(editAfterApproved);
        // self.editMode = false;
        // copy of the current outgoing if saved.
        // self.model = angular.copy(demoOutgoing);
        self.model = editAfterApproved ? angular.copy(editAfterApproved.metaData) : null;

        self.editAfterApproved = false;

        self.maxCreateDate = new Date();
        // all system organizations
        self.organizations = organizations;

        // all shortcut for the screen
        self.templates = lookups.templates;

        self.documentInformation = null;


        self.outgoing = /*demoOutgoing;*/
            new Outgoing({
                ou: self.employee.getOUID(),
                addMethod: 0,
                createdOn: new Date(),
                docDate: new Date(),
                // registryOU: organizationService.getRegistryOrganizationId(self.employee.organization.ouid).id,
                registryOU: self.employee.getRegistryOUID(),
                securityLevel: lookups.securityLevels[0],
                linkedDocs: replyTo ? [replyTo] : []
            });

        if (replyTo) {
            self.outgoing = replyTo;
        }

        if (editAfterApproved) {
            self.outgoing = editAfterApproved.metaData;
            self.documentInformation = editAfterApproved.content;
            self.editAfterApproved = true;
        }

        self.preventPropagation = function ($event) {
            $event.stopPropagation();
        };

        self.checkChangeOutgoingType = function () {
            if (self.documentInformation || self.outgoing.contentFile) {
                return dialog
                    .confirmMessage(langService.get('content_will_remove_confirm'))
                    .then(function () {
                        self.documentInformation = null;
                        self.outgoing.contentFile = null;
                    })
                    .catch(function () {
                        self.outgoing.addMethod = !self.outgoing.addMethod;
                    })
            }
            return self.documentInformation = null;
        };


        self.requestCompleted = false;

        self.saveCorrespondence = function (status) {
            if (status && !self.documentInformation) {
                toast.error(langService.get('cannot_save_as_draft_without_content'));
                return;
            }
            var promise = null;
            //var isDocHasVsId = angular.copy(self.outgoing).hasVsId();

            /*No document information(No prepare document selected)*/
            if (self.documentInformation) {
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
                var newId = self.model.vsId;

                /*If content file was attached */
                if (self.outgoing.contentFile) {
                    self.outgoing.addDocumentContentFile()
                        .then(function () {
                            saveCorrespondenceFinished(status, newId);
                        })
                }
                else {
                    saveCorrespondenceFinished(status, newId);
                }
            });
        };

        var saveCorrespondenceFinished = function (status, newId) {
            counterService.loadCounters();
            if (status) {// || (self.outgoing.contentFile)
                toast.success(langService.get('save_success'));
                $timeout(function () {
                    $state.go('app.outgoing.draft');
                })
            }
            else {
                var successKey = 'outgoing_metadata_saved_success';
                if (self.documentInformation) {
                    self.outgoing.contentSize = 1;
                    successKey = 'save_success'
                }
                else if (self.outgoing.contentFile && self.outgoing.contentFile.size) {
                    self.outgoing.contentSize = self.outgoing.contentFile.size;
                    successKey = 'save_success'
                }

                self.requestCompleted = true;
                counterService.loadCounters();
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

            distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSend(self.outgoing, false, false, null, "outgoing", $event)
                .then(function () {
                    counterService.loadCounters();
                    self.resetAddCorrespondence();
                });
        };


        self.docActionSendToReview = function (document, $event) {
            //console.log('send to review', document);
            draftOutgoingService.controllerMethod
                .draftOutgoingSendToReview(self.outgoing, $event);
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

        /**
         * @description Check if action will be shown in dropdown or not
         * @param action
         * @param model
         * @returns {boolean}
         */
        self.checkToShowAction = function (action, model) {
            /*if (action.hasOwnProperty('permissionKey'))
             return !action.hide && employeeService.hasPermissionTo(action.permissionKey);
             return (!action.hide);*/

            if (action.hasOwnProperty('permissionKey')) {
                if (typeof action.permissionKey === 'string') {
                    return (!action.hide) && employeeService.hasPermissionTo(action.permissionKey);
                }
                else if (angular.isArray(action.permissionKey)) {
                    if (!action.permissionKey.length) {
                        return (!action.hide);
                    }
                    else {
                        var hasPermissions = _.map(action.permissionKey, function (key) {
                            return employeeService.hasPermissionTo(key);
                        });
                        return (!action.hide) && !(_.some(hasPermissions, function (isPermission) {
                                return isPermission !== true;
                            }));
                    }
                }
            }
            return (!action.hide);
        };

        self.documentActions = [
            {
                text: langService.get('content_action_print_barcode'),
                callback: self.docActionPrintBarcode,
                class: "action-green",
                permissionKey: "PRINT_BARCODE",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && info.isPaper; //Don't show if its electronic outgoing
                }
            },
            {
                text: langService.get('content_action_launch_distribution_workflow'),
                callback: self.docActionLaunchDistributionWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
                checkShow: function (action, model) {
                    //var info = model.getInfo();
                    return self.checkToShowAction(action, model) && (self.documentInformation || (self.outgoing.contentFile && self.outgoing.hasContent()));
                }
            },
            {
                text: langService.get('content_action_send_to_review'),
                callback: self.docActionSendToReview,
                class: "action-red",
                hide: true,
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && (self.documentInformation || (self.outgoing.contentFile && self.outgoing.hasContent()));
                }
            },
            {
                text: langService.get('content_action_manage_tasks'),
                callback: self.docActionManageTasks,
                class: "action-red",
                hide: true,
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model);
                }
            },
            {
                text: langService.get('content_action_configure_security'),
                callback: self.docActionConfigureSecurity,
                class: "action-red",
                hide: true,
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model);
                }
            },
            {
                text: langService.get('content_action_export'),
                callback: self.docActionExportDocument,
                class: "action-red",
                hide: true,
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && info.isPaper; //Don't show if its electronic outgoing
                }
            }
        ];

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
            self.documentInformation = null;
            self.document_properties.$setUntouched();
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

    });
};