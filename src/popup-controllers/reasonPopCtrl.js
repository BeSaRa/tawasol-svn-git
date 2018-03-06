module.exports = function (app) {
    app.controller('reasonPopCtrl', function (dialog, comments) {
        'ngInject';
        var self = this;
        self.controllerName = 'reasonPopCtrl';
        self.reason = '';
        self.comments = comments;
        self.selectedComment = null;

        /**
         * @description to set reason when user select it from comments.
         */
        self.setTerminateReason = function () {
            self.reason = self.selectedComment.getComment();
        };
        /**
         * @description send the reason for controller.
         */
        self.sendReason = function () {
            dialog.hide(self.reason);
        };

        /**
         * @description close reason reason.
         */
        self.closeReasonPopup = function () {
            dialog.cancel();
        };
    });
};