module.exports = function (app) {
    app.controller('viewAttachmentPopCtrl', function (dialog, $sce, attachment) {
        'ngInject';
        var self = this;
        self.controllerName = 'viewAttachmentPopCtrl';

        self.contentLoaded = false;

        self.url = null;

        self.attachment = attachment;

        self.fullscreen = 'fullscreen';

        self.viewerType = 'pdf';

        self.renderAttachmentView = function () {
            var file = attachment.file.hasOwnProperty('file') ? attachment.file.file : attachment.file;
            if (file.type.indexOf('image') !== -1) {
                self.viewerType = 'image';
            }
            self.url = $sce.trustAsResourceUrl(window.URL.createObjectURL(file));
            self.contentLoaded = true;
        };

        self.iframeFullScreen = function () {
            var iframe = angular.element('.viewer-handler')[0];
            var requestFullScreen = iframe.requestFullscreen || iframe.msRequestFullscreen || iframe.mozRequestFullScreen || iframe.webkitRequestFullscreen;
            if (requestFullScreen) {
                requestFullScreen.bind(iframe)();
            }
        };

        self.closeAttachmentViewer = function () {
            dialog.hide();
        };

        self.renderAttachmentView();
    });
};