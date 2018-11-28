module.exports = function (app) {
    app.service('downloadService', function (urlService,
                                             $http,
                                             tokenService,
                                             generator) {
        'ngInject';
        var self = this;
        self.serviceName = 'downloadService';

        self.controllerMethod = {
            /**
             * @description Download the main document
             * @param vsId
             * @param $event
             */
            mainDocumentDownload: function (vsId, $event) {
                vsId = typeof vsId.getInfo === 'function' ? vsId.getInfo().vsId : vsId;
                return self.downloadMainDocument(vsId).then(function (result) {
                    window.open(result);
                    //generator.checkIfBrowserPopupBlocked(window);
                    return true;
                });
            },
            /**
             * @description Download Composite Document
             * @param vsId
             * @param $event
             */
            compositeDocumentDownload: function (vsId, $event) {
                vsId = typeof vsId.getInfo === 'function' ? vsId.getInfo().vsId : vsId;
                return self.downloadCompositeDocument(vsId).then(function (result) {
                    window.open(result);
                    return true;
                });
            },
            /**
             * @description Download File
             * @param path
             * @param $event
             */
            fileDownload: function (path, $event) {
                //var domain = $location.protocol() + "://" + $location.host() + ":" + $location.port() + "/";
                window.open(path);
            }
        };

        /**
         * @description download main document from server
         */
        self.downloadMainDocument = function (vsId) {
            return $http
                .get(urlService.downloadDocument + '/' + vsId + '?tawasol-auth-header=' + tokenService.getToken())
                .then(function (result) {
                    return result.data.rs;
                })
        };

        /**
         * @description download composite document from server
         */
        self.downloadCompositeDocument = function (vsId) {
            return $http
                .get(urlService.downloadDocumentComposite + '/' + vsId + '?tawasol-auth-header=' + tokenService.getToken())
                .then(function (result) {
                    return result.data.rs;
                })
        };

        /**
         * @description get main document email content from server
         */
        self.getMainDocumentEmailContent = function (vsId) {
            /*return $http
                 .get(urlService.getDocumentEmailContent + '/' + vsId + '?tawasol-auth-header=' + tokenService.getToken())
                 .then(function (result) {
                     return result.data.rs;
                 });*/
            $http
                .get(urlService.getDocumentEmailContent + '/' + vsId + '?tawasol-auth-header=' + tokenService.getToken())
                .then(function (result) {
                    _download(result.data.rs, 'Tawasol.msg');
                })
        };

        /**
         * @description get composite document email content from server
         */
        self.getCompositeDocumentEmailContent = function (vsId) {
            /*return $http
                .get(urlService.getDocumentCompositeEmailContent + '/' + vsId + '?tawasol-auth-header=' + tokenService.getToken())
                .then(function (result) {
                   return result.data.rs;
                })*/
            return $http
                .get(urlService.getDocumentCompositeEmailContent + '/' + vsId + '?tawasol-auth-header=' + tokenService.getToken())
                .then(function (result) {
                    _download(result.data.rs, 'Tawasol.msg');
                })
        };

        var _download = function (url, name) {
            var link = document.createElement('a');
            link.download = name || 'cms-download';
            link.href = url;
            //link.target = '_blank';
            link.click();
        }
    });
};