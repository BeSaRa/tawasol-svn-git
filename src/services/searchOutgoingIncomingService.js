module.exports = function (app) {
    app.service('searchOutgoingIncomingService', function (urlService,
                                                           $http,
                                                           $q,
                                                           generator,
                                                           OutgoingIncomingSearch,
                                                           tokenService,
                                                           correspondenceService,
                                                           _) {
        'ngInject';
        var self = this;
        self.serviceName = 'searchOutgoingIncomingService';

        self.searchOutgoingIncomings = [];

        function _findProperty(property, model) {
            var value = null;
            _.map(model, function (item, key) {
                if (property === key.toLowerCase())
                    value = item;
            });
            return value;
        }

        function _checkPropertyConfiguration(model, properties, ignoredProperties) {
            var criteria = {};
            _.map(properties, function (item) {
                criteria[item.symbolicName] = _findProperty(item.symbolicName.toLowerCase(), model);
            });

            //add ignored properties
            if (ignoredProperties && ignoredProperties.length) {
                _.map(ignoredProperties, function (item) {
                    criteria[item] = _findProperty(item.toLowerCase(), model);
                });
            }

            return criteria;
        }

        /**
         * @description Search the Incoming document
         * @param model
         * @param properties
         * @return {Promise|searchOutgoingIncomings}
         */
        self.searchOutgoingIncomingDocuments = function (model, properties) {
            var criteria = generator.interceptSendInstance('SearchOutgoingIncoming', model);
            var ignoredPropertyConfiguration = ["FromRegOUId", "ToRegOUId"];
            criteria = _checkPropertyConfiguration(criteria, properties, ignoredPropertyConfiguration);

            return $http
                .post(urlService.searchDocument.change({searchType: 'correspondence'}),
                    generator.interceptSendInstance('SearchCriteria', criteria))
                .then(function (result) {
                    self.searchOutgoingIncomings = correspondenceService.interceptReceivedCollectionBasedOnEachDocumentClass(result.data.rs);
                    return self.searchOutgoingIncomings;
                });
        };

        /**
         * @description Search the Incoming document
         * @param model
         * @param properties
         * @return {Promise|searchOutgoingIncomings}
         */
        self.searchForDocuments = function (model, properties) {
            var criteria = generator.interceptSendInstance('SearchOutgoingIncoming', model);
            var ignoredPropertyConfiguration = ["FromRegOUId", "ToRegOUId"];
            criteria = _checkPropertyConfiguration(criteria, properties, ignoredPropertyConfiguration);

            return $http
                .post(urlService.searchDocument.change({searchType: 'correspondence'}),
                    generator.interceptSendInstance('SearchCriteria', criteria))
                .then(function (result) {
                    self.searchOutgoingIncomings = correspondenceService.interceptReceivedCollectionBasedOnEachDocumentClass(result.data.rs);
                    return self.searchOutgoingIncomings;
                });
        };

        /**
         * @description Export searched Incoming Document item
         * @param searchedIncomingDocument
         */
        self.exportSearchOutgoingIncoming = function (searchedIncomingDocument) {
            var vsId = searchedIncomingDocument.hasOwnProperty('generalStepElm')
                ? (searchedIncomingDocument.generalStepElm.hasOwnProperty('vsId') ? searchedIncomingDocument.generalStepElm.vsId : searchedIncomingDocument.generalStepElm)
                : (searchedIncomingDocument.hasOwnProperty('vsId') ? searchedIncomingDocument.vsId : searchedIncomingDocument);

            return $http
                .put(urlService.userInboxActions + "/outgoing-incoming/" + vsId + "/export")
                .then(function (result) {
                    return searchedIncomingDocument;
                });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteSearchOutgoingIncoming, self.updateSearchOutgoingIncoming);
    });
};
