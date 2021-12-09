module.exports = function (app) {
    app.controller('attachmentThumbnailPopCtrl', function (dialog, attachment, thumbnails, selectedThumb, attachmentService, correspondence) {
        'ngInject';
        var self = this;
        self.controllerName = 'attachmentThumbnailPopCtrl';
        self.correspondence = correspondence;
        self.thumbnails = thumbnails;
        self.selectedItem = selectedThumb.setViewer(attachment.content.viewURL).setTitle(attachment.docSubject);

        self.closeAttachemntThumbnails = function () {
            dialog.cancel();
        };

        self.hasNext = function () {
            return self.correspondence.thumbnails.indexOf(self.selectedThumb) < (self.correspondence.length - 1)
        };

        self.hasPrevious = function () {
            return self.correspondence.thumbnails.indexOf(self.selectedThumb) !== 0;
        };

        self.getSelectedAttachment = function (selectedImage) {
            attachmentService
                .loadAttachment(selectedImage.vsId, correspondence.getInfo().documentClass)
                .then(function (attachment) {
                    self.selectedItem = selectedImage.setViewer(attachment.content.viewURL).setTitle(attachment.docSubject);
                });
        }

    });
};