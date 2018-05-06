module.exports = function (app) {
    app.controller('manageDocumentAttachmentsPopCtrl', function (dialog, document) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageDocumentAttachmentsPopCtrl';

        self.closeDocumentAttachments = function () {
            dialog.cancel(self.model);
        };

        self.saveDocumentAttachments = function () {
            dialog.hide(self.model);
        }
    });
};