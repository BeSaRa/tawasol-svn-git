module.exports = function (app) {
    app.service('relatedOUDocumentFileService', function (urlService,
                                                          $http,
                                                          $q,
                                                          generator,
                                                          RelatedOUDocumentFile,
                                                          _) {
        'ngInject';
        var self = this;
        self.serviceName = 'relatedOUDocumentFileService';

        self.relatedOUDocumentFiles = [];
        /**
         * @description load relatedOUs from server.
         * @returns {Promise|relatedOUDocumentFiles}
         */
        self.loadRelatedOUDocumentFiles = function () {
            return $http.get(urlService.relatedOUDocumentFiles).then(function (result) {
                self.relatedOUDocumentFiles = result.data.rs;
                return result.data.rs;
            });
        };
        self.loadOrganizationsDocumentFile = function () {
            return $http.get(urlService.organizations).then(function (result) {
                self.relatedOUDocumentFiles = result.data.rs;
                return self.relatedOUDocumentFiles;
            });
        };

        /**
         * @description get relatedOUs from self.relatedOUDocumentFiles if found and if not load it from server again.
         * @returns {Promise|relatedOUDocumentFiles}
         */
        self.getRelatedOUDocumentFiles = function () {
            return self.relatedOUDocumentFiles.length ? $q.when(self.relatedOUDocumentFiles) : self.loadRelatedOUDocumentFiles();
        };

        /**
         * @description add new relatedOU
         * @param relatedOUDocumentFile
         * @return {Promise|RelatedOUDocumentFile}
         */
        self.addRelatedOUDocumentFile = function (relatedOUDocumentFile) {
            return $http
                .post(urlService.relatedOUDocumentFiles,
                    generator.interceptSendInstance('OUDocumentFile', relatedOUDocumentFile))
                .then(function (result) {
                    relatedOUDocumentFile.id = result.data.rs;
                     return generator.interceptReceivedInstance('OUDocumentFile', generator.generateInstance(relatedOUDocumentFile, RelatedOUDocumentFile, self._sharedMethods));
                });
        };

        /**
         * @description delete given relatedOU.
         * @param relatedOUDocumentFile
         * @return {Promise|null}
         */
        self.deleteRelatedOUDocumentFile = function (relatedOUDocumentFile) {
            var id = relatedOUDocumentFile.hasOwnProperty('id') ? relatedOUDocumentFile.id : relatedOUDocumentFile;
            return $http.delete(urlService.relatedOUDocumentFiles + '/' + id).then(function(result){
                return relatedOUDocumentFile;
            });
        };

        /**
         * @description delete bulk relatedOUs.
         * @param relatedOUDocumentFiles
         * @return {Promise|null}
         */
        self.deleteBulkRelatedOUDocumentFiles = function (relatedOUDocumentFiles) {
            var bulkIds = relatedOUDocumentFiles[0].hasOwnProperty('selectedOUId') ? _.map(relatedOUDocumentFiles, 'selectedOUId') : relatedOUDocumentFiles;

            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.relatedOUDocumentFiles + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                return relatedOUDocumentFiles;
               /* var failedRelatedOUDocumentFiles = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedRelatedOUDocumentFiles.push(key);
                });
                return _.filter(relatedOUDocumentFiles, function (relatedOUDocumentFile) {
                    return (failedRelatedOUDocumentFiles.indexOf(relatedOUDocumentFile.id) > -1);
                },function(relatedDocumentFile){
                    return relatedDocumentFile;
                });*/
            });
        };

        /**
         * @description get relatedOU by relatedOUDocumentFileId
         * @param relatedOUDocumentFileId
         * @returns {RelatedOUDocumentFile|undefined} return RelatedOUDocumentFile Model or undefined if not found.
         */
        self.getRelatedOUDocumentFileById = function (relatedOUDocumentFileId) {
            relatedOUDocumentFileId = relatedOUDocumentFileId instanceof RelatedOUDocumentFile ? relatedOUDocumentFileId.id : relatedOUDocumentFileId;
            return _.find(self.relatedOUDocumentFiles, function (relatedOUDocumentFile) {
                return Number(relatedOUDocumentFile.id) === Number(relatedOUDocumentFileId)
            });
        };

    });
};
