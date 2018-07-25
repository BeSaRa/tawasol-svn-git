module.exports = function (app) {
    app.service('gridSortingService', function (localStorageService,
                                                generator) {
        'ngInject';
        var self = this;
        self.serviceName = 'gridSortingService';
        self.gridSortings = {};

        /**
         * @description Local storage key for all the grid sorting values
         * @type {string}
         */
        self.storageKey = 'sort';
        /**
         * @description List of the grids with static values to be used for sorting.
         * The values from this object will be used to set and get the sorting keys from local storage
         */
        self.grids = {
            outgoing: {
                prepare: 'prepareOutgoing',
                draft: 'draftOutgoing',
                review: 'reviewOutgoing',
                readyToSend: 'readyToSendOutgoing',
                rejected: 'rejectedOutgoing',
            },
            incoming: {
                scan: 'scanIncoming',
                review: 'reviewIncoming',
                readyToSend: 'readyToSendIncoming',
                rejected: 'rejectedIncoming',
            },
            internal: {
                prepare: 'prepareInternal',
                draft: 'draftInternal',
                review: 'reviewInternal',
                readyToSend: 'readyToSendInternal',
                rejected: 'rejectedInternal',
                approved: 'approvedInternal'
            },
            userInbox: {
                inbox: 'inbox',
                sentItems: 'userSentItems',
                followupEmp: 'userFollowupEmp',
                favorite: 'userFavorite',
                folder: 'userFolder',
                proxy: 'userProxy',
                group: 'userGroup'
            },
            department: {
                incoming: 'depIncoming',
                returned: 'depReturned',
                sentItems: 'depRentItems',
                readyToExport: 'depReadyToExport'
            },
            g2g: {
                incoming: 'g2gIncoming',
                sentItems: 'g2gSentItems',
                returned: 'g2gReturned'
            },
            centralArchive: {
                readyToExport: 'caReadyToExport'
            },
            search: {
                outgoing: 'searchOutgoing',
                incoming: 'searchIncoming',
                internal: 'searchInternal',
                general: 'searchGeneral',
                quick: 'searchQuick'
            },
            administration: {}
        };

        /**
         * @description Gets the sorting key
         * @param gridName
         * If passed, return sorting key by gridName.
         * Otherwise, returns all sorting keys.
         * @returns {*}
         */
        self.getGridSortingKey = function (gridName) {
            var sortingStorage = localStorageService.get(self.storageKey);
            if (sortingStorage && generator.isJsonString(sortingStorage)) {
                sortingStorage = JSON.parse(sortingStorage);
                if (sortingStorage && Object.keys(sortingStorage).length) {
                    if (gridName) {
                        return {[gridName]: sortingStorage[gridName]};
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
            localStorageService.set(self.storageKey, JSON.stringify(sortingStorage));
        };

        /**
         * @description Delete the sorting key for the grid
         * @param gridName
         */
        self.removeGridSortingKey = function (gridName) {
            var sortingStorage = self.getGridSortingKey(gridName);
            if (sortingStorage) {
                delete sortingStorage[gridName];
            }
            if (sortingStorage && Object.keys(sortingStorage).length) {
                localStorageService.set(self.storageKey, JSON.stringify(sortingStorage));
                return;
            }
            localStorageService.remove('sort');
        };
    });
};
