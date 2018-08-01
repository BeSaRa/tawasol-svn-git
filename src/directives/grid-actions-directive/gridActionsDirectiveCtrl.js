module.exports = function (app) {
    app.controller('gridActionsDirectiveCtrl', function ($q,
                                                         $scope,
                                                         langService,
                                                         _,
                                                         Lookup,
                                                         $timeout,
                                                         lookupService,
                                                         employeeService,
                                                         Outgoing,
                                                         Incoming,
                                                         Internal,
                                                         EventHistory,
                                                         WorkItem,
                                                         G2G,
                                                         G2GMessagingHistory,
                                                         SentItemDepartmentInbox,
                                                         Information) {
        'ngInject';
        var self = this;
        self.controllerName = 'gridActionsDirectiveCtrl';
        self.langService = langService;

        self.shortcutActions = [];
        /**
         * @description Checks if actions will be shown or not
         * @param action
         * @returns {*}
         */
        self.isShowAction = function (action) {
            return action.checkShow(action, self.model);
        };

        /**
         * @description Get the text of action according to selected language
         * @param action
         * @param isShortcutRequest
         */
        self.getActionText = function (action, isShortcutRequest) {
            var langKey = "";
            if (action.hasOwnProperty('textCallback') && angular.isFunction(action.textCallback)) {
                return langService.get(action.textCallback(self.model));
            }

            if (angular.isFunction(action.text)) {
                if (isShortcutRequest)
                    langKey = action.text().shortcutText;
                else
                    langKey = action.text().contextText;
            }
            else {
                langKey = action.text;
            }
            return langService.get(langKey);
        };

        /**
         * @description Process the callback for the action button
         * @param action
         * @param $event
         */
        self.processMenu = function (action, $event) {
            if (action.hasOwnProperty('params') && action.params && action.params.length) {
                action.callback(self.model, action.params, $event);
            }
            else {
                action.callback(self.model, $event);
            }
        };

        /**
         * @description Filters the action buttons for showing/hiding shortcut actions
         * It will skip the separators
         * @returns {Array}
         */
        self.filterShortcuts = function (direction) {
            self.shortcutActions = [];
            var mainAction, action;
            direction = direction || self.menuDirection;
            for (var i = 0; i < self.gridActions.length; i++) {
                mainAction = self.gridActions[i];
                if (direction === 'vertical') {
                    action = _filterVerticalShortcuts(mainAction);
                }
                else {
                    action = _filterHorizontalShortcuts(mainAction);
                }
                if (action) {
                    angular.isArray(action) ? self.shortcutActions = self.shortcutActions.concat(action) : self.shortcutActions.push(action);
                }
            }
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
                if (self.isShowAction(mainAction)) {
                    var shortcutActions = [], subAction;
                    for (var k = 0; k < mainAction.subMenu.length; k++) {
                        subAction = mainAction.subMenu[k];
                        if (subAction.type.toLowerCase() === "action" && self.isShowAction(subAction)) {
                            if (!!self.shortcut) {
                                if (subAction.hasOwnProperty('shortcut') && subAction.shortcut) {
                                    shortcutActions.push(subAction);
                                }
                            }
                            else {
                                shortcutActions.push(subAction);
                            }
                        }
                    }
                    return shortcutActions;
                }
                return false;
            }
            else {
                if (mainAction.type.toLowerCase() === "action" && self.isShowAction(mainAction)) {
                    if (!!self.shortcut) {
                        if (mainAction.hasOwnProperty('shortcut') && mainAction.shortcut) {
                            return mainAction;
                        }
                        return false;
                    }
                    else {
                        return mainAction;
                    }
                }
                else {
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
                if (self.isShowAction(mainAction)) {
                    var subActionsToShow = [];
                    for (var j = 0; j < mainAction.subMenu.length; j++) {
                        var subAction = mainAction.subMenu[j];
                        /*If sub menu has separator, show it in vertical only. not in horizontal*/
                        if (subAction.type.toLowerCase() === "action" && self.isShowAction(subAction)) {
                            if (!!self.shortcut) {
                                if (subAction.hasOwnProperty('shortcut') && subAction.shortcut) {
                                    subActionsToShow.push(subAction);
                                }
                            }
                            else {
                                subActionsToShow.push(subAction);
                            }
                        }
                        else if (subAction.type.toLowerCase() === "separator" && !subAction.hide) {
                            subActionsToShow.push(subAction);
                        }
                    }
                    if (subActionsToShow.length) {
                        mainAction.subMenu = subActionsToShow;
                        return mainAction;
                    }
                    else {
                        return false;
                    }
                }
                return false;
            }
            else {
                /*
                * If main menu is of type "action", check if its allowed to show
                * else if main menu is of type "separator", and separator is allowed to show(not hidden)
                * else nothing(return false)
                * */
                if (mainAction.type.toLowerCase() === "action" && self.isShowAction(mainAction)) {
                    /*
                    * If shortcut is passed true in directive, this means, we need to show only shortcut actions
                    * else show all actions
                    * */
                    if (!!self.shortcut) {
                        if (mainAction.hasOwnProperty('shortcut') && mainAction.shortcut) {
                            return mainAction;
                        }
                        return false;
                    }
                    else {
                        return mainAction;
                    }
                }
                else if (mainAction.type.toLowerCase() === 'separator' && !mainAction.hide) {
                    return mainAction;
                }
                else {
                    return false;
                }
            }
        }

        /**
         * @description Filters the action buttons for showing/hiding context menu actions
         * @returns {Array}
         */
        self.filterContextMenuItems = function () {
            var contextMenu, contextMenuActions = [];
            for (var i = 0; i < self.gridActions.length; i++) {
                contextMenu = _filterContextMenuActions(self.gridActions[i]);
                if (contextMenu) {
                    angular.isArray(contextMenu) ? contextMenuActions = contextMenuActions.concat(contextMenu) : contextMenuActions.push(contextMenu);
                }
                //return !gridAction.hide && !(gridAction.hasOwnProperty('onlyShortcut') && gridAction.onlyShortcut);
            }
            return contextMenuActions;
        };

        function _filterContextMenuActions(mainAction) {
            /*
            * if main action has subMenu and subMenu has length
            * else main action doesn't have subMenu
            * */
            if (mainAction.hasOwnProperty('subMenu') && angular.isArray(mainAction.subMenu) && mainAction.subMenu.length) {
                if (self.isShowAction(mainAction)) {
                    var subActionsToShow = [];
                    for (var j = 0; j < mainAction.subMenu.length; j++) {
                        var subAction = mainAction.subMenu[j];
                        /*If sub menu is action, and action is allowed to show, show it
                        * If sub menu is separator and not hidden, show it
                        * If sub menu is document info, and info is allowed to show, show it
                        * */
                        if (subAction.type.toLowerCase() === "action" && self.isShowAction(subAction)) {
                            if (!(mainAction.hasOwnProperty('onlyShortcut') && mainAction.onlyShortcut)) {
                                subActionsToShow.push(subAction);
                            }
                        }
                        else if (subAction.type.toLowerCase() === "separator"&& !subAction.hide) {
                            subActionsToShow.push(subAction);
                        }
                        else if(subAction.type.toLowerCase() === 'info' && self.isShowAction(subAction)){
                            subActionsToShow.push(subAction);
                        }
                    }
                    if (subActionsToShow.length) {
                        mainAction.subMenu = subActionsToShow;
                        return mainAction;
                    }
                    else {
                        return false;
                    }
                }
                return false;
            }
            else {
                /*
                * If main menu is of type "action", check if its allowed to show
                * else if main menu is of type "separator", and separator is allowed to show(not hidden)
                * else nothing(return false)
                * */
                if (mainAction.type.toLowerCase() === "action" && self.isShowAction(mainAction)) {
                    /*
                    * If onlyShortcut is true in action, this means, we need not to show action
                    * else show action
                    * */
                    if (mainAction.hasOwnProperty('onlyShortcut') && mainAction.onlyShortcut) {
                        return false;
                    }
                    return mainAction;
                }
                else if (mainAction.type.toLowerCase() === 'separator' && !mainAction.hide) {
                    return mainAction;
                }
                else {
                    return false;
                }
            }
        }

        /**
         * @description Checks if security level information can be shown or not.
         * @param gridName
         * @returns {boolean}
         */
        self.showSecurityLevelInfo = function (gridName) {
            return true;
        };

        /**
         * @description Checks if comments information can be shown or not.
         * It will not show for Outgoing | Incoming | Internal | EventHistory | SentItemDepartmentInbox documents
         * @param gridName
         * @returns {boolean}
         */
        self.showCommentsInfo = function (gridName) {
            return !(self.model instanceof Outgoing
                || self.model instanceof Incoming
                || self.model instanceof Internal
                || self.model instanceof EventHistory
                || self.model instanceof SentItemDepartmentInbox
                || self.model instanceof G2G
                || self.model instanceof G2GMessagingHistory
            );
        };

        /**
         * @description Checks if priority level information can be shown or not.
         * @param gridName
         * @returns {boolean}
         */
        self.showPriorityLevel = function (gridName) {
            return !((self.model instanceof EventHistory && gridName === 'user-sent-items')
                || self.model instanceof G2GMessagingHistory);
        };

        /**
         * @description Checks if comments information can be shown or not.
         * @param gridName
         * @returns {boolean}
         */
        self.showAuthorInfo = function (gridName) {
            return !(self.model instanceof EventHistory
                || self.model instanceof SentItemDepartmentInbox
                || self.model instanceof G2G
                || self.model instanceof G2GMessagingHistory);
        };

        /**
         * @description Checks if tags information can be shown or not.
         * @param gridName
         * @returns {boolean}
         */
        self.showTagsInfo = function (gridName) {
            return !(self.model instanceof G2G
                || self.model instanceof G2GMessagingHistory
                || self.model instanceof EventHistory
                || self.model instanceof SentItemDepartmentInbox
            );
        };

        /**
         * @description Checks if broadcasted information can be shown or not.
         * @param gridName
         * @returns {boolean}
         */
        self.showBroadcastedInfo = function (gridName) {
            return gridName === 'user-inbox';
        };

        /**
         * @description Get the document information for context menu
         * @param property
         * @param gridName
         * @returns {*}
         */
        self.getDocumentInfo = function (property, gridName) {
            var model = self.model;
            if (property === 'securityLevel') {
                /*var securityLevel = model.hasOwnProperty('generalStepElm')
                    ? (model.generalStepElm.hasOwnProperty('securityLevel') ? model.generalStepElm.securityLevel : null)
                    : (model.hasOwnProperty('securityLevel') ? model.securityLevel : null);*/
                var securityLevel = null;
                if (model instanceof WorkItem) {
                    securityLevel = model.generalStepElm.securityLevel;
                }
                else if (model instanceof G2G) {
                    securityLevel = model.correspondence.securityLevel;
                }
                else if (model instanceof G2GMessagingHistory) {
                    securityLevel = model.securityLevel;
                }
                else {
                    securityLevel = model.hasOwnProperty('securityLevel') ? model.securityLevel : null;
                }
                if (!securityLevel)
                    return null;
                if (securityLevel instanceof Lookup)
                    return securityLevel.getTranslatedName();
                else
                    return lookupService.getLookupByLookupKey(lookupService.securityLevel, securityLevel).getTranslatedName();
            }
            else if (property === 'priorityLevel') {
                /*var priorityLevel = model.hasOwnProperty('generalStepElm')
                    ? (model.generalStepElm.hasOwnProperty('priorityLevel') ? model.generalStepElm.priorityLevel : null)
                    : (model.hasOwnProperty('priorityLevel') ? model.priorityLevel : null);
*/
                var priorityLevel = null;
                if (model instanceof WorkItem) {
                    priorityLevel = model.generalStepElm.priorityLevel;
                }
                else if (model instanceof G2G) {
                    priorityLevel = model.correspondence.priorityLevel;
                }
                else if (model instanceof G2GMessagingHistory) {
                    if (model.hasOwnProperty('prioretyLevel'))
                        priorityLevel = model.prioretyLevel;
                    else if (model.hasOwnProperty('priorityLevel'))
                        priorityLevel = model.priorityLevel;
                }
                else {
                    priorityLevel = model.hasOwnProperty('priorityLevel') ? model.priorityLevel : null;
                }

                if (priorityLevel === null || typeof priorityLevel === 'undefined')
                    return null;

                if (priorityLevel instanceof Lookup)
                    return priorityLevel.getTranslatedName();
                else
                    return lookupService.getLookupByLookupKey(lookupService.priorityLevel, priorityLevel).getTranslatedName();
            }
            else if (property === 'author') {
                if(model instanceof WorkItem){
                    return new Information(model.creatorOu).getTranslatedName();
                }
                return model.hasOwnProperty('creatorInfo')
                    ? new Information(model.creatorInfo).getTranslatedName()
                    : (model.hasOwnProperty('creatorOuInfo') ? new Information(model.creatorOuInfo).getTranslatedName() : '');
            }
            else if (property === 'tags') {
                return model.getTagsCount();
            }
            else if (property === 'comments') {
                return model.getCommentsCount();
            }
            else if (property === 'broadcasted') {
                return model.isBroadcasted() ? langService.get('yes') : langService.get('no');
            }
        };

        /**
         * @description Initialize and filter the shortcut actions.
         */
        $timeout(function () {
            self.filterShortcuts();
        });

        /**
         * @description Opens the grid shortcut menu
         * @param $mdMenu
         */
        self.openShortcutMenu = function ($mdMenu) {
            $mdMenu.open();
        };

        /**
         * @description Filter the shortcut actions for each model change/digest.
         */
        $scope.$watch(function () {
            return self.model;
        }, function () {
            self.filterShortcuts();
        });
    });
};	