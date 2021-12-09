module.exports = function (app) {
    app.service('outgoingService', function (urlService,
                                             $http,
                                             $q,
                                             LinkedObject,
                                             generator,
                                             queueStatusService,
                                             Outgoing,
                                             _) {
        'ngInject';
        var self = this;
        self.serviceName = 'outgoingService';

        self.outgoings = [];

        /**
         * @description load outgoings from server.
         * @returns {Promise|outgoings}
         */
        self.loadOutgoings = function () {
            return $http.get(urlService.outgoings).then(function (result) {
                self.outgoings = generator.generateCollection(result.data.rs, Outgoing, self._sharedMethods);
                self.outgoings = generator.interceptReceivedCollection('Outgoing', self.outgoings);
                return self.outgoings;
            });
        };
        /**
         * @description get outgoings from self.outgoings if found and if not load it from server again.
         * @returns {Promise|outgoings}
         */
        self.getOutgoings = function () {
            return self.outgoings.length ? $q.when(self.outgoings) : self.loadOutgoings();
        };


        /**
         * @description delete given classification.
         * @param outgoing
         * @return {Promise}
         */
        self.deleteOutgoing = function (outgoing) {
            var id = outgoing.hasOwnProperty('id') ? outgoing.id : outgoing;
            return $http
                .delete((urlService.outgoings + '/' + id));
        };
        /**
         * @description create the shred method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteOutgoing, self.updateOutgoing);

        /**
         * @description get outgoing by outgoingId
         * @param outgoingId
         * @returns {Outgoing|undefined} return Outgoing Model or undefined if not found.
         */
        self.getOutgoingById = function (outgoingId) {
            outgoingId = outgoingId instanceof Outgoing ? outgoingId.id : outgoingId;
            return _.find(self.outgoings, function (outgoing) {
                return Number(outgoing.id) === Number(outgoingId)
            });
        };

        /********* correspondence actions for send ***********/
        self.loadOutgoingById = function (outgoingId) {
            var id = outgoingId.hasOwnProperty('vsId') ? outgoingId.vsId : outgoingId;
            return $http
                .get((urlService.outgoings + '/' + id))
                .then(function (result) {
                    return generator.interceptReceivedInstance('Outgoing', generator.generateInstance(result.data.rs, Outgoing, self._sharedMethods));
                });
        };
        /**
         * @description add new outgoing to service
         * @param outgoing
         * @return {Promise|Outgoing}
         */
        self.addOutgoing = function (outgoing) {
            var route = outgoing.docStatus === 3 ? '/draft' : '/metadata';
            return $http
                .post((urlService.outgoings + route), generator.interceptSendInstance('Outgoing', outgoing))
                .then(function (result) {
                    outgoing.vsId = result.data.rs;
                    return generator.generateInstance(outgoing, Outgoing, self._sharedMethods);
                });
        };
        /**
         * @description make an update for given outgoing.
         * @param outgoing
         * @return {Promise|Outgoing}
         */
        self.updateOutgoing = function (outgoing) {
            return $http
                .put((urlService.outgoings + '/metadata'), generator.interceptSendInstance('Outgoing', outgoing))
                .then(function () {
                    return generator.generateInstance(outgoing, Outgoing, self._sharedMethods);
                });
        };
        /**
         * add linked object for the document.
         * @param document
         */
        self.addLinkedObject = function (document) {
            var id = document.hasOwnProperty('vsId') ? document.vsId : document;
            return $http.put((urlService.outgoings + '/' + id + '/linked-objects'),
                (generator.interceptSendCollection('LinkedObject', document.linkedEntities))
            ).then(function (result) {
                return generator.generateCollection(document.linkedEntities, LinkedObject);
            });
        };
        /**
         * get outgoing linked entities
         * @param document
         */
        self.getOutgoingLinkedEntities = function (document) {
            var id = document.hasOwnProperty('vsId') ? document.vsId : document;
            return $http.get((urlService.outgoings + '/' + id + '/linked-objects')).then(function (result) {
                return generator.interceptReceivedCollection('LinkedObject', generator.generateCollection(result.data.rs, LinkedObject));
            });
        };
        /**
         * get outgoing linked entities
         * @param vsId
         * @param documentClass
         */
        self.getOutgoingLinkedEntitiesByVsId = function (vsId, documentClass) {
            var document = {
                vsId: vsId,
                docClassName: documentClass
            };
            return self.getOutgoingLinkedEntities(document);
        };

    });
};
