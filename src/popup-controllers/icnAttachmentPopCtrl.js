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

        var aLink = null;
        self.createLoginIframe = function () {
            aLink = angular.element('<a />').attr('href', self.menuUrl);
            var loginLink = aLink[0].protocol + '//' + aLink[0].host + '/navigator/jaxrs/logon?userid={{username}}&password={{password}}';
            self.loginURL = $sce.trustAsResourceUrl(loginLink.replace('{{username}}', encodeURIComponent(self.credentials.username)).replace('{{password}}', encodeURIComponent(self.credentials.password)));
            // self.loginURL = $sce.trustAsResourceUrl(loginLink.replace('{{username}}', encodeURIComponent('nr2')).replace('{{password}}', encodeURIComponent('ebla')));
        };
        self.removeLoginIframe = function () {
            angular.element('#icn-login').remove();
        };
        self.createLoginIframe();

        $timeout(function () {
            self.removeLoginIframe();
            self.url = $sce.trustAsResourceUrl(self.menuUrl);
        }, 2000);

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
            if($event && $event.data && generator.isJsonString($event.data)) {
                var response = JSON.parse($event.data);
                if (response.hasOwnProperty('status') && response.status === 'success' && response.hasOwnProperty('frame') && response.frame === 'attachment') {
                    dialog.hide('icnAttachmentSuccess');
                }
            }
        };

        $window.addEventListener("message", self.handleResponseFromICN);

    });
};
