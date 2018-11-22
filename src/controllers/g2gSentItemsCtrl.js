module.exports = function (app) {
    app.controller('g2gSentItemsCtrl', function (lookupService,
                                                 g2gSentItemsService,
                                                 $q,
                                                 $filter,
                                                 langService,
                                                 ResolveDefer,
                                                 toast,
                                                 dialog,
                                                 employeeService,
                                                 generator,
                                                 correspondenceService,
                                                 viewDeliveryReportService,
                                                 gridService) {
        var self = this;

        self.controllerName = 'g2gSentItemsCtrl';

        self.progress = null;

        /**
         * @description All g2g inbox items
         * @type {*}
         */
        self.g2gItems = [];

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
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.g2g.sentItem) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.g2g.sentItem, self.g2gItems),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.g2g.sentItem, limit);
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
            return g2gSentItemsService
                .loadG2gItems(self.selectedMonth, self.selectedYear)
                .then(function (result) {
                    self.g2gItems = result;
                    self.selectedG2gItems = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        var today = new Date();
        self.selectedYear = today.getFullYear();
        self.selectedMonth = today.getMonth() + 1;
        self.getMonthYearForSentItems = function ($event) {
            g2gSentItemsService
                .openDateAndYearDialog(self.selectedMonth, self.selectedYear, $event)
                .then(function (result) {
                    self.selectedMonth = result.month;
                    self.selectedYear = result.year;
                    self.selectedMonthText = angular.copy(result.monthText);
                    self.reloadG2gItems(self.grid.page);
                });
        };
        self.selectedMonthText = generator.months[self.selectedMonth - 1].text;
        self.reloadG2gItems(self.grid.page);
        //self.getMonthYearForSentItems();

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
            g2gItem.viewDocument(self.gridActions, 'g2gSentItem', $event)
                .then(function (result) {
                    self.reloadG2gItems(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadG2gItems(self.grid.page);
                })
        };

        /**
         * @description Recall the sent item
         * @param g2gItem
         * @param $event
         * @param defer
         * @returns {*}
         */
        self.recall = function (g2gItem, $event, defer) {
            return g2gSentItemsService.recallG2G(g2gItem, $event)
                .then(function (result) {
                    new ResolveDefer(defer);
                    if (result) {
                        self.reloadG2gItems(self.grid.page)
                            .then(function () {
                                toast.success(langService.get('recall_success').change({name: g2gItem.getTranslatedName()}));
                            });
                    }
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

        /**
         * @description Check if action will be shown on grid or not
         * @param action
         * @param model
         * @returns {boolean}
         */
        self.checkToShowAction = function (action, model) {
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
            // Document Information
            {
                type: 'action',
                icon: 'information-variant',
                text: 'grid_action_document_info',
                showInView: false,
                subMenu: [
                    {
                        type: 'info',
                        checkShow: self.checkToShowAction,
                        gridName: 'g2g-sent-items'
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
                class: "action-green",
                permissionKey: 'VIEW_DOCUMENT',
                showInView: false,
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
                class: "action-green",
                permissionKey: 'VIEW_DOCUMENT',
                showInView: false,
                checkShow: self.checkToShowAction
            },
            // Recall
            {
                type: 'action',
                icon: 'check',
                text: 'grid_action_recall',
                shortcut: true,
                callback: self.recall,
                class: "action-green",
                //permissionKey: 'VIEW_DOCUMENT',
                showInView: true,
                checkShow: self.checkToShowAction
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
                checkShow: self.checkToShowAction,
                showInView: true
            }
        ];
    });
};