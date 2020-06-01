module.exports = function (app) {
    app.controller('userFollowupBookCtrl', function (folders,
                                                     $q,
                                                     $filter,
                                                     userSubscriptionService,
                                                     langService,
                                                     FollowUpFolder,
                                                     mailNotificationService,
                                                     followUpUserService,
                                                     gridService,
                                                     employeeService,
                                                     dialog,
                                                     viewTrackingSheetService,
                                                     FollowupBookCriteria,
                                                     moment,
                                                     counterService,
                                                     generator,
                                                     configurationService,
                                                     correspondenceService,
                                                     ResolveDefer) {
        'ngInject';
        var self = this;
        self.controllerName = 'userFollowupBookCtrl';

        self.sidebarStatus = false;

        self.followupBooks = [];
        self.followupBooksCopy = angular.copy(self.followupBooks);
        self.selectedFollowupBooks = [];

        self.folders = _prepareFollowupFolders(folders);
        self.selectedFolder = null;

        function _prepareFollowupFolders(folders, showRootFolder) {
            return showRootFolder ? [new FollowUpFolder({
                arName: langService.getKey('followup_folders', 'ar'),
                enName: langService.getKey('followup_folders', 'en'),
                id: 0,
                status: true
            }).setChildren(folders)] : folders;
        }

        /**
         * @description get child records to delete
         * @param folder
         * @param array
         * @returns {*}
         */
        function getChildIds(folder, array) {
            for (var i = 0; i < folder.children.length; i++) {
                array.push(folder.children[i].id);
                getChildIds(folder.children[i], array);
            }
            return array;
        }

        /**
         * @description
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            name: gridService.grids.inbox.userFollowupBook,
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.inbox.userFollowupBook) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.inbox.userFollowupBook, self.workItems),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.inbox.userFollowupBook, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.inbox.userFollowupBook),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.inbox.userFollowupBook, self.grid.truncateSubject);
            },
            searchColumns: {
                serial: 'docFullSerial',
                subject: 'docSubject',
                createdOn: 'docDateString',
                actionDate: 'actionDateString',
                followupDate: 'followupDateString',
                corrSite: function (record) {
                    return self.getSortingKey('mainSiteSubSiteString', 'Information');
                },
                securityLevel: function (record) {
                    return self.getSortingKey('securityLevel', 'Lookup');
                },
                numberOfDays: 'numberOfDays',
                folder: function (record) {
                    return self.getSortingKey('folderInfo', 'Information');
                }
            },
            searchText: '',
            searchCallback: function (grid) {
                self.followupBooks = gridService.searchGridData(self.grid, self.followupBooksCopy);
            }
        };

        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var isEditAllowed = employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES");
            if (checkForViewPopup)
                return !isEditAllowed;
            return isEditAllowed;
        };

        var checkIfEditCorrespondenceSiteAllowed = function (model, checkForViewPopup) {
            var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
            if (checkForViewPopup)
                return !(hasPermission);
            return hasPermission;
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
            self.followupBooks = $filter('orderBy')(self.followupBooks, self.grid.order);
        };

        /**
         * @description reload followup books
         * @param pageNumber
         */
        self.reloadFollowupBooks = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            if (self.searchCriteriaUsed) {
                return followUpUserService.loadUserFollowupBooksByCriteria(null, self.searchCriteria)
                    .then(function (result) {
                        self.followupBooks = result;
                        defer.resolve(true);
                        return result;
                    });
            }

            if (!self.selectedFolder) {
                defer.resolve(true);
                return;
            }

            return followUpUserService
                .loadFollowupFolderContent(self.selectedFolder)
                .then(function (result) {
                    self.followupBooks = result;
                    self.followupBooksCopy = angular.copy(self.followupBooks);
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.selectedFollowupBooks = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return self.followupBooks;
                });
        };

        /**
         * @description get clicked folder content.
         * @param folder
         * @param $event
         * @returns {*}
         */
        self.getFolderContent = function (folder, $event) {
            if (folder.id === 0)
                return;
            self.selectedFolder = folder;
            return self.reloadFollowupBooks(self.grid.page);
        };
        /**
         * @description toggle sidebar folders.
         */
        self.toggleSidebarFolder = function () {
            self.sidebarStatus = !self.sidebarStatus;
        };

        /**
         * @description Reloads the followup folders
         */
        self.reloadFollowupFolders = function () {
            followUpUserService.loadFollowupFolders(true)
                .then(function (result) {
                    self.folders = _prepareFollowupFolders(result);
                });
        };

        self.createFolder = function (folder, $event) {
            followUpUserService
                .controllerMethod
                .followupFolderAdd((folder.id ? folder : null), $event)
                .then(function () {
                    self.reloadFollowupFolders();
                });
        };

        self.editFolder = function (folder, $event) {
            followUpUserService
                .controllerMethod
                .followupFolderEdit(folder, $event)
                .then(function () {
                    self.reloadFollowupFolders();
                });
        };

        self.deleteFolder = function (folder, $event) {
            var array = [folder.id];
            getChildIds(folder, array);
            followUpUserService
                .controllerMethod
                .followupFolderDeleteBulk(array.reverse(), $event)
                .then(function () {
                    self.reloadFollowupFolders();
                });
        };

        /**
         * @description Terminate record
         * @param record
         * @param $event
         * @param defer
         */
        self.terminate = function (record, $event, defer) {
            record.terminate(false, $event).then(function () {
                return self.reloadFollowupBooks(self.grid.page);
            });
        };

        /**
         * @description Terminate folder items Bulk
         * @param $event
         */
        self.terminateBulk = function ($event) {
            followUpUserService.terminateBulkFollowup(self.selectedFollowupBooks).then(function () {
                return self.reloadFollowupBooks(self.grid.page);
            });
        };

        /**
         * @description Moves the record to other folder
         * @param record
         * @param $event
         * @param defer
         */
        self.moveToFolder = function (record, $event, defer) {
            record
                .addToFolder(true, $event)
                .then(function () {
                    self.reloadFollowupBooks(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description move bulk to folder
         * @param $event
         */
        self.moveToFolderBulk = function ($event) {
            return followUpUserService
                .showAddBulkFollowupBooksToFolder(self.selectedFollowupBooks, true, $event)
                .then(function () {
                    self.reloadFollowupBooks(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
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
            correspondenceService
                .viewCorrespondence(record, [], checkIfEditPropertiesAllowed(record, true), false)
                .then(function () {
                    return self.reloadFollowupBooks(self.grid.page);
                })
                .catch(function () {
                    return self.reloadFollowupBooks(self.grid.page);
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
            record.viewFromQueue(self.gridActions, 'search' + generator.ucFirst(record.getInfo().documentClass), $event)
                .then(function () {
                    return self.reloadFollowupBooks(self.grid.page);
                })
                .catch(function () {
                    return self.reloadFollowupBooks(self.grid.page);
                });
        };

        /**
         * @description View Tracking Sheet
         * @param record
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (record, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(record, params, $event);
        };

        /**
         * @description Manage Comments
         * @param record
         * @param $event
         */
        self.manageComments = function (record, $event) {
            record.manageDocumentComments($event)
                .then(function () {
                    return self.reloadFollowupBooks(self.grid.page);
                })
                .catch(function (e) {
                    return self.reloadFollowupBooks(self.grid.page);
                });
        };

        /**
         * @description Subscribe
         * @param record
         * @param $event
         */
        self.subscribe = function (record, $event) {
            userSubscriptionService.controllerMethod.openAddSubscriptionDialog(record, $event);
        };

        self.printResult = function ($event) {
            if (!self.searchCriteriaUsed) {
                self.searchCriteriaCopy.folderId = self.selectedFolder.id
            }

            followUpUserService.setFollowupReportHeading(self.searchCriteriaUsed, self.searchCriteriaCopy, (self.selectedFolder ? self.selectedFolder.getTranslatedName() : null))
                .then(function (heading) {
                    followUpUserService.printUserFollowupFromWebPage(heading, self.searchCriteriaCopy);
                });
        };

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
                        gridName: 'user-followup-book'
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
                            //If no content, hide the button
                            return model.hasContent();
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
            // Terminate
            {
                type: 'action',
                icon: 'stop',
                text: 'grid_action_terminate',
                shortcut: true,
                callback: self.terminate,
                class: "action-green",
                sticky: true,
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Move To Folder
            {
                type: 'action',
                icon: 'folder-move',
                text: 'grid_action_move_to_folder',
                shortcut: true,
                showInView: true,
                callback: self.moveToFolder,
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Subscribe
            {
                type: 'action',
                icon: 'bell-plus',
                text: 'grid_action_subscribe',
                shortcut: false,
                callback: self.subscribe,
                class: "action-red",
                checkShow: function (action, model) {
                    return true;
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
                subMenu: viewTrackingSheetService.getViewTrackingSheetOptions('grid', gridService.grids.inbox.userFollowupBook)
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
                params: ['view_tracking_sheet', 'tabs', gridService.grids.inbox.userFollowupBook]
            },
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                shortcut: false,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                showInView: false,
                permissionKey: [
                    "MANAGE_DOCUMENT’S_COMMENTS"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // Comments
                    {
                        type: 'action',
                        icon: 'comment',
                        text: 'grid_action_comments',
                        shortcut: false,
                        permissionKey: "MANAGE_DOCUMENT’S_COMMENTS",
                        callback: self.manageComments,
                        class: "action-green",
                        sticky: true,
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            }
        ];
        self.shortcutActions = gridService.getShortcutActions(self.gridActions);
        self.contextMenuActions = gridService.getContextMenuActions(self.gridActions);

        /**
         * @description Opens the search dialog for books
         */
        self.openFilterDialog = function ($event) {
            if (self.grid.searchText) {
                self.searchCriteria.docSubject = self.grid.searchText;
            }
            followUpUserService
                .controllerMethod.openFilterDialog(self.grid, self.searchCriteria)
                .then(function (result) {
                    self.selectedFolder = null;
                    self.grid.page = 1;
                    self.grid.searchText = '';
                    self.followupBooks = result.result;
                    // if criteria is returned in result, means filter is used. otherwise, filter is reset
                    if (result.criteria) {
                        self.searchCriteriaUsed = true;
                        self.searchCriteria = result.criteria;
                        self.searchCriteriaCopy = angular.copy(result.criteria);
                    } else {
                        self.searchCriteriaUsed = false;
                        _initSearchCriteria();
                        self.toggleSidebarFolder();
                    }
                })
                .catch(function (error) {
                    if (error && error.hasOwnProperty('error') && error.error === 'serverError') {
                        self.selectedFolder = null;
                        self.grid.page = 1;
                        self.grid.searchText = '';
                        self.searchCriteriaUsed = true;
                        self.searchCriteria = error.criteria;
                        self.followupBooks = [];
                    }
                });
        };

        self.resetFilter = function ($event) {
            self.grid.page = 1;
            self.grid.searchText = '';
            _initSearchCriteria();
            self.searchCriteriaUsed = false;

            self.followupBooks = [];
            self.selectedFolder = null;

            self.toggleSidebarFolder();
        };


        var _initSearchCriteria = function (skipDates) {
            self.searchCriteria = new FollowupBookCriteria({
                userId: employeeService.getEmployee().id,
                userOUID: employeeService.getEmployee().getOUID()
            });
            self.searchCriteriaCopy = angular.copy(self.searchCriteria);
            if (!skipDates) {
                self.searchCriteria.fromFollowupDate = moment().subtract(configurationService.FOLLOWUP_BOOK_FILTER_START_BEFORE_VALUE, configurationService.FOLLOWUP_BOOK_FILTER_START_BEFORE_TYPE).toDate();
                self.searchCriteria.toFollowupDate = moment(generator.getNextDaysDate(30)).endOf("day").toDate();
            }
        };

        self.searchCriteriaUsed = false;
        self.$onInit = function () {
            self.toggleSidebarFolder();
            _initSearchCriteria();
        };
    });
};
