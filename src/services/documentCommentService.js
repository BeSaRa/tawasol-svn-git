module.exports = function (app) {
    app.service('documentCommentService', function (urlService,
                                                    $http,
                                                    $q,
                                                    employeeService,
                                                    generator,
                                                    DocumentComment,
                                                    _) {
        'ngInject';
        var self = this;
        self.serviceName = 'documentCommentService';

        self.documentComments = [];

        self.prepareDocumentComment = function (documentComment, vsId) {
            return documentComment
                .setCreationDate()
                .setCreator(employeeService.getEmployee());
        };

        /**
         * @description load documentComments from server.
         * @returns {Promise|documentComments}
         */
        self.loadDocumentCommentsByVsId = function (document) {
            var vsId = document.hasOwnProperty('vsId') ? document.vsId : document;
            return $http.get((urlService.documentComments + '/vsid/' + vsId)).then(function (result) {
                self.documentComments = generator.generateCollection(result.data.rs, DocumentComment, self._sharedMethods);
                self.documentComments = generator.interceptReceivedCollection('DocumentComment', self.documentComments);
                return self.documentComments;
            });
        };
        /**
         * @description get documentComments from self.documentComments if found and if not load it from server again.
         * @returns {Promise|documentComments}
         */
        self.getDocumentComments = function () {
            return self.documentComments.length ? $q.when(self.documentComments) : self.loadDocumentComments();
        };
        /**
         * @description add new documentComment to service
         * @param vsId
         * @param documentComment
         * @return {Promise|DocumentComment}
         */
        self.addDocumentComment = function (documentComment) {
            documentComment = self.prepareDocumentComment(documentComment);
            var vsId = documentComment.hasOwnProperty('documentVSID') ? documentComment.documentVSID : documentComment;
            return $http
                .post(urlService.documentComments + "/" + vsId,
                    generator.interceptSendInstance('DocumentComment', documentComment))
                .then(function (result) {
                    documentComment.id = result.data.rs;
                    return generator.generateInstance(documentComment, DocumentComment, self._sharedMethods);
                });
        };

        self.addBulkDocumentComments = function (documentComments, vsId) {
            documentComments = _.map(documentComments, function (documentComment) {
                return self.prepareDocumentComment(documentComment);
            });

            return $http
                .post(urlService.documentComments + "/" + vsId + '/bulk',
                    generator.interceptSendCollection('DocumentComment', documentComments))
                .then(function (result) {
                    result = result.data.rs;
                    _.map(documentComments, function (value, index) {
                        documentComments[index] = result[index];
                    });
                    return generator.generateInstance(documentComments, DocumentComment, self._sharedMethods);
                });
        };
        /**
         * @description make an update for given documentComment.
         * @param documentComment
         * @return {Promise|DocumentComment}
         */
        self.updateDocumentComment = function (documentComment) {
            return $http
                .put(urlService.documentComments,
                    generator.interceptSendInstance('DocumentComment', documentComment))
                .then(function () {
                    return generator.generateInstance(documentComment, DocumentComment, self._sharedMethods);
                });
        };
        /**
         * @description delete given documentComments.
         * @param documentComment
         * @return {Promise}
         */
        self.deleteDocumentComment = function (documentComment) {
            var id = documentComment.hasOwnProperty('id') ? documentComment.id : documentComment;
            return $http
                .delete((urlService.documentComments + '/' + id));
        };
        /**
         * @description Delete bulk documentComments.
         * @return {Promise|null}
         * @param documentComments
         */
        self.deleteBulkDocumentComments = function (documentComments) {
            var bulkIds = documentComments[0].hasOwnProperty('id') ? _.map(documentComments, 'id') : documentComments;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.documentComments + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedDocumentComments = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedDocumentComments.push(key);
                });
                return _.filter(documentComments, function (attachmentType) {
                    return (failedDocumentComments.indexOf(attachmentType.id) > -1);
                });
            });
        };
        /**
         * @description create the shred method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteDocumentComment, self.updateDocumentComment);

        /**
         * @description get documentComment by documentCommentId
         * @param documentCommentId
         * @returns {DocumentComment|undefined} return DocumentComment Model or undefined if not found.
         */
        self.getDocumentCommentById = function (documentCommentId) {
            documentCommentId = documentCommentId instanceof DocumentComment ? documentCommentId.id : documentCommentId;
            return _.find(self.documentComments, function (documentComment) {
                return Number(documentComment.id) === Number(documentCommentId)
            });
        };

    });
};
