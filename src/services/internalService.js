module.exports = function (app) {
    app.service('internalService', function (urlService,
                                             $http,
                                             $q,
                                             LinkedObject,
                                             generator,
                                             queueStatusService,
                                             Internal,
                                             _) {
        'ngInject';
        var self = this;
        self.serviceName = 'internalService';

        self.internals = [];

        /**
         * @description load internals from server.
         * @returns {Promise|internals}
         */
        self.loadInternals = function () {
            return $http.get(urlService.internals).then(function (result) {
                self.internals = generator.generateCollection(result.data.rs, Internal, self._sharedMethods);
                self.internals = generator.interceptReceivedCollection('Internal', self.internals);
                return self.internals;
            });
        };
        /**
         * @description get internals from self.internals if found and if not load it from server again.
         * @returns {Promise|internals}
         */
        self.getInternals = function () {
            return self.internals.length ? $q.when(self.internals) : self.loadInternals();
        };


        /**
         * @description delete given classification.
         * @param internal
         * @return {Promise}
         */
        self.deleteInternal = function (internal) {
            var id = internal.hasOwnProperty('id') ? internal.id : internal;
            return $http
                .delete((urlService.internals + '/' + id));
        };
        /**
         * @description create the shred method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteInternal, self.updateInternal);

        /**
         * @description get internal by internalId
         * @param internalId
         * @returns {Internal|undefined} return Internal Model or undefined if not found.
         */
        self.getInternalById = function (internalId) {
            internalId = internalId instanceof Internal ? internalId.id : internalId;
            return _.find(self.internals, function (internal) {
                return Number(internal.id) === Number(internalId)
            });
        };

        /********* correspondence actions for send ***********/
        self.loadInternalById = function (internalId) {
            var id = internalId.hasOwnProperty('vsId') ? internalId.vsId : internalId;
            return $http
                .get((urlService.internals + '/' + id))
                .then(function (result) {
                    return generator.interceptReceivedInstance('Internal', generator.generateInstance(result.data.rs, Internal, self._sharedMethods));
                });
        };
        /**
         * @description add new internal to service
         * @param internal
         * @return {Promise|Internal}
         */
        self.addInternal = function (internal) {
            var route = internal.docStatus === 3 ? '/draft' : '/metadata';
            return $http
                .post((urlService.internals + '/' + route), generator.interceptSendInstance('Internal', internal))
                .then(function (result) {
                    internal.vsId = result.data.rs;
                    return generator.generateInstance(internal, Internal, self._sharedMethods);
                });
        };
        /**
         * @description make an update for given internal.
         * @param internal
         * @return {Promise|Internal}
         */
        self.updateInternal = function (internal) {
            return $http
                .put((urlService.internals + '/metadata'), generator.interceptSendInstance('Internal', internal))
                .then(function () {
                    return generator.generateInstance(internal, Internal, self._sharedMethods);
                });
        };
        /**
         * add linked object for the document.
         * @param document
         */
        self.addLinkedObject = function (document) {
            var id = document.hasOwnProperty('vsId') ? document.vsId : document;
            return $http.put((urlService.internals + '/' + id + '/linked-objects'),
                (generator.interceptSendCollection('LinkedObject', document.linkedEntities))
            ).then(function (result) {
                return generator.generateCollection(document.linkedEntities, LinkedObject);
            });
        };
        /**
         * get internal linked entities
         * @param document
         */
        self.getInternalLinkedEntities = function (document) {
            var id = document.hasOwnProperty('vsId') ? document.vsId : document;
            return $http.get((urlService.internals + '/' + id + '/linked-objects')).then(function (result) {
                return generator.interceptReceivedCollection('LinkedObject', generator.generateCollection(result.data.rs, LinkedObject));
            });
        };
        /**
         * get internal linked entities
         * @param vsId
         * @param documentClass
         */
        self.getInternalLinkedEntitiesByVsId = function (vsId, documentClass) {
            var document = {
                vsId: vsId,
                docClassName: documentClass
            };
            return self.getInternalLinkedEntities(document);
        };


    });
};
