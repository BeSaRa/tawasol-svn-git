module.exports = function (app) {
    app.service('ouClassificationService', function (urlService,
                                                     $http,
                                                     $q,
                                                     generator,
                                                     OUClassification,
                                                     _) {
        'ngInject';
        var self = this;
        self.serviceName = 'ouClassificationService';

        self.ouClassifications = [];
        self.returnOUClassifications = function () {
            return self.ouClassifications;
        };

        self.loadOUClassificationsByOuId = function (organization) {
            var id = organization.hasOwnProperty('id') ? organization.id : organization;
            return $http.get((urlService.ouClassifications + '/ou/' + id))
                .then(function (result) {
                    return generator.interceptReceivedCollection('OUClassification', generator.generateCollection(result.data.rs, OUClassification, self._sharedMethods));
                });
        };
        /**
         * @description load ouClassifications from server.
         * @returns {Promise|ouClassifications}
         */
        self.loadOUClassifications = function () {
            return $http.get(urlService.ouClassifications).then(function (result) {
                self.ouClassifications = generator.generateCollection(result.data.rs, OUClassification, self._sharedMethods);
                self.ouClassifications = generator.interceptReceivedCollection('OUClassification', self.ouClassifications);
                return self.ouClassifications.reverse();
            });
        };
        /**
         * @description get ouClassifications from self.ouClassifications if found and if not load it from server again.
         * @returns {Promise|ouClassifications}
         */
        self.getOUClassifications = function () {
            return self.ouClassifications.length ? $q.when(self.ouClassifications) : self.loadOUClassifications();
        };
        /**
         * @description add new ouClassification to service
         * @param ouClassification
         * @return {Promise|OUClassification}
         */
        self.addOUClassification = function (ouClassification) {
            return $http
                .post(urlService.ouClassifications,
                    generator.interceptSendInstance('OUClassification', ouClassification))
                .then(function (result) {
                    ouClassification.id = result.data.rs;
                    self.ouClassifications.push(ouClassification);
                    return ouClassification;
                });
        };
        /**
         * @description make an update for given ouClassification.
         * @param ouClassification
         * @return {Promise|OUClassification}
         */
        self.updateOUClassification = function (ouClassification) {
            return $http
                .put(urlService.ouClassifications,
                    generator.interceptSendInstance('OUClassification', ouClassification))
                .then(function () {
                    return ouClassification;
                });
        };
        /**
         * @description delete given classification.
         * @param ouClassification
         * @return {Promise}
         */
        self.deleteOUClassification = function (ouClassification) {
            var id = ouClassification.hasOwnProperty('id') ? ouClassification.id : ouClassification;
            return $http
                .delete((urlService.ouClassifications + '/' + id))
                .then(function () {
                    self.ouClassifications = _.filter(self.ouClassifications, function (ouClassification) {
                        return ouClassification.id !== id;
                    });
                });
        };
        /**
         * @description create the shred method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteOUClassification, self.updateOUClassification);

        /**
         * @description get ouClassification by ouClassificationId
         * @param ouClassificationId
         * @returns {OUClassification|undefined} return OUClassification Model or undefined if not found.
         */
        self.getOUClassificationById = function (ouClassificationId) {
            ouClassificationId = ouClassificationId instanceof OUClassification ? ouClassificationId.id : ouClassificationId;
            return _.find(self.ouClassifications, function (ouClassification) {
                return Number(ouClassification.id) === Number(ouClassificationId)
            });
        };

        self.deleteBulkOUClassifications = function (ouClassifications) {
            var bulkIds = ouClassifications[0].hasOwnProperty('id') ? _.map(ouClassifications, 'id') : ouClassifications;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.ouClassifications + '/bulk',
                data: bulkIds
            }).then(function (result) {
                self.ouClassifications = _.filter(self.ouClassifications, function (ouClassification) {
                    return bulkIds.indexOf(ouClassification.id) === -1;
                });
                result = result.data.rs;
                var failedOUClassifications = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedOUClassifications.push(key);
                });
                return _.filter(ouClassifications, function (classification) {
                    return (failedOUClassifications.indexOf(classification.id) > -1);
                });
            });
        };

        self.getRelatedOUClassifications = function (classification) {
            var classificationId = classification.hasOwnProperty('id') ? classification.id : classification;
            return _.filter(self.ouClassifications, function (ouClassification) {
                return classificationId === ouClassification.classification.id;
            });
        };
        /**
         * @description add bulk ouClassifications
         * @param ouClassifications
         * @returns {Promise|[OUClassification]}
         */
        self.addBulkOUClassifications = function (ouClassifications) {
            return $http
                .post((urlService.ouClassifications + '/bulk'),
                    generator.interceptSendCollection('OUClassification', ouClassifications))
                .then(function (result) {
                    result = result.data.rs;
                    ouClassifications = _.map(ouClassifications, function (ouClassification, index) {
                        ouClassification.id = result[index];
                        return ouClassification;
                    });
                    return ouClassifications;
                });
        };
        /**
         * @description return the list of the ouClassification
         * @param organizations
         * @param classification
         * @param insert
         * @return {Array}
         */
        self.createListOUClassifications = function (organizations, classification, insert) {
            var ouClassifications = _.map(organizations, function (organization) {
                var ouClassification = new OUClassification();
                return ouClassification.setOuId(organization).setClassification(classification);
            });

            if (!insert)
                return $q.when(ouClassifications);

            return self.addBulkOUClassifications(ouClassifications);
        };


        /**
         * @description Activate classification
         * @param ouClassification
         */
        self.activateOUClassification = function (ouClassification) {
            return $http
                .put((urlService.ouClassifications + '/activate/' + ouClassification.id))
                .then(function () {
                    return ouClassification;
                });
        };

        /**
         * @description Deactivate ouClassification
         * @param ouClassification
         */
        self.deactivateOUClassification = function (ouClassification) {
            return $http
                .put((urlService.ouClassifications + '/deactivate/' + ouClassification.id))
                .then(function () {
                    return ouClassification;
                });
        };

        /**
         * @description Activate bulk ouClassifications
         * @param ouClassifications
         */
        self.activateBulkOUClassifications = function (ouClassifications) {
            var bulkIds = ouClassifications[0].hasOwnProperty('id') ? _.map(ouClassifications, 'id') : ouClassifications;
            return $http
                .put((urlService.ouClassifications + '/activate/bulk'), bulkIds)
                .then(function () {
                    return ouClassifications;
                });
        };

        /**
         * @description Deactivate bulk ouClassifications
         * @param ouClassifications
         */
        self.deactivateBulkOUClassifications = function (ouClassifications) {
            var bulkIds = ouClassifications[0].hasOwnProperty('id') ? _.map(ouClassifications, 'id') : ouClassifications;
            return $http
                .put((urlService.ouClassifications + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return ouClassifications;
                });
        };



    });
};
