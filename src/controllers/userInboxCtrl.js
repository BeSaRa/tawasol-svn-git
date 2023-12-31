module.exports = function (app) {
    app.controller('userInboxCtrl', function (_,
                                              lookupService,
                                              userInboxService,
                                              $scope,
                                              userInboxes,
                                              $filter,
                                              errorCode,
                                              $timeout,
                                              sidebarService,
                                              ResolveDefer,
                                              generator,
                                              authenticationService,
                                              userFilterService,
                                              $stateParams,
                                              correspondenceService,
                                              // userFilters,
                                              $state,
                                              ignoreReload,
                                              counterService,
                                              $q,
                                              $rootScope,
                                              $mdMedia,
                                              langService,
                                              toast,
                                              dialog,
                                              rootEntity,
                                              viewDocumentService,
                                              managerService,
                                              $window,
                                              tokenService,
                                              contextHelpService,
                                              userFolderService,
                                              readyToExportService,
                                              viewTrackingSheetService,
                                              downloadService,
                                              employeeService,
                                              favoriteDocumentsService,
                                              Information,
                                              mailNotificationService,
                                              UserSubscription,
                                              userSubscriptionService,
                                              fromNotification,
                                              //emailItem,
                                              gridService,
                                              WorkItem,
                                              configurationService,
                                              sequentialWorkflowService,
                                              printService) {
        'ngInject';
        var self = this;
        self.controllerName = 'userInboxCtrl';
        self.employeeService = employeeService;
        self.employee = self.employeeService.getEmployee();

        self.excludeMe = fromNotification;
        contextHelpService.setHelpTo('user-inbox', self.excludeMe);
        var timeoutRefresh = false;
        var gridSearchColumns = {
            serial: 'generalStepElm.docFullSerial',
            subject: 'generalStepElm.docSubject',
            receivedDateTime: 'receivedDateTime',
            action: function (record) {
                return self.getSortingKey('action', 'WorkflowAction');
            },
            sender: function (record) {
                return self.getSortingKey('senderInfo', 'SenderInfo');
            },
            dueDate: 'generalStepElm.dueDate',
            corrSite: function (record) {
                return self.getSortingKey('mainSiteSubSiteString', 'Information');
            }
        };

        self.langService = langService;
        self.isUserInboxCtrl = true; // true for userInboxCtrl, false for documentsNotifyDirectiveCtrl to avoid auto-refresh of grid from documentsNotifyDirectiveCtrl

        self.selectedTab = 0;
        self.selectedGridType = 'inbox';
        self.psPDFViewerEnabled = rootEntity.hasPSPDFViewer();
        self.isInternalOutgoingEnabled = rootEntity.isInternalOutgoingEnabled();

        self.searchMode = false;
        self.searchModel = '';


        /**
         * @description All user inboxes
         * @type {*}
         */
        self.userInboxes = userInboxes;
        self.userInboxesCopy = angular.copy(self.userInboxes);
        self.totalRecords = userInboxService.totalCount;

        self.starredUserInboxes = []; //_.filter(self.userInboxes, 'generalStepElm.starred');
        self.starredUserInboxesCopy = [];// angular.copy(self.starredUserInboxes);
        self.totalRecordsStarred = userInboxService.starredTotalCount;
        //self.userFolders = userFolders;


        /**
         * @description Contains methods for Star operations for user inbox items
         */
        self.starServices = {
            'false': userInboxService.controllerMethod.userInboxStar,
            'true': userInboxService.controllerMethod.userInboxUnStar,
            'starBulk': correspondenceService.starBulkWorkItems,
            'unStarBulk': correspondenceService.unStarBulkWorkItems
        };

        /**
         * @description Contains the selected user inboxes
         * @type {Array}
         */
        // self.selectedUserInboxes = _.map(self.userInboxes, function (item) {
        //     return item;
        // });
        self.selectedUserInboxes = [];
        self.globalSetting = rootEntity.returnRootEntity().settings;

        function _getWorkflowName(model) {
            return model.getInfo().documentClass;
        }

        self.getSelectedInboxGrid = function () {
            var tabs = {
                'inbox': self.userInboxes,
                'starred': self.starredUserInboxes,
                'filter': self.selectedFilter ? self.workItemsFilters[self.selectedFilter.index] : []
            };

            return tabs[self.selectedGridType]
        }

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
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            name: 'inboxGrid',
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.inbox.userInbox) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.inbox.userInbox, self.totalRecords),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.inbox.userInbox, limit);
                self.reloadUserInboxes(page, false, true, true);
            },
            searchColumns: gridSearchColumns,
            searchText: '',
            searchCallback: function (grid) {
                self.userInboxes = gridService.searchGridData(self.grid, self.userInboxesCopy);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.inbox.userInbox),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.inbox.userInbox, self.grid.truncateSubject);
            },
            selectRowsCallback: function () {
                var tableName = self.employee.viewInboxAsGrid ? 'inbox' : 'magazineInbox';
                generator.selectedRowsHandler(self.selectedUserInboxes, tableName, 'generalStepElm.workObjectNumber', !self.employee.viewInboxAsGrid);
            }
        };

        self.starredGrid = {
            name: 'starredGrid',
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.inbox.starred) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.inbox.starred, self.totalRecordsStarred),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.inbox.starred, limit);
                self.reloadUserInboxes(page, false, true, true);
            },
            searchColumns: gridSearchColumns,
            searchText: '',
            searchCallback: function (grid) {
                self.starredUserInboxes = gridService.searchGridData(self.starredGrid, self.starredUserInboxesCopy);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.inbox.starred),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.inbox.starred, self.starredGrid.truncateSubject);
            },
            selectRowsCallback: function () {
                var tableName = self.employee.viewInboxAsGrid ? 'starred' : 'magazineStarred';
                generator.selectedRowsHandler(self.selectedUserInboxes, tableName, 'generalStepElm.workObjectNumber', !self.employee.viewInboxAsGrid);
            }
        };

        self.fixedTabsCount = 1;

        self.showStarred = false;

        self.toggleStarredTab = function ($event) {
            //self.showStarred = !self.showStarred;
            if (self.showStarred) {
                self.fixedTabsCount = 2;
                ++self.selectedTab;
            } else if (self.selectedGridType !== 'inbox') {
                self.fixedTabsCount = 1;
                --self.selectedTab;
            }

            return self.showStarred;
        };

        self.openSidebarFilter = function () {
            self.sidebarFilter = !self.sidebarFilter;
        };

        self.filterGrid = [];

        //   self.userFilters = $filter('orderBy')(userFilters, 'sortOptionId');

        self.workItemsFilters = [];
        self.workItemsFiltersCopy = [];

        self.selectedFilter = null;

        // just for start
        function _prepareFilters() {
            self.filterGrid = [];
            // self.workItemsFilters = new Array(self.userFilters.length);
            // self.workItemsFiltersCopy = new Array(self.userFilters.length);
            for (var i = 0; i < self.userFilters.length; i++) {
                self.filterGrid.push({
                    name: 'filterGrid_' + i,
                    progress: null,
                    limit: gridService.getGridPagingLimitByGridName(gridService.grids.inbox.inboxFilter) || 5, //self.globalSetting.searchAmount, // default limit
                    page: 1, // first page
                    order: '', // default sorting order
                    limitOptions: gridService.getGridLimitOptions(gridService.grids.inbox.inboxFilter),
                    pagingCallback: function (page, limit) {
                        gridService.setGridPagingLimitByGridName(gridService.grids.inbox.inboxFilter, limit);
                    },
                    filterIndex: i,
                    searchColumns: gridSearchColumns,
                    searchText: '',
                    searchCallback: function (grid) {
                        self.workItemsFilters[grid.filterIndex] = gridService.searchGridData(grid, self.workItemsFiltersCopy[grid.filterIndex]);
                    },
                    truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.inbox.inboxFilter),
                    setTruncateSubject: function ($event) {
                        // using first filter grid because all filter grids will use same value for truncate
                        gridService.setGridSubjectTruncateByGridName(gridService.grids.inbox.inboxFilter, self.filterGrid[0].truncateSubject);
                    }
                });
            }
        }

        //  _prepareFilters();

        /**
         * @description create filter
         * @param $event
         * @returns {promise|*}
         */
        self.userFilterCreate = function ($event) {
            return userFilterService
                .createUserFilterDialog($event)
                .then(function (filter) {
                    userFilterService.loadUserFilters().then(function (result) {
                        self.userFilters = result;
                        self.userFilters = $filter('orderBy')(self.userFilters, 'sortOptionId');
                        self.selectFilter(filter, _getFilterIndex(filter));
                    })
                });
        };

        function _getFilterIndex(userFilter) {
            return _.findIndex(self.userFilters, function (filter) {
                return userFilter.id === filter.id;
            });
        }

        var _updateFilterProperties = function (originalFilter, updatedFilter, properties) {
            _.map(self.userFilters, function (userFilter) {
                if (userFilter.id === originalFilter.id) {
                    for (var i = 0; i < properties.length; i++) {
                        userFilter[properties[i]] = updatedFilter[properties[i]];
                    }
                }
                return userFilter;
            })
        };

        /**
         * @description edit filter.
         * @param filterToUpdate
         * @param $index
         * @param $event
         * @returns {*}
         */
        self.userFilterEdit = function (filterToUpdate, $index, $event) {
            // load filter from server to get latest values of all keys.
            return userFilterService.loadUserFilterById(filterToUpdate)
                .then(function (filter) {
                    return userFilterService.editUserFilterDialog(filter, $event).then(function (result) {
                        // self.userFilters[_getFilterIndex(result)] = result;
                        _updateFilterProperties(filter, result, ['sortOptionId', 'arName', 'enName', 'status']);
                        self.userFilters = $filter('orderBy')(self.userFilters, 'sortOptionId');

                        if (self.selectedFilter && self.selectedFilter.filter.id === result.id) {
                            self.selectedFilter.filter = result;
                            self.selectedFilter.index = _getFilterIndex(result);
                        }

                        if (self.selectedFilter)
                            self.selectFilter(self.selectedFilter.filter, self.selectedFilter.index);
                    });
                })
        };
        /**
         * @description delete filter
         * @param filter
         * @param $index
         * @param $event
         */
        self.userFilterDelete = function (filter, $index, $event) {
            return filter.deleteFilter($event).then(function () {
                self.userFilters.splice($index, 1);
                self.filterGrid.splice($index, 1);
                // for updating item order
                userFilterService.loadUserFilters();
            });
        };
        /**
         * @description load filter content
         * @param filter
         * @param $index
         * @param order
         * @param searchText
         */
        self.selectFilter = function (filter, $index, order, searchText) {
            var selectedWorkItemsWobNums = [];
            $timeout(function () {
                self.selectedTab = ($index + self.fixedTabsCount);
            });


            if (self.selectedFilter && self.selectedFilter.filter.id === filter.id && self.selectedUserInboxes.length) {
                selectedWorkItemsWobNums = _.map(self.selectedUserInboxes, 'generalStepElm.workObjectNumber');
            } else {
                self.selectedUserInboxes = [];
            }


            self.selectedFilter = {
                index: $index,
                filter: angular.copy(filter)
            };
            _prepareFilters();
            self.selectedGridType = 'filter';
            if (!filter.status) {
                toast.info(langService.get('filter_disabled_activate_to_get_data'));
                self.workItemsFilters[$index] = [];
                self.workItemsFiltersCopy[$index] = [];
                return false;
            } else {
                correspondenceService.loadWorkItemsByFilterID(filter).then(function (workItems) {
                    self.workItemsFilters[$index] = workItems;
                    self.workItemsFiltersCopy[$index] = workItems;

                    if (selectedWorkItemsWobNums.length) {
                        self.selectedUserInboxes = _.filter(self.workItemsFilters[$index], function (item) {
                            return selectedWorkItemsWobNums.indexOf(item.generalStepElm.workObjectNumber) !== -1;
                        });
                    }
                    if (order) {
                        self.filterGrid[self.selectedFilter.index].order = order;
                        self.getSortedDataForFilter(order);
                    }
                    if (searchText) {
                        self.filterGrid[self.selectedFilter.index].searchText = searchText;
                        self.filterGrid[self.selectedFilter.index].searchCallback(self.filterGrid[self.selectedFilter.index]);
                    }
                });
            }
        };

        self.resetSelectedFilter = function ($index) {
            self.selectedFilter = null;
            self.selectedTab = $index;
            self.selectedUserInboxes = [];
            var selectedGridTypeCopy = angular.copy(self.selectedGridType);
            self.selectedGridType = ($index === 0 ? 'inbox' : 'starred');
            if (self.selectedGridType !== selectedGridTypeCopy) {
                self.searchMode = false;
                self.searchModel = '';
                self.reloadUserInboxes();
            }
        };
        /**
         * @description Replaces the record in grid after update
         * @param record
         */
        self.replaceRecord = function (record) {
            var index = _.findIndex(self.userInboxes, function (userInbox) {
                return userInbox.generalStepElm.vsId === record.generalStepElm.vsId;
            });
            if (index > -1)
                self.userInboxes.splice(index, 1, record);

            var starredIndex = _.findIndex(self.starredUserInboxes, function (starredUserInbox) {
                return starredUserInbox.generalStepElm.vsId === record.generalStepElm.vsId;
            });
            if (starredIndex > -1)
                self.starredUserInboxes.splice(index, 1, record);

            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
        };

        self.getSortedDataForInbox = function (order) {
            order = order ? order : self.grid.order;
            self.userInboxes = $filter('orderBy')(self.userInboxes, order);
        };

        self.getSortedDataForStarred = function (order) {
            order = order ? order : self.starredGrid.order;
            self.starredUserInboxes = $filter('orderBy')(self.starredUserInboxes, order);
        };
        self.getSortedDataForFilter = function (order) {
            if (self.selectedFilter) {
                order = order ? order : self.filterGrid[self.selectedFilter.index].order;
                self.workItemsFilters[self.selectedFilter.index] = $filter('orderBy')(self.workItemsFilters[self.selectedFilter.index], order);
            }
        };

        self.cancelSearchFilter = function () {
            self.searchMode = false;
            self.searchModel = '';
            if (self.selectedGridType === 'starred') {
                self.starredGrid.page = 1;
                self.starredGrid.searchText = '';
            } else {
                self.grid.page = 1;
                self.grid.searchText = '';
            }
            self.reloadUserInboxes(1, false, true);
        }

        self.searchInUserInboxItems = function (searchText) {
            if (!searchText)
                return;
            self.searchMode = true;
            return self.reloadUserInboxes(1, false, true);
        };

        /**
         * @description Reload the grid of user inboxes
         * @param pageNumber
         * @param isAutoReload
         * @param skipCountersReload
         * @param keepSelectedRows
         * @return {*|Promise<WorkItem>}
         */
        self.reloadUserInboxes = function (pageNumber, isAutoReload, skipCountersReload, keepSelectedRows) {
            var promise = null;
            if (ignoreReload) {
                // ignoreReload is used from tasks
                return $q.resolve([]);
            }
            var defer = $q.defer();
            if (self.selectedFilter) {
                self.filterGrid[self.selectedFilter.index].progress = defer.promise;
                var selectedFilterSortOrder = angular.copy(self.filterGrid[self.selectedFilter.index].order);
                var selectedFilterSearchText = angular.copy(self.filterGrid[self.selectedFilter.index].searchText);
                self.selectFilter(self.selectedFilter.filter, self.selectedFilter.index, selectedFilterSortOrder, selectedFilterSearchText);
                return;
            }

            var workItemsWobNumbers = _.map(self.selectedUserInboxes, 'generalStepElm.workObjectNumber');

            self.grid.progress = defer.promise;
            if (self.selectedGridType === 'starred') {
                self.starredGrid.progress = defer.promise;
                promise = userInboxService.loadStarredUserInboxes(true, (pageNumber || self.starredGrid.page), self.starredGrid.limit, self.searchModel);
            } else {
                promise = userInboxService.loadUserInboxes(true, null, !!isAutoReload, (pageNumber || self.grid.page), self.grid.limit, self.searchModel)
            }

            return promise.then(function (result) {
                if (!skipCountersReload) {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                }

                // load starred user inbox
                if (self.selectedGridType === 'starred') {
                    self.starredUserInboxes = result; //_.filter(result, 'generalStepElm.starred');
                    self.starredUserInboxesCopy = angular.copy(self.starredUserInboxes);
                    self.totalRecordsStarred = userInboxService.starredTotalCount;
                    if (pageNumber) {
                        self.starredGrid.page = pageNumber;
                    }
                    self.getSortedDataForStarred();
                    self.starredGrid.searchCallback();
                } else {
                    // load user inbox
                    self.userInboxes = result;
                    self.userInboxesCopy = angular.copy(self.userInboxes);
                    self.totalRecords = userInboxService.totalCount;
                    if (pageNumber) {
                        self.grid.page = pageNumber;
                    }
                    self.getSortedDataForInbox();
                    self.grid.searchCallback();
                }

                if (keepSelectedRows) {
                    self.selectedGridType === 'starred' ? self.starredGrid.selectRowsCallback() : self.grid.selectRowsCallback();
                } else {
                    self.selectedUserInboxes = _.filter(self.getSelectedInboxGrid(), function (item) {
                        return workItemsWobNumbers.indexOf(item.generalStepElm.workObjectNumber) !== -1;
                    });
                }

                defer.resolve(true);
                return result;
            });
        };

        /**
         * @description Terminate User inboxes Bulk
         * @param $event
         */
        self.terminateBulk = function ($event) {
            //var numberOfRecordsToTerminate = angular.copy(self.selectedUserInboxes.length);
            correspondenceService
                .terminateBulkWorkItem(self.selectedUserInboxes, $event)
                .then(function () {
                    self.reloadUserInboxes(self.grid.page);
                });
        };


        self.checkIfForwardBulkAvailable = function () {
            return _.every(self.selectedUserInboxes, function (item) {
                return !item.hasActiveSeqWF();
            });
        };

        /**
         * @description Launch distribution workflow for selected review outgoing mails
         * @param $event
         */
        self.forwardBulk = function ($event) {
            /*var selectedItems = angular.copy(self.selectedUserInboxes);
            if (!self.checkIfForwardBulkAvailable()) {
                if (self.itemsAlreadyBroadCasted.length === selectedItems.length) {
                    dialog.alertMessage(langService.get('selected_items_are_broadcasted_can_not_forward'));
                    return false;
                }
                dialog.confirmMessage(langService.get('some_items_are_broadcasted_skip_and_forward'), null, null, $event).then(function () {
                    self.selectedUserInboxes = selectedItems = _.filter(self.selectedUserInboxes, function (workItem) {
                        return self.itemsAlreadyBroadCasted.indexOf(workItem.generalStepElm.vsId) === -1;
                    });
                    if (self.selectedUserInboxes.length)
                        forwardBulk(selectedItems, $event);
                })
            } else {
                forwardBulk(selectedItems, $event);
            }*/
            forwardBulk(self.selectedUserInboxes, $event);
        };

        function forwardBulk(selectedItems, $event) {
            return correspondenceService
                .launchCorrespondenceWorkflow(selectedItems, $event, 'forward', self.employee.isDefaultTabFavoriteAtLaunch() ? 'favorites' : 'users')
                .then(function () {
                    self.reloadUserInboxes(self.grid.page);
                });
        }


        /**
         * @description Add To Folder User inboxes Bulk
         * @param $event
         */
        self.addToFolderUserInboxBulk = function ($event) {
            return correspondenceService
                .showAddBulkWorkItemsToFolder(self.selectedUserInboxes, $event, false)
                .then(function (result) {
                    if (result)
                        self.reloadUserInboxes(self.grid.page);
                });
        };

        /**
         * @description Change the starred for user inbox
         * @param userInbox
         * @param $event
         */
        self.changeUserInboxStar = function (userInbox, $event) {
            userInbox.toggleStar().then(function () {
                self.reloadUserInboxes(self.grid.page);
            });
        };

        /**
         * @description Change the starred for user inboxes Bulk
         * @param starUnStar
         * @param $event
         */
        self.changeUserInboxStarBulk = function (starUnStar, $event) {
            self.starServices[starUnStar](self.selectedUserInboxes)
                .then(function () {
                    self.reloadUserInboxes(self.grid.page);
                });
        };

        /**
         * @description Terminate User Inbox Item
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.terminate = function (userInbox, $event, defer) {
            userInbox
                .terminate($event)
                .then(function () {
                    $rootScope.$broadcast('$terminated_from_notification', self.controllerName);
                    new ResolveDefer(defer);
                    self.reloadUserInboxes(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                }).catch(function (error) {
                if (error && errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                    dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: userInbox.getInfo().wobNumber}));
                    return false;
                }
            })
        };

        /**
         * @description Add To Folder
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.addToFolder = function (userInbox, $event, defer) {
            userInbox.addToFolder($event, false).then(function (result) {
                new ResolveDefer(defer);
                if (result)
                    self.reloadUserInboxes(self.grid.page);
            }).catch(function (error) {
                if (error && errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                    dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: userInbox.getInfo().wobNumber}));
                    return false;
                }
            });
        };

        /**
         * @description add an item to the favorite documents
         * @param userInbox
         * @param $event
         */
        self.addToFavorite = function (userInbox, $event) {
            userInbox.addToFavorite().then(function () {
                self.reloadUserInboxes(self.grid.page)
            }).catch(function (error) {
                if (error && errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                    dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: userInbox.getInfo().wobNumber}));
                    return false;
                }
            });
        };

        /**
         * @description Archive the document to icn
         * @param workItem
         * @param $event
         * @param defer
         */
        self.addToIcnArchive = function (workItem, $event, defer) {
            workItem.addToIcnArchiveDialog($event)
                .then(function () {
                    self.reloadUserInboxes(self.grid.page);
                    new ResolveDefer(defer);
                }).catch(function (error) {
                if (error && errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                    dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: workItem.getInfo().wobNumber}));
                    return false;
                }
            });
        };

        /**
         * @description Create Reply
         * @param workItem
         * @param $event
         * @param defer
         */
        self.createReply = function (workItem, $event, defer) {
            workItem.createReply($event, false)
                .then(function (result) {
                    new ResolveDefer(defer);
                }).catch(function (error) {
                if (error && errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                    dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: workItem.getInfo().wobNumber}));
                    return false;
                }
            });
        };

        /**
         * @description Create Reply Specific version
         * @param workItem
         * @param $event
         * @param defer
         */
        self.createReplySpecificVersion = function (workItem, $event, defer) {
            workItem.createReply($event, true)
                .then(function (result) {
                    new ResolveDefer(defer);
                }).catch(function (error) {
                if (error && errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                    dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: workItem.getInfo().wobNumber}));
                    return false;
                }
            });
        };

        /**
         * @description Forward
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.forward = function (userInbox, $event, defer) {
            userInbox.launchWorkFlow($event, userInbox.hasActiveSeqWF() ? 'launch' : 'forward',
                self.employee.isDefaultTabFavoriteAtLaunch() ? 'favorites' : 'users', null, null, self.reloadUserInboxes)
                .then(function () {
                    self.reloadUserInboxes(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Launch distribution workflow with quick send
         * @param record
         * @param $event
         * @param defer
         */
        self.quickSend = function (record, $event, defer) {
            record.quickSendLaunchWorkflow($event, self.employee.isDefaultTabFavoriteAtLaunch() ? 'favorites' : 'users')
                .then(function () {
                    self.reloadUserInboxes(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description Launch distribution workflow with sequential workflow
         * @param record
         * @param $event
         * @param defer
         */
        self.launchSequentialWorkflow = function (record, $event, defer) {
            record.openLaunchSequentialWorkflowDialog($event)
                .then(function () {
                    self.reloadUserInboxes(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description luanch workflow from after approve.
         * @param workItem
         * @param $event
         * @param defer
         */
        self.launchWorkFlow = function (workItem, $event, defer) {
            workItem
                .launchWorkflowByVsIdAfterApprove($event, 'forward', self.employee.isDefaultTabFavoriteAtLaunch() ? 'favorites' : 'users')
                .then(function () {
                    self.reloadUserInboxes(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Reply user inbox
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.reply = function (userInbox, $event, defer) {
            userInbox.replySimple($event, 'reply')
                .then(function () {
                    self.reloadUserInboxes(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                }).catch(function (error) {
                if (error && errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                    dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: userInbox.getInfo().wobNumber}));
                    return false;
                }
            });
        };

        /**
         * @description send to minister
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.sendToMinister = function (userInbox, $event, defer) {
            userInbox.launchMinisterWorkFlow($event, 'launch')
                .then(function () {
                    self.reloadUserInboxes(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        }

        /**
         * @description send document to minster assistants
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.sendToMinisterAssistants = function (userInbox, $event, defer) {
            userInbox.launchMinisterAssistantsWorkFlow($event, rootEntity.getGlobalSettings().isAllowToSendToMinister() ? 'launch' : 'forward')
                .then(function () {
                    self.reloadUserInboxes(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        }

        /**
         * @description Get the link of user inbox
         * @param workItem
         * @param $event
         */
        self.getLink = function (workItem, $event) {
            var info = workItem.getInfo();
            viewDocumentService.loadDocumentViewUrlWithOutEdit(info.vsId).then(function (result) {
                //var docLink = "<a target='_blank' href='" + result + "'>" + result + "</a>";
                dialog.successMessage(langService.get('link_message').change({result: result}), null, null, null, null, true);
                return true;
            });
        };


        /**
         * @description Subscribe to actions on the workItem
         * @param workItem
         * @param $event
         */
        self.subscribe = function (workItem, $event) {
            userSubscriptionService.controllerMethod.openAddSubscriptionDialog(workItem, $event);
        };

        /**
         * @description Export user inbox (export to ready to export)
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.sendWorkItemToReadyToExport = function (userInbox, $event, defer) {
            if (userInbox.exportViaArchive()) {
                return userInbox.exportWorkItem($event, true).then(function () {
                    self.reloadUserInboxes(self.grid.page);
                    new ResolveDefer(defer);
                });
            }
            userInbox.sendToReadyToExport($event).then(function () {
                self.reloadUserInboxes(self.grid.page)
                    .then(function () {
                        toast.success(langService.get('export_success'));
                        new ResolveDefer(defer);
                    });
            })
        };

        /**
         * @description export document
         * @param userInbox
         * @param $event
         */
        self.exportWorkItem = function (userInbox, $event) {
            userInbox.exportWorkItem($event, true)
                .then(function () {
                    self.reloadUserInboxes(self.grid.page);
                })
                .catch(function (error) {
                    if (error && error !== 'close')
                        toast.error(langService.get('export_failed'));
                });
        };

        self.addDocumentTask = function (workItem, $event) {
            workItem.createDocumentTask($event)
        };

        /**
         * @description End followup of correspondence site
         * @param workItem
         * @param $event
         * @param defer
         */
        self.endFollowup = function (workItem, $event, defer) {
            workItem.endFollowup($event)
                .then(function (result) {
                    if (result !== 'FAILED_TERMINATE_FOLLOWUP') {
                        self.reloadUserInboxes(self.grid.page)
                            .then(function () {
                                new ResolveDefer(defer);
                            });
                    }
                });
        };

        /**
         * @description View Tracking Sheet
         * @param userInbox
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (userInbox, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(userInbox, params, $event)
                .then(function (result) {

                });
        };

        /**
         * @description Manage Tags
         * @param userInbox
         * @param $event
         */
        self.manageTags = function (userInbox, $event) {
            var info = userInbox.getInfo();
            managerService.manageDocumentTags(info.vsId, info.documentClass, userInbox.getTranslatedName(), $event)
                .then(function () {
                    self.reloadUserInboxes(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadUserInboxes(self.grid.page);
                });
        };

        /**
         * @description Manage Comments
         * @param userInbox
         * @param $event
         */
        self.manageComments = function (userInbox, $event) {
            //var info = userInbox.getInfo();
            userInbox.manageDocumentComments($event)
                .then(function () {
                    self.reloadUserInboxes(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadUserInboxes(self.grid.page);
                });
        };

        /**
         *@description reset workflow
         * @param userInbox
         * @param $event
         */
        self.resetWorkflow = function (userInbox, $event) {
            sequentialWorkflowService.resetSeqWF(userInbox, $event)
                .then(function (result) {
                    toast.success(langService.get('success_reset_seq_wf'));
                    self.reloadUserInboxes(self.grid.page);
                    dialog.cancel();
                })
        };

        /**
         * @description Manage Tasks
         * @param userInbox
         * @param $event
         */
        self.manageTasks = function (userInbox, $event) {
            console.log('manageUserInboxTasks : ', userInbox);
        };

        /**
         * @description Manage Attachments
         * @param userInbox
         * @param $event
         */
        self.manageAttachments = function (userInbox, $event) {
            userInbox.manageDocumentAttachments($event)
                .then(function () {
                    self.reloadUserInboxes(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadUserInboxes(self.grid.page);
                });
        };


        /**
         * @description Manage Linked Documents
         * @param userInbox
         * @param $event
         */
        self.manageLinkedDocuments = function (userInbox, $event) {
            userInbox.manageDocumentLinkedDocuments($event)
                .then(function () {
                    self.reloadUserInboxes(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadUserInboxes(self.grid.page);
                });
        };

        /**
         * @description Manage Linked Entities
         * @param userInbox
         * @param $event
         */
        self.manageLinkedEntities = function (userInbox, $event) {
            userInbox
                .manageDocumentEntities($event);
        };

        /**
         * @description Destinations
         * @param userInbox
         * @param $event
         */
        self.manageDestinations = function (userInbox, $event) {
            userInbox.manageDocumentCorrespondence($event)
                .then(function () {
                    self.reloadUserInboxes(self.grid.page);
                });
        };

        /**
         * @description View Direct Linked Documents
         * @param userInbox
         * @param $event
         */
        self.viewDirectLinkedDocuments = function (userInbox, $event) {
            console.log('viewUserInboxDirectLinkedDocuments : ', userInbox);
        };

        /**
         * @description View Complete Linked Documents
         * @param userInbox
         * @param $event
         */
        self.viewCompleteLinkedDocuments = function (userInbox, $event) {
            console.log('viewUserInboxCompleteLinkedDocuments : ', userInbox);
        };

        /**
         * @description Download Main Document
         * @param userInbox
         * @param $event
         */
        self.downloadMainDocument = function (userInbox, $event) {
            userInbox
                .mainDocumentDownload($event);
        };

        /**
         * @description Download Composite Document
         * @param userInbox
         * @param $event
         */
        self.downloadCompositeDocument = function (userInbox, $event) {
            userInbox
                .compositeDocumentDownload($event);
        };

        /**
         * @description download selected document
         * @param userInbox
         * @param $event
         */
        self.downloadSelected = function (userInbox, $event) {
            downloadService.openSelectedDownloadDialog(userInbox, $event);
        };
        /**
         * @description merge and download
         * @param correspondence
         */
        self.mergeAndDownloadFullDocument = function (correspondence) {
            downloadService.mergeAndDownload(correspondence);
        };

        /**
         * @description Send Link To Document By Email
         * @param userInbox
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (userInbox, $event) {
            userInbox
                .getMainDocumentEmailContent($event);
        };

        /**
         * @description Send Composite Document As Attachment
         * @param userInbox
         * @param $event
         */
        self.sendCompositeDocumentAsAttachment = function (userInbox, $event) {
            console.log('sendUserInboxCompositeDocumentAsAttachment : ', userInbox);
        };

        /**
         * @description Send Composite Document As Attachment By Email
         * @param workItem
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (workItem, $event) {
            workItem
                .getCompositeDocumentEmailContent($event);
        };

        /**
         * @description Send Main Document Fax
         * @param userInbox
         * @param $event
         */
        self.sendMainDocumentFax = function (userInbox, $event) {
            userInbox.openSendFaxDialog($event);
        };

        /**
         * @description Send SMS
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.sendSMS = function (userInbox, $event, defer) {
            userInbox.openSendSMSDialog($event)
                .then(function (result) {
                    new ResolveDefer(defer);
                });
        };

        /**
         * @description Send Document Link
         * @param userInbox
         * @param $event
         */
        self.sendDocumentLink = function (userInbox, $event) {
            userInbox.openSendDocumentURLDialog($event);
        };

        /**
         * @description Sign e-Signature
         * @param userInbox
         * @param $event
         * @param defer
         * @param additionalData
         * @param sendAfterApprove
         */
        self.signESignature = function (userInbox, $event, defer, additionalData, sendAfterApprove) {
            return userInbox
                .approveWorkItem($event, defer, null, sendAfterApprove, additionalData)
                .then(function (result) {
                    if (sendAfterApprove)
                        return result;

                    userInbox
                        .launchWorkFlowCondition($event, 'reply', null, true, function () {
                            return result === correspondenceService.authorizeStatus.INTERNAL_PERSONAL.text;
                        })
                        .then(function () {
                            self.reloadUserInboxes(self.grid.page);
                        })
                        .catch(function () {
                            self.reloadUserInboxes(self.grid.page);
                        });
                }).catch(function (error) {
                    if (error && error === 'PARTIAL_AUTHORIZE_LAUNCH_CANCELLED') {
                        self.reloadUserInboxes();
                        return $q.reject(false);
                    }
                    if (error && errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                        dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: userInbox.getInfo().wobNumber}));
                        return $q.reject(false);
                    }
                })
        };
        /**
         * @description conditional approve for the document
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.conditionalApprove = function (userInbox, $event, defer) {
            userInbox.applyConditionalApprove($event, defer)
                .then(function () {
                    new ResolveDefer(defer);
                    self.reloadUserInboxes(self.grid.page);
                })
        };
        /**
         * @description approve and send the document
         * @param workItem
         * @param $event
         * @param defer
         * @param additionalData
         * @return {*}
         */
        self.signESignatureAndSend = function (workItem, $event, defer, additionalData) {
            return self
                .signESignature(workItem, $event, defer, additionalData, true)
                .then(function (result) {
                    // make the temp workitem fully authorized.
                    workItem.generalStepElm.docStatus = (result === correspondenceService.authorizeStatus.INTERNAL_PERSONAL.text) ? 23 : 24;
                    // start launch workflow.
                    return self.launchWorkFlow(workItem, $event, defer);
                })
                .catch(function () {
                    self.reloadUserInboxes(self.grid.page);
                })
        };
        /**
         * @description Sign Digital Signature
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.signDigitalSignature = function (userInbox, $event, defer) {
            console.log('signUserInboxDigitalSignature : ', $event, defer, userInbox);
        };

        /**
         * @description Approve and export the document
         * @param userInbox
         * @param $event
         * @param defer
         * @returns {*}
         */
        self.approveAndExport = function (userInbox, $event, defer) {
            userInbox.approveDocument($event, defer, false)
                .then(function (result) {
                    if (result === 'FULLY_AUTHORIZED') {
                        userInbox.exportWorkItem($event, true)
                            .then(function () {
                                new ResolveDefer(defer);
                            })
                            .catch(function (error) {
                                if (error)
                                    toast.error(langService.get('export_failed'));
                            });
                    }

                    self.reloadUserInboxes(self.grid.page);
                }).catch(function (error) {
                if (error && errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                    dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: userInbox.getInfo().wobNumber}));
                    return false;
                }
            })
        };

        /**
         * @description Edit Content
         * @param userInbox
         * @param $event
         */
        self.editContent = function (userInbox, $event) {
            userInbox.manageDocumentContent($event)
                .then(function () {
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                }).catch(function (error) {
                if (error && errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                    dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: userInbox.getInfo().wobNumber}));
                    return false;
                }
            });
        };

        /**
         * @description Edit Properties
         * @param userInbox
         * @param $event
         */
        self.editProperties = function (userInbox, $event) {
            var info = userInbox.getInfo();
            managerService
                .manageDocumentProperties(info.vsId, info.documentClass, info.title, $event)
                .finally(function (e) {
                    self.reloadUserInboxes(self.grid.page);
                });
        };

        /**
         * @description
         * @param userInbox
         * @param $event
         */
        self.correspondenceSimpleEdit = function (userInbox, $event) {
            var info = userInbox.getInfo(),
                page = (self.isInternalOutgoingEnabled && userInbox.isInternalOutgoing()) ? '.simple-add-internal' : '.simple-add';
            userInbox.correspondenceSimpleEdit().then(function () {
                $state.go('app.' + info.documentClass + page, {
                    wobNum: info.wobNumber,
                    vsId: info.vsId,
                    action: 'simpleEdit',
                    prevPage: 'userInbox'
                });
            })
        }


        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var info = model.getInfo();
            var hasPermission = false;
            if (info.documentClass === "internal") {
                //If approved internal electronic, don't allow to edit
                if (info.docStatus >= 24 && !info.isPaper)
                    hasPermission = false;
                else
                    hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES");
            } else if (info.documentClass === "incoming")
                hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES");
            else if (info.documentClass === "outgoing") {
                //If approved outgoing electronic, don't allow to edit
                if (info.docStatus >= 24 && !info.isPaper)
                    hasPermission = false;
                else
                    hasPermission = employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES");
            }
            if (checkForViewPopup)
                return !hasPermission || model.isBroadcasted();
            return hasPermission && !model.isBroadcasted();
        };

        var checkIfEditContentAllowed = function (model) {
            var info = model.getInfo(), isAllowed = true;
            if (model.hasActiveSeqWF() && model.isCorrespondenceApprovedBefore()) {
                return false;
            }
            // if already approved once and not allowed to edit partial approved in global settings, return false
            if (model.isCorrespondenceApprovedBefore()) {
                isAllowed = rootEntity.getGlobalSettings().isAllowEditAfterFirstApprove();
            }
            if (!isAllowed || info.docStatus >= 24) {
                return false;
            }
            var hasPermission = false;
            if (info.documentClass === "internal")
                hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT");
            else if (info.documentClass === "incoming")
                hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT");
            else if (info.documentClass === "outgoing") {
                hasPermission = (info.isPaper ? employeeService.hasPermissionTo("EDIT_OUTGOING_PAPER") : employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
            }

            return hasPermission;
        }


        var checkIfEditCorrespondenceSiteAllowed = function (model, checkForViewPopup) {
            var info = model.getInfo();
            var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
            var allowed = (hasPermission && info.documentClass !== "internal");
            if (checkForViewPopup)
                return !(allowed);
            return allowed;
        };

        /**
         * @description Preview document
         * @param userInbox
         * @param $event
         */
        self.previewDocument = function (userInbox, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            userInbox.viewInboxWorkItem(self.gridActions, checkIfEditPropertiesAllowed(userInbox, true), checkIfEditCorrespondenceSiteAllowed(userInbox, true))
                .then(function () {
                    return self.reloadUserInboxes(self.grid.page);
                })
                .catch(function () {
                    return self.reloadUserInboxes(self.grid.page);
                });
        };

        /**
         * @description do broadcast for workItem.
         */
        self.broadcast = function (userInbox, $event, defer) {
            userInbox
                .correspondenceBroadcast()
                .then(function () {
                    self.reloadUserInboxes(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        })
                }).catch(function (error) {
                if (error && errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                    dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: userInbox.getInfo().wobNumber}));
                    return false;
                }
            });
        };

        // view document
        self.viewDocument = function (workItem, $event) {
            var info = workItem.getInfo();
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            if (info.hasActiveSeqWF && self.psPDFViewerEnabled) {
                return workItem.openSequentialDocument(null, null, self.gridActions)
                    .then(function () {
                        self.reloadUserInboxes(self.grid.page);
                    })
                    .catch(function () {
                        self.reloadUserInboxes(self.grid.page);
                    });
            }

            workItem
                .viewNewWorkItemDocument(self.gridActions, 'userInbox', $event, function () {
                    self.reloadUserInboxes(self.grid.page);
                })
                .then(function () {
                    self.reloadUserInboxes(self.grid.page);
                })
                .catch(function () {
                    self.reloadUserInboxes(self.grid.page);
                });
        };

        /**
         * @description edit word document in desktop
         * @param workItem
         * @return {Promise}
         */
        self.editInDesktop = function (workItem) {
            return workItem.editCorrespondenceInDesktop();
        };

        /**
         * @description open document before approve as signed document with draft watermark
         * @param workItem
         * @param $event
         */
        self.viewDocumentAsApproved = function (workItem, $event) {
            workItem.viewDocumentAsApproved(self.gridActions, 'userInbox', $event);
        }

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
         * @param defer
         */
        self.duplicateCurrentVersion = function (workItem, $event, defer) {
            var info = workItem.getInfo(), page;
            if (info.documentClass.toLowerCase() === 'outgoing') {
                page = (self.isInternalOutgoingEnabled && workItem.isInternalOutgoing()) ? 'app.outgoing.add-internal' : 'app.outgoing.add';
            } else {
                page = 'app.' + info.documentClass.toLowerCase() + '.add'
            }
            return workItem
                .duplicateVersion($event)
                .then(function () {
                    new ResolveDefer(defer);
                    $state.go(page, {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        wobNum: info.wobNumber
                    });
                });
        };
        /**
         * @description duplicate specific version
         * @param workItem
         * @param $event
         * @param defer
         * @return {*}
         */
        self.duplicateVersion = function (workItem, $event, defer) {
            var info = workItem.getInfo(), page;
            if (info.documentClass.toLowerCase() === 'outgoing') {
                page = (self.isInternalOutgoingEnabled && workItem.isInternalOutgoing()) ? 'app.outgoing.add-internal' : 'app.outgoing.add';
            } else {
                page = 'app.' + info.documentClass.toLowerCase() + '.add'
            }
            return workItem
                .duplicateSpecificVersion($event)
                .then(function () {
                    new ResolveDefer(defer);
                    $state.go(page, {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        wobNum: info.wobNumber
                    });
                });
        };

        self.viewInDeskTop = function (workItem) {
            return correspondenceService.viewWordInDesktop(workItem);
        };

        /**
         * @description add workItem To My FollowUp
         * @param item
         */
        self.addToDirectFollowUp = function (item) {
            item.addToMyDirectFollowUp();
        };

        /**
         * @description add workItem To other user's FollowUp
         * @param item
         */
        self.addToEmployeeFollowUp = function (item) {
            item.addToUserFollowUp();
        };

        /**
         * @description add workItem to broadcast FollowUp
         * @param item
         */
        self.addToBroadcastFollowUp = function (item) {
            item.addToBroadcastFollowUp();
        };

        /**
         * @description annotate document
         * @param workItem
         * @param $event
         * @param defer
         */
        self.annotateDocument = function (workItem, $event, defer) {
            workItem.openForAnnotation(true)
                .then(function () {
                    self.reloadUserInboxes(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
                .catch(function () {
                    self.reloadUserInboxes(self.grid.page);
                });
        };

        self.getTrackingSheetCallback = function (record, $event) {
            var action = self.gridActions.find(action => {
                return action.text === "grid_action_view_tracking_sheet" && action.onlyShortcut;
            });

            return action.callback(record, action.params, $event);
        }

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
                        gridName: gridService.grids.inbox.userInbox
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
                    'VIEW_DOCUMENT_VERSION',
                    'VIEW_OUTGOING_BEFORE_AUTHORIZATION'
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
                    },
                    // show versions
                    {
                        type: 'action',
                        icon: 'animation',
                        text: 'grid_action_view_specific_version',
                        shortcut: false,
                        hide: false,
                        callback: self.getDocumentVersions,
                        permissionKey: "VIEW_DOCUMENT_VERSION",
                        class: "action-green",
                        showInView: true,
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // viewInDeskTop
                    {
                        type: 'action',
                        icon: 'monitor',
                        text: 'grid_action_view_in_desktop',
                        shortcut: false,
                        hide: false,
                        callback: self.viewInDeskTop,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        showInView: false,
                        checkShow: function (action, model) {
                            var info = model.getInfo(), isAllowed = true;
                            if (model.hasActiveSeqWF()) {
                                return false;
                            }
                            if (model.isCorrespondenceApprovedBefore()) {
                                isAllowed = rootEntity.getGlobalSettings().isAllowEditAfterFirstApprove();
                            }
                            if (!isAllowed) {
                                return false;
                            }
                            return !info.isPaper && info.needToApprove();
                        }
                    },
                    // view as signed
                    {
                        type: 'action',
                        icon: 'book-open-outline',
                        text: 'grid_action_view_document_as_approved',
                        shortcut: true,
                        callback: self.viewDocumentAsApproved,
                        permissionKey: "VIEW_OUTGOING_BEFORE_AUTHORIZATION",
                        class: "action-green",
                        showInView: false,
                        checkShow: function (action, model) {
                            return !model.hasDocumentClass('incoming') && model.needApprove() && !model.hasActiveSeqWF();
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
                stickyIndex: 1,
                checkShow: function (action, model) {
                    var hasPermission = employeeService.hasPermissionTo("TERMINATE_SEQ_WF");
                    if (model.hasActiveSeqWF()) {
                        return hasPermission;
                    }

                    return true;
                }
            },
            // Annotate Document
            {
                type: 'action',
                icon: 'draw',
                text: 'grid_action_annotate_document',
                shortcut: true,
                callback: self.annotateDocument,
                class: "action-green",
                sticky: true,
                stickyIndex: 1,
                checkShow: function (action, model) {
                    return model.userCanAnnotate() && rootEntity.hasPSPDFViewer() &&
                        employeeService.hasPermissionTo(configurationService.ANNOTATE_DOCUMENT_PERMISSION) &&
                        !model.isTerminatedSEQ() &&
                        !correspondenceService.isLimitedCentralUnitAccess(model);
                }
            },
            // Add To
            {
                type: 'action',
                icon: 'plus',
                text: 'grid_action_add_to',
                class: "action-green",
                permissionKey: [
                    'MANAGE_FAVORITE',
                    '',//add to folder
                    'ICN_ENTRY_TEMPLATE',
                    'USER_FOLLOWUP_BOOKS',
                    'ADMIN_USER_FOLLOWUP_BOOKS'
                ],
                checkAnyPermission: true,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                subMenu: [
                    // Add To Folder
                    {
                        type: 'action',
                        icon: 'folder-plus',
                        text: 'grid_action_to_folder',
                        callback: self.addToFolder,
                        permissionKey: 'FOLDERS_QUEUE',
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Add To Favorite
                    {
                        type: 'action',
                        icon: 'star',
                        text: 'grid_action_to_favorite',
                        permissionKey: "MANAGE_FAVORITE",
                        callback: self.addToFavorite,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Add To ICN Archive
                    {
                        type: 'action',
                        icon: 'archive',
                        text: 'grid_action_icn_archive',
                        callback: self.addToIcnArchive,
                        class: "action-green",
                        permissionKey: 'ICN_ENTRY_TEMPLATE',
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // add to my follow up
                    {
                        type: 'action',
                        icon: 'book-search-outline',
                        text: 'grid_action_to_my_followup',
                        shortcut: true,
                        callback: self.addToDirectFollowUp,
                        permissionKey: 'USER_FOLLOWUP_BOOKS',
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // add to employee follow up
                    {
                        type: 'action',
                        icon: 'book-search',
                        text: 'grid_action_to_employee_followup',
                        shortcut: true,
                        callback: self.addToEmployeeFollowUp,
                        permissionKey: 'ADMIN_USER_FOLLOWUP_BOOKS',
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // add to broadcast follow up
                    {
                        type: 'action',
                        icon: 'book-multiple',
                        text: 'grid_action_to_broadcast_followup',
                        shortcut: true,
                        callback: self.addToBroadcastFollowUp,
                        permissionKey: 'ADMIN_USER_FOLLOWUP_BOOKS',
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Create Reply
            {
                type: 'action',
                icon: 'pen',
                text: 'grid_action_create_reply',
                callback: self.createReply,
                class: "action-green",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    // if docFullSerial exists, its either paper or electronic approved document
                    return model.checkCreateReplyPermission() && !!info.docFullSerial && !model.isBroadcasted();
                }
            },
            // Create Reply For Specific Version
            {
                type: 'action',
                icon: 'pen',
                text: 'grid_action_create_reply_specific_version',
                callback: self.createReplySpecificVersion,
                class: "action-green",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    // if docFullSerial exists, its either paper or electronic approved document
                    return model.checkCreateReplyPermission(true) && !!info.docFullSerial && !model.isBroadcasted();
                }
            },
            // Forward
            {
                type: 'action',
                icon: 'share',
                text: 'grid_action_forward',
                textCallback: function (model) {
                    return !model.hasActiveSeqWF() ? 'grid_action_forward' : 'grid_action_launch_distribution_workflow';
                },
                shortcut: true,
                callback: self.forward,
                sticky: true,
                stickyIndex: 4,
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Quick Send (Quick Launch)
            {
                type: 'action',
                icon: 'sitemap',
                text: 'grid_action_quick_send',
                shortcut: true,
                callback: self.quickSend,
                sticky: true,
                stickyIndex: 8,
                class: "action-green",
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
                checkShow: function (action, model) {
                    return !model.hasActiveSeqWF();
                }
            },
            // Launch Sequential Workflow
            {
                type: 'action',
                icon: gridService.gridIcons.actions.sequentialWF,
                text: 'grid_action_launch_sequential_workflow',
                callback: self.launchSequentialWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_SEQ_WF',
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return rootEntity.hasPSPDFViewer() && !model.hasActiveSeqWF()
                        && !model.isCorrespondenceApprovedBefore() && !model.isComposite()
                        && !model.isTerminatedSEQ() && !model.isBroadcasted() && !model.generalStepElm.isSeqWFLaunch;
                }
            },
            // Send To Minister
            {
                type: 'action',
                icon: 'shield-account',
                text: 'grid_send_to_minister',
                permissionKey: 'SEND_TO_HEAD_OF_GOVERNMENT_ENTITY',
                callback: self.sendToMinister,
                class: "action-green",
                sticky: true,
                stickyIndex: 9,
                checkShow: function (action, model) {
                    return rootEntity.getGlobalSettings().isAllowToSendToMinister();
                }
            },
            // Send To Minister Assistants
            {
                type: 'action',
                icon: 'account-supervisor',
                text: 'grid_send_to_minister_assistants',
                permissionKey: 'SEND_TO_MINISTRY_ASSISTANT',
                callback: self.sendToMinisterAssistants,
                class: "action-green",
                sticky: true,
                stickyIndex: 10,
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Broadcast
            {
                type: 'action',
                icon: 'bullhorn',
                text: 'grid_action_broadcast',
                hide: false,
                permissionKey: 'BROADCAST_DOCUMENT',
                callback: self.broadcast,
                class: "action-green",
                checkShow: function (action, model) {
                    return (!model.needApprove() || model.hasDocumentClass('incoming'))
                        && !model.isBroadcasted()
                        && (model.getSecurityLevelLookup().lookupKey !== 4)
                        && !model.hasActiveSeqWF();
                }
            },
            // Reply
            {
                type: 'action',
                icon: 'reply',
                text: 'grid_action_reply',
                callback: self.reply,
                sticky: true,
                stickyIndex: 5,
                class: "action-green",
                checkShow: function (action, model) {
                    return !model.hasActiveSeqWF() && !model.isBroadcasted();
                }
            },
            // Get Link
            {
                type: 'action',
                icon: 'link',
                text: 'grid_action_get_link',
                permissionKey: 'GET_A_LINK_TO_THE_DOCUMENT',
                callback: self.getLink,
                class: "action-green",
                hide: true,
                checkShow: function (action, model) {
                    return !model.isBroadcasted();
                }
            },
            // Subscribe
            {
                type: 'action',
                icon: 'bell-plus',
                text: 'grid_action_subscribe',
                callback: self.subscribe,
                class: "action-green",
                hide: false,
                checkShow: function (action, model) {
                    return !model.isBroadcasted();
                }
            },
            // Export (Send to ready to export)
            {
                type: 'action',
                icon: 'export',
                text: 'grid_action_send_to_ready_to_export',
                textCallback: function (model) {
                    return model.exportViaArchive() ? 'grid_action_send_to_central_archive' : 'grid_action_send_to_ready_to_export';
                },
                shortcut: true,
                callback: self.sendWorkItemToReadyToExport,
                class: "action-green",
                sticky: true,
                permissionKey: 'SEND_TO_READY_TO_EXPORT_QUEUE',
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return info.isPaper && info.documentClass === 'outgoing' && !model.isBroadcasted() && (info.docStatus <= 22) && !model.isPrivateSecurityLevel()
                        && !model.hasActiveSeqWF();
                }
            },
            // Export
            {
                type: 'action',
                icon: 'export',
                text: 'grid_action_export',
                callback: self.exportWorkItem,
                class: "action-green",
                hide: true,
                permissionKey: "OPEN_DEPARTMENT’S_READY_TO_EXPORT_QUEUE",
                sticky: true,
                shortcut: true,
                checkShow: function (action, model) {
                    var allowExportInternalOutgoing = model.isInternalOutgoing() ? rootEntity.isAllowExportInternalOutgoingEnabled() : true;
                    var info = model.getInfo();
                    return gridService.checkToShowAction(action)
                        && info.docStatus === 24
                        && info.documentClass === 'outgoing'
                        && !model.isPrivateSecurityLevel()
                        && !model.hasActiveSeqWF()
                        && allowExportInternalOutgoing;
                }
            },
            // add task
            {
                type: 'action',
                icon: 'calendar-check-outline',
                text: 'create_task',
                callback: self.addDocumentTask,
                class: "action-green",
                shortcut: true,
                checkShow: gridService.checkToShowAction
            },
            // End Follow up
            {
                type: 'action',
                icon: gridService.gridIcons.actions.endFollowup,
                text: 'grid_action_end_follow_up',
                callback: self.endFollowup,
                class: "action-green",
                hide: true, // as discussed with issawi as followupStatus is not updated after end followup
                //showInViewOnly: true,
                permissionKey: "MANAGE_DESTINATIONS",
                checkShow: function (action, model) {
                    // only for outgoing/incoming
                    // no follow up status = 0 (need reply)
                    var correspondence = model.hasOwnProperty('correspondence') ? model.correspondence : model;
                    var info = correspondence.getInfo();

                    if (info.documentClass === 'outgoing' || info.documentClass === 'incoming') {
                        if (!(correspondence instanceof WorkItem)) {
                            return !correspondence.getSiteFollowupStatus() && !correspondence.getSiteFollowupEndDate()// && model.getSiteMaxFollowupDate();
                        } else {
                            return model.getSiteFollowupStatus() === 0;
                        }
                    }
                    return false;
                }
            },
            // Reset Workflow
            {
                type: 'action',
                icon: 'playlist-remove',
                text: 'reset_seq_wf',
                permissionKey: "MULTI_SIGNATURE_RESET",
                callback: self.resetWorkflow,
                class: "action-green",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    if (info.documentClass === 'incoming') {
                        return false;
                    }

                    return model.hasActiveSeqWF() ||
                        (!info.isPaper && info.docStatus === 23);
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
                subMenu: viewTrackingSheetService.getViewTrackingSheetOptions('grid', gridService.grids.inbox.userInbox)
            },
            // View Tracking Sheet (Sticky Only)
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view_tracking_sheet',
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: gridService.checkToShowAction,
                sticky: true,
                stickyIndex: 2,
                showInView: false,
                showInViewOnly: true,
                callback: self.viewTrackingSheet,
                params: ['view_tracking_sheet', 'tabs', gridService.grids.inbox.userInbox]
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
                params: ['view_tracking_sheet', 'tabs', gridService.grids.inbox.userInbox]
            },
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                permissionKey: [
                    "MANAGE_DOCUMENT’S_TAGS",
                    "MANAGE_TASKS",
                    "MANAGE_ATTACHMENTS",
                    "MANAGE_LINKED_DOCUMENTS",
                    "MANAGE_LINKED_ENTITIES",
                    "MANAGE_DESTINATIONS"
                ],
                checkAnyPermission: true,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                showInView: false,
                subMenu: [
                    // Tags
                    {
                        type: 'action',
                        icon: 'tag',
                        text: 'grid_action_tags',
                        permissionKey: "MANAGE_DOCUMENT’S_TAGS",
                        callback: self.manageTags,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Comments
                    {
                        type: 'action',
                        icon: 'comment',
                        text: 'grid_action_comments',
                        callback: self.manageComments,
                        class: "action-green",
                        sticky: true,
                        stickyIndex: 3,
                        checkShow: function (action, model) {
                            return true;
                        },
                        count: function (action, model) {
                            var info = model.getInfo();
                            // we do filter here because we can't get the updated count of workItem inside correspondence popup
                            var selectedWorkItem = _.find(self.getSelectedInboxGrid(), function (item) {
                                return item.generalStepElm.workObjectNumber === info.wobNumber;
                            });

                            return selectedWorkItem ? selectedWorkItem.generalStepElm.commentsNO : 0;
                        }
                    },
                    // Tasks
                    {
                        type: 'action',
                        icon: 'note-multiple',
                        text: 'grid_action_tasks',
                        permissionKey: "MANAGE_TASKS",
                        callback: self.manageTasks,
                        class: "action-red",
                        hide: true,
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Attachments
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_attachments',
                        permissionKey: "MANAGE_ATTACHMENTS",
                        callback: self.manageAttachments,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Linked Documents
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_linked_documents',
                        permissionKey: "MANAGE_LINKED_DOCUMENTS",
                        callback: self.manageLinkedDocuments,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Linked Entities
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_linked_entities',
                        callback: self.manageLinkedEntities,
                        class: "action-green",
                        permissionKey: "MANAGE_LINKED_ENTITIES",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Destinations
                    {
                        type: 'action',
                        icon: 'stop',
                        text: 'grid_action_destinations',
                        callback: self.manageDestinations,
                        permissionKey: "MANAGE_DESTINATIONS",
                        class: "action-green",
                        checkShow: function (action, model) {
                            return checkIfEditCorrespondenceSiteAllowed(model, false);
                        }
                    }
                ]
            },
            // View
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view',
                hide: true,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                subMenu: [
                    // Direct Linked Documents
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_direct_linked_documents',
                        callback: self.viewDirectLinkedDocuments,
                        class: "action-red",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Complete Linked Documents
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_complete_linked_documents',
                        callback: self.viewCompleteLinkedDocuments,
                        class: "action-red",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Download
            {
                type: 'action',
                icon: 'download',
                text: 'grid_action_download',
                checkShow: function (action, model) {
                    var isAllowed = true;
                    if (model.isCorrespondenceApprovedBefore() && model.getInfo().authorizeByAnnotation) {
                        isAllowed = rootEntity.getGlobalSettings().isAllowEditAfterFirstApprove();
                    }

                    return isAllowed && gridService.checkToShowMainMenuBySubMenu(action, model) && !correspondenceService.isLimitedCentralUnitAccess(model);
                },
                permissionKey: [
                    "DOWNLOAD_MAIN_DOCUMENT",
                    "DOWNLOAD_COMPOSITE_BOOK"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // Main Document
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_main_document',
                        permissionKey: "DOWNLOAD_MAIN_DOCUMENT",
                        callback: self.downloadMainDocument,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Composite Document
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_composite_document',
                        permissionKey: 'DOWNLOAD_COMPOSITE_BOOK',
                        callback: self.downloadCompositeDocument,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // download selected
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'selective_document',
                        permissionKey: 'DOWNLOAD_COMPOSITE_BOOK',
                        callback: self.downloadSelected,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // merge and download
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'merge_and_download',
                        permissionKey: 'DOWNLOAD_COMPOSITE_BOOK',
                        callback: self.mergeAndDownloadFullDocument,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Send
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_send',
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model) && !model.isBroadcasted() &&
                        !correspondenceService.isLimitedCentralUnitAccess(model);
                },
                permissionKey: [
                    "SEND_COMPOSITE_DOCUMENT_BY_EMAIL",
                    "SEND_DOCUMENT_BY_FAX",
                    "SEND_SMS",
                    "SHARE_BOOK_LINK"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // Link To Document By Email
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_link_to_document_by_email',
                        permissionKey: 'SEND_COMPOSITE_DOCUMENT_BY_EMAIL',
                        callback: self.sendLinkToDocumentByEmail,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Composite Document As Attachment By Email
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_composite_document_as_attachment_by_email',
                        permissionKey: 'SEND_COMPOSITE_DOCUMENT_BY_EMAIL',
                        callback: self.sendCompositeDocumentAsAttachmentByEmail,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Send Document by Fax
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_send_document_by_fax',
                        permissionKey: "SEND_DOCUMENT_BY_FAX",
                        callback: self.sendMainDocumentFax,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return model.canSendByFax();
                        }
                    },
                    // SMS
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'grid_action_send_sms',
                        permissionKey: "SEND_SMS",
                        callback: self.sendSMS,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // send document link
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'send_document_link',
                        permissionKey: "SHARE_BOOK_LINK",
                        callback: self.sendDocumentLink,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Sign(Approve)
            {
                type: 'action',
                icon: 'check-decagram',
                text: 'grid_action_approve',//signature
                checkShow: function (action, model) {
                    if (model.hasActiveSeqWF() || model.isTerminatedSEQ()) {
                        return false;
                    }
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "ELECTRONIC_SIGNATURE",
                    "ELECTRONIC_SIGNATURE_MEMO"
                    // "DIGITAL_SIGNATURE"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // approve and export
                    {
                        type: 'action',
                        text: 'grid_action_approve_and_export',
                        icon: 'account-multiple-check',
                        callback: self.approveAndExport,
                        sticky: true,
                        class: "action-green",
                        checkShow: function (action, model) {
                            var employee = employeeService.getEmployee();
                            var allowExportInternalOutgoing = model.isInternalOutgoing() ? rootEntity.isAllowExportInternalOutgoingEnabled() : true;
                            if (model.hasActiveSeqWF() || model.isTerminatedSEQ()) {
                                return false;
                            }
                            if (model.getAuthorizeByAnnotationStatus()) {
                                return false;
                            }

                            if (!employee.hasPermissionTo('ELECTRONIC_SIGNATURE') || !employee.hasPermissionTo('OPEN_DEPARTMENT’S_READY_TO_EXPORT_QUEUE'))
                                return false;

                            var info = model.getInfo();
                            return !info.isPaper
                                && (info.documentClass === 'outgoing')
                                && model.needApprove()
                                && model.allInternalSites
                                && model.hasSingleSignature()
                                && !model.isPrivateSecurityLevel()
                                && !model.isBroadcasted()
                                && allowExportInternalOutgoing;
                        }
                    },
                    // e-Signature
                    {
                        type: 'action',
                        icon: 'check-decagram',
                        text: 'grid_action_electronic_approve',//e_signature
                        callback: self.signESignature,
                        class: "action-green",
                        sticky: true,
                        stickyIndex: 6,
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            if (model.hasActiveSeqWF() || model.isTerminatedSEQ()) {
                                return false;
                            }
                            if (model.getAuthorizeByAnnotationStatus()) {
                                return false;
                            }
                            return !model.isBroadcasted()
                                && !info.isPaper
                                && model.checkElectronicSignaturePermission()
                                && model.needApprove();
                        }
                    },
                    // Conditional Approve
                    {
                        type: 'action',
                        icon: 'clock-start',
                        text: 'grid_action_conditional_approve',
                        callback: self.conditionalApprove,
                        class: "action-green",
                        sticky: true,
                        stickyIndex: 8,
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            if (model.hasActiveSeqWF() || model.isTerminatedSEQ()) {
                                return false;
                            }
                            if (model.getAuthorizeByAnnotationStatus()) {
                                return false;
                            }
                            return info.documentClass === 'outgoing' && !model.isBroadcasted()
                                && !info.isPaper
                                && model.checkElectronicSignaturePermission()
                                && model.needApprove()
                                && model.hasSingleSignature()
                                && !model.isPrivateSecurityLevel();
                        }
                    },
                    // Digital Signature
                    {
                        type: 'action',
                        icon: 'draw',
                        text: 'grid_action_digital',//digital_signature
                        callback: self.signDigitalSignature,
                        class: "action-red",
                        permissionKey: "DIGITAL_SIGNATURE",
                        hide: true,
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            if (model.hasActiveSeqWF() || model.isTerminatedSEQ()) {
                                return false;
                            }
                            if (model.getAuthorizeByAnnotationStatus()) {
                                return false;
                            }
                            return !model.isBroadcasted()
                                && !info.isPaper
                                && (info.documentClass !== 'incoming')
                                && model.needApprove();
                        }
                    },
                    // Approve and send
                    {
                        type: 'action',
                        icon: 'account-check',
                        text: 'grid_action_electronic_approve_and_send',
                        callback: self.signESignatureAndSend,
                        class: "action-green",
                        sticky: true,
                        stickyIndex: 7,
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            if (model.hasActiveSeqWF() || model.isTerminatedSEQ()) {
                                return false;
                            }
                            if (model.getAuthorizeByAnnotationStatus()) {
                                return false;
                            }
                            return !model.isBroadcasted()
                                && !info.isPaper
                                && model.checkElectronicSignaturePermission()
                                && model.hasSingleSignature()
                                && model.needApprove();
                        }
                    }
                ]
            },
            // Edit
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit',
                showInView: false,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model) && !model.isBroadcasted();
                },
                subMenu: [
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
                        callback: self.editContent,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return checkIfEditContentAllowed(model);
                        }
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
                        callback: self.editProperties,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return checkIfEditPropertiesAllowed(model);
                        }
                    },
                    // Simple Edit
                    {
                        type: 'action',
                        icon: 'pencil',
                        text: 'grid_action_simple_edit',
                        callback: self.correspondenceSimpleEdit,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return checkIfEditContentAllowed(model) && checkIfEditPropertiesAllowed(model);
                        }
                    },
                    // editInDeskTop
                    {
                        type: 'action',
                        icon: 'desktop-classic',
                        text: 'grid_action_edit_in_desktop',
                        shortcut: true,
                        callback: self.editInDesktop,
                        class: "action-green",
                        showInView: false,
                        checkShow: function (action, model) {
                            var info = model.getInfo(), isAllowed = true;
                            if (model.hasActiveSeqWF() && model.isCorrespondenceApprovedBefore()) {
                                return false;
                            }
                            if (model.isCorrespondenceApprovedBefore()) {
                                isAllowed = rootEntity.getGlobalSettings().isAllowEditAfterFirstApprove();
                            }
                            if (!isAllowed || info.docStatus >= 24) {
                                return false;
                            }
                            var hasPermission = false;
                            if (info.documentClass === 'outgoing') {
                                hasPermission = (info.isPaper ? employeeService.hasPermissionTo("EDIT_OUTGOING_PAPER") : employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
                            } else if (info.documentClass === 'incoming') {
                                hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT");
                            } else if (info.documentClass === 'internal') {
                                hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT");
                            }
                            return !model.isBroadcasted()
                                && !info.isPaper
                                && (info.documentClass !== 'incoming')
                                && model.needApprove()
                                && hasPermission
                                && !correspondenceService.isLimitedCentralUnitAccess(model);
                        }
                    }
                ]
            },
            // Duplicate
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_duplicate',
                shortcut: false,
                showInView: false,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "DUPLICATE_BOOK_CURRENT",
                    "DUPLICATE_BOOK_FROM_VERSION"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // duplicate current version
                    {
                        type: 'action',
                        icon: 'content-copy',
                        text: 'grid_action_duplication_current_version',
                        shortcut: false,
                        hide: false,
                        callback: self.duplicateCurrentVersion,
                        class: "action-green",
                        permissionKey: 'DUPLICATE_BOOK_CURRENT',
                        showInView: true,
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            return (info.documentClass === 'outgoing' || info.documentClass === 'internal') && !info.isPaper
                        }
                    },
                    // duplicate specific version
                    {
                        type: 'action',
                        icon: 'content-duplicate',
                        text: 'grid_action_duplication_specific_version',
                        shortcut: false,
                        hide: false,
                        callback: self.duplicateVersion,
                        class: "action-green",
                        showInView: true,
                        permissionKey: 'DUPLICATE_BOOK_FROM_VERSION',
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            }
        ];

        self.shortcutActions = gridService.getShortcutActions(self.gridActions);
        self.contextMenuActions = gridService.getContextMenuActions(self.gridActions);
        self.stickyActions = $filter('orderBy')(gridService.getStickyActions(self.gridActions), 'stickyIndex');

        /**
         * @description Mark item as read/unread
         * @param userInbox
         * @param $event
         */
        self.markAsReadUnread = function (userInbox, $event) {
            return userInbox.markAsReadUnread($event)
                .then(function (result) {
                    self.replaceRecord(result);
                    counterService.loadCounters();
                })
        };

        self.openEmailItem = function (emailItem) {
            emailItem ? self.viewDocument(emailItem) : null;
        };

        self.refreshInbox = function (time) {
            $timeout(function () {
                $state.is('app.inbox.user-inbox') && self.reloadUserInboxes(self.grid.page, true);
            }, time)
                .then(function () {
                    $state.is('app.inbox.user-inbox') && self.refreshInbox(time);
                });
        };


        self.printResult = function (printSelected, $event) {
            var printTitle = langService.get('menu_item_user_inbox');
            var records = [];
            var headers = [
                // 'inbox_serial',
                'subject',
                'received_date',
                'action',
                'sender',
                'due_date',
                'correspondence_sites'
            ];

            if (printSelected) {
                records = self.selectedUserInboxes;
            } else {
                if (self.selectedFilter && self.selectedGridType === 'filter') {
                    // filter tabs
                    printTitle = printTitle + ' - ' + self.selectedFilter.filter.getTranslatedName();
                    records = self.workItemsFilters[self.selectedFilter.index];
                } else if (self.selectedGridType === 'starred') {
                    // starred
                    printTitle = printTitle + ' - ' + langService.get('starred_tab');
                    records = self.starredUserInboxes;
                } else {
                    records = self.userInboxes;
                }
            }

            printService
                .printData(records, headers, printTitle, null, null, null, true);
        }

        self.canShowPrint = function () {
            if (self.selectedFilter && self.selectedGridType === 'filter') {
                return self.workItemsFilters[self.selectedFilter.index] && self.workItemsFilters[self.selectedFilter.index].length > 0;
            } else if (self.selectedGridType === 'starred') {
                return self.starredUserInboxes.length > 0;
            } else {
                return self.userInboxes.length > 0;
            }
        }

        $scope.$on('$folder_deleted', function (event) {
            if (self.controllerName === 'userInboxCtrl') {
                self.reloadUserInboxes();
            }
        });

        $scope.$on('$terminated_from_notification', function ($event, data) {
            if (data === 'documentsNotifyDirectiveCtrl' && self.controllerName === 'userInboxCtrl') {
                self.reloadUserInboxes();
            }
        });

        var _forceSwitchOU = function (ouId) {
            authenticationService.selectDepartmentToLogin(ouId)
                .then(function () {
                    var newParams = {};
                    // use all params except ouId because ouId is only to switch ou
                    Object.keys($stateParams).forEach(function (key) {
                        if (key !== 'ouId') {
                            newParams[key] = $stateParams[key];
                        }
                    })
                    /*$state.go($state.current, newParams, {inherit:false});*/
                    $state.transitionTo($state.current, newParams, {
                        reload: true, inherit: false
                    });
                })
                .catch(function (error) {
                    errorCode.checkIf(error, 'INACTIVE_USER_ENTITY', function () {
                        toast.error(langService.get('can_not_login_with_inactive_user_or_entity'));
                    });
                });
        }

        self.checkAndOpenEmail = function () {
            var action = $stateParams.action, source = $stateParams.source,
                wobNumber = $stateParams['wob-num'], ouId = $stateParams.ouId, item;

            if (action && action === 'open' && source && source === 'email' && wobNumber) {
                item = _.find(userInboxes, function (workItem) {
                    return workItem.generalStepElm.workObjectNumber === wobNumber;
                });
                if (item) {
                    self.openEmailItem(item);
                } else {
                    userInboxService.getUserInboxItemByWobNumber(wobNumber)
                        .then(function (item) {
                            if (item) {
                                self.openEmailItem(item);
                            } else if (ouId) {
                                // if ouId exists in url, switch the organization to given ouId
                                _forceSwitchOU(ouId);
                            } else {
                                dialog.errorMessage(langService.get('work_item_not_found').change({
                                    wobNumber: wobNumber
                                }));
                            }
                        });
                }
            }
        }

        self.$onInit = function () {
            if (self.isUserInboxCtrl) {
                self.checkAndOpenEmail();
            }
            userFilterService.loadUserFilters().then(function (userFilters) {
                self.userFilters = $filter('orderBy')(userFilters, 'sortOptionId');
                _prepareFilters();
            });
            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);

            if (employeeService.getEmployee().getIntervalMin() && self.isUserInboxCtrl) {
                self.refreshInbox(employeeService.getEmployee().getIntervalMin());
            }
        }

    });
};
