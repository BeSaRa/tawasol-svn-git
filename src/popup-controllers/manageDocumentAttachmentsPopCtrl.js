module.exports = function (app) {
    app.controller('manageDocumentAttachmentsPopCtrl', function (dialog, langService, document) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageDocumentAttachmentsPopCtrl';

        self.activeAttachment = null;

        self.closeDocumentAttachments = function () {
            if (!self.activeAttachment) {
                dialog.cancel(self.attachments);
            } else {
                dialog.confirmMessage(langService.get('confirm_unsaved_changes'))
                    .then(function () {
                        dialog.cancel(self.attachments);
                    })
            }
        };

        self.saveDocumentAttachments = function () {
            dialog.hide(self.model);
        }
    });
};
