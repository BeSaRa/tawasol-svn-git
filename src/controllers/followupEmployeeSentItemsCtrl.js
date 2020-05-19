module.exports = function (app) {
    app.controller('followupEmployeeSentItemsCtrl', function (lookupService,
                                                              userSentItemService,
                                                              followupEmployeeInboxService,
                                                              $q,
                                                              $filter,
                                                              $state,
                                                              viewDocumentService,
                                                              langService,
                                                              rootEntity,
                                                              contextHelpService,
                                                              correspondenceService,
                                                              managerService,
                                                              viewTrackingSheetService,
                                                              downloadService,
                                                              employeeService,
                                                              favoriteDocumentsService,
                                                              toast,
                                                              mailNotificationService,
                                                              counterService,
                                                              gridService,
                                                              WorkItem,
                                                              ResolveDefer,
                                                              generator,
                                                              dialog,
                                                              EventHistoryCriteria,
                                                              printService,
                                                              moment,
                                                              EventHistory) {
        'ngInject';
        var self = this;

        self.controllerName = 'followupEmployeeSentItemsCtrl';

        contextHelpService.setHelpTo('followup-employee-sent-items');

        self.followupEmployeeSentItems = [];
        self.followupEmployeeSentItemsCopy = [];
        self.totalRecords = followupEmployeeInboxService.followupSentItemsTotalCount;
        self.selectedOrganization = null;
        self.selectedEmployee = null;

        self.selectedFollowupEmployeeSentItems = [];
        self.globalSetting = rootEntity.returnRootEntity().settings;

        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.followupEmployeeSentItems = $filter('orderBy')(self.followupEmployeeSentItems, self.grid.order);
        };

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.inbox.followupSentItem) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.inbox.followupSentItem, self.totalRecords), //[5, 10, 20, 100, 200]
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.inbox.followupSentItem, limit);
                self.reloadFollowupEmployeeSentItems(page);
            },
            searchColumns: {
                securityLevel: function () {
                    return self.getSortingKey('securityLevelIndicator.value', 'Lookup')
                },
                docFullSerial: 'docFullSerial',
                docSubject: 'docSubject',
                actionDate: 'actionDate',
                action: function () {
                    return self.getSortingKey('action', 'WorkflowAction');
                },
                receiverInfo: function () {
                    return self.getSortingKey('receiverInfo', 'Information');
                },
                comments: 'comments',
                dueDate: 'dueDate',
                mainSiteSubSiteString: function () {
                    return self.getSortingKey('mainSiteSubSiteString', 'Information');
                }
            },
            searchText: '',
            searchCallback: function (grid, serverSide) {
                if (!!serverSide) {
                    // gridService.searchGridData(self.grid, self.followupEmployeeSentItemsCopy,userSentItemService.filterUserSentItems)
                    userSentItemService.filterUserSentItems(self.grid.searchText, self.searchCriteria, self.grid.page, self.selectedEmployee, self.selectedOrganization)
                        .then(function (result) {
                            self.followupEmployeeSentItems = self.grid.searchText ? result.records : result;
                            self.totalRecords = self.grid.searchText ? result.count : followupEmployeeInboxService.followupSentItemsTotalCount;
                        });
                } else {
                    self.followupEmployeeSentItems = gridService.searchGridData(self.grid, self.followupEmployeeSentItemsCopy);
                    self.totalRecords = self.grid.searchText ? self.followupEmployeeSentItems.length : followupEmployeeInboxService.followupSentItemsTotalCount;
                }
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.inbox.sentItem),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.inbox.sentItem, self.grid.truncateSubject);
            }
        };

        var _initEventHistoryCriteria = function (skipDates) {
            if (skipDates) {
                self.searchCriteria = new EventHistoryCriteria();
            } else {
                self.searchCriteria = new EventHistoryCriteria({
                    fromActionTime: moment().subtract(3, 'months').toDate(),
                    toActionTime: moment().endOf("day").toDate()
                })
            }
        };

        _initEventHistoryCriteria();
        self.searchCriteriaUsed = false;

        /**
         * @description Reload the grid of followup sent items
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadFollowupEmployeeSentItems = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            if (self.searchCriteriaUsed) {
                return userSentItemService.filterUserSentItems(null, self.searchCriteria, self.grid.page, self.selectedEmployee, self.selectedOrganization)
                    .then(function (result) {
                        self.followupEmployeeSentItems = result.records;
                        self.totalRecords = result.count;
                        defer.resolve(true);
                        return result;
                    });
            }

            return followupEmployeeInboxService
                .loadFollowupEmployeeSentItems(self.selectedEmployee, self.selectedOrganization, self.grid.page, self.grid.limit)
                .then(function (result) {
                    self.followupEmployeeSentItems = result;
                    self.followupEmployeeSentItemsCopy = angular.copy(self.followupEmployeeSentItems);
                    self.totalRecords = followupEmployeeInboxService.followupSentItemsTotalCount;

                    self.selectedFollowupEmployeeSentItems = [];
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    self.grid.searchCallback();
                    return result;
                });
        };

        /**
         * @description View Tracking Sheet
         * @param followupSentItem
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (followupSentItem, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(followupSentItem, params, $event).then(function (result) {

            });
        };

        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var hasPermission = false;
            if (checkForViewPopup) {
                return !hasPermission;
            }
        };

        /**
         * @description Preview document
         * @param followupSentItem
         * @param $event
         */
        self.previewDocument = function (followupSentItem, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            var info = followupSentItem.getInfo();
            info.wobNumber = null;
            correspondenceService.viewCorrespondence({
                vsId: info.vsId,
                docClassName: info.documentClass
            }, self.gridActions, checkIfEditPropertiesAllowed(followupSentItem, true), true)
                .then(function () {
                    self.reloadFollowupEmployeeSentItems(self.grid.page);
                })
                .catch(function () {
                    self.reloadFollowupEmployeeSentItems(self.grid.page);
                });
        };

        /**
         * @description View document
         * @param followupSentItem
         * @param $event
         */
        self.viewDocument = function (followupSentItem, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            followupSentItem.viewUserSentItem(self.gridActions, 'sentItem', $event)
                .then(function () {
                    return self.reloadFollowupEmployeeSentItems(self.grid.page);
                })
                .catch(function () {
                    return self.reloadFollowupEmployeeSentItems(self.grid.page);
                });
        };

        self.printResult = function ($event) {
            var printTitle = langService.get('menu_item_followup_employee_sent_items'),
                table = {
                    headers:
                        [
                            'sent_items_serial_number',
                            'label_document_class',
                            'sent_items_document_subject',
                            'action_date',
                            'sent_items_action',
                            'sent_items_receiver',
                            'comment'
                        ],
                    columns: [
                        'docFullSerial',
                        'docClassName',
                        'docSubject',
                        'actionDate',
                        'workflowActionInfo',
                        'userToInfo',
                        'comments'
                    ]
                };
            printService
                .printData(self.followupEmployeeSentItems, table, printTitle, (self.searchCriteriaUsed ? self.searchCriteria : new EventHistoryCriteria()), self.selectedEmployee, self.selectedOrganization);

        };

        /**
         * @description viewCorrespondenceSites
         * @param followupSentItem
         * @param $event
         */
        self.viewCorrespondenceSites = function (followupSentItem, $event) {
            correspondenceService.viewCorrespondenceSites(followupSentItem, null, $event);
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
                        checkShow: function (action, model) {
                            return true;
                        },
                        gridName: 'user-sent-items'
                    }
                ],
                class: "action-green",
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                }
            },
            // view
            {
                type: 'action',
                icon: 'book-open-variant',
                text: 'grid_action_view',
                shortcut: false,
                callback: self.previewDocument,
                class: "action-green",
                showInView: false,
                permissionKey: [
                    'VIEW_DOCUMENT',
                    'VIEW_DOCUMENT_VERSION'
                ],
                checkAnyPermission: true,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                subMenu: [
                    // Preview
                    {
                        type: 'action',
                        icon: 'book-open-variant',
                        text: 'grid_action_preview_document',
                        shortcut: true,
                        showInView: false,
                        callback: self.previewDocument,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        checkShow: function (action, model) {
                            //If no content, hide the button
                            return true;// && model.hasContent();
                        }
                    },
                    // Open
                    {
                        type: 'action',
                        icon: 'book-open-page-variant',
                        text: 'grid_action_open',
                        shortcut: true,
                        showInView: false,
                        callback: self.viewDocument,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        checkShow: function (action, model) {
                            //If no content, hide the button
                            return true;// && model.hasContent();
                        }
                    }
                ]
            },
            // Separator
            {
                type: 'separator',
                checkShow: function (action, model) {
                    return true;
                },
                showInView: false
            },
            // view Correspondence Sites
            {
                type: 'action',
                icon: 'arrange-send-backward',
                text: 'grid_action_correspondence_sites',
                callback: self.viewCorrespondenceSites,
                class: "action-green",
                showInView: false,
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return info.documentClass !== "internal";
                }
            },
            // View Tracking Sheet
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view_tracking_sheet',
                shortcut: false,
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: function (action, model) {
                    return true;
                },
                subMenu: viewTrackingSheetService.getViewTrackingSheetOptions('grid')
            },
            // View Tracking Sheet (Shortcut Only)
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view_tracking_sheet',
                shortcut: true,
                onlyShortcut: true,
                showInView: false,
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: function (action, model) {
                    return true;
                },
                callback: self.viewTrackingSheet,
                params: ['view_tracking_sheet', 'tabs']
            },
        ];

        self.getEmployeeForFollowupEmployeeSentItems = function ($event) {
            followupEmployeeInboxService
                .controllerMethod
                .openOrganizationAndUserDialog(self.selectedOrganization, self.selectedEmployee, null, true, $event)
                .then(function (result) {
                    self.selectedOrganization = result.organization;
                    self.selectedEmployee = result.applicationUser;
                    self.currentSelectedUser = result.applicationUser;
                    self.reloadFollowupEmployeeSentItems(self.grid.page);
                });
        };

        self.getEmployeeForFollowupEmployeeSentItems();

        /**
         * @description Opens the search dialog for followup employee sent items search
         */
        self.openFilterDialog = function ($event) {
            if (self.grid.searchText) {
                self.searchCriteria.docSubject = self.grid.searchText;
            }
            userSentItemService
                .controllerMethod.openFilterDialog(self.grid, self.searchCriteria, self.selectedEmployee, self.selectedOrganization)
                .then(function (result) {
                    self.grid.page = 1;
                    self.grid.searchText = '';
                    self.followupEmployeeSentItems = result.result.records;
                    // if criteria is returned in result, means filter is used. otherwise, filter is reset
                    if (result.criteria) {
                        // when filter is used, the total count is number of items returned.
                        self.totalRecords = result.result.count;
                        self.searchCriteriaUsed = true;
                        self.searchCriteria = result.criteria;
                    } else {
                        // when filter is reset, use the total count from service as total records
                        self.totalRecords = followupEmployeeInboxService.followupSentItemsTotalCount;
                        self.searchCriteriaUsed = false;
                        _initEventHistoryCriteria();
                    }
                })
                .catch(function (error) {
                    if (error && error.hasOwnProperty('error') && error.error === 'serverError') {
                        self.grid.page = 1;
                        self.grid.searchText = '';
                        self.searchCriteriaUsed = true;
                        self.searchCriteria = error.criteria;
                        self.userSentItems = [];
                        self.totalRecords = 0;
                    }
                });
        };

        self.resetFilter = function ($event) {
            self.grid.page = 1;
            self.grid.searchText = '';
            _initEventHistoryCriteria();
            self.searchCriteriaUsed = false;

            self.reloadFollowupEmployeeSentItems(self.grid.page);
        };


        self.shortcutActions = gridService.getShortcutActions(self.gridActions);
        self.contextMenuActions = gridService.getContextMenuActions(self.gridActions);

    });
};