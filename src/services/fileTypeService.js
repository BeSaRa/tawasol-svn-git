module.exports = function (app) {
    app.service('fileTypeService', function (urlService, $http , $q , generator, DocumentFileType , _) {
        'ngInject';
        var self = this;
        self.serviceName = 'fileTypeService';

        self.fileTypes = [];

        /**
         * @description load fileTypes from server.
         * @returns {Promise|fileTypes}
         */
        self.loadDocumentFileTypes = function () {
            return $http.get(urlService.fileTypes).then(function (result) {
                self.fileTypes = generator.generateCollection(result.data.rs, DocumentFileType, self._sharedMethods);
                self.fileTypes = generator.interceptReceivedCollection('DocumentFileType', self.fileTypes);
                return self.fileTypes;
            });
        };
        /**
         * @description get fileTypes from self.fileTypes if found and if not load it from server again.
         * @returns {Promise|fileTypes}
         */
        self.getDocumentFileTypes = function () {
            return self.fileTypes.length ? $q.when(self.fileTypes) : self.loadDocumentFileTypes();
        };
        /**
         * @description add new fileType to service
         * @param fileType
         * @return {Promise|DocumentFileType}
         */
        self.addDocumentFileType = function (fileType) {
            return $http
                .post(urlService.fileTypes,
                    generator.interceptSendInstance('DocumentFileType', fileType))
                .then(function () {
                    return fileType;
                });
        };
        /**
         * @description make an update for given fileType.
         * @param fileType
         * @return {Promise|DocumentFileType}
         */
        self.updateDocumentFileType = function (fileType) {
            return $http
                .put(urlService.fileTypes,
                    generator.interceptSendInstance('DocumentFileType', fileType))
                .then(function () {
                    return fileType;
                });
        };
        /**
         * @description delete given classification.
         * @param fileType
         * @return {Promise}
         */
        self.deleteDocumentFileType = function (fileType) {
            var id = fileType.hasOwnProperty('id') ? fileType.id : fileType;
            return $http
                .delete((urlService.fileTypes + '/' + id));
        };
        /**
         * @description create the shred method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteDocumentFileType, self.updateDocumentFileType);

        /**
         * @description get fileType by fileTypeId
         * @param fileTypeId
         * @returns {DocumentFileType|undefined} return DocumentFileType Model or undefined if not found.
         */
        self.getDocumentFileTypeById = function (fileTypeId) {
            fileTypeId = fileTypeId instanceof DocumentFileType ? fileTypeId.id : fileTypeId;
            return _.find(self.fileTypes, function (fileType) {
                return Number(fileType.id) === Number(fileTypeId)
            });
        };

    });
};
