module.exports = function (app) {
    app.controller('correspondenceViewActionDirectiveCtrl', function (LangWatcher, dialog, $q, $scope) {
        'ngInject';
        var self = this;
        self.controllerName = 'correspondenceViewActionDirectiveCtrl';
        LangWatcher($scope);
        /**
         * @description runActionCallback function.
         * @param action
         * @param workItem
         * @param correspondence
         */
        self.runActionCallback = function (action, workItem, correspondence, $event) {
            var defer = $q.defer();
            defer.promise.then(function () {
                dialog.cancel();
            });
            if (action.hasOwnProperty('params') && action.params) {
                return action.callback((workItem || correspondence), action.params, $event, defer);
            }
            return action.callback((workItem || correspondence), $event, defer);
        };


        /**
         * @description to check if the action hide or not
         * @param action
         * @param workItem
         * @param correspondence
         */
        self.checkDisplayAction = function (action, workItem, correspondence) {
            return action.checkShow(action, (workItem || correspondence));
        };
        /**
         * @description hide this action from view correspondence.
         * @param action
         * @returns {boolean}
         */
        self.hideFromView = function (action) {
            return action.hasOwnProperty('showInView') && !action.showInView;
        }
    });
};