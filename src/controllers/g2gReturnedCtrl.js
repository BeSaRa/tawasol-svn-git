module.exports = function (app) {
    app.controller('g2gReturnedCtrl', function (lookupService,
                                                g2gReturnedService,
                                                g2gItems,
                                                $q,
                                                $filter,
                                                langService,
                                                toast,
                                                $state,
                                                dialog,
                                                ResolveDefer,
                                                correspondenceStorageService,
                                                contextHelpService,
                                                counterService,
                                                employeeService,
                                                generator,
                                                correspondenceService,
                                                viewDeliveryReportService,
                                                gridService) {
        var self = this;

        self.controllerName = 'g2gReturnedCtrl';
        contextHelpService.setHelpTo('returned-g2g');
        counterService.loadG2GCounters();
        self.progress = null;

        /**
         * @description All g2g inbox items
         * @type {*}
         */
        self.g2gItems = g2gItems;

        /**
         * @description Contains the selected g2g inbox items
         * @type {Array}
         */
        self.selectedG2gItems = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.g2g.returned) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.g2g.returned, self.g2gItems),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.g2g.returned, limit);
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

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.g2gItems = $filter('orderBy')(self.g2gItems, self.grid.order);
        };

        /**
         * @description Reload the grid of g2g inbox item
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadG2gItems = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return g2gReturnedService
                .loadG2gItems()
                .then(function (result) {
                    self.g2gItems = result;
                    self.selectedG2gItems = [];
                    defer.resolve(true);
                    counterService.loadG2GCounters();
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Preview document
         * @param g2gItem
         * @param $event
         */
        self.previewDocument = function (g2gItem, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            return correspondenceService.viewCorrespondenceG2G(g2gItem, self.gridActions, 'G2GMessagingHistory', $event)
                .then(function (result) {
                    self.reloadG2gItems(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadG2gItems(self.grid.page);
                })
        };

        /**
         * @description View document
         * @param g2gItem
         * @param $event
         */
        self.viewDocument = function (g2gItem, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            g2gItem.viewDocument(self.gridActions, 'g2gReturned', $event)
                .then(function (result) {
                    self.reloadG2gItems(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadG2gItems(self.grid.page);
                })
        };

        /**
         * @description Resend the document
         * @param g2gItem
         * @param $event
         * @param defer
         * @returns {*}
         */
        self.resend = function (g2gItem, $event, defer) {
            return g2gItem
                .resendG2GItem($event)
                .then(function (result) {
                    if (result) {
                        new ResolveDefer(defer);
                        self.reloadG2gItems(self.grid.page)
                            .then(function () {
                                toast.success(langService.get('resend_specific_success').change({name: g2gItem.getTranslatedName()}));
                            });
                    }
                })
        };

        /**
         * @description Terminate the document
         * @param g2gItem
         * @param $event
         * @param defer
         * @returns {*}
         */
        self.terminate = function (g2gItem, $event, defer) {
            return g2gReturnedService.terminateG2G(g2gItem)
                .then(function (result) {
                    new ResolveDefer(defer);
                    self.reloadG2gItems(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('terminate_success'));
                        });
                })
        };

        /**
         * @description View Delivery Report
         * @param g2gItem
         * @param $event
         * @returns {*}
         */
        self.viewDeliveryReport = function (g2gItem, $event) {
            return viewDeliveryReportService.viewDeliveryReport(g2gItem, $event);
        };

        self.g2gEditAfterReturn = function (g2gMessagingHistory, $event) {
            var action = 'editAfterReturnFromG2G';

            correspondenceService
                .editAfterReturnFromG2G(g2gMessagingHistory)
                .then(function (correspondence) {
                    correspondenceStorageService.storeCorrespondence(action, correspondence);
                    // $state.go('app.outgoing.add', {
                    //     vsId: g2gMessagingHistory.refDocId,
                    //     action: action
                    // });
                })
                .catch(function () {
                    dialog.errorMessage(langService.get('error_messages'));
                });
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
                showInView: false,
                subMenu: [
                    {
                        type: 'info',
                        checkShow: function (action, model) {
                            return true;
                        },
                        gridName: 'g2g-returned'
                    }
                ],
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
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
                    'VIEW_DOCUMENT'
                ],
                checkAnyPermission: true,
                checkShow: function (action, model) {
                    return true;
                },
                subMenu: [
                    // Preview
                    {
                        type: 'action',
                        icon: 'book-open-variant',
                        text: 'grid_action_preview_document',
                        shortcut: true,
                        callback: self.previewDocument,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        showInView: false,
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Open
                    {
                        type: 'action',
                        icon: 'book-open-page-variant',
                        text: 'grid_action_open',
                        shortcut: true,
                        callback: self.viewDocument,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        showInView: false,
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
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
            // Resend
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_resend',
                shortcut: true,
                callback: self.resend,
                class: "action-green",
                //permissionKey: 'VIEW_DOCUMENT',
                showInView: true,
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Terminate
            {
                type: 'action',
                icon: 'stop',
                text: 'grid_action_terminate',
                shortcut: true,
                callback: self.terminate,
                class: "action-green",
                //permissionKey: 'VIEW_DOCUMENT',
                showInView: true,
                checkShow: function (action, model) {
                    return true;
                }
            },
            // View Delivery Report
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view_delivery_report',
                shortcut: true,
                callback: self.viewDeliveryReport,
                class: "action-green",
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: function (action, model) {
                    return true;
                },
                showInView: true
            },
            // Terminate
            {
                type: 'action',
                icon: 'stop',
                text: 'grid_action_terminate',
                callback: self.g2gEditAfterReturn,
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
                }
            }
        ];

        self.shortcutActions = gridService.getShortcutActions(self.gridActions);
        self.contextMenuActions = gridService.getContextMenuActions(self.gridActions);
    });
};
