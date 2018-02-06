module.exports = function (app) {
    app.service('ouDocumentFileService', function (urlService,
                                                   $http,
                                                   $q,
                                                   generator,
                                                   OUDocumentFile,
                                                   _) {
        'ngInject';
        var self = this;
        self.serviceName = 'ouDocumentFileService';

        self.ouDocumentFiles = [];

        /**
         * @description load ouDocumentFiles from server.
         * @returns {Promise|ouDocumentFiles}
         */
        self.loadOUDocumentFiles = function () {
            return $http.get(urlService.ouDocumentFiles).then(function (result) {
                self.ouDocumentFiles = generator.generateCollection(result.data.rs, OUDocumentFile, self._sharedMethods);
                self.ouDocumentFiles = generator.interceptReceivedCollection('OUDocumentFile', self.ouDocumentFiles);
                return self.ouDocumentFiles;
            });
        };
        /**
         * @description get ouDocumentFiles from self.ouDocumentFiles if found and if not load it from server again.
         * @returns {Promise|ouDocumentFiles}
         */
        self.getOUDocumentFiles = function () {
            return self.ouDocumentFiles.length ? $q.when(self.ouDocumentFiles) : self.loadOUDocumentFiles();
        };
        /**
         * @description add new ouDocumentFile to service
         * @param ouDocumentFile
         * @return {Promise|OUDocumentFile}
         */
        self.addOUDocumentFile = function (ouDocumentFile) {
            return $http
                .post(urlService.ouDocumentFiles,
                    generator.interceptSendInstance('OUDocumentFile', ouDocumentFile))
                .then(function (result) {
                    ouDocumentFile.id = result.data.rs;
                    return generator.generateInstance(ouDocumentFile, OUDocumentFile, self._sharedMethods);
                });
        };
        /**
         * @description make an update for given ouDocumentFile.
         * @param ouDocumentFile
         * @return {Promise|OUDocumentFile}
         */
        self.updateOUDocumentFile = function (ouDocumentFile) {
            return $http
                .put(urlService.ouDocumentFiles,
                    generator.interceptSendInstance('OUDocumentFile', ouDocumentFile))
                .then(function () {
                    return ouDocumentFile;
                });
        };
        /**
         * @description delete given classification.
         * @param ouDocumentFile
         * @return {Promise}
         */
        self.deleteOUDocumentFile = function (ouDocumentFile) {
            var id = ouDocumentFile.hasOwnProperty('id') ? ouDocumentFile.id : ouDocumentFile;
            return $http
                .delete((urlService.ouDocumentFiles + '/' + id));
        };
        /**
         * @description create the shred method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteOUDocumentFile, self.updateOUDocumentFile);

        /**
         * @description get ouDocumentFile by ouDocumentFileId
         * @param ouDocumentFileId
         * @returns {OUDocumentFile|undefined} return OUDocumentFile Model or undefined if not found.
         */
        self.getOUDocumentFileById = function (ouDocumentFileId) {
            ouDocumentFileId = ouDocumentFileId instanceof OUDocumentFile ? ouDocumentFileId.id : ouDocumentFileId;
            return _.find(self.ouDocumentFiles, function (ouDocumentFile) {
                return Number(ouDocumentFile.id) === Number(ouDocumentFileId)
            });
        };
        /**
         * @description get related ou document Files .
         * @param documentFile
         * @returns {Array}
         */
        self.getRelatedOUDocumentFile = function (documentFile) {
            var fileId = documentFile.hasOwnProperty('id') ? documentFile.id : documentFile;
            return _.filter(self.ouDocumentFiles, function (ouDocumentFile) {
                return Number(ouDocumentFile.file.id) === Number(fileId);
            });
        }

    });
};
