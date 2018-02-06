module.exports = function (app) {
    app.controller('internalAddContentActionsPopCtrl', function (_,
                                                                 toast,
                                                                 validationService,
                                                                 internalDocument,
                                                                 documentInformation,
                                                                 generator,
                                                                 dialog,
                                                                 langService,
                                                                 distributionWorkflowService,
                                                                 draftInternalService,
                                                                 managerService,
                                                                 employeeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'internalAddContentActionsPopCtrl';
        self.internalDocument = angular.copy(internalDocument);
        self.model = angular.copy(internalDocument);
        self.documentInformation = documentInformation;


        self.docActionPrintBarcode = function ($event) {
            console.log('print barcode', self.internalDocument);
        };

        /*   self.docActionCloseDocument = function ($event) {
               console.log('closeDocument', self.internalDocument);
           };
   */
        self.docActionCreateContent = function ($event) {
            console.log('create content', self.internalDocument);
        };

        self.docActionLaunchDistributionWorkflow = function ($event) {
            //console.log('launch distribution workflow', self.internalDocument);
            if (!self.internalDocument.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }

            distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSend(self.internalDocument, false, false, null, "internal", $event);
        };

        self.docActionSendToReview = function ($event) {
            //console.log('send to review', self.internalDocument);
            draftInternalService.controllerMethod
                .draftInternalSendToReview(self.internalDocument, $event);
        };

        /* self.docActionSaveAsDraft = function ($event) {
             console.log('save as draft', self.internalDocument);
         };*/

        self.docActionManageComments = function ($event) {
            managerService
                .manageDocumentComments(self.internalDocument.vsId, self.internalDocument.docSubject, $event)
                .then(function (documentComments) {
                    self.internalDocument.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    self.internalDocument.documentComments = documentComments;
                });
        };

        self.docActionManageTags = function ($event) {
            managerService
                .manageDocumentTags(self.internalDocument.vsId, self.internalDocument.docClassName, self.internalDocument.docSubject, $event)
                .then(function (tags) {
                    self.internalDocument.tags = tags;
                })
                .catch(function (tags) {
                    self.internalDocument.tags = tags;
                });
        };

        self.docActionManageTasks = function ($event) {
            console.log('manage tasks', self.internalDocument);
        };

        self.docActionConfigureSecurity = function ($event) {
            console.log('configure document security', self.internalDocument);
        };

        /*   self.docActionExportDocument = function ($event) {
               console.log('export', self.internalDocument);
           };*/

        self.performDocumentAction = function (action, $event) {
            action.callback($event);
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
            [
                //Print Barcode
                {
                    text: langService.get('content_action_print_barcode'),
                    callback: self.docActionPrintBarcode,
                    class: "action-red",
                    permissionKey: "PRINT_BARCODE",
                    checkShow: function(action, model){
                        var info = model.getInfo();
                        return self.checkToShowAction(action, model) && info.isPaper;
                    }
                },
                // Create Content
                {
                    text: langService.get('content_action_create_content'),
                    callback: self.docActionCreateContent,
                    class: "action-red",
                    checkShow: function (action, model) {
                        return self.checkToShowAction(action, model) && !self.documentInformation;
                    }
                }
            ],
            [
                // Launch Distribution Workflow
                {
                    text: langService.get('content_action_launch_distribution_workflow'),
                    callback: self.docActionLaunchDistributionWorkflow,
                    class: "action-green",
                    checkShow: function (action, model) {
                        return self.checkToShowAction(action, model) && self.documentInformation;
                    }
                },
                // Send To Review
                {
                    text: langService.get('content_action_send_to_review'),
                    callback: self.docActionSendToReview,
                    class: "action-green",
                    checkShow: function (action, model) {
                        return self.checkToShowAction(action, model) && self.documentInformation;
                    }
                }
            ],
            [
                // Manage Comments
                {
                    text: langService.get('content_action_manage_comments'),
                    callback: self.docActionManageComments,
                    class: "action-green",
                    checkShow: self.checkToShowAction
                },
                // Manage Tags
                {
                    text: langService.get('content_action_manage_tags'),
                    callback: self.docActionManageTags,
                    class: "action-green",
                    checkShow: self.checkToShowAction
                }
            ],
            [
                // Manage Tasks
                {
                    text: langService.get('content_action_manage_tasks'),
                    callback: self.docActionManageTasks,
                    class: "action-red",
                    checkShow: self.checkToShowAction
                }/*,
                //Export
                {
                    text: langService.get('content_action_export'),
                    callback: self.docActionExportDocument,
                    class: "action-red",
                    checkShow: function (action, model) {
                        return !action.hide && model.addMethod && self.documentInformation; //Don't show if its electronic internal
                    }
                },
                // Save as Draft
                {
                    text: langService.get('content_action_save_as_draft'),
                    callback: self.docActionSaveAsDraft,
                    class: "action-red",
                    hide: true,
                    checkShow: function (action, model) {
                        return !action.hide && !model.addMethod && self.documentInformation; //Don't show if its paper internal
                    }
                }*/
            ],
            [
                //Configure Security
                {
                    text: langService.get('content_action_configure_security'),
                    callback: self.docActionConfigureSecurity,
                    class: "action-red",
                    checkShow: self.checkToShowAction,
                    hide: true
                }
            ]
        ];


        /**
         * @description Close the popup
         */
        self.closeInternalActionsPopupFromCtrl = function ($event) {
            dialog.cancel();
        }
    });
};