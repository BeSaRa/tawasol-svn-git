module.exports = function (app) {
    app.service('lookupService', function (urlService, $q, generator, Lookup, _) {
        'ngInject';
        var self = this, $http;
        self.serviceName = 'lookupService';

        self.lookups = {};

        // available lookup
        self.securityLevel = 'securityLevel';
        self.priorityLevel = 'priorityLevel';
        self.followupStatus = 'followupStatus';
        self.fileSize = 'fileSize';
        self.eventType = 'eventType';
        self.documentClass = 'documentClass';
        self.securitySchema = 'securitySchema';
        self.workflowSecurity = 'workflowSecurity';
        self.barcodeElement = 'barcodeElement';
        self.escalationProcess = 'escalationProcess';
        self.refrenceNumberPlanElement = 'refrenceNumberPlanElement';
        self.permissionGroup = 'permissionGroup';
        self.localizationModule = 'localizationModule';
        self.language = 'language';
        self.documentSubscription = 'documentSubscription';
        self.inboxFilterKey = 'inboxFilterKey';
        self.inboxSortOption = 'inboxSortOption';
        self.externalDataSourceType = 'externalDataSourceType';
        self.themeKey = 'themeKey';
        self.gender = 'gender';
        self.waterMarkTextOrientation = 'waterMarkTextOrientation';
        self.messageStatus = 'messageStatus';
        self.thumbnailMode = 'thumbnailMode';
        self.attachmentUpdateAction = 'attachmentUpdateAction';
        self.menuItemType = 'menuItemType';
        self.menuItemParam = 'menuItemParam';

        // this propertyConfiguration related to the property configurations Service.
        self.propertyConfigurations = {
            outgoing: [],
            incoming: [],
            internal: [],
            correspondence: [], // private key for global search,
            tawasolattachment: []
        };

        self.setHttpService = function (http) {
            $http = http;
        };

        /**
         * @description load lookups from server.
         * @returns {Promise|lookups}
         */
        self.loadLookups = function (lookupName) {
            return $http.get(urlService.lookups.change({lookupName: lookupName}))
                .then(function (result) {
                    self.lookups[lookupName] = generator.generateCollection(result.data.rs, Lookup, self._sharedMethods);
                    self.lookups[lookupName] = generator.interceptReceivedCollection('Lookup', self.lookups[lookupName]);
                    return self.lookups;
                });
        };
        /**
         * @description get lookups from self.lookups if found and if not load it from server again.
         * @returns {Promise|lookups}
         */
        self.getLookups = function (lookupName) {
            return (
                self.lookups.hasOwnProperty(lookupName) && self.lookups[lookupName].length ?
                    $q.when(self.lookups[lookupName]) : self.loadLookups(lookupName)
            );
        };

        self.defaultDocumentClasses = ['outgoing', 'incoming', 'internal'];
        self.defaultDocumentClassesDocumentSecurity = ['outgoing', 'incoming', 'internal', 'tawasolattachment'];

        /**
         * @description Returns the lookups based on lookupName.
         * @param lookupName
         * Describes the category of the lookup to be returned.
         * If the category is 'documentClass', return an array containing lookups for 'outgoing', 'incoming', 'internal'
         * @param isDocumentSecurity
         * Describes if the lookups returned will be used for the document security settings.
         * If the category is 'documentClass', return an array containing lookups for 'outgoing', 'incoming', 'internal', 'tawasolattachment'
         * @returns {Array}
         */
        self.returnLookups = function (lookupName, isDocumentSecurity) {
            var lookups = self.lookups.hasOwnProperty(lookupName) ? self.lookups[lookupName] : [];
            if (lookups.length && lookupName === self.documentClass) {
                lookups = _.filter(lookups, function (lookup) {
                    if(isDocumentSecurity)
                        return self.defaultDocumentClassesDocumentSecurity.indexOf(lookup.lookupStrKey.toLowerCase()) > -1;
                    return self.defaultDocumentClasses.indexOf(lookup.lookupStrKey.toLowerCase()) > -1;
                });
            }
            return lookups;
            //return self.lookups.hasOwnProperty(lookupName) ? self.lookups[lookupName] : [];
        };
        /**
         * @description add new lookup to service
         * @param lookup
         * @return {Promise|Lookup}
         */
        self.addLookup = function (lookup) {

        };
        /**
         * @description make an update for given lookup.
         * @param lookup
         * @return {Promise|Lookup}
         */
        self.updateLookup = function (lookup) {

        };
        /**
         * @description delete given lookup.
         * @param lookup
         * @return {Promise}
         */
        self.deleteLookup = function (lookup) {

        };
        /**
         * @description create the shred method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteLookup, self.updateLookup);

        /**
         * @description get lookup by lookupId
         * @param lookupName
         * @param lookupId
         * @returns {Lookup|undefined} return Lookup Model or undefined if not found.
         */
        self.getLookupById = function (lookupName, lookupId) {
            lookupId = lookupId instanceof Lookup ? lookupId.id : lookupId;
            return _.find(self.lookups[lookupName], function (lookup) {
                return Number(lookup.id) === Number(lookupId)
            });
        };
        /**
         * @description get lookup by lookupKey
         * @param lookupName
         * @param lookupKey
         * @returns {Lookup|undefined} return Lookup Model or undefined if not found.
         */
        self.getLookupByLookupKey = function (lookupName, lookupKey) {
            lookupKey = lookupKey instanceof Lookup ? lookupKey.lookupKey : lookupKey;
            return _.find(self.lookups[lookupName], function (lookup) {
                return Number(lookup.lookupKey) === Number(lookupKey)
            }) || lookupKey;
        };
        /**
         * this method to set the lookup from the when validate token or login
         * @param lookups
         */
        self.setLookups = function (lookups) {
            _.map(lookups, function (lookupType, key) {
                self.lookups[key] = generator.generateCollection(lookupType, Lookup, self._sharedMethods);
                self.lookups[key] = generator.interceptReceivedCollection('Lookup', self.lookups[key]);
                return self.lookups[key];
            });
        };

        /**
         * @description get lookup by lookupId
         * @param lookupName
         * @param lookupId
         * @returns {Lookup|undefined} return Lookup Model or undefined if not found.
         */
        self.getLookupByLookupId = function (lookupName, lookupId) {
            return $http.get(urlService.lookups.change({lookupName: lookupName}) + '/' + lookupId)
                .then(function (result) {
                    self.lookups[lookupName] = generator.generateCollection(result.data.rs, Lookup, self._sharedMethods);
                    self.lookups[lookupName] = generator.interceptReceivedCollection('Lookup', self.lookups[lookupName]);
                    return self.lookups;
                });
        };
        /**
         * @description set propertyConfigurations for all documentClass
         * @param propertyConfigurations
         */
        self.setPropertyConfigurations = function (propertyConfigurations) {
            self.propertyConfigurations.outgoing = [];
            self.propertyConfigurations.incoming = [];
            self.propertyConfigurations.internal = [];
            self.propertyConfigurations.correspondence = [];
            self.propertyConfigurations.tawasolattachment = [];

            _.map(propertyConfigurations, function (property) {
                var lookup = self.lookups.documentClass[property.documentClass] || 'correspondence';
                var documentClass = angular.isObject(lookup) ? lookup.lookupStrKey.toLowerCase() : lookup;
                self.propertyConfigurations[documentClass].push(property);
            });
        };

        /**
         * @description set propertyConfigurations for documentClass
         * @param propertyConfigurations
         * @param documentClass
         */
        self.replacePropertyConfigurationsByDocumentClass = function (propertyConfigurations, documentClass) {
            self.propertyConfigurations[documentClass.toLowerCase()] = propertyConfigurations;
        };

        /**
         * @description get propertyConfigurations for specific documentClass or all
         * @param documentClass
         * @return {*}
         */
        self.getPropertyConfigurations = function (documentClass) {
            documentClass = documentClass ? documentClass.toLowerCase() : '';
            if (documentClass && self.propertyConfigurations.hasOwnProperty(documentClass))
                return self.propertyConfigurations[documentClass];
            return self.propertyConfigurations;
        };

        /**
         * @description Get all property configurations in array
         * @returns {Array}
         */
        self.getAllPropertyConfigurations = function () {
            var propConfigs = self.getPropertyConfigurations(), allPropertyConfigs =[];
            _.map(Object.keys(propConfigs), function (documentClass) {
                allPropertyConfigs = allPropertyConfigs.concat(propConfigs[documentClass]);
                return propConfigs;
            });
            return allPropertyConfigs;
        };
    });
};
