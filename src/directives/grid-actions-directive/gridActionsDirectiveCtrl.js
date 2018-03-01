module.exports = function (app) {
    app.controller('gridActionsDirectiveCtrl', function ($q,
                                                         $scope,
                                                         langService,
                                                         _,
                                                         Lookup,
                                                         lookupService) {
        'ngInject';
        var self = this;
        self.controllerName = 'gridActionsDirectiveCtrl';
        self.langService = langService;

        /**
         * @description Get the text of action according to selected language
         * @param action
         */
        self.getActionText = function (action, isShortcutRequest) {
            var langKey = "";
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
         * @param model
         * @param $event
         */
        self.processMenu = function (action, model, $event) {
            if (action.hasOwnProperty('params') && action.params) {
                action.callback(model, action.params, $event);
            }
            else {
                action.callback(model, $event);
            }
        };


        /**
         * @description Filters the action buttons for showing/hiding shortcut actions
         * @param gridActions
         * @param direction
         * @param shortcut
         * @returns {Array}
         */
        self.filterShortcuts = function (gridActions, direction, shortcut) {
            var mainAction, subAction;
            var shortcutActions = [];

            if (direction === "vertical" && shortcut === 'true') {
                for (var i = 0; i < gridActions.length; i++) {
                    mainAction = gridActions[i];
                    if (mainAction.type.toLowerCase() === "action" && !mainAction.hide) {
                        if (mainAction.hasOwnProperty('shortcut') && mainAction.shortcut) {
                            shortcutActions.push(mainAction);
                        }
                        else if (!mainAction.hasOwnProperty('shortcut')
                            || (mainAction.hasOwnProperty('shortcut') && !mainAction.shortcut && mainAction.hasOwnProperty('submenu'))
                        ) {
                            for (var j = 0; j < mainAction.submenu.length; j++) {
                                subAction = mainAction.submenu[j];
                                if (subAction.type.toLowerCase() === "action" && subAction.hasOwnProperty('shortcut') && subAction.shortcut && !subAction.hide) {
                                    shortcutActions.push(mainAction);
                                }
                                /*else if (subAction.type.toLowerCase() === "separator" && !subAction.hide)
                                 shortcutActions.push(mainAction)*/
                            }
                        }
                    }
                    else if (!mainAction.hasOwnProperty('shortcut') || (mainAction.hasOwnProperty('shortcut') && !mainAction.shortcut)) {
                        shortcutActions.push(mainAction)
                    }
                    else if (mainAction.type.toLowerCase() === "separator" && !mainAction.hide) {
                        shortcutActions.push(mainAction)
                    }
                }
                return shortcutActions;
            }
            else if (direction === "horizontal" && shortcut === 'true') {
                for (var i = 0; i < gridActions.length; i++) {
                    mainAction = gridActions[i];
                    if (mainAction.type.toLowerCase() === "action" && !mainAction.hide) {
                        if (mainAction.hasOwnProperty('shortcut') && mainAction.shortcut) {
                            shortcutActions.push(mainAction);
                        }
                        else if (!mainAction.hasOwnProperty('shortcut')
                            || (mainAction.hasOwnProperty('shortcut') && !mainAction.shortcut && mainAction.hasOwnProperty('submenu'))
                        ) {
                            for (var j = 0; j < mainAction.submenu.length; j++) {
                                subAction = mainAction.submenu[j];
                                if (subAction.type.toLowerCase() === "action" && subAction.hasOwnProperty('shortcut') && subAction.shortcut && !subAction.hide) {
                                    shortcutActions.push(subAction);
                                }
                                /*else if (subAction.type.toLowerCase() === "separator" && !subAction.hide)
                                 shortcutActions.push(subAction)*/
                            }
                        }
                    }
                    else if (mainAction.type.toLowerCase() === "separator" && !mainAction.hide) {
                        shortcutActions.push(mainAction)
                    }
                }
                return shortcutActions;
            }
            return gridActions;
        };

        /**
         * @description Filters the action buttons for showing/hiding context menu actions
         * @param gridActions
         * @returns {Array}
         */
        self.filterContextMenuItems = function (gridActions) {
            return _.filter(gridActions, function (gridAction) {
                return !(gridAction.hasOwnProperty('onlyShortcut') && gridAction.onlyShortcut);
            });
        };

        /**
         * @description Get the document information for context menu
         * @param model
         * @param property
         * @returns {*}
         */
        self.getDocumentInfo = function (model, property) {
            if (property === 'securityLevel') {
                var securityLevel = model.hasOwnProperty('generalStepElm')
                    ? (model.generalStepElm.hasOwnProperty('securityLevel') ? model.generalStepElm.securityLevel : null)
                    : (model.hasOwnProperty('securityLevel') ? model.securityLevel : null);
                if (securityLevel instanceof Lookup)
                    return securityLevel.getTranslatedName();
                else
                    return lookupService.getLookupByLookupKey(lookupService.securityLevel, securityLevel).getTranslatedName();
            }
            else if (property === 'priorityLevel') {
                var priorityLevel = model.hasOwnProperty('generalStepElm')
                    ? (model.generalStepElm.hasOwnProperty('priorityLevel') ? model.generalStepElm.priorityLevel : null)
                    : (model.hasOwnProperty('priorityLevel') ? model.priorityLevel : null);
                if (priorityLevel instanceof Lookup)
                    return priorityLevel.getTranslatedName();
                else
                    return lookupService.getLookupByLookupKey(lookupService.priorityLevel, priorityLevel).getTranslatedName();
            }
            else if (property === 'author') {
                return model.hasOwnProperty('createdBy')
                    ? model.createdBy
                    : (model.hasOwnProperty('creatorOu') ? model.creatorOu[langService.current + 'Name'] : '');
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