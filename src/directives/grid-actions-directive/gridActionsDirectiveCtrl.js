module.exports = function (app) {
    app.controller('gridActionsDirectiveCtrl', function ($q,
                                                         $scope,
                                                         langService,
                                                         $timeout,
                                                         _,
                                                         Lookup,
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

        $timeout(function () {
            self.menuDirection = self.menuDirection || 'horizontal';
        });

        self.isShowAction = function (action) {
            if (action.hasOwnProperty('checkAnyPermission')) {
                return action.checkShow(action, self.model, action.checkAnyPermission);
            }
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
            if (action.hasOwnProperty('params') && action.params) {
                action.callback(self.model, action.params, $event);
            }
            else {
                action.callback(self.model, $event);
            }
        };

        /**
         * @description Filters the action buttons for showing/hiding shortcut actions
         * It will skip the separators
         * @param direction
         * @returns {Array}
         */
        self.filterShortcuts = function (direction) {
            var mainAction, subAction;
            var shortcutActions = [];
            if (!!self.shortcut) {
                for (var i = 0; i < self.gridActions.length; i++) {
                    mainAction = self.gridActions[i];
                    if (mainAction.type.toLowerCase() === "action" && !mainAction.hide) {
                        /*
                        * If action has property (shortcut) and it has value = true
                        * Else if action don't has property (shortcut) or has property (shortcut) but value = false and has subMenu property with array value
                        * */
                        if (mainAction.hasOwnProperty('shortcut') && mainAction.shortcut) {
                            shortcutActions.push(mainAction);
                        }
                        else if (
                            (!mainAction.hasOwnProperty('shortcut') || (mainAction.hasOwnProperty('shortcut') && !mainAction.shortcut))
                            && (mainAction.hasOwnProperty('subMenu') && angular.isArray(mainAction.subMenu))
                        ) {
                            for (var j = 0; j < mainAction.subMenu.length; j++) {
                                subAction = mainAction.subMenu[j];

                                /*If sub menu has separator, show it in vertical only. not in horizontal*/
                                if (direction === 'vertical') {
                                    if (subAction.type.toLowerCase() === "action" && !subAction.hide
                                        && (subAction.hasOwnProperty('shortcut') && subAction.shortcut)
                                    ) {
                                        shortcutActions.push(mainAction);
                                    }
                                    else if (subAction.type.toLowerCase() === "separator" && !subAction.hide)
                                        shortcutActions.push(mainAction);
                                }
                                else if (direction === 'horizontal') {
                                    if (subAction.type.toLowerCase() === "action" && !subAction.hide && subAction.hasOwnProperty('shortcut') && subAction.shortcut) {
                                        shortcutActions.push(subAction);
                                    }
                                }
                            }
                        }
                    }
                    //skip the separators in shortcut menu
                    /*else if (mainAction.type.toLowerCase() === "separator" && !mainAction.hide) {
                        shortcutActions.push(mainAction)
                    }*/
                }
                return shortcutActions;
            }
            return self.gridActions;

            /*if (direction === "vertical") {
                for (var i = 0; i < self.gridActions.length; i++) {
                    mainAction = self.gridActions[i];
                    if (mainAction.type.toLowerCase() === "action" && !mainAction.hide) {
                        /!*
                        * If action has property (shortcut) and it has value = true
                        * Else if action don't has property (shortcut) or has property (shortcut) but value = false and has subMenu property with array value
                        * *!/
                        if (mainAction.hasOwnProperty('shortcut') && mainAction.shortcut) {
                            shortcutActions.push(mainAction);
                        }
                        else if (
                            (!mainAction.hasOwnProperty('shortcut') || (mainAction.hasOwnProperty('shortcut') && !mainAction.shortcut))
                            && (mainAction.hasOwnProperty('subMenu') && angular.isArray(mainAction.subMenu))
                        ) {
                            for (var j = 0; j < mainAction.subMenu.length; j++) {
                                subAction = mainAction.subMenu[j];
                                if (subAction.type.toLowerCase() === "action" && !subAction.hide
                                    && (subAction.hasOwnProperty('shortcut') && subAction.shortcut)
                                ) {
                                    shortcutActions.push(mainAction);
                                }

                                /!*If sub menu has separator, show it in vertical only. not in horizontal*!/
                                else if (subAction.type.toLowerCase() === "separator" && !subAction.hide)
                                 shortcutActions.push(mainAction)
                            }
                        }
                    }
                    else if (mainAction.type.toLowerCase() === "separator" && !mainAction.hide) {
                        shortcutActions.push(mainAction)
                    }
                }
                return shortcutActions;
            }
            else if (direction === "horizontal") {
                for (var i = 0; i < self.gridActions.length; i++) {
                    mainAction = self.gridActions[i];
                    if (mainAction.type.toLowerCase() === "action" && !mainAction.hide) {
                        /!*
                       * If action has property (shortcut) and it has value = true
                       * Else if action don't has property (shortcut) or has property (shortcut) but value = false and has subMenu property with array value
                       * *!/
                        if (mainAction.hasOwnProperty('shortcut') && mainAction.shortcut) {
                            shortcutActions.push(mainAction);
                        }
                        else if (
                            (!mainAction.hasOwnProperty('shortcut') || (mainAction.hasOwnProperty('shortcut') && !mainAction.shortcut))
                            && (mainAction.hasOwnProperty('subMenu') && angular.isArray(mainAction.subMenu))
                        ) {
                            for (var j = 0; j < mainAction.subMenu.length; j++) {
                                subAction = mainAction.subMenu[j];
                                if (subAction.type.toLowerCase() === "action" && !subAction.hide && subAction.hasOwnProperty('shortcut') && subAction.shortcut) {
                                    shortcutActions.push(subAction);
                                }
                                /!*else if (subAction.type.toLowerCase() === "separator" && !subAction.hide)
                                 shortcutActions.push(subAction)*!/
                            }
                        }
                    }
                    else if (mainAction.type.toLowerCase() === "separator" && !mainAction.hide) {
                        shortcutActions.push(mainAction)
                    }
                }
                return shortcutActions;
            }
            return self.gridActions;*/
        };

        /**
         * @description Filters the action buttons for showing/hiding context menu actions
         * @returns {Array}
         */
        self.filterContextMenuItems = function () {
            return _.filter(self.gridActions, function (gridAction) {
                return !gridAction.hide && !(gridAction.hasOwnProperty('onlyShortcut') && gridAction.onlyShortcut);
            });
        };


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
        }
    });
};