module.exports = function (app) {
    app.controller('returnedCentralArchiveCtrl', function (contextHelpService,
                                                           gridService,
                                                           $filter,
                                                           langService,
                                                           returnedArchiveItems,
                                                           dialog,
                                                           $q,
                                                           _,
                                                           counterService,
                                                           generator,
                                                           ResolveDefer,
                                                           viewTrackingSheetService,
                                                           employeeService,
                                                           managerService,
                                                           rootEntity,
                                                           correspondenceService) {
        'ngInject';
        var self = this;
        self.controllerName = 'returnedCentralArchiveCtrl';

        contextHelpService.setHelpTo('returned-central-archive');

        self.returnedArchiveItems = returnedArchiveItems;
        self.returnedArchiveItemsCopy = angular.copy(self.returnedArchiveItems);
        self.selectedReturnedArchiveItems = [];
        self.employeeService = employeeService;

        /**
         * @description View document
         * @param correspondence
         * @param $event
         */
        self.viewDocument = function (correspondence, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            correspondence
                .viewReturnedCentralArchiveDocument(self.gridActions, 'returnedCentralArchive', $event, false, function () {
                    self.reloadReturnedCentralArchive(self.grid.page);
                })
                .then(function () {
                    return self.reloadReturnedCentralArchive(self.grid.page);
                })
                .catch(function (error) {
                    return self.reloadReturnedCentralArchive(self.grid.page);
                });
        };

        /**
         * @description Preview document
         * @param correspondence
         * @param $event
         */
        self.previewDocument = function (correspondence, $event) {
            if (!correspondence.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(correspondence, self.gridActions, true)
                .then(function () {
                    return self.reloadReturnedCentralArchive(self.grid.page);
                })
                .catch(function () {
                    return self.reloadReturnedCentralArchive(self.grid.page);
                });
        };


        /**
         * @description View Tracking Sheet
         * @param correspondence
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (correspondence, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(correspondence, params, $event)
                .then(function (result) {

                });
        };

        /**
         * @description Forward
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.forward = function (correspondence, $event, defer) {
            var defaultTab = 'favorites';
            if (correspondence && correspondence.hasContent()) {
                defaultTab = {
                    tab: 'registry_organizations',
                    registryOU: correspondence.registryOU,
                    ou: correspondence.ou || correspondence.registryOU
                }
            }
            correspondence.launchWorkFlow($event, 'forward', defaultTab)
                .then(function () {
                    self.reloadReturnedCentralArchive(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Archive the returned item
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.archive = function (correspondence, $event, defer) {
            correspondence.archiveDocument($event)
                .then(function () {
                    self.reloadReturnedCentralArchive(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Archive for selected returned correspondence
         * @param $event
         */
        self.archiveBulk = function ($event) {
            correspondenceService
                .archiveBulkCorrespondences(self.selectedReturnedArchiveItems, $event)
                .then(function () {
                    self.reloadReturnedCentralArchive(self.grid.page);
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
                shortcut: false,
                showInView: false,
                subMenu: [
                    {
                        type: 'info',
                        checkShow: function (action, model) {
                            return true;
                        },
                        gridName: 'returned-central-archive'
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
                permissionKey: 'VIEW_DOCUMENT',
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
                        shortcut: false,
                        callback: self.previewDocument,
                        class: "action-green",
                        showInView: false,
                        permissionKey: 'VIEW_DOCUMENT',
                        checkShow: function (action, model) {
                            //If no content, hide the button
                            return model.hasContent();
                        }
                    },
                    // Open
                    {
                        type: 'action',
                        icon: 'book-open-page-variant',
                        text: 'grid_action_open',
                        shortcut: false,
                        callback: self.viewDocument,
                        class: "action-green",
                        showInView: false,
                        permissionKey: 'VIEW_DOCUMENT',
                        checkShow: function (action, model) {
                            //If no content, hide the button
                            return model.hasContent();
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
            // Forward
            {
                type: 'action',
                icon: 'share',
                text: 'grid_action_forward',
                shortcut: true,
                sticky: true,
                callback: self.forward,
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Archive
            {
                type: 'action',
                icon: 'archive',
                text: 'grid_action_archive',
                shortcut: true,
                callback: self.archive,
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
                }
            },
            // View Tracking Sheet (with sub menu)
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view_tracking_sheet',
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: function (action, model) {
                    return true;
                },
                subMenu: viewTrackingSheetService.getViewTrackingSheetOptions('grid', gridService.grids.centralArchive.returned)
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
                params: ['view_tracking_sheet', 'tabs', gridService.grids.centralArchive.returned]
            }];

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
            self.returnedArchiveItems = $filter('orderBy')(self.returnedArchiveItems, self.grid.order);
        };


        /**
         * @description Reload the grid of returned central archive items
         * @param pageNumber
         * @return {*|Promise<>}
         */
        self.reloadReturnedCentralArchive = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return correspondenceService
                .loadReturnedCentralArchive()
                .then(function (result) {
                    counterService.loadCounters();
                    self.returnedArchiveItems = result;
                    self.returnedArchiveItems = angular.copy(self.returnedArchiveItems);
                    self.selectedReturnedArchiveItems = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };


        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.centralArchive.returned) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order,
            limitOptions: gridService.getGridLimitOptions(gridService.grids.centralArchive.returned, self.returnedArchiveItems),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.centralArchive.returned, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.centralArchive.returned),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.centralArchive.returned, self.grid.truncateSubject);
            },
            searchColumns: {
                subject: 'docSubject',
                priorityLevel: function (record) {
                    return self.getSortingKey('priorityLevel', 'Lookup');
                },
                securityLevel: function (record) {
                    return self.getSortingKey('securityLevel', 'Lookup');
                },
                creator: function () {
                    return self.getSortingKey('creatorInfo', 'Information');
                },
                createdOn: 'createdOn'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.returnedArchiveItems = gridService.searchGridData(self.grid, self.returnedArchiveItemsCopy);
            }
        };

        self.shortcutActions = gridService.getShortcutActions(self.gridActions);
        self.contextMenuActions = gridService.getContextMenuActions(self.gridActions);

    });
};
