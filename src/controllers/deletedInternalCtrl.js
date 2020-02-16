module.exports = function (app) {
    app.controller('deletedInternalCtrl', function (contextHelpService,
                                                    gridService,
                                                    deletedInternals,
                                                    $filter,
                                                    employeeService,
                                                    langService,
                                                    dialog,
                                                    $q,
                                                    _,
                                                    generator,
                                                    ResolveDefer,
                                                    printService,
                                                    viewTrackingSheetService,
                                                    correspondenceService) {
        'ngInject';
        var self = this;
        self.controllerName = 'deletedInternalCtrl';

        contextHelpService.setHelpTo('deleted-internal');

        self.deletedInternals = deletedInternals;
        self.deletedInternalsCopy = angular.copy(self.deletedInternals);
        self.selectedDeletedInternals = [];

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
            correspondence.viewFromQueue(self.gridActions, 'deletedInternal', $event, true)
                .then(function () {
                    return self.reloadDeletedInternals(self.grid.page);
                })
                .catch(function (error) {
                    return self.reloadDeletedInternals(self.grid.page);
                });
        };

        /**
         * @description Preview document
         * @param deletedInternal
         * @param $event
         */
        self.previewDocument = function (deletedInternal, $event) {
            if (!deletedInternal.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(deletedInternal, self.gridActions, true, true, null, null, null, true)
                .then(function () {
                    return self.reloadDeletedInternals(self.grid.page);
                })
                .catch(function () {
                    return self.reloadDeletedInternals(self.grid.page);
                });
        };
        /**
         * @description Archive the deleted internal item
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.archive = function (correspondence, $event, defer) {
            correspondence.archiveDocument($event)
                .then(function () {
                    self.reloadDeletedInternals(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Archive for selected deleted internal correspondence
         * @param $event
         */
        self.archiveBulk = function ($event) {
            correspondenceService
                .archiveBulkCorrespondences(self.selectedDeletedInternals, $event)
                .then(function () {
                    self.reloadDeletedInternals(self.grid.page);
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
                        gridName: 'deleted-internal-documents'
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
            // View Tracking Sheet (with sub menu)
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view_tracking_sheet',
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: function (action, model) {
                    return true;
                },
                subMenu: viewTrackingSheetService.getViewTrackingSheetOptions('grid', gridService.grids.internal.deleted)
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
                params: ['view_tracking_sheet', 'tabs', gridService.grids.internal.deleted]
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
                    return model.hasContent();
                }
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
            self.deletedInternals = $filter('orderBy')(self.deletedInternals, self.grid.order);
        };


        /**
         * @description Reload the grid of deleted internal email
         * @param pageNumber
         * @return {*|Promise<>}
         */
        self.reloadDeletedInternals = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return correspondenceService
                .loadDeletedDocumentsByDocumentClass('internal')
                .then(function (result) {
                    self.deletedInternals = result;
                    self.deletedInternalsCopy = angular.copy(self.deletedInternals);
                    self.selectedDeletedInternals = [];
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
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.internal.deleted) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order,
            limitOptions: gridService.getGridLimitOptions(gridService.grids.internal.deleted, self.deletedInternals),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.internal.deleted, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.internal.deleted),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.internal.deleted, self.grid.truncateSubject);
            },
            searchColumns: {
                subject: 'docSubject',
                priorityLevel: function (record) {
                    return self.getSortingKey('priorityLevel', 'Lookup');
                },
                securityLevel: function (record) {
                    return self.getSortingKey('securityLevel', 'Lookup');
                },
                lastModifierInfo: function () {
                    return self.getSortingKey('lastModifierInfo', 'Information');
                },
                lastModified: 'lastModified'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.deletedInternals = gridService.searchGridData(self.grid, self.deletedInternalsCopy);
            }
        };

        self.isSelectedHasContent = function () {
            return _.every(self.selectedDeletedInternals, function (deletedInternal) {
                return deletedInternal.hasContent();
            });
        };

        /**
         * @description Prints the current tab result data
         */
        self.printResult = function ($event) {
            var printTitle = langService.get('menu_item_internal_deleted'),
                headers = [
                    'subject',
                    'priority_level',
                    'security_level',
                    'deleted_by',
                    'deleted_on'
                ];
            printService
                .printData(self.deletedInternals, headers, printTitle);
        };


        self.shortcutActions = gridService.getShortcutActions(self.gridActions);
        self.contextMenuActions = gridService.getContextMenuActions(self.gridActions);

    });
};
