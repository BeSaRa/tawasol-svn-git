module.exports = function (app) {
    app.controller('reasonBulkPopCtrl', function (comments, dialog, workItems, userInboxService) {
        'ngInject';
        var self = this;
        self.controllerName = 'reasonBulkPopCtrl';
        // all user comments
        self.comments = comments;
        // all selected documents
        self.workItems = angular.copy(workItems);
        // selected comment from users comments
        self.selectedComment = null;
        // the default reason for terminate
        self.reason = null;

        /**
         * @description to check if the workItem has custom reason.
         * @param workItem
         * @return {boolean}
         */
        self.hasCustomReason = function (workItem) {
            return !!workItem.reason;
        };

        self.setBulkTerminateReason = function () {
            self.reason = self.selectedComment.getComment();
        };

        self.openReasonDialog = function (workItem) {
            userInboxService
                .controllerMethod
                .userInboxTerminate(workItem, false, true)
                .then(function (reason) {
                    workItem.reason = reason;
                });
        };
        /**
         * @description send all reason with the workItems
         */
        self.sendBulkReason = function () {
            dialog.hide(_.map(self.workItems, function (workItem) {
                if (!self.hasCustomReason(workItem))
                    workItem.reason = self.reason;
                return workItem;
            }));
        };

        self.itemNeedReason = function () {
            return _.some(self.workItems, function (workItem) {
                return !workItem.reason;
            });
        }

    });
};