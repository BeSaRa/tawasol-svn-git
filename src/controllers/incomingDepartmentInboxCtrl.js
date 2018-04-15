module.exports = function (app) {
    app.controller('incomingDepartmentInboxCtrl', function (lookupService,
                                                            incomingDepartmentInboxService,
                                                            incomingDepartmentInboxes,
                                                            correspondenceService,
                                                            managerService,
                                                            $state,
                                                            $q,
                                                            langService,
                                                            viewDocumentService,
                                                            toast,
                                                            dialog,
                                                            contextHelpService,
                                                            counterService,
                                                            employeeService,
                                                            ResolveDefer,
                                                            Information) {
        'ngInject';
        var self = this;

        self.controllerName = 'incomingDepartmentInboxCtrl';

        self.progress = null;
        contextHelpService.setHelpTo('department-inbox-incoming');
        /**
         * @description All incoming department inbox items
         * @type {*}
         */
        self.incomingDepartmentInboxes = incomingDepartmentInboxes;
        /**
         * @description Contains the selected incoming department inbox items
         * @type {Array}
         */
        self.selectedIncomingDepartmentInboxes = [];

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
                        return (self.incomingDepartmentInboxes.length + 21);
                    }
                }
            ]
        };

        function _getWorkflowName(model) {
            return model.getInfo().documentClass;
        }

        /**
         * @description Reload the grid of incoming department inbox item
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadIncomingDepartmentInboxes = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return incomingDepartmentInboxService
                .loadIncomingDepartmentInboxes()
                .then(function (result) {
                    counterService.loadCounters();
                    self.incomingDepartmentInboxes = result;
                    self.selectedIncomingDepartmentInboxes = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };


        self.checkIfReturnBulkAvailable = function () {
            self.itemsWithoutReturn = [];
            _.map(self.selectedIncomingDepartmentInboxes, function (workItem) {
                //info = workItem.getInfo();
                //if (!info.incomingVsId)
                if (workItem.generalStepElm.isReassigned)
                    self.itemsWithoutReturn.push(workItem.generalStepElm.vsId);
            });
            return !(self.itemsWithoutReturn && self.itemsWithoutReturn.length);
        };

        /**
         * @description Return the bulk incoming department inbox items
         * @param $event
         */
        self.returnWorkItemsBulk = function ($event) {
            var selectedItems = angular.copy(self.selectedIncomingDepartmentInboxes);
            if (!self.checkIfReturnBulkAvailable()) {
                if (self.itemsWithoutReturn.length === selectedItems.length) {
                    dialog.alertMessage(langService.get('selected_items_can_not_be_returned'));
                    return false;
                }
                dialog.confirmMessage(langService.get('some_items_cannot_return_skip_and_return'), null, null, $event).then(function () {
                    self.selectedIncomingDepartmentInboxes = selectedItems = _.filter(self.selectedIncomingDepartmentInboxes, function (workItem) {
                        return self.itemsWithoutReturn.indexOf(workItem.generalStepElm.vsId) === -1;
                    });
                    if (self.selectedIncomingDepartmentInboxes.length)
                        returnBulk(selectedItems, $event);
                })
            }
            else {
                returnBulk(selectedItems, $event);
            }
        };

        function returnBulk(selectedItems, $event) {
            correspondenceService
                .returnBulkWorkItem(selectedItems, $event)
                .then(function () {
                    self.reloadIncomingDepartmentInboxes(self.grid.page);
                });
        }

        /**
         * @description Return the incoming department inbox item
         * @param incomingDepartmentInbox
         * @param $event
         * @param defer
         */
        self.returnWorkItem = function (incomingDepartmentInbox, $event, defer) {
            /*incomingDepartmentInboxService
             .controllerMethod
             .incomingDepartmentInboxReturn(incomingDepartmentInbox, $event)
             .then(function () {
             self.reloadIncomingDepartmentInboxes(self.grid.page)
             .then(function () {
             new ResolveDefer(defer);
             });
             })*/
            incomingDepartmentInbox
                .returnWorkItem($event)
                .then(function () {
                    new ResolveDefer(defer);
                    self.reloadIncomingDepartmentInboxes(self.grid.page);
                });
        };

        /**
         * @description Accept the incoming department inbox item
         * @param incomingDepartmentInbox
         * @param $event
         * @param defer
         */
        self.receiveWorkItem = function (incomingDepartmentInbox, $event, defer) {
            var info = incomingDepartmentInbox.getInfo();
            dialog.hide();
            $state.go('app.incoming.add', {action: 'receive', workItem: info.wobNumber});
        };

        /**
         * @description Quick Accept the incoming department inbox item
         * @param incomingDepartmentInbox
         * @param $event
         * @param defer
         */
        self.quickReceiveWorkItem = function (incomingDepartmentInbox, $event, defer) {
            incomingDepartmentInboxService.controllerMethod
                .incomingDepartmentInboxQuickReceive(incomingDepartmentInbox, $event)
                .then(function () {
                    self.reloadIncomingDepartmentInboxes(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Launch distribution workflow for department incoming item
         * @param workItem
         * @param $event
         * @param defer
         */
        self.launchDistributionWorkflow = function (workItem, $event, defer) {
            workItem.launchWorkFlow($event, 'forward', 'favorites', true)
                .then(function () {
                    self.reloadIncomingDepartmentInboxes(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        var checkIfEditCorrespondenceSiteAllowed = function (model, checkForViewPopup) {
            /*var info = model.getInfo();
             var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
             var allowed = (hasPermission && info.documentClass !== "internal");
             if (checkForViewPopup)
             return !(allowed);
             return allowed;*/
            if (checkForViewPopup)
                return true;
            return false;
        };

        /**
         * @description View document of incoming department inbox
         * @param incomingDepartmentInbox
         * @param $event
         */
        self.viewDocument = function (incomingDepartmentInbox, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(incomingDepartmentInbox, self.gridActions, true, checkIfEditCorrespondenceSiteAllowed(incomingDepartmentInbox, true), true, false, false, true);
            return;
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

        /*

         /!**
         * @description Manage Tags
         * @param incomingDepartmentInbox
         * @param $event
         *!/
         self.manageTags = function (incomingDepartmentInbox, $event) {
         var vsId = incomingDepartmentInbox.hasOwnProperty('generalStepElm')
         ? (incomingDepartmentInbox.generalStepElm.hasOwnProperty('vsId') ? incomingDepartmentInbox.generalStepElm.vsId : incomingDepartmentInbox.generalStepElm)
         : (incomingDepartmentInbox.hasOwnProperty('vsId') ? incomingDepartmentInbox.vsId : incomingDepartmentInbox);
         var wfName = _getWorkflowName(incomingDepartmentInbox);
         //var wfName = 'outgoing';
         managerService.manageDocumentTags(vsId, wfName.toLowerCase(), incomingDepartmentInbox.getTranslatedName(), $event)
         .then(function () {
         self.reloadIncomingDepartmentInboxes(self.grid.page);
         })
         .catch(function (error) {
         self.reloadIncomingDepartmentInboxes(self.grid.page);
         });
         };

         /!**
         * @description Manage Comments
         * @param incomingDepartmentInbox
         * @param $event
         *!/
         self.manageComments = function (incomingDepartmentInbox, $event) {
         //console.log('manageUserInboxComments : ', incomingDepartmentInbox);
         var vsId = incomingDepartmentInbox.hasOwnProperty('generalStepElm')
         ? (incomingDepartmentInbox.generalStepElm.hasOwnProperty('vsId') ? incomingDepartmentInbox.generalStepElm.vsId : incomingDepartmentInbox.generalStepElm)
         : (incomingDepartmentInbox.hasOwnProperty('vsId') ? incomingDepartmentInbox.vsId : incomingDepartmentInbox);
         var wfName = _getWorkflowName(incomingDepartmentInbox);
         //var wfName = 'outgoing';
         managerService.manageDocumentComments(vsId, wfName.toLowerCase(), $event)
         .then(function () {
         self.reloadIncomingDepartmentInboxes(self.grid.page);
         })
         .catch(function (error) {
         self.reloadIncomingDepartmentInboxes(self.grid.page);
         });
         };

         /!**
         * @description Manage Tasks
         * @param incomingDepartmentInbox
         * @param $event
         *!/
         self.manageTasks = function (incomingDepartmentInbox, $event) {
         console.log('manageUserInboxTasks : ', incomingDepartmentInbox);
         };

         /!**
         * @description Manage Attachments
         * @param incomingDepartmentInbox
         * @param $event
         *!/
         self.manageAttachments = function (incomingDepartmentInbox, $event) {
         //console.log('manageUserInboxAttachments : ', incomingDepartmentInbox);
         var vsId = incomingDepartmentInbox.hasOwnProperty('generalStepElm')
         ? (incomingDepartmentInbox.generalStepElm.hasOwnProperty('vsId') ? incomingDepartmentInbox.generalStepElm.vsId : incomingDepartmentInbox.generalStepElm)
         : (incomingDepartmentInbox.hasOwnProperty('vsId') ? incomingDepartmentInbox.vsId : incomingDepartmentInbox);
         var wfName = _getWorkflowName(incomingDepartmentInbox);
         //var wfName = 'outgoing';
         managerService.manageDocumentAttachments(vsId, wfName.toLowerCase(), incomingDepartmentInbox.getTranslatedName(), $event);
         };


         /!**
         * @description Manage Linked Documents
         * @param incomingDepartmentInbox
         * @param $event
         *!/
         self.manageLinkedDocuments = function (incomingDepartmentInbox, $event) {
         //console.log('manageUserInboxLinkedDocuments : ', incomingDepartmentInbox);
         var info = incomingDepartmentInbox.getInfo();
         managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass, "welcome");
         };

         /!**
         * @description Manage Linked Entities
         * @param incomingDepartmentInbox
         * @param $event
         *!/
         self.manageLinkedEntities = function (incomingDepartmentInbox, $event) {
         //console.log('manageUserInboxLinkedEntities : ', incomingDepartmentInbox);
         //var wfName = 'outgoing';
         var wfName = _getWorkflowName(incomingDepartmentInbox);
         managerService
         .manageDocumentEntities(incomingDepartmentInbox.generalStepElm.vsId, wfName.toLowerCase(), incomingDepartmentInbox.generalStepElm.docSubject, $event);
         };

         /!**
         * @description Destinations
         * @param incomingDepartmentInbox
         * @param $event
         *!/
         self.manageDestinations = function (incomingDepartmentInbox, $event) {
         //console.log('manage destinations : ', incomingDepartmentInbox);

         var wfName = _getWorkflowName(incomingDepartmentInbox);

         managerService.manageDocumentCorrespondence(incomingDepartmentInbox.generalStepElm.vsId, wfName.toLowerCase(), incomingDepartmentInbox.generalStepElm.docSubject, $event)
         };
         */

        /**
         * @description Array of actions that can be performed on grid
         * @type {[*]}
         */
        self.gridActions = [
            // Document Information
            {
                type: 'action',
                icon: 'information-variant',
                text: 'grid_action_document_info',
                shortcut: false,
                showInView: false,
                subMenu: [
                    {
                        type: 'info',
                        checkShow: self.checkToShowAction,
                        gridName: 'department-incoming'
                    }
                ],
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            // Separator
            {
                type: 'separator',
                checkShow: self.checkToShowAction,
                showInView: false
            },
            // Open
            {
                type: 'action',
                icon: 'book-open-variant',
                text: 'grid_action_open',
                shortcut: true,
                callback: self.viewDocument,
                showInView: false,
                class: "action-green",
                permissionKey: 'VIEW_DOCUMENT',
                checkShow: function (action, model) {
                    //If no content or no view document permission, hide the button
                    return self.checkToShowAction(action, model) && model.hasContent();
                }
            },
            // Return
            {
                type: 'action',
                icon: 'undo-variant',
                text: 'grid_action_return',
                shortcut: true,
                callback: self.returnWorkItem,
                class: "action-green",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && !model.generalStepElm.isReassigned;//!!info.incomingVsId;
                }
            },
            // Receive
            {
                type: 'action',
                icon: 'check',
                text: 'grid_action_receive',
                shortcut: true,
                callback: self.receiveWorkItem,
                class: "action-green",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && !model.generalStepElm.isReassigned;//!!info.incomingVsId;
                }
            },
            // Quick Receive
            {
                type: 'action',
                icon: 'check-all',
                text: 'grid_action_quick_receive',
                shortcut: true,
                hide: false,
                callback: self.quickReceiveWorkItem,
                class: "action-green",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && !model.generalStepElm.isReassigned;//!!info.incomingVsId;
                }
            },
            //Launch Distribution Workflow
            {
                type: 'action',
                icon: 'sitemap',
                text: 'grid_action_launch_distribution_workflow',
                shortcut: true,
                callback: self.launchDistributionWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && model.generalStepElm.isReassigned;//!info.incomingVsId;
                }
            },
            // Manage (Not in SRS)
            /*{
             type: 'action',
             icon: 'settings',
             text: 'grid_action_manage',
             shortcut: false,
             showInView: false,
             hide: true,
             checkShow: self.checkToShowAction,
             subMenu: [
             // Tags
             {
             type: 'action',
             icon: 'tag',
             text: 'grid_action_tags',
             shortcut: false,
             callback: self.manageTags,
             class: "action-green",
             checkShow: self.checkToShowAction
             },
             // Comments
             {
             type: 'action',
             icon: 'comment',
             text: 'grid_action_comments',
             shortcut: false,
             permissionKey: "MANAGE_DOCUMENT’S_COMMENTS",
             callback: self.manageComments,
             class: "action-green",
             checkShow: self.checkToShowAction
             },
             // Tasks
             {
             type: 'action',
             icon: 'note-multiple',
             text: 'grid_action_tasks',
             shortcut: false,
             callback: self.manageTasks,
             class: "action-red",
             hide: true,
             checkShow: self.checkToShowAction
             },
             // Attachments
             {
             type: 'action',
             icon: 'attachment',
             text: 'grid_action_attachments',
             shortcut: false,
             callback: self.manageAttachments,
             class: "action-green",
             checkShow: self.checkToShowAction
             },
             // Linked Documents
             {
             type: 'action',
             icon: 'file-document',
             text: 'grid_action_linked_documents',
             shortcut: false,
             callback: self.manageLinkedDocuments,
             class: "action-green",
             checkShow: self.checkToShowAction
             },
             // Linked Entities
             {
             type: 'action',
             icon: 'link-variant',
             text: 'grid_action_linked_entities',
             shortcut: false,
             callback: self.manageLinkedEntities,
             class: "action-green",
             checkShow: self.checkToShowAction
             },
             // Destinations
             {
             type: 'action',
             icon: 'stop',
             text: 'grid_action_destinations',
             shortcut: false,
             callback: self.manageDestinations,
             permissionKey: "MANAGE_DESTINATIONS",
             hide: true,
             class: "action-yellow",
             checkShow: function (action, model) {
             var info = model.getInfo();
             return self.checkToShowAction(action, model) && checkIfEditCorrespondenceSiteAllowed(model, false);
             }
             }
             ]
             }*/
        ];
    });
};