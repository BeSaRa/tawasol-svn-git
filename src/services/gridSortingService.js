module.exports = function (app) {
    app.service('gridSortingService', function (localStorageService,
                                                generator,
                                                toast,
                                                langService) {
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
                prepare: 'prepareOut',
                draft: 'draftOut',
                review: 'reviewOut',
                readyToSend: 'readyToSendOut',
                rejected: 'rejectedOut',
            },
            incoming: {
                scan: 'scanInc',
                review: 'reviewInc',
                readyToSend: 'readyToSendInc',
                rejected: 'rejectedInc',
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
                quick: 'searchQuick'
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


        function _removeGridSortingKey(gridName) {
            var sortingStorage = self.getGridSortingKey(gridName);
            if (sortingStorage) {
                delete sortingStorage[gridName];
            }
            if (sortingStorage && Object.keys(sortingStorage).length) {
                localStorageService.set(self.storageKey, JSON.stringify(sortingStorage));
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
            localStorageService.remove(self.storageKey);
        };
    });
};
