module.exports = function (app) {
    app.service('g2gLookupService', function (urlService,
                                              $http,
                                              $q,
                                              generator,
                                              LookupG2G,
                                              _) {
        'ngInject';
        var self = this;
        self.serviceName = 'g2gLookupService';

        self.g2gLookups = {};
        self.g2gInternalLookups = {};

        self.lookupCategory = {
            securityLevel: {name: 'securityLevel', lKey: 0},
            priorityLevel: {name: 'priorityLevel', lKey: 1},
            docClass: {name: 'docClass', lKey: 2},
            followupType: {name: 'followupType', lKey: 3},
            trackingActions: {name: 'trackingActions', lKey: 4},//status
            documentActions: {name: 'documentActions', lKey: 5},
            ouTypes: {name: 'ouTypes', lKey: 6},
            category: {name: 'category', lKey: 7},
            userType: {name: 'userType', lKey: 8},
            requiredFields: {name: 'requiredFields', lKey: 9},
            documentType: {name: 'documentType', lKey: 10},
            copyOrOriginal: {name: 'copyOrOriginal', lKey: 11},
            country: {name: 'country', lKey: 12},
            jobTitle: {name: 'jobTitle', lKey: 13},
            governmentOrPrivate: {name: 'governmentOrPrivate', lKey: 14},
            fileType: {name: 'fileType', lKey: 15},
            sessionActon: {name: 'sessionActon', lKey: 16}
        };

        self.categorizeLookups = function (g2gLookups) {
            self.g2gLookups = {};
            var category, record;
            for (var i = 0; i < g2gLookups.length; i++) {
                record = g2gLookups[i];
                category = _.findKey(self.lookupCategory, ['lKey', record.category]);
                //category = findKeyByValue(self.lookupCategory, record.category);
                if (!self.g2gLookups.hasOwnProperty(category))
                    self.g2gLookups[category] = [];
                self.g2gLookups[category].push(record);
            }
        };

        self.categorizeInternalLookups = function (g2gInternalLookups) {
            self.g2gInternalLookups = {};
            var category, record;
            for (var i = 0; i < g2gInternalLookups.length; i++) {
                record = g2gInternalLookups[i];
                category = _.findKey(self.lookupCategory, ['lKey', record.category]);
                //category = findKeyByValue(self.lookupCategory, record.category);
                if (!self.g2gInternalLookups.hasOwnProperty(category))
                    self.g2gInternalLookups[category] = [];
                self.g2gInternalLookups[category].push(record);
            }
        };

        /**
         * @description Load the lookups from server.
         * @returns {Promise|g2gLookups}
         */
        self.loadG2gLookups = function () {
            return $http.get(urlService.g2gInbox + 'load-lookups')
                .then(function (result) {
                    result = generator.generateCollection(result.data.rs, LookupG2G, self._sharedMethods);
                    result = generator.interceptReceivedCollection('LookupG2G', result);
                    self.categorizeLookups(result);
                    //console.log('g2g lookups', self.g2gLookups);
                    return self.g2gLookups;
                }).catch(function(error){
                    return {};
                });
        };


        /**
         * @description Get lookups from self.g2gLookups if found and if not load it from server again.
         * @returns {Promise|g2gLookups}
         */
        self.getG2gLookups = function () {
            return Object.keys(self.g2gLookups).length ? $q.when(self.g2gLookups) : self.loadG2gLookups();
        };

        /**
         * @description Load the internal lookups from server.
         * @returns {Promise|g2gInternalLookups}
         */
        self.loadG2gInternalLookups = function () {
            return $http.get(urlService.g2gInbox + 'load-internal-lookups')
                .then(function (result) {
                    result = generator.generateCollection(result.data.rs, LookupG2G, self._sharedMethods);
                    result = generator.interceptReceivedCollection('LookupG2G', result);
                    self.categorizeInternalLookups(result);
                    //console.log('g2g lookups', self.g2gLookups);
                    return self.g2gInternalLookups;
                }).catch(function(error){
                    return {};
                });
        };

        /**
         * @description Get internal lookups from self.g2gInternalLookups if found and if not load it from server again.
         * @returns {Promise|g2gInternalLookups}
         */
        self.getG2gInternalLookups = function () {
            return Object.keys(self.g2gInternalLookups).length ? $q.when(self.g2gInternalLookups) : self.loadG2gInternalLookups();
        };

        /**
         * @description Get lookup by lkey
         * @param category
         * @param lKey
         * @param isInternalG2G
         * @returns {LookupG2G|undefined} return G2gLookup Model or undefined if not found.
         */
        self.getG2gLookupByCategoryAndLookupKey = function (category, lKey, isInternalG2G) {
            lKey = lKey instanceof LookupG2G ? lKey.lkey : lKey;
            var lookups = isInternalG2G ? self.g2gInternalLookups : self.g2gLookups;
            return _.find(lookups[category], function (g2gLookup) {
                return Number(g2gLookup.lkey) === Number(lKey);
            });
        };

        /**
         * @description get lookup by lookupId
         * @param category
         * @param lookupId
         * @param isInternalG2G
         * @returns {Lookup|undefined} return Lookup Model or undefined if not found.
         */
        self.getG2gLookupByCategoryAndId = function (category, lookupId, isInternalG2G) {
            lookupId = lookupId instanceof LookupG2G ? lookupId.id : lookupId;
            var lookups = isInternalG2G ? self.g2gInternalLookups : self.g2gLookups;
            return _.find(lookups[category], function (lookup) {
                return Number(lookup.id) === Number(lookupId)
            });
        };

        self.getG2gLookupsByCategory = function (category, isInternalG2G) {
            var lookups = isInternalG2G ? self.g2gInternalLookups : self.g2gLookups;
            return lookups[category];
        }

    });
};
