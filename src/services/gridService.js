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
            pagingLimit: 'limit',
            truncateSubject: 'truncate'
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
                administrators: 'administrators',
                g2gPending: 'g2gPending',
                viewersLog: 'viewersLog',
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
            },
            others: {
                linkedDoc: 'linkedDoc',
                linkedDocSearch: 'linkedDocSearch',
                linkedDocAttachments: 'linkedDocAttach',
                versionSelect: 'versionSelect',
                viewTask: 'viewTask',
                taskDoc: 'taskDoc',
                comments: 'comment',
                commentInclude: 'commentInc',
                commentExclude: 'commentExc'
            },
            trackingSheet: {
                workflowHistory: 'vts_workflowHistory',
                linkedDocsHistory: 'vts_linkedDocsHistory',
                attachmentsHistory: 'vts_attachmentsHistory',
                mergedLinkedDocsHistory: 'vts_mergedLinkedDocsHistory',
                linkedEntitiesHistory: 'vts_linkedEntitiesHistory',
                destinationsHistory: 'vts_destinationsHistory',
                contentViewHistory: 'vts_contentViewHistory',
                smsLogs: 'vts_smsLogs',
                outgoingDeliveryReport: 'vts_outDeliveryReport',
                fullHistory: 'vts_fullHistory',
                docLinkViewers: 'vts_docLinkViewer',
                mergedLinkedDocsHistoryActions: 'vts_mergedLinkedDocsHistoryActions',
                contentViewHistoryViewers: 'vts_contentViewHistoryViewers'
            },
            launch: {
                favoritesUsers: 'launchFavUsers',
                favoritesOUs: 'launchFavOUs',
                users: 'launchUsers',
                managers: 'launchManagers',
                privateUsers: 'launchPrivateUsers',
                presidentMinisters: 'launchPreMinisters',
                wfGroups: 'launchWfGroups',
                ous: 'launchOus',
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
            } else if (gridName === self.grids.inbox.inboxFilter || gridName === self.grids.department.incoming) {
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
            if (callback) {
                if (!grid.searchText)
                    return $q.resolve(recordsCopy);
                else {
                    return callback(grid.searchText, null);
                }
            } else {
                if (!grid.searchText)
                    return recordsCopy;
                else {
                    self.gridToSearch = grid;
                    return $filter('filter')(recordsCopy, _searchRecords);
                }
            }
        };

        /**
         * @description Search given string in records
         * @param item
         * @param index
         * @param records
         * @returns {boolean}
         * @private
         */
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

        self.gridActionOptions = {
            direction: {
                horizontal: 'horizontal',
                vertical: 'vertical',
                context: 'context'
            },
            location: {
                grid: 'grid',
                popup: 'popup',
                sticky: 'sticky'
            }
        };

        /**
         * @description Check if action can be shown or not depending on permission, show in view, show in grid, sticky
         * @param action
         * @returns {boolean}
         */
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
                    var showInViewPopupOnly = action.hasOwnProperty('showInViewOnly') ? action.showInViewOnly : false,
                        showInViewPopup = !action.hasOwnProperty('showInView') ? true : action.showInView,
                        isSticky = action.hasOwnProperty('sticky') && !!action.sticky,
                        actionFrom = action.hasOwnProperty('actionFrom') && action.actionFrom ? action.actionFrom.toLowerCase() : self.gridActionOptions.location.grid;

                    if (actionFrom === self.gridActionOptions.location.popup) {
                        hasPermission = showInViewPopup || showInViewPopupOnly;
                    } else if (actionFrom === self.gridActionOptions.location.grid) {
                        if (showInViewPopupOnly)
                            hasPermission = false;
                    } else if (actionFrom === self.gridActionOptions.location.sticky) {
                        hasPermission = isSticky;
                    }
                }
                return hasPermission;
            }
        };

        /**
         * @description Filters the shortcut actions for grid
         * @param actions
         * @param direction
         * @param skipShortcut
         * Set it to true if you want to display all actions as same as context menu
         * @returns {Array}
         */
        self.getShortcutActions = function (actions, direction, skipShortcut) {
            actions = actions || [];
            if (skipShortcut) {
                return self.getContextMenuActions(actions);
            }
            var shortcutActions = [], actionsCopy = angular.copy(actions), mainAction, action;
            direction = direction || self.gridActionOptions.direction.horizontal;
            for (var i = 0; i < actionsCopy.length; i++) {
                mainAction = actionsCopy[i];
                mainAction.actionFrom = self.gridActionOptions.location.grid;

                if (direction === self.gridActionOptions.direction.vertical) {
                    action = _filterVerticalShortcuts(mainAction);
                } else {
                    action = _filterHorizontalShortcuts(mainAction);
                }
                if (action) {
                    angular.isArray(action) ? shortcutActions = shortcutActions.concat(action) : shortcutActions.push(action);
                }
            }
            return shortcutActions;
        };

        /**
         * @description Filter the actions to be shown in horizontal direction depending on permissions and values.
         * It will skip the separators
         * @param mainAction
         * @returns {*}
         * Returns the array of actions(main or sub menu action) or false.
         * @private
         */
        function _filterHorizontalShortcuts(mainAction) {
            if (mainAction.hasOwnProperty('subMenu') && angular.isArray(mainAction.subMenu) && mainAction.subMenu.length) {
                if (self.checkToShowAction(mainAction)) {
                    var shortcutActions = [], subAction;
                    for (var k = 0; k < mainAction.subMenu.length; k++) {
                        subAction = mainAction.subMenu[k];
                        subAction.actionFrom = self.gridActionOptions.location.grid;
                        if (subAction.type.toLowerCase() === "action" && self.checkToShowAction(subAction)) {
                            if (subAction.hasOwnProperty('shortcut') && subAction.shortcut) {
                                shortcutActions.push(subAction);
                            }
                        }
                    }
                    return shortcutActions;
                }
                return false;
            } else {
                if (mainAction.type.toLowerCase() === "action" && self.checkToShowAction(mainAction)) {
                    if (mainAction.hasOwnProperty('shortcut') && mainAction.shortcut) {
                        return mainAction;
                    }
                    return false;
                } else {
                    return false;
                }
            }
        }

        /**
         * @description Filter the actions to be shown in vertical direction depending on permissions and values.
         * It will include the separators
         * @param mainAction
         * @returns {*}
         * Returns the main action.
         * If there is no sub menu, main action will be returned.
         * If there is sub menu, sub menu array will be replaced with available sub menus according to permissions and values and main action will be returned;
         * If no condition matches, return false;
         * @private
         */
        function _filterVerticalShortcuts(mainAction) {
            /*
            * if main action has subMenu and subMenu has length
            * else main action doesn't have subMenu
            * */
            if (mainAction.hasOwnProperty('subMenu') && angular.isArray(mainAction.subMenu) && mainAction.subMenu.length) {
                if (self.checkToShowAction(mainAction)) {
                    var subActionsToShow = [];
                    for (var j = 0; j < mainAction.subMenu.length; j++) {
                        var subAction = mainAction.subMenu[j];
                        subAction.actionFrom = self.gridActionOptions.location.grid;
                        /*If sub menu has separator, show it in vertical only. not in horizontal*/
                        if (subAction.type.toLowerCase() === "action" && self.checkToShowAction(subAction)) {
                            if (subAction.hasOwnProperty('shortcut') && subAction.shortcut) {
                                subActionsToShow.push(subAction);
                            }
                        } else if (subAction.type.toLowerCase() === "separator" && !subAction.hide) {
                            subActionsToShow.push(subAction);
                        }
                    }
                    if (subActionsToShow.length) {
                        mainAction.subMenu = subActionsToShow;
                        return mainAction;
                    } else {
                        return false;
                    }
                }
                return false;
            } else {
                /*
                * If main menu is of type "action", check if its allowed to show
                * else if main menu is of type "separator", and separator is allowed to show(not hidden)
                * else nothing(return false)
                * */
                if (mainAction.type.toLowerCase() === "action" && self.checkToShowAction(mainAction)) {
                    if (mainAction.hasOwnProperty('shortcut') && mainAction.shortcut) {
                        return mainAction;
                    }
                    return false;
                } else if (mainAction.type.toLowerCase() === 'separator' && !mainAction.hide) {
                    return mainAction;
                } else {
                    return false;
                }
            }
        }

        /**
         * @description Filters the action to show as context menu actions
         * @returns {Array}
         */
        self.getContextMenuActions = function (actions, actionFrom) {
            actions = actions || [];
            var contextMenu, contextMenuActions = [], actionsCopy = angular.copy(actions);
            for (var i = 0; i < actionsCopy.length; i++) {
                contextMenu = _filterContextMenuItems(actionsCopy[i], actionFrom);
                if (contextMenu) {
                    angular.isArray(contextMenu) ? contextMenuActions = contextMenuActions.concat(contextMenu) : contextMenuActions.push(contextMenu);
                }
                //return !gridAction.hide && !(gridAction.hasOwnProperty('onlyShortcut') && gridAction.onlyShortcut);
            }
            return contextMenuActions;
        };

        /**
         * @description filters the context menu items
         * @param mainAction
         * @param actionFrom
         * @returns {*}
         * @private
         */
        function _filterContextMenuItems(mainAction, actionFrom) {
            actionFrom = actionFrom || self.gridActionOptions.location.grid;
            mainAction.actionFrom = actionFrom;
            /*
            * if main action has subMenu and subMenu has length
            * else main action doesn't have subMenu
            * */
            if (mainAction.hasOwnProperty('subMenu') && angular.isArray(mainAction.subMenu) && mainAction.subMenu.length) {
                if (self.checkToShowAction(mainAction)) {
                    var subActionsToShow = [];
                    for (var j = 0; j < mainAction.subMenu.length; j++) {
                        var subAction = mainAction.subMenu[j];
                        subAction.actionFrom = actionFrom;
                        /*If sub menu is action, and action is allowed to show, show it
                        * If sub menu is separator and not hidden, show it
                        * If sub menu is document info, and info is allowed to show, show it
                        * */
                        if (subAction.type.toLowerCase() === "action" && self.checkToShowAction(subAction)) {
                            if (!(mainAction.hasOwnProperty('onlyShortcut') && mainAction.onlyShortcut)) {
                                subActionsToShow.push(subAction);
                            }
                        } else if (subAction.type.toLowerCase() === "separator" && !subAction.hide) {
                            subActionsToShow.push(subAction);
                        } else if (subAction.type.toLowerCase() === 'info' && self.checkToShowAction(subAction)) {
                            subActionsToShow.push(subAction);
                        }
                    }
                    if (subActionsToShow.length) {
                        mainAction.subMenu = subActionsToShow;
                        return mainAction;
                    } else {
                        return false;
                    }
                }
                return false;
            } else {
                /*
                * If main menu is of type "action", check if its allowed to show
                * else if main menu is of type "separator", and separator is allowed to show(not hidden)
                * else nothing(return false)
                * */
                if (mainAction.type.toLowerCase() === "action" && self.checkToShowAction(mainAction)) {
                    /*
                    * If onlyShortcut is true in action, this means, we need not to show action
                    * else show action
                    * */
                    if (mainAction.hasOwnProperty('onlyShortcut') && mainAction.onlyShortcut) {
                        return false;
                    }
                    return mainAction;
                } else if (mainAction.type.toLowerCase() === 'separator' && !mainAction.hide) {
                    return mainAction;
                } else {
                    return false;
                }
            }
        }

        /**
         * @description Filters the shortcut actions for grid
         * @param actions
         * Set it to true if you want to display all actions as same as context menu
         * @param listOfActions
         * @returns {Array}
         */
        self.getStickyActions = function (actions, listOfActions) {
            actions = actions || [];
            var stickyActions = listOfActions ? listOfActions : [], action, actionCopy, isSticky, canShow;
            if (!stickyActions)
                return [];

            for (var i = 0; i < actions.length; i++) {
                action = actions[i];
                actionCopy = angular.copy(action);
                actionCopy.actionFrom = self.gridActionOptions.location.sticky;
                isSticky = actionCopy.hasOwnProperty('sticky') && !!actionCopy.sticky;
                canShow = self.checkToShowAction(actionCopy);

                if (isSticky && canShow) {
                    stickyActions.push(actionCopy);
                }
                if (actionCopy.hasOwnProperty('subMenu') && actionCopy.subMenu.length) {
                    // add dummy parent property to subMenu
                    actionCopy.subMenu = _.map(actionCopy.subMenu, function (subMenu) {
                        subMenu.parent = angular.copy(actionCopy);
                        delete subMenu.parent.subMenu;

                        return subMenu;
                    });
                    self.getStickyActions(actionCopy.subMenu, stickyActions);
                }
            }
            // the returned sticky actions for the viewer
            return stickyActions;
        };


        /**
         * @description Gets the truncate subject key by grid name
         * @param gridName
         * If passed, return truncate subject key by gridName.
         * Otherwise, returns all truncate subject keys.
         * @param returnObjectIfGridName
         * Use only when gridName is passed
         * @returns {*}
         */
        self.getGridSubjectTruncateByGridName = function (gridName, returnObjectIfGridName) {
            var truncateStorage = localStorageService.get(_getStorageKey(self.storageKeys.truncateSubject));
            if (truncateStorage && generator.isJsonString(truncateStorage)) {
                truncateStorage = JSON.parse(truncateStorage);
                if (truncateStorage && Object.keys(truncateStorage).length) {
                    if (gridName) {
                        if (returnObjectIfGridName) {
                            var gridSubjectTruncate = {};
                            gridSubjectTruncate[gridName] = truncateStorage[gridName];
                            return gridSubjectTruncate;
                        } else {
                            return !!(truncateStorage[gridName]);
                        }
                    }
                    return truncateStorage;
                }
            }
            return false;
        };

        /**
         * @description Set the truncate subject key for the grid
         * @param gridName
         * @param value
         */
        self.setGridSubjectTruncateByGridName = function (gridName, value) {
            var truncateStorage = self.getGridSubjectTruncateByGridName();
            if (!truncateStorage) {
                truncateStorage = {};
                truncateStorage[gridName] = value;
            } else {
                if (truncateStorage[gridName] !== value)
                    truncateStorage[gridName] = value;
            }

            localStorageService.set(_getStorageKey(self.storageKeys.truncateSubject), JSON.stringify(truncateStorage));
        };

        function _removeGridSubjectTruncateByGridName(gridName) {
            // get all the saved truncate subject keys
            var truncateStorage = self.getGridSubjectTruncateByGridName();
            // if found saved truncate key, remove the given grid truncate key
            if (truncateStorage) {
                delete truncateStorage[gridName];
            }
            // after delete, if the truncate subject still has any other grids, save the truncate subject again to update.
            if (truncateStorage && Object.keys(truncateStorage).length) {
                localStorageService.set(_getStorageKey(self.storageKeys.truncateSubject), JSON.stringify(truncateStorage));
                return 1;
            }
            self.removeAllGridSubjectTruncate();
            return -1;
        }

        /**
         * @description Delete the truncate subject value for the grid
         * @param {string | string[]}gridName
         * if passed, it will remove truncate subject key for given grid or array of grids
         * otherwise, remove the truncate subject keys for all grids
         */
        self.removeGridPagingTruncateByGridName = function (gridName) {
            if (!gridName)
                self.removeAllGridSubjectTruncate();
            if (typeof gridName === 'string') {
                _removeGridSubjectTruncateByGridName(gridName);
            } else if (angular.isArray(gridName) && gridName.length) {
                for (var i = 0; i < gridName.length; i++) {
                    // remove the saved truncate value one by one and if saved truncate values finished and removed from storage, break the loop.
                    if (_removeGridSubjectTruncateByGridName(gridName[i]) === -1)
                        break;
                }
            }
        };

        /**
         * @description Removes all the truncate subject keys
         */
        self.removeAllGridSubjectTruncate = function () {
            localStorageService.remove(_getStorageKey(self.storageKeys.truncateSubject));
        };
    });
};
