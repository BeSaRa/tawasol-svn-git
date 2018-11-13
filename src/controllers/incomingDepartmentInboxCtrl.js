module.exports = function (app) {
    app.controller('incomingDepartmentInboxCtrl', function (lookupService,
                                                            incomingDepartmentInboxService,
                                                            incomingDepartmentInboxes,
                                                            correspondenceService,
                                                            managerService,
                                                            $state,
                                                            errorCode,
                                                            $q,
                                                            $filter,
                                                            langService,
                                                            viewDocumentService,
                                                            toast,
                                                            dialog,
                                                            contextHelpService,
                                                            counterService,
                                                            employeeService,
                                                            ResolveDefer,
                                                            generator,
                                                            listGeneratorService,
                                                            Incoming,
                                                            mailNotificationService,
                                                            gridService) {
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
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.department.incoming) || 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.department.incoming, self.incomingDepartmentInboxes),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.department.incoming, limit);
            }
        };


        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };

        function _getWorkflowName(model) {
            return model.getInfo().documentClass;
        }

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.incomingDepartmentInboxes = $filter('orderBy')(self.incomingDepartmentInboxes, self.grid.order);
        };

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
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.incomingDepartmentInboxes = result;
                    self.selectedIncomingDepartmentInboxes = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
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
            var documentName = angular.copy(incomingDepartmentInbox.generalStepElm.docSubject);
            incomingDepartmentInboxService.controllerMethod
                .incomingDepartmentInboxQuickReceive(incomingDepartmentInbox, $event)
                .then(function (result) {
                    var list = listGeneratorService.createUnOrderList(),
                        langKeys = ['quick_received_success', 'not_launched_book_will_go_to_review', 'confirm_launch_distribution_workflow'];
                    _.map(langKeys, function (item) {
                        list.addItemToList(langService.get(item));
                    });

                    dialog.confirmMessage(list.getList(), null, null, $event)
                        .then(function () {
                            var correspondence = new Incoming({
                                vsId: result,
                                docSubject: documentName,
                                securityLevel: incomingDepartmentInbox.generalStepElm.securityLevel,
                                mainSiteId: true // to avoid the check correspondence sites for the document before launch it.
                            });
                            /* isDeptIncoming is sent true to avoid alert message */
                            correspondence.launchWorkFlow($event, 'forward', 'favorites', true)
                                .then(function () {
                                    self.reloadIncomingDepartmentInboxes(self.grid.page)
                                        .then(function () {
                                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                                            new ResolveDefer(defer);
                                        });
                                });
                        })
                        .catch(function () {
                            self.reloadIncomingDepartmentInboxes(self.grid.page)
                                .then(function () {
                                    new ResolveDefer(defer);
                                });
                        });

                })
                .catch(function (error) {
                    errorCode.checkIf(error, 'INVALID_REFERENCE_FORMAT', function () {
                        dialog
                            .confirmMessage(langService.get('quick_receive_failed_missing_properties'))
                            .then(function () {
                                return self.receiveWorkItem(incomingDepartmentInbox, $event);
                            });
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
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
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
         * @description Preview document
         * @param incomingDepartmentInbox
         * @param $event
         */
        self.previewDocument = function (incomingDepartmentInbox, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(incomingDepartmentInbox, self.gridActions, true, checkIfEditCorrespondenceSiteAllowed(incomingDepartmentInbox, true), true, false, false, true)
                .then(function () {
                    return self.reloadIncomingDepartmentInboxes(self.grid.page);
                })
                .catch(function () {
                    return self.reloadIncomingDepartmentInboxes(self.grid.page);
                });
        };

        /**
         * @description View document
         * @param workItem
         * @param $event
         */
        self.viewDocument = function (workItem, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            var info = workItem.getInfo();
            /*
                If document is sent to regOu from launchScreen
                else document is exported from ready to export
            */
            if (!info.incomingVsId && info.docType !== 1) {
                workItem.viewNewDepartmentIncomingAsWorkItem(self.gridActions, 'departmentIncoming', $event)
                    .then(function () {
                        self.reloadIncomingDepartmentInboxes(self.grid.page);
                    })
                    .catch(function () {
                        self.reloadIncomingDepartmentInboxes(self.grid.page);
                    });
            }
            else {
                workItem.viewNewDepartmentIncomingAsCorrespondence(self.gridActions, 'departmentIncoming', $event)
                    .then(function () {
                        self.reloadIncomingDepartmentInboxes(self.grid.page);
                    })
                    .catch(function () {
                        self.reloadIncomingDepartmentInboxes(self.grid.page);
                    });
            }
        };

        /**
         * @description get document versions
         * @param workItem
         * @param $event
         * @return {*}
         */
        self.getDocumentVersions = function (workItem, $event) {
            return workItem
                .viewSpecificVersion(self.gridActions, $event);
        };
        /**
         * @description duplicate current version
         * @param workItem
         * @param $event
         */
        self.duplicateCurrentVersion = function (workItem, $event) {
            var info = workItem.getInfo();
            return workItem
                .duplicateVersion($event)
                .then(function () {
                    $state.go('app.' + info.documentClass.toLowerCase() + '.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        workItem: info.wobNum
                    });
                });
        };
        /**
         * @description duplicate specific version
         * @param workItem
         * @param $event
         * @return {*}
         */
        self.duplicateVersion = function (workItem, $event) {
            var info = workItem.getInfo();
            return workItem
                .duplicateSpecificVersion($event)
                .then(function () {
                    $state.go('app.' + info.documentClass.toLowerCase() + '.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        workItem: info.wobNum
                    });
                });
        };

        /**
         * @description Check if action will be shown on grid or not
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
            // Preview
            {
                type: 'action',
                icon: 'book-open-variant',
                text: 'grid_action_preview_document',
                shortcut: true,
                callback: self.previewDocument,
                showInView: false,
                class: "action-green",
                permissionKey: 'VIEW_DOCUMENT',
                checkShow: function (action, model) {
                    //If no content or no view document permission, hide the button
                    return self.checkToShowAction(action, model) && model.hasContent();
                }
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
                    //var info = model.getInfo();
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
                    //var info = model.getInfo();
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
                    //var info = model.getInfo();
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
                    //var info = model.getInfo();
                    return self.checkToShowAction(action, model) && model.generalStepElm.isReassigned;//!info.incomingVsId;
                }
            },
            // show versions
            {
                type: 'action',
                icon: 'animation',
                text: 'grid_action_view_specific_version',
                shortcut: false,
                callback: self.getDocumentVersions,
                permissionKey: "VIEW_DOCUMENT_VERSION",
                class: "action-green",
                showInView: true,
                hide: true,
                checkShow: self.checkToShowAction
            },
            // duplicate current version
            {
                type: 'action',
                icon: 'content-copy',
                text: 'grid_action_duplication_current_version',
                shortcut: false,
                callback: self.duplicateCurrentVersion,
                class: "action-green",
                permissionKey: 'DUPLICATE_BOOK_CURRENT',
                showInView: true,
                hide: true,
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && (info.documentClass === 'outgoing' || info.documentClass === 'internal') && !info.isPaper;
                }
            },
            // duplicate specific version
            {
                type: 'action',
                icon: 'content-duplicate',
                text: 'grid_action_duplication_specific_version',
                shortcut: false,
                callback: self.duplicateVersion,
                class: "action-green",
                showInView: true,
                hide: true,
                permissionKey: 'DUPLICATE_BOOK_FROM_VERSION',
                checkShow: self.checkToShowAction
            }
        ];
    });
};