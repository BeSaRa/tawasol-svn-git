module.exports = function (app) {
    app.controller('workflowItemSettingPopCtrl', function (distWorkflowItem, _, comments, workflowActions, dialogTitle, dialog) {
        'ngInject';
        var self = this;
        self.controllerName = 'workflowItemSettingPopCtrl';
        // dialog title
        self.dialogTitle = dialogTitle;
        // all comments
        self.comments = comments;
        // all workflow actions
        self.workflowActions = workflowActions;
        // the distWorkflowItem
        self.distWorkflowItem = angular.copy(distWorkflowItem);
        // current date minimum date for the due date.
        self.minDate = new Date();
        // selected comment
        self.comment = _getMatchedComment(self.distWorkflowItem);

        /**
         * @description find matched comment if not edited.
         * @param distWorkflowItem
         * @private
         */
        function _getMatchedComment(distWorkflowItem) {
            return _.find(self.comments, function (item) {
                return item.getComment() === distWorkflowItem.comments;
            });
        }

        /**
         * @description when selected comment changed.
         */
        self.onCommentChange = function () {
            self.distWorkflowItem.comments = self.comment.getComment();
        };
        /**
         * @description save properties for distWorkItem
         */
        self.setDistWorkflowItemProperties = function () {
            dialog.hide(self.distWorkflowItem);
        };
        /**
         * @description close the dialog.
         */
        self.closeDistWorkflowItemProperties = function () {
            dialog.cancel();
        }


    });
};