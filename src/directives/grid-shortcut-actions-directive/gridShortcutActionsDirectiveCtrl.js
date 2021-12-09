module.exports = function (app) {
    app.controller('gridShortcutActionsDirectiveCtrl', function ($q, _,
                                                                 generator,
                                                                 langService,
                                                                 $scope,
                                                                 LangWatcher,
                                                                 $timeout) {
        'ngInject';
        var self = this, parentRow = null;

        self.controllerName = 'gridShortcutActionsDirectiveCtrl';
        LangWatcher($scope);

        self.openShortcutMenu = function ($mdMenu, $event) {
            if (self.actions.length === 0) {
                return false;
            }
            _filterAllowedActions()
                .then(function (actions) {
                    self.shortcutActions = actions;
                    $timeout(function () {
                        parentRow = $($event.target).parents('tr')[0];
                        _setAndHighlightParentRow();
                        $mdMenu.open();
                        _handleCloseGridActionsMenu();
                    })
                });
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


        function _setAdditionalActionProperties(action) {
            action.disabledAction = self.isActionDisabled(action);
            action.isSeparator = action.type.toLowerCase() === 'separator';
            action.isActionMenu = action.type.toLowerCase() === 'action';

            // if action is separator, it will not have title
            if (action.isSeparator) {
                action.title = null;
            } else {
                action.title = self.getActionText(action, false);
            }
        }

        /**
         * @description Filters the given actions to check if actions will be shown or not
         * @returns {Promise}
         * @private
         */
        function _filterAllowedActions() {
            if (self.actions.length === 0) {
                return $q.reject('NO_ACTIONS_AVAILABLE');
            }
            return $q.resolve(_.filter(self.actions, function (action) {
                    if (!action.checkShow(action, self.model)) {
                        return false;
                    }
                    _setAdditionalActionProperties(action, true);
                    return true;
                })
            );
        }

        var _setAndHighlightParentRow = function () {
            if (parentRow) {
                // highlight the record when action menu opens
                parentRow.classList.add('background-grid-action');
            }
        };

        /**
         * @description Removes the classes(background-grid-action) when grid action menu with class (main-shortcut-menu) closes
         * @private
         */
        var _removeHighlightParentRow = function () {
            if (parentRow) {
                parentRow.classList.remove('background-grid-action');
            }
            parentRow = null;
        };


        /**
         * @description Handles the close of grid action menu
         * @private
         */
        var _handleCloseGridActionsMenu = function () {
            var deRegister = $scope.$on("$mdMenuClose", function (event, element) {
                // if closed shortcut menu, remove highlight from parent row
                if (element[0].id === 'grid-shortcut-menu') {
                    _removeHighlightParentRow();
                    deRegister();
                }
            });
        };

    });
};
