module.exports = function (app) {
    app.controller('incomingAddContentActionsPopCtrl', function (_,
                                                                 toast,
                                                                 validationService,
                                                                 incomingDocument,
                                                                 documentInformation,
                                                                 generator,
                                                                 dialog,
                                                                 langService,
                                                                 distributionWorkflowService,
                                                                 managerService,
                                                                 employeeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'incomingAddContentActionsPopCtrl';
        self.incomingDocument = angular.copy(incomingDocument);
        self.model = angular.copy(incomingDocument);
        self.documentInformation = documentInformation;


        self.docActionPrintBarcode = function ($event) {
            console.log('print barcode', self.incomingDocument);
        };

        /*   self.docActionCloseDocument = function ($event) {
               console.log('closeDocument', self.incomingDocument);
           };
   */
        self.docActionCreateContent = function ($event) {
            console.log('create content', self.incomingDocument);
        };

        self.docActionLaunchDistributionWorkflow = function ($event) {
            //console.log('launch distribution workflow', self.incomingDocument);
            if (!self.incomingDocument.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }

            distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSend(self.incomingDocument, false, false, null, "incoming", $event);
        };

        self.docActionSendToReview = function ($event) {
            //console.log('send to review', self.incomingDocument);

        };

        self.docActionManageComments = function ($event) {
            managerService
                .manageDocumentComments(self.incomingDocument.vsId, self.incomingDocument.docSubject, $event)
                .then(function (documentComments) {
                    self.incomingDocument.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    self.incomingDocument.documentComments = documentComments;
                });
        };

        self.docActionManageTags = function ($event) {
            managerService
                .manageDocumentTags(self.incomingDocument.vsId, self.incomingDocument.docClassName, self.incomingDocument.docSubject, $event)
                .then(function (tags) {
                    self.incomingDocument.tags = tags;
                })
                .catch(function (tags) {
                    self.incomingDocument.tags = tags;
                });
        };

        self.docActionManageTasks = function ($event) {
            console.log('manage tasks', self.incomingDocument);
        };

        self.docActionConfigureSecurity = function ($event) {
            console.log('configure document security', self.incomingDocument);
        };

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
                        return self.checkToShowAction(action, model);
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
                    class: "action-red",
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
                },
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
        self.closeIncomingActionsPopupFromCtrl = function ($event) {
            dialog.cancel();
        }
    });
};