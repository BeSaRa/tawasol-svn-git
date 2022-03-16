module.exports = function (app) {
    app.controller('manageDocumentAttachmentsPopCtrl', function (dialog, langService, document, _) {
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

        self.addSelectedDocumentAttachments = function () {
            var selectedAttachments = _.map(self.selectedAttachments, 'vsId');
            var documentAttachmentIds = _.map(self.attachments, 'vsId');
            // unselected all attachments then add selected only
            self.selectedAttachmentIds = self.selectedAttachmentIds.filter(function (attachmentId) {
                return documentAttachmentIds.indexOf(attachmentId) === -1;
            })

            self.document.copyAllAttachments = self.attachments.length === selectedAttachments.length;
            self.document.totaselectedAttachments = selectedAttachments.length;
            dialog.hide(self.selectedAttachmentIds.concat(selectedAttachments))
        }

        /***
         * @description set selected attachment ids to Attachment object when open popup
         */
        function setSelectedAttachmentIds() {
            if (!self.selectedAttachmentIds.length) {
                return;
            }
            self.selectedAttachments = self.attachments.filter(function (attachment) {
                return self.selectedAttachmentIds.indexOf(attachment.vsId) !== -1;
            });
        }

        setSelectedAttachmentIds();
    });
};
