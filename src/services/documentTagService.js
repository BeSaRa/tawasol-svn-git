module.exports = function (app) {
    app.service('documentTagService', function (urlService,
                                                $http,
                                                $q,
                                                generator,
                                                DocumentTag,
                                                _) {
        'ngInject';
        var self = this;
        self.serviceName = 'documentTagService';

        self.documentTags = [];

        function generateUrl(url) {
            return urlService.documentTags.replace('tag/search?criteria={{tag}}', url.toLowerCase());
        }

        self.saveDocumentTags = function (documentClass, vsId, tags) {
            var url = documentClass + '/' + vsId + '/' + 'tags';
            return $http.put(generateUrl(url), tags).then(function () {
                return tags;
            });
        };

        self.saveDocumentTagsByVsId = function (document) {
            var vsId = document.vsId;
            var documentClass = document.docClassName.toLowerCase();
            var url = documentClass + '/' + vsId + '/' + 'tags';
            return $http.put(generateUrl(url), document.tags).then(function () {
                return document;
            });
        };

        self.loadDocumentTags = function (vsId, documentClass) {
            var url = documentClass + '/' + vsId + '/' + 'tags';
            return $http.get(generateUrl(url)).then(function (result) {
                return result.data.rs;
            });
        };
        /**
         * @description load documentTags from server.
         * @returns {Promise|documentTags}
         */
        self.searchForTag = function (word) {
            return $http.get(urlService.documentTags.replace('{{tag}}', word)).then(function (result) {
                self.documentTags = generator.generateCollection(result.data.rs, DocumentTag, self._sharedMethods);
                self.documentTags = generator.interceptReceivedCollection('DocumentTag', self.documentTags);
                return self.documentTags;
            });
        };
        /**
         * @description get documentTags from self.documentTags if found and if not load it from server again.
         * @returns {Promise|documentTags}
         */
        self.getDocumentTags = function () {
            return self.documentTags.length ? $q.when(self.documentTags) : self.loadDocumentTags();
        };
        /**
         * @description add new documentTag to service
         * @param documentTag
         * @return {Promise|DocumentTag}
         */
        self.addDocumentTag = function (documentTag) {
            return $http
                .post(urlService.documentTags,
                    generator.interceptSendInstance('DocumentTag', documentTag))
                .then(function () {
                    return documentTag;
                });
        };
        /**
         * @description add bulk tags.
         * @param tags
         */
        self.addBulkTags = function (tags) {
            tags = angular.isArray(tags) ? tags : [tags];
            return $http
                .post(generateUrl('tag/bulk'), tags)
                .then(function () {
                    return tags;
                });
        };
        /**
         * @description make an update for given documentTag.
         * @param documentTag
         * @return {Promise|DocumentTag}
         */
        self.updateDocumentTag = function (documentTag) {
            return $http
                .put(urlService.documentTags,
                    generator.interceptSendInstance('DocumentTag', documentTag))
                .then(function () {
                    return documentTag;
                });
        };
        /**
         * @description delete given classification.
         * @param documentTag
         * @return {Promise}
         */
        self.deleteDocumentTag = function (documentTag) {
            var id = documentTag.hasOwnProperty('id') ? documentTag.id : documentTag;
            return $http
                .delete((urlService.documentTags + '/' + id));
        };
        /**
         * @description create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteDocumentTag, self.updateDocumentTag);

        /**
         * @description get documentTag by documentTagId
         * @param documentTagId
         * @returns {DocumentTag|undefined} return DocumentTag Model or undefined if not found.
         */
        self.getDocumentTagById = function (documentTagId) {
            documentTagId = documentTagId instanceof DocumentTag ? documentTagId.id : documentTagId;
            return _.find(self.documentTags, function (documentTag) {
                return Number(documentTag.id) === Number(documentTagId)
            });
        };


    });
};
