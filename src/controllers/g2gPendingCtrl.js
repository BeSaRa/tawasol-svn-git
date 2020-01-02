module.exports = function (app) {
    app.controller('g2gPendingCtrl', function (lookupService,
                                               g2gPendingService,
                                               g2gItems,
                                               $q,
                                               $filter,
                                               langService,
                                               counterService,
                                               toast,
                                               dialog,
                                               employeeService,
                                               localStorageService,
                                               generator,
                                               contextHelpService,
                                               correspondenceService,
                                               mailNotificationService,
                                               ResolveDefer,
                                               $state,
                                               gridService,
                                               cmsTemplate) {
        'ngInject';
        var self = this;

        self.controllerName = 'g2gPendingCtrl';
        contextHelpService.setHelpTo('pending_g2g');
        counterService.loadG2GCounters();
        self.docClassName = 'outgoing';
        /**
         * @description All g2g inbox items
         * @type {*}
         */
        self.g2gItems = g2gItems;
        self.g2gItemsCopy = angular.copy(self.g2gItems);

        /**
         * @description Contains the selected g2g inbox items
         * @type {Array}
         */
        self.selectedG2gItems = [];

        self.resetCriteria = function () {
            self.filterCriteria = {
                dateFrom: null,
                dateTo: null,
                mainSiteTo: null
            };
        };
        self.resetCriteria();

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.g2gPending) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.g2gPending, self.g2gItems),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.g2gPending, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.administration.g2gPending),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.administration.g2gPending, self.grid.truncateSubject);
            },
            searchColumns: {
                serial: 'docFullSerial',
                subject: 'docSubject',
                type: 'typeOriginalCopy',
                actionBy: function (record) {
                    return self.getSortingKey('sentByIdInfo', 'SenderInfo');
                },
                mainSiteFrom: function (record) {
                    return self.getSortingKey('mainSiteFromIdInfo', 'CorrespondenceSite')
                },
                mainSiteTo: function (record) {
                    return self.getSortingKey('mainSiteToIdInfo', 'CorrespondenceSite')
                },
                subSiteFrom: function (record) {
                    return self.getSortingKey('subSiteFromIdInfo', 'CorrespondenceSite')
                },
                subSiteTo: function (record) {
                    return self.getSortingKey('subSiteToIdInfo', 'CorrespondenceSite')
                },
                numberOfDays: 'numberOfDays'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.g2gItems = gridService.searchGridData(self.grid, self.g2gItemsCopy);
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
        self.reloadG2GPendingItems = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return g2gPendingService.loadG2gPendingItems(self.filterCriteria)
                .then(function (result) {
                    self.g2gItems = result;
                    self.g2gItemsCopy = angular.copy(self.g2gItems);
                    self.selectedG2gItems = [];
                    counterService.loadG2GCounters();
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Opens the filter dialog to select date range and main site
         * @param $event
         */
        self.filterDialog = function ($event) {
            g2gPendingService.openFilterDialog(self.filterCriteria)
                .then(function (criteria) {
                    self.filterCriteria = criteria;
                    self.reloadG2GPendingItems(1);
                })
        };

        /**
         * @description Export bulk pending g2g items
         * @param $event
         * @returns {boolean}
         */
        self.exportBulk = function ($event) {
            if (!self.selectedG2gItems || !self.selectedG2gItems.length){
                return false;
            }
            g2gPendingService.exportPendingBooks(self.selectedG2gItems)
                .then(function (result) {
                    self.reloadG2GPendingItems(1)
                        .then(function () {
                            toast.success(langService.get('export_success'));
                        });
                })
        };

        /**
         * @description Preview document
         * @param record
         * @param $event
         */
        self.previewDocument = function (record, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            correspondenceService.viewCorrespondenceWorkItem(record.getInfo(), self.gridActions, true, true, true, false, false, true)
                .then(function () {
                    return self.reloadG2GPendingItems(self.grid.page);
                })
                .catch(function (error) {
                    return self.reloadG2GPendingItems(self.grid.page);
                });
        };

        /**
         * @description View document
         * @param record
         * @param $event
         */
        self.viewDocument = function (record, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            self.recordCopy = angular.copy(record);
            record.viewNewG2GPendingItem(self.gridActions, 'g2gPending', $event)
                .then(function () {
                    self.recordCopy = null;
                    self.reloadG2GPendingItems(self.grid.page);
                })
                .catch(function () {
                    self.recordCopy = null;
                    self.reloadG2GPendingItems(self.grid.page);
                });
        };

        self.getExceptionMessage = function (model, $event) {
            if (self.recordCopy){
                g2gPendingService.openExceptionDialog(self.recordCopy, $event);
            }else {
                g2gPendingService.openExceptionDialog(model, $event);
            }
        };

        /**
         * @description Export pending g2g items
         */
        self.exportG2gItem = function (model, $event) {
            g2gPendingService.exportPendingBooks(model)
                .then(function (result) {
                    self.reloadG2GPendingItems(1)
                        .then(function () {
                            toast.success(langService.get('export_success'));
                        });
                })
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
                        gridName: 'g2g-incoming'
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
                class: "action-green",
                showInView: false,
                permissionKey: [
                    'VIEW_DOCUMENT'
                ],
                checkAnyPermission: true,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                subMenu: [
                    // Open
                    {
                        type: 'action',
                        icon: 'book-open-page-variant',
                        text: 'grid_action_open',
                        shortcut: true,
                        callback: self.viewDocument,
                        class: "action-green",
                        showInView: false,
                        permissionKey: 'VIEW_DOCUMENT',
                        checkShow: function (action, model) {
                            return true;
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
            // Error
            {
                type: 'action',
                icon: 'message-alert-outline',
                text: 'error_message',
                callback: self.getExceptionMessage,
                class: "action-green",
                shortcut: true,
                checkShow: function (action, model) {
                    if (action.actionFrom === gridService.gridActionOptions.location.popup) {
                        return !!self.recordCopy.exception;
                    }
                    return !!model.exception;
                }
            },
            // Export
            {
                type: 'action',
                icon: 'export',
                text: 'grid_action_export',
                callback: self.exportG2gItem,
                class: "action-green",
                sticky: true,
                shortcut: true,
                checkShow: function (action, model) {
                    return true;
                }
            }
        ];

        self.shortcutActions = gridService.getShortcutActions(self.gridActions);
        self.contextMenuActions = gridService.getContextMenuActions(self.gridActions);
    });
};
