module.exports = function (app) {
    app.service('downloadService', function (urlService,
                                             $http,
                                             tokenService,
                                             $timeout) {
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
                //console.log("EX" , vsId);
                vsId = typeof vsId.getInfo === 'function' ? vsId.getInfo().vsId : vsId;
                return self.downloadMainDocument(vsId).then(function (result) {
                    console.log("EX" , vsId);
                    window.open(result);
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
            return $http
                .get(urlService.getDocumentEmailContent + '/' + vsId + '?tawasol-auth-header=' + tokenService.getToken())
                .then(function (result) {
                    return result.data.rs;
                })
        };

        /**
         * @description get composite document email content from server
         */
        self.getCompositeDocumentEmailContent = function (vsId) {
            return $http
                .get(urlService.getDocumentCompositeEmailContent + '/' + vsId + '?tawasol-auth-header=' + tokenService.getToken())
                .then(function (result) {
                    return result.data.rs;
                })
        };

    });
};