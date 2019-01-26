module.exports = function (app) {
    app.service('gridService', function ($cookies,
                                         employeeService,
                                         localStorageService,
                                         generator,
                                         langService,
                                         $filter,
                                         _,
                                         $q,
                                         rootEntity) {
        'ngInject';
        var self = this;
        self.serviceName = 'gridService';

        /**
         * @description Local storage key for all the grid level values
         * @type {string}
         */
        self.storageKeys = {
            sorting: 'sort',
            pagingLimit: 'limit'
        };
        /**
         * @description List of the grids with static values to be used for sorting.
         * The values from this object will be used to set and get the sorting keys from local storage
         */
        self.grids = {
            outgoing: {
                prepare: 'prepareOut',
                draft: 'draftOut',
                review: 'reviewOut',
                readyToSend: 'readyToSendOut',
                rejected: 'rejectedOut'
            },
            incoming: {
                scan: 'scanInc',
                review: 'reviewInc',
                readyToSend: 'readyToSendInc',
                rejected: 'rejectedInc'
            },
            internal: {
                prepare: 'prepareInt',
                draft: 'draftInt',
                review: 'reviewInt',
                readyToSend: 'readyToSendInt',
                rejected: 'rejectedInt',
                approved: 'approvedInt'
            },
            inbox: {
                userInbox: 'userInbox',
                sentItem: 'userSentItem',
                followupEmp: 'userFollowupEmp',
                favorite: 'userFavorite',
                folder: 'userFolder',
                proxy: 'userProxy',
                group: 'userGroup',
                starred: 'starred',
                inboxFilter: 'inboxFilter'
            },
            department: {
                incoming: 'depInc',
                returned: 'depRet',
                sentItem: 'depSent',
                readyToExport: 'depReadyToExport'
            },
            g2g: {
                incoming: 'g2gInc',
                sentItem: 'g2gSent',
                returned: 'g2gRet'
            },
            centralArchive: {
                readyToExport: 'caReadyToExport',
                sentItem: 'caSent'
            },
            search: {
                outgoing: 'searchOut',
                incoming: 'searchInc',
                internal: 'searchInt',
                general: 'searchGen',
                quick: 'searchQuick',
                outgoingIncoming: 'searchOutInc'
            },
            administration: {
                entity: 'entity',
                classification: 'classification',
                workflowGroup: 'wfGroup',
                jobTitle: 'jobTitle',
                rank: 'rank',
                publicAnnouncement: 'pubAnnounce',
                privateAnnouncement: 'priAnnounce',
                localization: 'local',
                role: 'role',
                smsTemplate: 'smsTemplate',
                documentType: 'docType',
                correspondenceSiteType: 'corrSiteType',
                organizationType: 'orgType',
                correspondenceSite: 'corrSite',
                applicationUser: 'appUser',
                referenceNumberPlan: 'refNoPlan',
                distributionList: 'distList',
                entityType: 'entityType',
                documentStatus: 'docStatus',
                theme: 'theme',
                organizationStructure: 'orgStructure',
                workflowAction: 'wfAction',
                documentFile: 'docFile',
                documentTemplate: 'docTemplate',
                attachmentType: 'attachType',
                dynamicMenuItem: 'dynamicMenu'
            }
        };

        var _getStorageKey = function (storageKey, skipUserId) {
            if (!skipUserId)
                return employeeService.getEmployee().id + '_' + storageKey;
            return storageKey;
        };

        /**
         * @description Gets the sorting key
         * @param gridName
         * If passed, return sorting key by gridName.
         * Otherwise, returns all sorting keys.
         * @returns {*}
         */
        self.getGridSortingKey = function (gridName) {
            var sortingStorage = localStorageService.get(self.storageKeys.sorting);
            if (sortingStorage && generator.isJsonString(sortingStorage)) {
                sortingStorage = JSON.parse(sortingStorage);
                if (sortingStorage && Object.keys(sortingStorage).length) {
                    if (gridName) {
                        var gridSort = {};
                        gridSort[gridName] = sortingStorage[gridName];
                        return gridSort;
                    }
                    return sortingStorage;
                }
            }
            return null;
        };

        /**
         * @description Set the sorting key for the grid
         * @param gridName
         * @param value
         */
        self.setGridSortingKey = function (gridName, value) {
            var sortingStorage = self.getGridSortingKey();
            if (!sortingStorage) {
                sortingStorage = {};
            }
            sortingStorage[gridName] = value;
            localStorageService.set(self.storageKeys.sorting, JSON.stringify(sortingStorage));
        };

        function _removeGridSortingKey(gridName) {
            // get all the saved sorting
            var sortingStorage = self.getGridSortingKey();
            // if found saved sorting, remove the given grid sorting
            if (sortingStorage) {
                delete sortingStorage[gridName];
            }
            // after delete, if the sorting still has any other grids, save the sorting again to update.
            if (sortingStorage && Object.keys(sortingStorage).length) {
                localStorageService.set(self.storageKeys.sorting, JSON.stringify(sortingStorage));
                return 1;
            }
            self.removeAllSorting();
            return -1;
        }

        /**
         * @description Delete the sorting key for the grid
         * @param {string | string[]}gridName
         * if passed, it will remove sorting key for given grid
         * otherwise, remove the sorting keys for all grids
         */
        self.removeGridSortingKey = function (gridName) {
            if (!gridName)
                self.removeAllSorting();
            if (typeof gridName === 'string') {
                _removeGridSortingKey(gridName);
            } else if (angular.isArray(gridName) && gridName.length) {
                for (var i = 0; i < gridName.length; i++) {
                    // remove the saved sorting one by one and if saved sorting finished and removed from storage, break the loop.
                    if (_removeGridSortingKey(gridName[i]) === -1)
                        break;
                }
            }
        };

        /**
         * @description Removes all the sorting keys
         */
        self.removeAllSorting = function () {
            localStorageService.remove(self.storageKeys.sorting);
        };

        /**
         * @description Gets the grid limit options(records per page options)
         * @param records
         * @param gridName
         * Used to differentiate between grids in case of overrided values
         * @param useSearchAmountLimit
         * Used to set the highest records per page limit for any grid from global settings
         * @returns {*[]}
         */
        self.getGridLimitOptions = function (gridName, records, useSearchAmountLimit) {
            var count = null;
            if (typeof records !== 'undefined' && records !== null)
                count = (typeof records === "number") ? records : records.length;

            if (gridName === self.grids.inbox.sentItem) {
                return [5, 10, 20, 100, 200];
            } else if (gridName === self.grids.inbox.userInbox) {
                return [5, 10, 20, 50, 70, 90, 100, 200];
            } else if (gridName === self.grids.inbox.inboxFilter) {
                return [5, 10, 20, 200];
            } else if (gridName === self.grids.administration.localization) {
                return [5, 10, 20, 40, 50, 80, 100];
            } else {
                return (
                    [
                        5, 10, 20,
                        {
                            label: useSearchAmountLimit ? rootEntity.returnRootEntity().settings.searchAmountLimit.toString() : langService.get('all'),
                            value: function () {
                                if (useSearchAmountLimit) {
                                    return (rootEntity.returnRootEntity().settings.searchAmountLimit);
                                } else {
                                    // if count is not null, return (count + 21) records
                                    // if count is null, return the (max number + 21) records
                                    if (count !== null)
                                        return (count + 21);
                                    else
                                        return (20 + 21);
                                }
                            }
                        }
                    ]
                );
            }
        };

        /**
         * @description Gets the pagination limit by grid name
         * @param gridName
         * If passed, return paging key by gridName.
         * Otherwise, returns all paging keys.
         * @param returnObjectIfGridName
         * Use only when gridName is passed
         * @returns {*}
         */
        self.getGridPagingLimitByGridName = function (gridName, returnObjectIfGridName) {
            var pagingStorage = localStorageService.get(_getStorageKey(self.storageKeys.pagingLimit));
            if (pagingStorage && generator.isJsonString(pagingStorage)) {
                pagingStorage = JSON.parse(pagingStorage);
                if (pagingStorage && Object.keys(pagingStorage).length) {
                    if (gridName) {
                        if (returnObjectIfGridName) {
                            var gridPaging = {};
                            gridPaging[gridName] = pagingStorage[gridName];
                            return gridPaging;
                        } else {
                            return Number(pagingStorage[gridName]);
                        }
                    }
                    return pagingStorage;
                }
            }
            return null;
        };

        /**
         * @description Set the paging limit for the grid
         * @param gridName
         * @param value
         */
        self.setGridPagingLimitByGridName = function (gridName, value) {
            var pagingStorage = self.getGridPagingLimitByGridName();
            if (!pagingStorage) {
                pagingStorage = {};
                pagingStorage[gridName] = value;
            } else {
                if (pagingStorage[gridName] !== value)
                    pagingStorage[gridName] = value;
            }

            localStorageService.set(_getStorageKey(self.storageKeys.pagingLimit), JSON.stringify(pagingStorage));
        };

        function _removeGridPagingLimitByGridName(gridName) {
            // get all the saved paging
            var pagingStorage = self.getGridPagingLimitByGridName();
            // if found saved paging, remove the given grid paging
            if (pagingStorage) {
                delete pagingStorage[gridName];
            }
            // after delete, if the paging still has any other grids, save the paging again to update.
            if (pagingStorage && Object.keys(pagingStorage).length) {
                localStorageService.set(_getStorageKey(self.storageKeys.pagingLimit), JSON.stringify(pagingStorage));
                return 1;
            }
            self.removeAllPagingLimit();
            return -1;
        }

        /**
         * @description Delete the paging limit for the grid
         * @param {string | string[]}gridName
         * if passed, it will remove paging key for given grid or array of grids
         * otherwise, remove the paging keys for all grids
         */
        self.removeGridPagingLimitByGridName = function (gridName) {
            if (!gridName)
                self.removeAllPagingLimit();
            if (typeof gridName === 'string') {
                _removeGridPagingLimitByGridName(gridName);
            } else if (angular.isArray(gridName) && gridName.length) {
                for (var i = 0; i < gridName.length; i++) {
                    // remove the saved paging one by one and if saved paging finished and removed from storage, break the loop.
                    if (_removeGridPagingLimitByGridName(gridName[i]) === -1)
                        break;
                }
            }
        };

        /**
         * @description Removes all the paging keys
         */
        self.removeAllPagingLimit = function () {
            localStorageService.remove(_getStorageKey(self.storageKeys.pagingLimit));
        };

        /**
         * @description Search the text in the grid data
         * @param grid
         * @param recordsCopy
         * copy of original records which will be returned in case search is empty.
         * @param callback
         * @returns {*}
         */
        self.searchGridData = function (grid, recordsCopy, callback) {
            if (callback){
                if (!grid.searchText)
                    return $q.resolve(recordsCopy);
                else {
                    return callback(grid.searchText, recordsCopy);
                }
            }
            else {
                if (!grid.searchText)
                    return recordsCopy;
                else {
                    self.gridToSearch = grid;
                    return $filter('filter')(recordsCopy, _searchRecords);
                }
            }
        };

        var _searchRecords = function (item, index, records) {
            var searchTextCopy = angular.copy(self.gridToSearch.searchText.trim().toLowerCase());
            var propertyToSearch, propertyValue, result;
            for (var property in self.gridToSearch.searchColumns) {
                propertyToSearch = self.gridToSearch.searchColumns[property];
                if (typeof propertyToSearch === 'function') {
                    propertyToSearch = propertyToSearch(item);
                }
                // if property to search has value(property name defined), then search, otherwise, skip search
                if (propertyToSearch) {
                    // propertyValue = _.result(item, propertyToSearch);
                    propertyValue = generator.getNestedPropertyValue(item, propertyToSearch);
                    if (propertyValue && propertyValue.toString().toLowerCase().indexOf(searchTextCopy) > -1) {
                        result = true;
                        break;
                    }
                    result = false;
                }
                result = false;
            }
            return result;
        };

        self.checkToShowAction = function (action) {
            if (action.hide)
                return false;
            else {
                var hasPermission = true;
                // check if permission key(s) property available and user has permissions regarding the permission key(s)
                if (action.hasOwnProperty('permissionKey')) {
                    if (typeof action.permissionKey === 'string') {
                        hasPermission = employeeService.hasPermissionTo(action.permissionKey);
                    } else if (angular.isArray(action.permissionKey) && action.permissionKey.length) {
                        if (action.hasOwnProperty('checkAnyPermission')) {
                            hasPermission = employeeService.getEmployee() && employeeService.getEmployee().hasAnyPermissions(action.permissionKey);
                        } else {
                            hasPermission = employeeService.getEmployee() && employeeService.getEmployee().hasThesePermissions(action.permissionKey);
                        }
                    }
                }
                // if permission is available for action, check where to show, otherwise return permission value only
                if (hasPermission) {
                    var showInViewOnly = action.hasOwnProperty('showInViewOnly') && !!action.showInViewOnly,
                        showInView = action.hasOwnProperty('showInView') && !!action.showInView,
                        sticky = action.hasOwnProperty('sticky') && !!action.sticky,
                        actionFrom = action.actionFrom.toLowerCase();
                    if (actionFrom === 'popup') {
                        if (!showInView)
                            hasPermission = false;
                    }
                    else if (actionFrom === 'grid') {
                        if (showInViewOnly)
                            hasPermission = false;
                    }
                    else if (actionFrom === 'sticky') {
                        // add any condition, if required later
                        if (sticky)
                            hasPermission = true;
                    }
                }
                return hasPermission;
            }
        };

    });
};
