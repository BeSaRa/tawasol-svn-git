module.exports = function (app) {
    app.controller('gridActionsDirectiveCtrl', function ($q,
                                                         $scope,
                                                         langService,
                                                         LangWatcher,
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
                                                         Information,
                                                         gridService,
                                                         FollowupBook) {
        'ngInject';
        var self = this, actionParentRow;
        self.controllerName = 'gridActionsDirectiveCtrl';
        self.langService = langService;
        LangWatcher($scope);

        /**
         * @description Checks if actions will be shown or not
         * @param action
         * @returns {*}
         */
        self.isShowAction = function (action) {
            return action.checkShow(action, self.model);
        };

        /**
         * @description Checks if the action is disabled
         * @param action
         * @returns {boolean}
         */
        self.isActionDisabled = function (action) {
            if (action.hasOwnProperty('disabled')) {
                if (typeof action.disabled === 'function')
                    return !!action.disabled(self.model);
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
                return langService.get(action.textCallback(self.model));
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
            return !(self.model instanceof Outgoing
                || self.model instanceof Incoming
                || self.model instanceof Internal
                || self.model instanceof EventHistory
                || self.model instanceof SentItemDepartmentInbox
                || self.model instanceof G2G
                || self.model instanceof G2GMessagingHistory
                || self.model instanceof FollowupBook
            );
        };

        /**
         * @description Checks if priority level information can be shown or not.
         * @param gridName
         * @returns {boolean}
         */
        self.showPriorityLevel = function (gridName) {
            return !((self.model instanceof EventHistory && (gridName === 'user-sent-items' || gridName === gridService.grids.inbox.sentItem))
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
                || self.model instanceof G2GMessagingHistory
                || self.model instanceof WorkItem
                || self.model instanceof FollowupBook
            );
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
                || self.model instanceof FollowupBook
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
            var model = self.model;
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

        /**
         * @description Process the callback for the action button
         * @param action
         * @param $event
         */
        self.processMenu = function (action, $event) {
            if (action.hasOwnProperty('params') && action.params && action.params.length) {
                action.callback(self.model, action.params, $event);
            } else {
                action.callback(self.model, $event);
            }
            _removeHighlightParentRow();
        };


        /**
         * @description Opens the grid shortcut menu
         * @param $mdMenu
         * @param $event
         */
        self.openShortcutMenu = function ($mdMenu, $event) {
            var parentRow = $($event.target).parents('tr')[0];
            // gridActionRowClass is the unique number
            // It is set as class of parent row and passed to gridActionsDirective.
            // When menu opens, we will find the row by class=contextRowUniqueClass and highlight it.
            // When menu with main-context-menu or main-shortcut-menu class is closed, the (contextRowUniqueClass, background-grid-action) classes will be removed.
            self.gridActionRowClass = gridService.getUniqueIdentifier();
            if (parentRow) {
                parentRow.classList.add(self.gridActionRowClass);
            }

            _setAndHighlightParentRow();
            $mdMenu.open();
            _handleCloseGridActionsMenu();
        };

        /**
         * @description Opens the grid context menu
         * @param $mdMenu
         * @param $event
         */
        self.openContextMenu = function ($mdMenu, $event) {
            _setAndHighlightParentRow();
            $mdMenu.open();
            _handleCloseGridActionsMenu();
        };

        /**
         * @description Opens the cascade menu if action is enabled
         * @param $mdMenu
         * @param action
         */
        self.openCascadeMenu = function ($mdMenu, action) {
            if (self.isActionDisabled(action))
                return;
            $mdMenu.open();
        };

        var _setAndHighlightParentRow = function () {
            actionParentRow = document.getElementsByClassName(self.gridActionRowClass);
            if (actionParentRow && actionParentRow.length) {
                actionParentRow = actionParentRow[0];
                // highlight the record when action menu opens
                actionParentRow.classList.add('background-grid-action');
            }
        };

        /**
         * @description Removes the classes(gridActionRowClass and background-grid-action) when grid action menu with class (main-context-menu or main-shortcut-menu) closes
         * @private
         */
        var _removeHighlightParentRow = function () {
            actionParentRow = document.getElementsByClassName(self.gridActionRowClass);
            if (actionParentRow && actionParentRow.length && $(actionParentRow).hasClass('background-grid-action') && $(actionParentRow).hasClass(self.gridActionRowClass)) {
                actionParentRow[0].classList.remove('background-grid-action', self.gridActionRowClass);
                self.gridActionRowClass = '';
                actionParentRow = null;
            }
        };

        /**
         * @description Handles the close of grid action menu
         * @private
         */
        var _handleCloseGridActionsMenu = function () {
            $scope.$on("$mdMenuClose", function (event, el) {
                // if closed main context menu or shortcut menu, remove highlight from parent row
                if ((el[0].classList.contains('main-context-menu')) || (el[0].classList.contains('main-shortcut-menu'))) {
                    _removeHighlightParentRow();
                }
            });
        };
    });
};
