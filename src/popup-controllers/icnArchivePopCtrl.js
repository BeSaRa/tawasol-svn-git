module.exports = function (app) {
    app.controller('icnArchivePopCtrl', function (langService,
                                                  dialog,
                                                  loadingIndicatorService,
                                                  $sce,
                                                  $timeout,
                                                  $window,
                                                  generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'icnArchivePopCtrl';
        self.loadingIndicatorService = loadingIndicatorService;
        self.fullScreen = true;

        var aLink = null;
        self.createLoginIframe = function () {
            aLink = angular.element('<a />').attr('href', self.entryTemplateUrl);
            var loginLink = aLink[0].protocol + '//' + aLink[0].host + '/navigator/jaxrs/logon?userid={{username}}&password={{password}}';
            //self.loginURL = $sce.trustAsResourceUrl(loginLink.replace('{{username}}', encodeURIComponent(self.credentials.username)).replace('{{password}}', encodeURIComponent(self.credentials.password)));
            self.loginURL = $sce.trustAsResourceUrl(loginLink.replace('{{username}}', encodeURIComponent('nr2')).replace('{{password}}', encodeURIComponent('ebla')));
        };
        self.removeLoginIframe = function () {
            angular.element('#icn-login').remove();
        };
        self.createLoginIframe();

        $timeout(function () {
            self.removeLoginIframe();
            self.url = $sce.trustAsResourceUrl(self.entryTemplateUrl);
        }, 2000);

        /**
         * @description toggle fullScreen dialog
         */
        self.toggleFullScreen = function () {
            self.fullScreen = !self.fullScreen;
        };

        self.closeICNArchiveDialog = function () {
            dialog.cancel();
        };

        /**
         * @description Handles the response from icn
         * @param $event
         */
        self.handleResponseFromICN = function ($event) {
            if ($event && $event.data && generator.isJsonString($event.data)) {
                var response = JSON.parse($event.data);
                if (response.hasOwnProperty('frame') && response.frame === 'archive' && response.hasOwnProperty('status')) {
                    if (response.status === 'success') {
                        $window.removeEventListener('message', self.handleResponseFromICN);
                        dialog.hide('icnArchiveSuccess');
                    } else if (response.status === 'cancel'){
                        dialog.cancel('icnArchiveCancel');
                    }
                }
            }
        };

        $window.addEventListener("message", self.handleResponseFromICN);

    });
};
