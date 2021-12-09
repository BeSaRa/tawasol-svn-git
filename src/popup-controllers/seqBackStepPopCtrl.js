module.exports = function (app) {
    app.controller('seqBackStepPopCtrl', function (BackStepOptions, dialog) {
        'ngInject';
        var self = this;
        self.controllerName = 'seqBackStepPopCtrl';
        self.model = new BackStepOptions();
        self.selectedComment = null;

        self.onSelectedCommentChange = function () {
            self.model.userComment = self.selectedComment ? self.selectedComment.comment : null;
        };

        self.performBackStep = function () {
            dialog.hide(self.model);
        };

        self.closePopup = function () {
            dialog.cancel();
        }
    });
};
