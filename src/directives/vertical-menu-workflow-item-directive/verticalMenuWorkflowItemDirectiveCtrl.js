module.exports = function (app) {
    app.controller('verticalMenuWorkflowItemDirectiveCtrl', function ($scope, LangWatcher) {
        'ngInject';
        var self = this;
        self.controllerName = 'verticalMenuWorkflowItemDirectiveCtrl';
        LangWatcher($scope);
        /**
         * @description run ignore call back
         * @param $event
         * @returns {null}
         */
        self.runIgnoreCallback = function ($event) {
            self.ignoreCallback && typeof self.ignoreCallback === 'function' ? self.ignoreCallback(self.item, $event) : null;
            self.releaseSelected();

        };
        /**
         * @description run callback
         * @param $event
         * @returns {null}
         */
        self.runCallback = function ($event) {
            self.callback && typeof self.callback === 'function' ? self.callback(self.item, $event) : null;
            self.releaseSelected();
        };

        /**
         * @description to release selected
         */
        self.releaseSelected = function () {
            if (self.release && angular.isArray(self.release))
                self.release = [];
        };

        /**
         * @description Runs the wfGroup member button callback
         * @param $event
         */
        self.runWfGroupMemberCallback = function ($event) {
            self.gridName === 'workflowGroups' &&  self.wfGroupCallback && typeof self.wfGroupCallback === 'function' ? self.wfGroupCallback(self.item, $event) : null;
        };

    });
};
