module.exports = function (app) {
    app.service('ouDistributionListService', function (urlService,
                                                       $http,
                                                       $q,
                                                       generator,
                                                       OUDistributionList,
                                                       _) {
        'ngInject';
        var self = this;
        self.serviceName = 'ouDistributionListService';

        self.ouDistributionLists = [];

        /**
         * @description load ouDistributionLists from server.
         * @returns {Promise|ouDistributionLists}
         */
        self.loadOUDistributionLists = function () {
            return $http.get(urlService.ouDistributionLists).then(function (result) {
                self.ouDistributionLists = generator.generateCollection(result.data.rs, OUDistributionList, self._sharedMethods);
                self.ouDistributionLists = generator.interceptReceivedCollection('OUDistributionList', self.ouDistributionLists);
                return self.ouDistributionLists.reverse();
            });
        };
        /**
         * @description get ouDistributionLists from self.ouDistributionLists if found and if not load it from server again.
         * @returns {Promise|ouvs}
         */
        self.getOUDistributionLists = function () {
            return self.ouDistributionLists.length ? $q.when(self.ouDistributionLists) : self.loadOUDistributionLists();
        };
        /**
         * @description add new ouDistributionList to service
         * @param ouDistributionList
         * @return {Promise|OUDistributionList}
         */
        self.addOUDistributionList = function (ouDistributionList) {
            return $http
                .post(urlService.ouDistributionLists,
                    generator.interceptSendInstance('OUDistributionList', ouDistributionList))
                .then(function (result) {
                    ouDistributionList.id = result.data.rs;
                    self.ouDistributionLists.push(ouDistributionList);
                    return ouDistributionList;
                });
        };
        /**
         * @description make an update for given ouDistributionList.
         * @param ouDistributionList
         * @return {Promise|OUDistributionList}
         */
        self.updateOUDistributionList = function (ouDistributionList) {
            return $http
                .put(urlService.ouDistributionLists,
                    generator.interceptSendInstance('OUDistributionList', ouDistributionList))
                .then(function (result) {
                    //ouDistributionList.id = result.data.rs;
                    //self.ouDistributionLists.push(ouDistributionList);
                    return ouDistributionList;
                });
        };
        /**
         * @description delete given DistributionList.
         * @param ouDistributionList
         * @return {Promise}
         */
        self.deleteOUDistributionList = function (ouDistributionList) {
            var id = ouDistributionList.hasOwnProperty('id') ? ouDistributionList.id : ouDistributionList;
            return $http
                .delete((urlService.ouDistributionLists + '/' + id))
                .then(function () {
                    self.ouDistributionLists = _.filter(self.ouDistributionLists, function (ouDistributionList) {
                        return ouDistributionList.id !== id;
                    });
                });
        };
        /**
         * @description create the shred method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteOUDistributionList, self.updateOUDistributionList);

        /**
         * @description get ouDistributionList by ouDistributionListId
         * @param ouDistributionListId
         * @returns {OUDistributionList|undefined} return OUDistributionList Model or undefined if not found.
         */
        self.getOUDistributionListById = function (ouDistributionListId) {
            ouDistributionListId = ouDistributionListId instanceof OUDistributionList ? ouDistributionListId.id : ouDistributionListId;
            return _.find(self.ouDistributionLists, function (ouDistributionList) {
                return Number(ouDistributionList.id) === Number(ouDistributionListId)
            });
        };

        self.deleteBulkOUDistributionLists = function (ouDistributionLists) {
            var bulkIds = ouDistributionLists[0].hasOwnProperty('id') ? _.map(ouDistributionLists, 'id') : ouDistributionLists;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.ouDistributionLists + '/bulk',
                data: bulkIds
            }).then(function (result) {
                self.ouDistributionLists = _.filter(self.ouDistributionLists, function (ouDistributionList) {
                    return bulkIds.indexOf(ouDistributionList.id) === -1;
                });
                result = result.data.rs;
                var failedOUDistributionLists = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedOUDistributionLists.push(key);
                });
                return _.filter(ouDistributionLists, function (DistributionList) {
                    return (failedOUDistributionLists.indexOf(DistributionList.id) > -1);
                });
            });
        };

        self.getRelatedOUDistributionLists = function (DistributionList) {
            var DistributionListId = DistributionList.hasOwnProperty('id') ? DistributionList.id : DistributionList;
            return _.filter(self.ouDistributionLists, function (ouDistributionList) {
                return DistributionListId === ouDistributionList.DistributionList.id;
            });
        };
        /**
         * @description add bulk ouDistributionLists
         * @param ouDistributionLists
         * @returns {Promise|[OUDistributionList]}
         */
        self.addBulkOUDistributionLists = function (ouDistributionLists) {
            return $http
                .post((urlService.ouDistributionLists + '/bulk'),
                    generator.interceptSendCollection('OUDistributionList', ouDistributionLists))
                .then(function (result) {
                    result = result.data.rs;
                    ouDistributionLists = _.map(ouDistributionLists, function (ouDistributionList, index) {
                        ouDistributionList.id = result[index];
                        return ouDistributionList;
                    });
                    return ouDistributionLists;
                });
        };
        /**
         * @description return the list of the ouDistributionList
         * @param organizations
         * @param DistributionList
         * @param insert
         * @return {Array}
         */
        self.createListOUDistributionLists = function (organizations, DistributionList, insert) {
            var ouDistributionLists = _.map(organizations, function (organization) {
                var ouDistributionList = new OUDistributionList();
                return ouDistributionList.setOuId(organization).setDistributionList(DistributionList);
            });

            if (!insert)
                return $q.when(ouDistributionLists);

            return self.addBulkOUDistributionLists(ouDistributionLists);
        }

    });
};
