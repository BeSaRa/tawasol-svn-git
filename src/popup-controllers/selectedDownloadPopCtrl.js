module.exports = function (app) {
    app.controller('selectedDownloadPopCtrl', function (dialog,
                                                        correspondenceService,
                                                        downloadService,
                                                        langService,
                                                        attachmentService,
                                                        SelectedDownload,
                                                        managerService) {
        'ngInject';
        var self = this;

        self.controllerName = 'selectedDownloadPopCtrl';
        self.downloadSelectedOptions = new SelectedDownload();

        self.selectAttachmentsToSend = function () {
            var info = self.correspondence.getInfo();
            attachmentService
                .loadDocumentAttachments(info.vsId, info.documentClass)
                .then(function (attachments) {
                    if (!attachments.length) {
                        dialog.infoMessage(langService.get('document_has_no_attachments'));
                        return;
                    }
                    // popupTitle, attachments, selectedItems, selectionCallback
                    managerService
                        .attachmentSelector(langService.get('select_attachments'), attachments, info, self.downloadSelectedOptions.ATTACHMENTS, function (item, selectedItems) {
                            return selectedItems.indexOf(item.vsId) !== -1;
                        })
                        .then(function (selectedAttachments) {
                            self.downloadSelectedOptions.ATTACHMENTS = _.map(selectedAttachments, 'vsId');
                        });
                })
        };

        self.selectLinkedDocumentsToSend = function () {
            var info = self.correspondence.getInfo();
            correspondenceService
                .getLinkedDocumentsByVsIdClass(info.vsId, info.documentClass)
                .then(function (linkedDocuments) {
                    if (!linkedDocuments.length) {
                        dialog.infoMessage(langService.get('document_has_no_linked_documents'));
                        return;
                    }
                    managerService
                        .documentSelector(langService.get('select_linked_documents'), linkedDocuments, info, self.downloadSelectedOptions.RELATED_BOOKS, function (item, selectedItems) {
                            return selectedItems.indexOf(item.vsId) !== -1;
                        })
                        .then(function (selectedAttachments) {
                            self.downloadSelectedOptions.RELATED_BOOKS = _.map(selectedAttachments, 'vsId');
                        });
                })

        };

        self.checkDownloadSelectedOptionsDisabled = function () {
            return !(self.downloadSelectedOptions.BOOK || self.downloadSelectedOptions.ATTACHMENTS.length || self.downloadSelectedOptions.RELATED_BOOKS.length)
        };

        self.downloadSelected = function(){
            downloadService.downloadSelectedOptions(self.downloadSelectedOptions,self.correspondence)
                .then(function (result) {
                    dialog.hide();
                })
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        };

    });
};