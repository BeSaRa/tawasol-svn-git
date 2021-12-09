module.exports = function (app) {
    app.controller('gridContextMenuPanelCtrl', function (mdPanelRef, $timeout, $scope, $q,
                                                         LangWatcher, langService, cmsTemplate, _,
                                                         record, contextActions,
                                                         lookupService,
                                                         gridService,
                                                         Outgoing,
                                                         Incoming,
                                                         Internal,
                                                         EventHistory,
                                                         WorkItem,
                                                         G2G,
                                                         G2GMessagingHistory,
                                                         SentItemDepartmentInbox,
                                                         Information,
                                                         FollowupBook,
                                                         Lookup) {
        'ngInject';
        var self = this;

        self.controllerName = 'gridContextMenuPanelCtrl';
        self.record = record;
        self.contextActions = [];
        LangWatcher($scope);

        /**
         * @description Opens the grid context menu
         * @param $mdMenu
         * @param $event
         */
        self.openContextMenu = function ($mdMenu, $event) {
            $mdMenu.open();
        };

        /**
         * @description Opens the cascade menu if action is enabled
         * @param $mdMenu
         * @param action
         */
        self.openCascadeMenu = function ($mdMenu, action) {
            if (action.disabledAction)
                return;
            $mdMenu.open();
        };

        /**
         * @description Process the callback for the action button
         * @param action
         * @param $event
         * @param $mdMenu
         */
        self.processMenu = function (action, $event, $mdMenu) {
            if (action.hasOwnProperty('params') && action.params && action.params.length) {
                action.callback(self.record, action.params, $event);
            } else {
                action.callback(self.record, $event);
            }
            $mdMenu.close();
            mdPanelRef && mdPanelRef.close('processMenu');
        };

        /**
         * @description Checks if the action is disabled
         * @param action
         * @returns {boolean}
         */
        self.isActionDisabled = function (action) {
            if (action.hasOwnProperty('disabled')) {
                if (typeof action.disabled === 'function')
                    return !!action.disabled(self.record);
                return !!action.disabled;
            }
            return false;
        };

        /**
         * @description Get the text of action according to selected language
         * @param action
         * @param isShortcutRequest
         */
        self.getActionText = function (action, isShortcutRequest) {
            var langKey = "";
            if (action.hasOwnProperty('textCallback') && angular.isFunction(action.textCallback)) {
                return langService.get(action.textCallback(self.record));
            }

            if (angular.isFunction(action.text)) {
                if (isShortcutRequest)
                    langKey = action.text().shortcutText;
                else
                    langKey = action.text().contextText;
            } else {
                langKey = action.text;
            }
            return langService.get(langKey);
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
            return !(self.record instanceof Outgoing
                || self.record instanceof Incoming
                || self.record instanceof Internal
                || self.record instanceof EventHistory
                || self.record instanceof SentItemDepartmentInbox
                || self.record instanceof G2G
                || self.record instanceof G2GMessagingHistory
                || self.record instanceof FollowupBook
            );
        };

        /**
         * @description Checks if priority level information can be shown or not.
         * @param gridName
         * @returns {boolean}
         */
        self.showPriorityLevel = function (gridName) {
            return !((self.record instanceof EventHistory && (gridName === 'user-sent-items' || gridName === gridService.grids.inbox.sentItem))
                || self.record instanceof G2GMessagingHistory);
        };

        /**
         * @description Checks if comments information can be shown or not.
         * @param gridName
         * @returns {boolean}
         */
        self.showAuthorInfo = function (gridName) {
            return !(self.record instanceof EventHistory
                || self.record instanceof SentItemDepartmentInbox
                || self.record instanceof G2G
                || self.record instanceof G2GMessagingHistory
                || self.record instanceof WorkItem
                || self.record instanceof FollowupBook
            );
        };

        /**
         * @description Checks if tags information can be shown or not.
         * @param gridName
         * @returns {boolean}
         */
        self.showTagsInfo = function (gridName) {
            return !(self.record instanceof G2G
                || self.record instanceof G2GMessagingHistory
                || self.record instanceof EventHistory
                || self.record instanceof SentItemDepartmentInbox
                || self.record instanceof FollowupBook
            );
        };

        /**
         * @description Checks if broadcasted information can be shown or not.
         * @param gridName
         * @returns {boolean}
         */
        self.showBroadcastedInfo = function (gridName) {
            return gridName === 'user-inbox' || gridName === gridService.grids.inbox.userInbox;
        };

        /**
         * @description Get the document information for context menu
         * @param property
         * @param gridName
         * @returns {*}
         */
        self.getDocumentInfo = function (property, gridName) {
            var model = self.record;
            if (property === 'securityLevel') {
                var securityLevel = null;
                if (model instanceof WorkItem) {
                    securityLevel = model.generalStepElm.securityLevel;
                } else if (model instanceof G2G) {
                    securityLevel = model.correspondence.securityLevel;
                } else if (model instanceof G2GMessagingHistory) {
                    securityLevel = model.securityLevel;
                } else {
                    securityLevel = model.hasOwnProperty('securityLevel') ? model.securityLevel : null;
                }
                if (!securityLevel)
                    return null;
                if (securityLevel instanceof Lookup)
                    return securityLevel.getTranslatedName();
                else
                    return lookupService.getLookupByLookupKey(lookupService.securityLevel, securityLevel).getTranslatedName();
            } else if (property === 'priorityLevel') {
                var priorityLevel = null;
                if (model instanceof WorkItem) {
                    priorityLevel = model.generalStepElm.priorityLevel;
                } else if (model instanceof G2G) {
                    priorityLevel = model.correspondence.priorityLevel;
                } else if (model instanceof G2GMessagingHistory) {
                    if (model.hasOwnProperty('prioretyLevel'))
                        priorityLevel = model.prioretyLevel;
                    else if (model.hasOwnProperty('priorityLevel'))
                        priorityLevel = model.priorityLevel;
                } else {
                    priorityLevel = model.hasOwnProperty('priorityLevel') ? model.priorityLevel : null;
                }

                if (priorityLevel === null || typeof priorityLevel === 'undefined')
                    return null;

                if (priorityLevel instanceof Lookup)
                    return priorityLevel.getTranslatedName();
                else
                    return lookupService.getLookupByLookupKey(lookupService.priorityLevel, priorityLevel).getTranslatedName();
            } else if (property === 'author') {
                if (model instanceof WorkItem) {
                    return new Information(model.creatorOu).getTranslatedName();
                }
                return model.hasOwnProperty('creatorInfo')
                    ? new Information(model.creatorInfo).getTranslatedName()
                    : (model.hasOwnProperty('creatorOuInfo') ? new Information(model.creatorOuInfo).getTranslatedName() : '');
            } else if (property === 'tags') {
                return model.getTagsCount();
            } else if (property === 'comments') {
                return model.getCommentsCount();
            } else if (property === 'broadcasted') {
                return model.isBroadcasted() ? langService.get('yes') : langService.get('no');
            }
        };


        function _setAdditionalActionProperties(action, isMainAction) {
            action.disabledAction = self.isActionDisabled(action);

            action.isSeparator = action.type.toLowerCase() === 'separator';
            action.isInfoMenu = action.type.toLowerCase() === 'info';
            action.isActionMenu = action.type.toLowerCase() === 'action';

            action.icon = isMainAction ? action.icon : null; // only main action will have icon

            // if action is separator/info, it will not have title and subMenu
            if (action.isSeparator || action.isInfoMenu) {
                action.title = null;
                action.hasSubMenu = false;
            } else {
                action.title = self.getActionText(action, false);
                action.hasSubMenu = isMainAction && (!!action.subMenu && action.subMenu.length > 0);
            }

            if (action.isInfoMenu) {
                _setDocumentInfo(action);
            }
        }

        function _setDocumentInfo(action) {
            action.isShowSecurityLevelInfo = self.showSecurityLevelInfo(action.gridName);
            if (action.isShowSecurityLevelInfo) {
                action.securityLevelInfo = self.getDocumentInfo('securityLevel', action.gridName);
            }

            action.isShowPriorityLevelInfo = self.showPriorityLevel(action.gridName);
            if (action.isShowPriorityLevelInfo) {
                action.priorityLevelInfo = self.getDocumentInfo('priorityLevel', action.gridName);
            }

            action.isShowAuthorInfo = self.showAuthorInfo(action.gridName);
            if (action.isShowAuthorInfo) {
                action.authorInfo = self.getDocumentInfo('author', action.gridName);
            }

            action.isShowTagsInfo = self.showTagsInfo(action.gridName);
            if (action.isShowTagsInfo) {
                action.tagsInfo = self.getDocumentInfo('tags', action.gridName);
            }

            action.isShowCommentsInfo = self.showCommentsInfo(action.gridName);
            if (action.isShowCommentsInfo) {
                action.commentsInfo = self.getDocumentInfo('comments', action.gridName);
            }

            action.isShowBroadcastInfo = self.showBroadcastedInfo(action.gridName);
            if (action.isShowBroadcastInfo) {
                action.broadcastedInfo = self.getDocumentInfo('broadcasted', action.gridName);
            }
        }

        /**
         * @description Filters the given actions to check if actions will be shown or not
         * @returns {Array}
         * @private
         */
        function _filterAllowedActions(actions) {
            return _.filter(actions, function (action) {

                var _hasSubMenu = action.type.toLowerCase() === 'action' && (action.subMenu && action.subMenu.length > 0);

                if (_hasSubMenu) {
                    var allowedSubMenus = [];
                    _.map(action.subMenu, function (subAction) {
                        if (subAction.checkShow(subAction, self.record)) {
                            allowedSubMenus.push(subAction);
                            _setAdditionalActionProperties(subAction, false);
                        }
                        return subAction;
                    });
                    if (allowedSubMenus && allowedSubMenus.length) {
                        action.subMenu = allowedSubMenus;
                    }
                }

                if (!action.checkShow(action, self.record)) {
                    return false;
                }
                _setAdditionalActionProperties(action, true);
                return true;
            });
        }

        self.$onInit = function () {
            self.contextActions = _filterAllowedActions(contextActions);
        };
    });
};
