module.exports = function (app) {
    app.controller('correspondenceViewActionDirectiveCtrl', function (LangWatcher,
                                                                      langService,
                                                                      dialog,
                                                                      $q,
                                                                      $scope,
                                                                      _,
                                                                      $timeout,
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
                        console.log('ਆਈਟਮ ਅਨਲੌਕ ਅਸਫਲ');
                    }
                }
                dialog.cancel();
            });
            var record = self.g2gItemCopy ? self.g2gItemCopy : (workItem || correspondence);
            if (action.hasOwnProperty('params') && action.params) {
                return action.callback(record, action.params, $event, defer);
            }
            return action.callback(record, $event, defer);
        };


        /**
         * @description to check if the action hide or not
         * @param action
         * @param workItem
         * @param correspondence
         */
        self.checkDisplayAction = function (action, workItem, correspondence) {
            var actionCopy = angular.copy(action);
            actionCopy.actionFrom = 'popup';
            return actionCopy.checkShow(actionCopy, (workItem || correspondence), actionCopy.showInViewOnly);
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
            self.getTranslationForAllActions(self.actions);
        });

    });
};
