module.exports = function (app) {
    app.controller('correspondenceViewActionDirectiveCtrl', function (LangWatcher,
                                                                      langService,
                                                                      dialog,
                                                                      $q,
                                                                      $scope,
                                                                      _,
                                                                      $timeout,
                                                                      gridService,
                                                                      correspondenceService) {
        'ngInject';
        var self = this;
        self.controllerName = 'correspondenceViewActionDirectiveCtrl';
        LangWatcher($scope);
        /**
         * @description runActionCallback function.
         * @param action
         * @param workItem
         * @param correspondence
         * @param $event
         */
        self.runActionCallback = function (action, workItem, correspondence, $event) {
            var defer = $q.defer();
            defer.promise.then(function () {
                if (workItem) {
                    try {
                        correspondenceService.unlockWorkItem(workItem, true, $event)
                    } catch (e) {
                    }
                }
                dialog.cancel();
            });
            var record = self.g2gItemCopy ? self.g2gItemCopy : (workItem || correspondence),
                authorizeKeys = ['grid_action_electronic_approve_and_send', 'grid_action_electronic_approve'],
                additionalData;
            if (self.editMode && authorizeKeys.indexOf(action.text) > -1) {
                additionalData = {preApproveAction: self.saveCorrespondenceChanges};
            }
            if (action.hasOwnProperty('params') && action.params) {
                return action.callback(record, action.params, $event, defer, additionalData);
            }
            return action.callback(record, $event, defer, additionalData);
        };


        /**
         * @description to check if the action hide or not
         * @param action
         * @param workItem
         * @param correspondence
         */
        self.checkDisplayAction = function (action, workItem, correspondence) {
            var actionCopy = angular.copy(action);
            actionCopy.actionFrom = gridService.gridActionOptions.location.popup;
            return actionCopy.checkShow(actionCopy, (workItem || correspondence), {g2gItem : self.g2gItemCopy});
        };
        /**
         * @description hide this action from view correspondence.
         * @param action
         * @returns {boolean}
         */
        self.hideFromView = function (action) {
            return action.hasOwnProperty('showInView') && !action.showInView;
        };
        /**
         * @description get action text for grid actions.
         * @param action
         * @param workItem
         * @param correspondence
         */
        self.getActionText = function (action, workItem, correspondence) {
            var langKey = "";
            if (action.hasOwnProperty('textCallback') && angular.isFunction(action.textCallback)) {
                return langService.get(action.textCallback((workItem || correspondence)));
            }

            if (angular.isFunction(action.text)) {
                if (action.hasOwnProperty('shortcut') && action.shortcut)
                    langKey = action.text().shortcutText;
                else
                    langKey = action.text().contextText;
            } else {
                langKey = action.text;
            }
            return langService.get(langKey);
        };

        self.getTranslationForAllActions = function (actions) {
            _.map(actions, function (action, index) {
                actions[index].translate = self.getActionText(action, self.workItem, self.correspondence);
                if (actions[index].hasOwnProperty('subMenu') && actions[index].subMenu.length) {
                    self.getTranslationForAllActions(actions[index].subMenu);
                }
            });
        };

        $timeout(function () {
            self.viewActions = gridService.getContextMenuActions(self.actions, gridService.gridActionOptions.location.popup);
            self.getTranslationForAllActions(self.viewActions);
        });

    });
};
