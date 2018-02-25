module.exports = function (app) {
    app.controller('internalCtrl', function (Internal,
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
                                             documentFileService,
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
                                             distributionWorkflowService,
                                             draftInternalService,
                                             editAfterApproved,
                                             correspondenceService) {
        'ngInject';
        var self = this;
        self.controllerName = 'internalCtrl';
        contextHelpService.setHelpTo('internal-add');
        self.employeeService = employeeService;
        // current employee
        self.employee = employeeService.getEmployee();
        // validation for accordion
        self.validation = true;
        // collapse from label
        self.collapse = true;
        // current mode
        self.editMode = !!(editAfterApproved);
        // self.editMode = false;
        // copy of the current internal if saved.
        // self.model = angular.copy(demoInternal);
        self.model = editAfterApproved ? angular.copy(editAfterApproved.metaData) : null;

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
                promise = self.internal
                    .saveDocumentWithContent(self.documentInformation);
            } else {
                promise = self.internal
                    .saveDocument(status)
            }
            promise.then(function (result) {
                self.internal = result;
                self.model = angular.copy(self.internal);
                self.documentInformationExist = !!angular.copy(self.documentInformation);


                /*If content file was attached */
                if (self.internal.contentFile) {
                    self.internal.addDocumentContentFile()
                        .then(function () {
                            self.contentFileExist = !!(self.internal.hasOwnProperty('contentFile') && self.internal.contentFile);
                            self.contentFileSizeExist = !!(self.contentFileExist && self.internal.contentFile.size);

                            saveCorrespondenceFinished(status);
                        })
                }
                else {
                    self.contentFileExist = false;
                    self.contentFileSizeExist = false;

                    saveCorrespondenceFinished(status);
                }
            });
        };

        var saveCorrespondenceFinished = function (status) {
            counterService.loadCounters();
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
                //counterService.loadCounters();
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

        self.openDocumentActions = function () {
            return dialog
                .showDialog({
                    targetEvent: null,
                    template: cmsTemplate.getPopup('internal-add-content-actions'),
                    controller: 'internalAddContentActionsPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        internalDocument: self.internal,
                        documentInformation: self.documentInformation
                    }
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

        /* self.docActionCreateContent = function (document, $event){
         console.log('create content', document);
         };*/

        self.docActionLaunchDistributionWorkflow = function (document, $event) {
            if (!self.internal.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }

            /*distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSend(self.internal, false, false, null, "internal", $event)
                .then(function () {
                    counterService.loadCounters();
                    self.resetAddCorrespondence();
                });*/
            document.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    counterService.loadCounters();
                    self.resetAddCorrespondence();
                });
        };

        self.docActionSendToReview = function (document, $event) {
            //console.log('send to review', document);
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

        var isVisible = false;
        self.documentActions = [
            {
                text: langService.get('content_action_print_barcode'),
                callback: self.docActionPrintBarcode,
                class: "action-green",
                permissionKey: "PRINT_BARCODE",
                checkShow: function (action, model, index) {
                    var info = model.getInfo();
                    isVisible = self.checkToShowAction(action, model) && info.isPaper !== 0; //Don't show if its electronic internal
                    self.setAvailability(index, isVisible);
                    return isVisible;
                    //return self.checkToShowAction(action, model) && info.isPaper;
                }
            },
            {
                text: langService.get('content_action_launch_distribution_workflow'),
                callback: self.docActionLaunchDistributionWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
                checkShow: function (action, model, index) {
                    isVisible = self.checkToShowAction(action, model) && (!!self.documentInformationExist || !!(self.contentFileExist && self.contentFileSizeExist));
                    self.setAvailability(index, isVisible);
                    return isVisible;
                    //return self.checkToShowAction(action, model) && (self.documentInformation || (self.internal.contentFile && self.internal.hasContent()));
                }
            },
            {
                text: langService.get('content_action_send_to_review'),
                callback: self.docActionSendToReview,
                class: "action-red",
                hide: true,
                checkShow: function (action, model, index) {
                    isVisible = self.checkToShowAction(action, model) && (!!self.documentInformationExist || !!(self.contentFileExist && self.contentFileSizeExist));
                    self.setAvailability(index, isVisible);
                    return isVisible;
                    //return self.checkToShowAction(action, model) && (self.documentInformation || (self.internal.contentFile && self.internal.hasContent()));
                }
            },
            {
                text: langService.get('content_action_manage_tasks'),
                callback: self.docActionManageTasks,
                class: "action-red",
                hide: true,
                checkShow: function (action, model, index) {
                    isVisible = self.checkToShowAction(action, model);
                    self.setAvailability(index, isVisible);
                    return isVisible;
                    // return self.checkToShowAction(action, model);
                }
            },
            {
                text: langService.get('content_action_configure_security'),
                callback: self.docActionConfigureSecurity,
                class: "action-red",
                hide: true,
                checkShow: function (action, model, index) {
                    isVisible = self.checkToShowAction(action, model);
                    self.setAvailability(index, isVisible);
                    return isVisible;
                    // return self.checkToShowAction(action, model);
                }
            },
            {
                text: langService.get('content_action_export'),
                callback: self.docActionExportDocument,
                class: "action-red",
                hide: true,
                checkShow: function (action, model, index) {
                    var info = model.getInfo();
                    isVisible = self.checkToShowAction(action, model) && info.isPaper; //Don't show if its electronic internal
                    self.setAvailability(index, isVisible);
                    return isVisible;
                    //return self.checkToShowAction(action, model) && model.addMethod === 1; //Don't show if its electronic internal
                }
            }
        ];

        self.setAvailability = function (index, isVisible) {
            if (index === 0)
                self.visibilityArray = [];
            self.visibilityArray.push(isVisible);
            if (index + 1 === self.documentActions.length) {
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