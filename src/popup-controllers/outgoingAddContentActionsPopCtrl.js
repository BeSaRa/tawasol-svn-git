module.exports = function (app) {
    app.controller('outgoingAddContentActionsPopCtrl', function (_,
                                                                 toast,
                                                                 validationService,
                                                                 outgoingDocument,
                                                                 documentInformation,
                                                                 generator,
                                                                 dialog,
                                                                 langService,
                                                                 distributionWorkflowService,
                                                                 draftOutgoingService,
                                                                 managerService,
                                                                 employeeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'outgoingAddContentActionsPopCtrl';
        self.outgoingDocument = angular.copy(outgoingDocument);
        self.model = angular.copy(outgoingDocument);
        self.documentInformation = documentInformation;


        self.docActionPrintBarcode = function ($event) {

        };

        /*   self.docActionCloseDocument = function ($event) {
               console.log('closeDocument', self.outgoingDocument);
           };
   */
        self.docActionCreateContent = function ($event) {
            console.log('create content', self.outgoingDocument);
        };

        self.docActionLaunchDistributionWorkflow = function ($event) {
            //console.log('launch distribution workflow', self.outgoingDocument);
            if (!self.outgoingDocument.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }

            distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSend(self.outgoingDocument, false, false, null, "outgoing", $event);
        };

        self.docActionSendToReview = function ($event) {
            //console.log('send to review', self.outgoingDocument);
            draftOutgoingService.controllerMethod
                .draftOutgoingSendToReview(self.outgoingDocument, $event);
        };

        /* self.docActionSaveAsDraft = function ($event) {
             console.log('save as draft', self.outgoingDocument);
         };*/

        self.docActionManageComments = function ($event) {
            managerService
                .manageDocumentComments(self.outgoingDocument.vsId, self.outgoingDocument.docSubject, $event)
                .then(function (documentComments) {
                    self.outgoingDocument.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    self.outgoingDocument.documentComments = documentComments;
                });
        };

        self.docActionManageTags = function ($event) {
            managerService
                .manageDocumentTags(self.outgoingDocument.vsId, self.outgoingDocument.docClassName, self.outgoingDocument.docSubject, $event)
                .then(function (tags) {
                    self.outgoingDocument.tags = tags;
                })
                .catch(function (tags) {
                    self.outgoingDocument.tags = tags;
                });
        };

        self.docActionManageTasks = function ($event) {
            console.log('manage tasks', self.outgoingDocument);
        };

        self.docActionConfigureSecurity = function ($event) {
            console.log('configure document security', self.outgoingDocument);
        };

        /*   self.docActionExportDocument = function ($event) {
               console.log('export', self.outgoingDocument);
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
                        return self.checkToShowAction(action, model) && model.addMethod && self.documentInformation; //Don't show if its electronic outgoing
                    }
                },
                // Save as Draft
                {
                    text: langService.get('content_action_save_as_draft'),
                    callback: self.docActionSaveAsDraft,
                    class: "action-red",
                    hide: true,
                    checkShow: function (action, model) {
                        return self.checkToShowAction(action, model) && !model.addMethod && self.documentInformation; //Don't show if its paper outgoing
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
        self.closeOutgoingActionsPopupFromCtrl = function ($event) {
            dialog.cancel();
        }
    });
};