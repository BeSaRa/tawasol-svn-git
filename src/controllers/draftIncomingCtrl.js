module.exports = function (app) {
    app.controller('draftIncomingCtrl', function (lookupService,
                                                  draftIncomingService,
                                                  draftIncomings,
                                                  $q,
                                                  langService,
                                                  generator,
                                                  toast,
                                                  counterService,
                                                  dialog,
                                                  viewDocumentService,
                                                  //outgoingService,
                                                  managerService,
                                                  validationService,
                                                  employeeService,
                                                  contextHelpService,
                                                  $timeout,
                                                  viewTrackingSheetService,
                                                  distributionWorkflowService,
                                                  broadcastService) {
        'ngInject';
        var self = this;

        self.controllerName = 'draftIncomingCtrl';
        self.currentEmployee = employeeService.getEmployee();
        self.progress = null;
        contextHelpService.setHelpTo('incoming-draft');
        // employee service to check the permission in html
        self.employeeService = employeeService;

        /**
         * @description All draft incoming mails
         * @type {*}
         */
        self.draftIncomings = draftIncomings;

        /**
         * @description Contains the selected draft incoming mails
         * @type {Array}
         */
        self.selectedDraftIncomings = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.draftIncomings.length + 21);
                    }
                }
            ]
        };

        /**
         * @description Contains methods for CRUD operations for draft incoming mails
         */
        self.statusServices = {
            'activate': draftIncomingService.activateBulkDraftIncomings,
            'deactivate': draftIncomingService.deactivateBulkDraftIncomings,
            'true': draftIncomingService.activateDraftIncoming,
            'false': draftIncomingService.deactivateDraftIncoming
        };

        /**
         * @description Opens dialog for edit draft incoming mail
         * @param $event
         * @param draftIncoming
         */
        self.openEditDraftIncomingDialog = function (draftIncoming, $event) {
            console.log('edit draft incoming mail : ', draftIncoming);
        };

        /**
         * @description Replaces the record in grid after update
         * @param record
         */
        self.replaceRecord = function (record) {
            var index = _.findIndex(self.draftIncomings, {'id': record.id});
            if (index > -1)
                self.draftIncomings.splice(index, 1, record);
        };

        /**
         * @description Reload the grid of draft incoming mail
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadDraftIncomings = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return draftIncomingService
                .loadDraftIncomings(self.currentEmployee.defaultOUID)
                .then(function (result) {
                    counterService.loadCounters();
                    self.draftIncomings = result;
                    self.selectedDraftIncomings = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Remove multiple selected draft incoming mails
         * @param $event
         */
        self.removeBulk = function ($event) {
            console.log('delete draft incoming mails bulk : ', self.selectedDraftIncomings);
        };

        /**
         * @description Launch distribution workflow for selected draft incoming mails
         * @param draftIncoming
         * @param $event
         */
        self.launchDistributionWorkflowBulk = function (draftIncoming, $event) {
            var contentNotExist = _.filter(self.selectedDraftIncomings, function (draftIncoming) {
                return !draftIncoming.hasContent();
            });
            if (contentNotExist.length > 0) {
                dialog.alertMessage(langService.get("content_not_found_bulk"));
                return;
            }

            distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSendBulk(self.selectedDraftIncomings, "incoming", $event)
                .then(function () {
                    self.reloadDraftIncomings(self.grid.page);
                })
                .catch(function () {
                    self.reloadDraftIncomings(self.grid.page);
                });

        };

        /**
         * @description Send to review for selected draft incoming mails
         * @param $event
         */
        self.sendToReviewBulk = function ($event) {
            console.log('send to review incoming mails bulk : ', self.selectedDraftIncomings);
        };

        /**
         * @description Remove single draft incoming mail
         * @param draftIncoming
         * @param $event
         */
        self.remove = function (draftIncoming, $event) {
            console.log('delete draft incoming mail : ', draftIncoming);
        };

        /**
         * @description Edit the incoming properties
         * @param draftIncoming
         * @param $event
         */
        self.editProperties = function (draftIncoming, $event) {
            console.log('edit incoming properties : ', draftIncoming);
        };

        /**
         * @description Edit the incoming content
         * @param draftIncoming
         * @param $event
         */
        self.editContent = function (draftIncoming, $event) {
            console.log('edit incoming content : ', draftIncoming);
        };

        /**
         * @description Send the draft incoming to review
         * @param draftIncoming
         * @param $event
         */
        self.sendToReview = function (draftIncoming, $event) {
            console.log('send to review : ', draftIncoming);
        };

        /**
         * @description Launch distribution workflow for draft incoming item
         * @param draftIncoming
         * @param $event
         */
        self.launchDistributionWorkflow = function (draftIncoming, $event) {
            if (!draftIncoming.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }

        };

        /**
         * @description View Tracking Sheet
         * @param draftIncoming
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (draftIncoming, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(draftIncoming, params, $event).then(function (result) {
            });
        };

        /**
         * @description Manage document tags for draft incoming
         * @param draftIncoming
         * @param $event
         */
        self.manageTags = function (draftIncoming, $event) {
            console.log('manage tags : ', draftIncoming);
        };

        /**
         * @description Manage document comments for draft incoming
         * @param draftIncoming
         * @param $event
         */
        self.manageComments = function (draftIncoming, $event) {
            console.log('manage comments : ', draftIncoming);
        };

        /**
         * @description Manage document attachments for draft incoming
         * @param draftIncoming
         * @param $event
         */
        self.manageAttachments = function (draftIncoming, $event) {
            console.log('manage attachments : ', draftIncoming);
        };

        /**
         * @description Manage entities for draft incoming
         * @param draftIncoming
         * @param $event
         */
        self.manageEntities = function (draftIncoming, $event) {
            console.log('manage entities : ', draftIncoming);
        };

        /**
         * @description Manage linked documents for draft incoming
         * @param draftIncoming
         * @param $event
         */
        self.manageLinkedDocuments = function (draftIncoming, $event) {
            console.log('manage linked documents');
        };

        /**
         * @description Manage security for draft incoming
         * @param draftIncoming
         * @param $event
         */
        self.security = function (draftIncoming, $event) {
            console.log('security', draftIncoming);
        };

        /**
         * @description Manage destinations for draft incoming
         * @param draftIncoming
         * @param $event
         */
        self.manageDestinations = function (draftIncoming, $event) {
            console.log('destinations', draftIncoming);
        };

        /**
         * @description Open draft incoming
         * @param draftIncoming
         * @param $event
         */
        self.open = function (draftIncoming, $event) {
            if (!draftIncoming.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if(!employeeService.hasPermissionTo('VIEW_DOCUMENT')){
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
        };

        /**
         * @description broadcast selected organization and workflow group
         * @param draftIncoming
         * @param $event
         */
        self.broadcast = function (draftIncoming, $event) {
            broadcastService
                .controllerMethod
                .broadcastSend(draftIncoming, $event)
                .then(function () {
                    self.reloadDraftIncomings(self.grid.page);
                })
                .catch(function () {
                    self.reloadDraftIncomings(self.grid.page);
                });
        };

        /**
         * @description Check if action will be shown on grid or not
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

        /**
         * @description Array of actions that can be performed on grid
         * @type {[*]}
         */
        self.gridActions = [
            {
                type: 'action',
                icon: 'information-variant',
                text: 'grid_action_document_info',
                shortcut: false,
                submenu: [
                    {
                        type: 'info',
                        checkShow: self.checkToShowAction
                    }
                ],
                class: "action-green",
                hide: true,
                checkShow: self.checkToShowAction
            },
            {
                type: 'separator',
                checkShow: self.checkToShowAction
            },
            {
                type: 'action',
                icon: 'delete',
                text: 'grid_action_document_info',
                shortcut: true,
                callback: self.remove,
                class: "action-red",
                hide: true,
                checkShow: self.checkToShowAction
            },
           /* {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit_incoming_properties',
                shortcut: true,
                permissionKey: "EDIT_INCOMING’S_PROPERTIES",
                callback: self.editProperties,
                class: "action-red",
                hide: true,
                checkShow: self.checkToShowAction
            },
            {
                type: 'action',
                icon: 'pencil-box',
                text: 'grid_action_edit_incoming_content',
                shortcut: true,
                permissionKey: "EDIT_INCOMING’S_CONTENT",
                callback: self.editContent,
                class: "action-red",
                hide: true,
                checkShow: self.checkToShowAction
            },*/
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_send_to_review',
                shortcut: true,
                callback: self.sendToReview,
                class: "action-red",
                hide: true,
                checkShow: self.checkToShowAction
            },
            {
                type: 'action',
                icon: 'sitemap',
                text: 'grid_action_launch_distribution_workflow',
                shortcut: true,
                callback: self.launchDistributionWorkflow,
                class: "action-red",
                hide: true,
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
                checkShow: self.checkToShowAction
            },
            // Edit
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit',
                shortcut: false,
                showInView: false,
                checkShow: function (action, model) {
                    var hasPermission = (employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES") || employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT"));
                    return self.checkToShowAction(action, model) && hasPermission;
                },
                submenu: [
                    // Content
                    {
                        type: 'action',
                        icon: 'pencil-box',
                        //text: 'grid_action_content',
                        text: function () {
                            return {
                                contextText: 'grid_action_content',
                                shortcutText: 'grid_action_edit_content'
                            };
                        },
                        shortcut: true,
                        callback: self.editContent,
                        class: "action-green",
                        permissionKey: "EDIT_INCOMING’S_CONTENT",
                        checkShow: self.checkToShowAction
                    },
                    // Properties
                    {
                        type: 'action',
                        icon: 'pencil',
                        //text: 'grid_action_properties',
                        text: function () {
                            return {
                                contextText: 'grid_action_properties',
                                shortcutText: 'grid_action_edit_properties'
                            };
                        },
                        shortcut: true,
                        callback: self.editProperties,
                        class: "action-green",
                        permissionKey: "EDIT_INCOMING’S_PROPERTIES",
                        checkShow: self.checkToShowAction
                    }
                ]
            },
            // View Tracking Sheet
            {
                type: 'action',
                icon: 'eye',
                text: 'view_tracking_sheet',
                shortcut: false,
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: self.checkToShowAction,
                submenu: viewTrackingSheetService.getViewTrackingSheetOptions(self.checkToShowAction, self.viewTrackingSheet, 'grid')
            },
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                shortcut: false,
                hide: true,
                checkShow: self.checkToShowAction,
                submenu: [
                    // Tags
                    {
                        type: 'action',
                        icon: 'tag',
                        text: 'grid_action_tags',
                        shortcut: false,
                        callback: self.manageTags,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    {
                        type: 'action',
                        icon: 'comment',
                        text: 'grid_action_comments',
                        shortcut: false,
                        permissionKey: "MANAGE_DOCUMENT’S_COMMENTS",
                        callback: self.manageComments,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_attachments',
                        shortcut: false,
                        callback: self.manageAttachments,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    {
                        type: 'action',
                        icon: 'pencil-box-outline',
                        text: 'grid_action_entities',
                        shortcut: false,
                        callback: self.manageEntities,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_linked_documents',
                        shortcut: false,
                        callback: self.manageLinkedDocuments,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    {
                        type: 'action',
                        icon: 'stop',
                        text: 'grid_action_destinations',
                        shortcut: false,
                        callback: self.manageDestinations,
                        permissionKey: "MANAGE_DESTINATIONS",
                        class: "action-red",
                        hide: true,
                        checkShow: self.checkToShowAction
                    }
                ]
            },
            {
                type: 'action',
                icon: 'security',
                text: 'grid_action_security',
                shortcut: false,
                callback: self.security,
                class: "action-red",
                hide: true,
                checkShow: self.checkToShowAction
            },
            {
                type: 'action',
                icon: 'book-open-variant',
                text: 'grid_action_open',
                shortcut: false,
                callback: self.open,
                class: "action-red",
                hide: true,
                permissionKey: 'VIEW_DOCUMENT',
                checkShow: function (action, model) {
                    //If no content or no view document permission, hide the button
                    return self.checkToShowAction(action, model) && model.hasContent();
                }
            },
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_broadcast',
                shortcut: false,
                hide: true,
                callback: self.broadcast,
                checkShow: function (action, model) {
                    /*var addMethod = model.hasOwnProperty('generalStepElm')
                        ? (model.generalStepElm.hasOwnProperty('addMethod') ? model.generalStepElm.addMethod : model.generalStepElm)
                        : (model.hasOwnProperty('addMethod') ? model.addMethod : model);

                    var approvers = model.hasOwnProperty('generalStepElm')
                        ? (model.generalStepElm.hasOwnProperty('approvers') ? model.generalStepElm.approvers : model.generalStepElm)
                        : (model.hasOwnProperty('approvers') ? model.approvers : model);*/

                    return self.checkToShowAction(action, model) && (model.addMethod || model.approvers !== null);
                }
            }
        ];

        /**
         * @description View document
         * @param draftIncoming
         * @param $event
         */
        self.viewDocument = function (draftIncoming, $event) {
            if (!draftIncoming.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if(!employeeService.hasPermissionTo('VIEW_DOCUMENT')){
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
        };
        /*/!**
         * @description Change the globalization of draft incoming mail
         * @param draftIncoming
         *!/
         self.changeGlobalDraftIncoming = function (draftIncoming) {
         if (draftIncoming.isGlobal) {
         draftIncomingService.updateDraftIncoming(draftIncoming)
         .then(function () {
         toast.success(langService.get('globalization_success'));
         })
         .catch(function () {
         draftIncoming.globalProperty = !draftIncoming.globalProperty;
         dialog.errorMessage(langService.get('something_happened_when_update_global'));
         });
         }
         else {
         console.log("Open the popup to add relation entities");
         }
         };*/
    });
};