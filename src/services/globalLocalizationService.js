module.exports = function (app) {
    app.service('globalLocalizationLookupService', function (urlService, 
                                                             $http, 
                                                             $q, 
                                                             generator, 
                                                             GlobalLocalizationLookup, 
                                                             _) {
        'ngInject';
        var self = this;
        self.serviceName = 'globalLocalizationLookupService';

        self.globalLocalizationLookups = [];

        /**
         * @description load globalLocalizationLookups from server.
         * @returns {Promise|globalLocalizationLookups}
         */
        self.loadGlobalLocalizationLookups = function () {
            return $http.get(urlService.globalLocalizationLookups).then(function (result) {
                self.globalLocalizationLookups = generator.generateHashMap(result.data.rs, GlobalLocalizationLookup, self._sharedMethods);
                self.globalLocalizationLookups = generator.interceptReceivedHashMap('GlobalLocalizationLookup', self.globalLocalizationLookups);
                return self.globalLocalizationLookups;
            });
        };
        /**
         * @description get globalLocalizationLookups from self.globalLocalizationLookups if found and if not load it from server again.
         * @returns {Promise|globalLocalizationLookups}
         */
        self.getGlobalLocalizationLookups = function () {
            return self.globalLocalizationLookups.length ? $q.when(self.globalLocalizationLookups) : self.loadGlobalLocalizationLookups();
        };
        /**
         * @description add new globalLocalizationLookup to service
         * @param globalLocalizationLookup
         * @return {Promise|GlobalLocalizationLookup}
         */
        self.addGlobalLocalizationLookup = function (globalLocalizationLookup) {
            return $http
                .post(urlService.globalLocalizationLookups,
                    generator.interceptSendInstance('GlobalLocalizationLookup', globalLocalizationLookup))
                .then(function () {
                    return globalLocalizationLookup;
                });
        };
        /**
         * @description make an update for given globalLocalizationLookup.
         * @param globalLocalizationLookup
         * @return {Promise|GlobalLocalizationLookup}
         */
        self.updateGlobalLocalizationLookup = function (globalLocalizationLookup) {
            return $http
                .put(urlService.globalLocalizationLookups,
                    generator.interceptSendInstance('GlobalLocalizationLookup', globalLocalizationLookup))
                .then(function () {
                    return globalLocalizationLookup;
                });
        };
        /**
         * @description delete given classification.
         * @param globalLocalizationLookup
         * @return {Promise}
         */
        self.deleteGlobalLocalizationLookup = function (globalLocalizationLookup) {
            var id = globalLocalizationLookup.hasOwnProperty('id') ? globalLocalizationLookup.id : globalLocalizationLookup;
            return $http
                .delete((urlService.globalLocalizationLookups + '/' + id));
        };
        /**
         * @description create the shred method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteGlobalLocalizationLookup, self.updateGlobalLocalizationLookup);

        /**
         * @description get globalLocalizationLookup by globalLocalizationLookupId
         * @param globalLocalizationLookupId
         * @returns {GlobalLocalizationLookup|undefined} return GlobalLocalizationLookup Model or undefined if not found.
         */
        self.getGlobalLocalizationLookupById = function (globalLocalizationLookupId) {
            globalLocalizationLookupId = globalLocalizationLookupId instanceof GlobalLocalizationLookup ? globalLocalizationLookupId.id : globalLocalizationLookupId;
            return _.find(self.globalLocalizationLookups, function (globalLocalizationLookup) {
                return Number(globalLocalizationLookup.id) === Number(globalLocalizationLookupId)
            });
        };

    });
};
