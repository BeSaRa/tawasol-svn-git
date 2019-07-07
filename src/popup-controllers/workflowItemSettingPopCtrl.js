module.exports = function (app) {
    app.controller('workflowItemSettingPopCtrl', function (distWorkflowItem, rootEntity ,_, comments, workflowActions, dialogTitle, dialog) {
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

        self.globalSettings = rootEntity.getGlobalSettings();

        self.actionSearchText = '';
        self.commentSearchText = '';

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
        };

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };

        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of dropdown
         * @param $event
         */
        self.preventSearchKeyDown = function ($event) {
            if ($event){
                var code = $event.which || $event.keyCode;
                if (code !== 38 && code !== 40)
                    $event.stopPropagation();
            }
        };



    });
};
