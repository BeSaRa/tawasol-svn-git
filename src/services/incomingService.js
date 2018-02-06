module.exports = function (app) {
    app.service('incomingService', function (urlService,
                                             $http,
                                             $q,
                                             LinkedObject,
                                             generator,
                                             queueStatusService,
                                             Incoming,
                                             _) {
        'ngInject';
        var self = this;
        self.serviceName = 'incomingService';

        self.incomings = [];

        /**
         * @description load incomings from server.
         * @returns {Promise|incomings}
         */
        self.loadIncomings = function () {
            return $http.get(urlService.incomings).then(function (result) {
                self.incomings = generator.generateCollection(result.data.rs, Incoming, self._sharedMethods);
                self.incomings = generator.interceptReceivedCollection('Incoming', self.incomings);
                return self.incomings;
            });
        };
        /**
         * @description get incomings from self.incomings if found and if not load it from server again.
         * @returns {Promise|incomings}
         */
        self.getIncomings = function () {
            return self.incomings.length ? $q.when(self.incomings) : self.loadIncomings();
        };


        /**
         * @description delete given classification.
         * @param incoming
         * @return {Promise}
         */
        self.deleteIncoming = function (incoming) {
            var id = incoming.hasOwnProperty('id') ? incoming.id : incoming;
            return $http
                .delete((urlService.incomings + '/' + id));
        };
        /**
         * @description create the shred method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteIncoming, self.updateIncoming);

        /**
         * @description get incoming by incomingId
         * @param incomingId
         * @returns {Incoming|undefined} return Incoming Model or undefined if not found.
         */
        self.getIncomingById = function (incomingId) {
            incomingId = incomingId instanceof Incoming ? incomingId.id : incomingId;
            return _.find(self.incomings, function (incoming) {
                return Number(incoming.id) === Number(incomingId)
            });
        };

        /********* correspondence actions for send ***********/
        self.loadIncomingById = function (incomingId) {
            var id = incomingId.hasOwnProperty('vsId') ? incomingId.vsId : incomingId;
            return $http
                .get((urlService.incomings + '/' + id))
                .then(function (result) {
                    return generator.interceptReceivedInstance('Incoming', generator.generateInstance(result.data.rs, Incoming, self._sharedMethods));
                });
        };
        /**
         * @description add new incoming to service
         * @param incoming
         * @return {Promise|Incoming}
         */
        self.addIncoming = function (incoming) {
            var route = incoming.docStatus === 3 ? '/draft' : '/metadata';
            return $http
                .post((urlService.incomings + route), generator.interceptSendInstance('Incoming', incoming))
                .then(function (result) {
                    incoming.vsId = result.data.rs;
                    return generator.generateInstance(incoming, Incoming, self._sharedMethods);
                });
        };
        /**
         * @description make an update for given incoming.
         * @param incoming
         * @return {Promise|Incoming}
         */
        self.updateIncoming = function (incoming) {
            return $http
                .put((urlService.incomings + '/metadata'), generator.interceptSendInstance('Incoming', incoming))
                .then(function () {
                    return generator.generateInstance(incoming, Incoming, self._sharedMethods);
                });
        };
        /**
         * add linked object for the document.
         * @param document
         */
        self.addLinkedObject = function (document) {
            var id = document.hasOwnProperty('vsId') ? document.vsId : document;
            return $http.put((urlService.incomings + '/' + id + '/linked-objects'),
                (generator.interceptSendCollection('LinkedObject', document.linkedEntities))
            ).then(function (result) {
                return generator.generateCollection(document.linkedEntities, LinkedObject);
            });
        };
        /**
         * get incoming linked entities
         * @param document
         */
        self.getIncomingLinkedEntities = function (document) {
            var id = document.hasOwnProperty('vsId') ? document.vsId : document;
            return $http.get((urlService.incomings + '/' + id + '/linked-objects')).then(function (result) {
                return generator.interceptReceivedCollection('LinkedObject', generator.generateCollection(result.data.rs, LinkedObject));
            });
        };
        /**
         * get incoming linked entities
         * @param vsId
         * @param documentClass
         */
        self.getIncomingLinkedEntitiesByVsId = function (vsId, documentClass) {
            var document = {
                vsId: vsId,
                docClassName: documentClass
            };
            return self.getIncomingLinkedEntities(document);
        };



    });
};
