module.exports = function (app) {
    app.controller('icnAttachmentPopCtrl', function (langService,
                                                     dialog,
                                                     loadingIndicatorService,
                                                     $sce,
                                                     $timeout,
                                                     $window,
                                                     generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'icnAttachmentPopCtrl';
        self.loadingIndicatorService = loadingIndicatorService;
        self.fullScreen = true;

        self.$onInit = function () {
            self.url = $sce.trustAsResourceUrl(self.searchTemplateUrl);
        };

        /**
         * @description toggle fullScreen dialog
         */
        self.toggleFullScreen = function () {
            self.fullScreen = !self.fullScreen;
        };

        self.closeICNImportDialog = function () {
            dialog.cancel();
        };

        /**
         * @description Handles the response from icn
         * @param $event
         */
        self.handleResponseFromICN = function ($event) {
            if ($event && $event.data && generator.isJsonString($event.data)) {
                var response = JSON.parse($event.data);
                if (response.hasOwnProperty('frame') && response.frame === 'attachment' && response.hasOwnProperty('status')) {
                    if (response.status === 'success') {
                        $window.removeEventListener('message', self.handleResponseFromICN);
                        dialog.hide('icnAttachmentSuccess');
                    } else if (response.status === 'cancel') {
                        dialog.cancel('icnAttachmentCancel');
                    }
                }
            }
        };

        $window.addEventListener("message", self.handleResponseFromICN);

    });
};
