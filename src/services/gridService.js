module.exports = function (app) {
    app.service('gridService', function ($cookies,
                                         employeeService,
                                         localStorageService,
                                         generator,
                                         langService) {
        'ngInject';
        var self = this;
        self.serviceName = 'gridService';
        var currentUser = employeeService.getEmployee().id;

        /**
         * @description Gets the grid limit options(records per page options)
         * @param records
         * @returns {*[]}
         */
        self.getGridLimitOptions = function (records) {
            return (
                [
                    5,
                    10,
                    20,
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (records.length + 21);
                        }
                    }
                ]
            );
        };

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
                group: 'userGroup'
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
                readyToExport: 'caReadyToExport'
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
                attachmentType: 'attachType'
            }
        };

        var _getStorageKey = function (storageKey, skipUserId) {
            if (!skipUserId)
                return currentUser + '_' + storageKey;
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
            var sortingStorage = self.getGridSortingKey();
            if (sortingStorage) {
                delete sortingStorage[gridName];
            }
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
         */
        self.removeGridSortingKey = function (gridName) {
            if (typeof gridName === 'string') {
                _removeGridSortingKey(gridName);
            }
            else if (angular.isArray(gridName) && gridName.length) {
                for (var i = 0; i < gridName.length; i++) {
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
         * @description Gets the pagination limit by grid name
         * @param gridName
         * If passed, return paging key by gridName.
         * Otherwise, returns all paging keys.
         * @returns {*}
         */
        self.getGridPagingLimitByGridName = function (gridName) {
            var pagingStorage = localStorageService.get(_getStorageKey(self.storageKeys.pagingLimit));
            if (pagingStorage && generator.isJsonString(pagingStorage)) {
                pagingStorage = JSON.parse(pagingStorage);
                if (pagingStorage && Object.keys(pagingStorage).length) {
                    if (gridName) {
                        debugger;
                        var gridPaging = {};
                        gridPaging[gridName] = pagingStorage[gridName];
                        return gridPaging;
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
            debugger;
            if (!pagingStorage) {
                pagingStorage = {};
                pagingStorage[gridName] = value;
            }
            else {
                if (pagingStorage[gridName] !== value)
                    pagingStorage[gridName] = value;
            }

            localStorageService.set(_getStorageKey(self.storageKeys.pagingLimit), JSON.stringify(pagingStorage));
        };


        function _removeGridPagingLimitByGridName(gridName) {
            var pagingStorage = self.getGridPagingLimitByGridName();
            if (pagingStorage) {
                delete pagingStorage[gridName];
            }
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
         */
        self.removeGridPagingLimitByGridName = function (gridName) {
            if (typeof gridName === 'string') {
                _removeGridPagingLimitByGridName(gridName);
            }
            else if (angular.isArray(gridName) && gridName.length) {
                for (var i = 0; i < gridName.length; i++) {
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

    });
};
