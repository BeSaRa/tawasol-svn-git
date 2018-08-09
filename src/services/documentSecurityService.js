module.exports = function (app) {
    app.service('documentSecurityService', function (urlService,
                                                     $http,
                                                     $q,
                                                     tokenService,
                                                     langService,
                                                     DocumentSecurity,
                                                     toast,
                                                     generator) {
        'ngInject';
        var self = this;
        self.serviceName = 'documentSecurityService';

        self.documentSecurity = null;
        /**
         * @description Loads the document security and settings from database
         * @returns {*}
         */
        self.loadDocumentSecurity = function () {
            return $http.get(urlService.documentSecurity + '/setting')
                .then(function (result) {
                    if (result.data.rs) {
                        self.documentSecurity = generator.generateInstance(result.data.rs, DocumentSecurity, self._sharedMethods);
                        self.documentSecurity = generator.interceptReceivedInstance('DocumentSecurity', self.documentSecurity);
                        return self.documentSecurity;
                    }
                    self.documentSecurity = null;
                })
                .catch(function (error) {
                    self.documentSecurity = null;
                });
        };

        /**
         * @description Add new document security\\]\\
         * @param documentSecurity
         * @return {Promise|DocumentSecurity}
         */
        self.previewDocumentSecurity = function (documentSecurity) {
            var defer = $q.defer();
            var xhr = new XMLHttpRequest();
            xhr.open("POST", urlService.documentSecurity + '/previewSettings');
            xhr.setRequestHeader('tawasol-auth-header', tokenService.getToken());
            xhr.setRequestHeader('Content-type', 'application/json;charset=UTF-8');
            xhr.responseType = "blob";
            xhr.send(JSON.stringify(generator.interceptSendInstance('DocumentSecurity', documentSecurity)));
            xhr.onload = function (ev) {
                defer.resolve(xhr.response);
            };
            return defer.promise;
        };

        /**
         * @description Adds the new document security and settings
         * @param documentSecurity
         * @returns {*}
         */
        self.addDocumentSecurity = function (documentSecurity) {
            return $http
                .post(urlService.documentSecurity,
                    generator.interceptSendInstance('DocumentSecurity', documentSecurity))
                .then(function (result) {
                    toast.success(langService.get('add_document_security_success'));
                    return documentSecurity;
                })
                .catch(function (error) {
                    //console.log(error);
                    return false;
                });
        };

        /**
         * @description Updates the document security and settings
         * @param documentSecurity
         * @returns {*}
         */
        self.saveDocumentSecurity = function (documentSecurity) {
            return $http
                .put(urlService.documentSecurity,
                    generator.interceptSendInstance('DocumentSecurity', documentSecurity))
                .then(function (result) {
                    toast.success(langService.get('update_document_security_success'));
                    return documentSecurity;
                })
                .catch(function (error) {
                    //console.log(error);
                    return false;
                });
        };

    });
};
