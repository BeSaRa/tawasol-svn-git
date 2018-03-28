module.exports = function (app) {
    app.service('ouCorrespondenceSiteService', function (urlService,
                                                         $http,
                                                         $q,
                                                         generator,
                                                         OUCorrespondenceSite,
                                                         _) {
        'ngInject';
        var self = this;
        self.serviceName = 'ouCorrespondenceSiteService';

        self.ouCorrespondenceSites = [];

        self.loadOUCorrespondenceSitesByOuId = function (organization) {
            var id = organization.hasOwnProperty('id') ? organization.id : organization;
            return $http.get((urlService.ouCorrespondenceSites + '/ou/' + id))
                .then(function (result) {
                    return generator.interceptReceivedCollection('OUCorrespondenceSite', generator.generateCollection(result.data.rs, OUCorrespondenceSite, self._sharedMethods));
                });
        };
        /**
         * @description load ouCorrespondenceSites from server.
         * @returns {Promise|ouCorrespondenceSites}
         */
        self.loadOUCorrespondenceSites = function () {
            return $http.get(urlService.ouCorrespondenceSites).then(function (result) {
                self.ouCorrespondenceSites = generator.generateCollection(result.data.rs, OUCorrespondenceSite, self._sharedMethods);
                self.ouCorrespondenceSites = generator.interceptReceivedCollection('OUCorrespondenceSite', self.ouCorrespondenceSites);
                return self.ouCorrespondenceSites.reverse();
            });
        };
        /**
         * @description get ouCorrespondenceSites from self.ouCorrespondenceSites if found and if not load it from server again.
         * @returns {Promise|ouCorrespondenceSites}
         */
        self.getOUCorrespondenceSites = function () {
            return self.ouCorrespondenceSites.length ? $q.when(self.ouCorrespondenceSites) : self.loadOUCorrespondenceSites();
        };
        /**
         * @description add new ouCorrespondenceSite to service
         * @param ouCorrespondenceSite
         * @return {Promise|OUCorrespondenceSite}
         */
        self.addOUCorrespondenceSite = function (ouCorrespondenceSite) {
            return $http
                .post(urlService.ouCorrespondenceSites,
                    generator.interceptSendInstance('OUCorrespondenceSite', ouCorrespondenceSite))
                .then(function (result) {
                    ouCorrespondenceSite.id = result.data.rs;
                    self.ouCorrespondenceSites.push(ouCorrespondenceSite);
                    return ouCorrespondenceSite;
                });
        };
        /**
         * @description make an update for given ouCorrespondenceSite.
         * @param ouCorrespondenceSite
         * @return {Promise|OUCorrespondenceSite}
         */
        self.updateOUCorrespondenceSite = function (ouCorrespondenceSite) {
            return $http
                .put(urlService.ouCorrespondenceSites,
                    generator.interceptSendInstance('OUCorrespondenceSite', ouCorrespondenceSite))
                .then(function () {
                    return ouCorrespondenceSite;
                });
        };
        /**
         * @description delete given correspondenceSite.
         * @param ouCorrespondenceSite
         * @return {Promise}
         */
        self.deleteOUCorrespondenceSite = function (ouCorrespondenceSite) {
            var id = ouCorrespondenceSite.hasOwnProperty('id') ? ouCorrespondenceSite.id : ouCorrespondenceSite;
            return $http
                .delete((urlService.ouCorrespondenceSites + '/' + id))
                .then(function () {
                    self.ouCorrespondenceSites = _.filter(self.ouCorrespondenceSites, function (ouCorrespondenceSite) {
                        return ouCorrespondenceSite.id !== id;
                    });
                });
        };
        /**
         * @description create the shred method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteOUCorrespondenceSite, self.updateOUCorrespondenceSite);

        /**
         * @description get ouCorrespondenceSite by ouCorrespondenceSiteId
         * @param ouCorrespondenceSiteId
         * @returns {OUCorrespondenceSite|undefined} return OUCorrespondenceSite Model or undefined if not found.
         */
        self.getOUCorrespondenceSiteById = function (ouCorrespondenceSiteId) {
            ouCorrespondenceSiteId = ouCorrespondenceSiteId instanceof OUCorrespondenceSite ? ouCorrespondenceSiteId.id : ouCorrespondenceSiteId;
            return _.find(self.ouCorrespondenceSites, function (ouCorrespondenceSite) {
                return Number(ouCorrespondenceSite.id) === Number(ouCorrespondenceSiteId)
            });
        };

        self.deleteBulkOUCorrespondenceSites = function (ouCorrespondenceSites) {
            var bulkIds = ouCorrespondenceSites[0].hasOwnProperty('id') ? _.map(ouCorrespondenceSites, 'id') : ouCorrespondenceSites;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.ouCorrespondenceSites + '/bulk',
                data: bulkIds
            }).then(function (result) {
                self.ouCorrespondenceSites = _.filter(self.ouCorrespondenceSites, function (ouCorrespondenceSite) {
                    return bulkIds.indexOf(ouCorrespondenceSite.id) === -1;
                });
                result = result.data.rs;
                var failedOUCorrespondenceSites = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedOUCorrespondenceSites.push(Number(key));
                });
                return _.filter(ouCorrespondenceSites, function (correspondenceSite) {
                    return (failedOUCorrespondenceSites.indexOf(correspondenceSite.id) > -1);
                });
            });
        };

        self.getRelatedOUCorrespondenceSites = function (correspondenceSite) {
            var correspondenceSiteId = correspondenceSite.hasOwnProperty('id') ? correspondenceSite.id : correspondenceSite;
            return _.filter(self.ouCorrespondenceSites, function (ouCorrespondenceSite) {
                return correspondenceSiteId === ouCorrespondenceSite.correspondenceSite.id;
            });
        };
        /**
         * @description add bulk ouCorrespondenceSites
         * @param ouCorrespondenceSites
         * @returns {Promise|[OUCorrespondenceSite]}
         */
        self.addBulkOUCorrespondenceSites = function (ouCorrespondenceSites) {
            return $http.post((urlService.ouCorrespondenceSites + '/bulk'),
                generator.interceptSendCollection('OUCorrespondenceSite', ouCorrespondenceSites))
                .then(function (result) {
                    result = result.data.rs;
                    ouCorrespondenceSites = _.map(ouCorrespondenceSites, function (ouCorrespondenceSite, index) {
                        ouCorrespondenceSite.id = result[index];
                        return ouCorrespondenceSite;
                    });
                    return ouCorrespondenceSites;
                })
        };
        /**
         * @description return the list of the ouCorrespondenceSite
         * @param organizations
         * @param correspondenceSite
         * @param insert
         * @return {Array}
         */
        self.createListOUCorrespondenceSites = function (organizations, correspondenceSite, insert) {
            var ouCorrespondenceSites = _.map(organizations, function (organization) {
                var ouCorrespondenceSite = new OUCorrespondenceSite();
                return ouCorrespondenceSite.setOuId(organization).setCorrespondenceSite(correspondenceSite);
            });

            if (!insert)
                return $q.when(ouCorrespondenceSites);

            return self.addBulkOUCorrespondenceSites(ouCorrespondenceSites);
        };

        /**
         * @description Activate correspondenceSite
         * @param ouCorrespondenceSite
         */
        self.activateOUCorrespondenceSite = function (ouCorrespondenceSite) {
            return $http
                .put((urlService.ouCorrespondenceSites + '/activate/' + ouCorrespondenceSite.id))
                .then(function () {
                    return ouCorrespondenceSite;
                });
        };

        /**
         * @description Deactivate ouCorrespondenceSite
         * @param ouCorrespondenceSite
         */
        self.deactivateOUCorrespondenceSite = function (ouCorrespondenceSite) {
            return $http
                .put((urlService.ouCorrespondenceSites + '/deactivate/' + ouCorrespondenceSite.id))
                .then(function () {
                    return ouCorrespondenceSite;
                });
        };

        /**
         * @description Activate bulk ouCorrespondenceSites
         * @param ouCorrespondenceSites
         */
        self.activateBulkOUCorrespondenceSites = function (ouCorrespondenceSites) {
            var bulkIds = ouCorrespondenceSites[0].hasOwnProperty('id') ? _.map(ouCorrespondenceSites, 'id') : ouCorrespondenceSites;
            return $http
                .put((urlService.ouCorrespondenceSites + '/activate/bulk'), bulkIds)
                .then(function () {
                    return ouCorrespondenceSites;
                });
        };

        /**
         * @description Deactivate bulk ouCorrespondenceSites
         * @param ouCorrespondenceSites
         */
        self.deactivateBulkOUCorrespondenceSites = function (ouCorrespondenceSites) {
            var bulkIds = ouCorrespondenceSites[0].hasOwnProperty('id') ? _.map(ouCorrespondenceSites, 'id') : ouCorrespondenceSites;
            return $http
                .put((urlService.ouCorrespondenceSites + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return ouCorrespondenceSites;
                });
        };

    });
};
