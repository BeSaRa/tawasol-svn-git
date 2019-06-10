module.exports = function (app) {
    app.service('searchOutgoingService', function (urlService,
                                                   $http,
                                                   $q,
                                                   generator,
                                                   Outgoing,
                                                   tokenService,
                                                   _,
                                                   $timeout,
                                                   dialog,
                                                   langService,
                                                   toast,
                                                   cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'searchOutgoingService';

        self.searchOutgoings = [];

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
         * @description Search the outgoing document
         * @param model
         * @param properties
         * @return {Promise|searchOutgoings}
         */
        self.searchOutgoingDocuments = function (model, properties) {
            var criteria = generator.interceptSendInstance('SearchOutgoing', model);
            var ignoredPropertyConfiguration = ["FromRegOUId", "ToRegOUId", "ExportDate"];
            criteria = _checkPropertyConfiguration(criteria, properties, ignoredPropertyConfiguration);

            return $http
                .post(urlService.searchDocument.change({searchType: 'outgoing'}),
                    generator.interceptSendInstance('SearchCriteria', criteria))
                .then(function (result) {
                    self.searchOutgoings = generator.generateCollection(result.data.rs, Outgoing, self._sharedMethods);
                    self.searchOutgoings = generator.interceptReceivedCollection(['Correspondence', 'Outgoing'], self.searchOutgoings);
                    return self.searchOutgoings;
                });
        };

        /**
         * @description Export searched Outgoing Document item
         * @param searchedOutgoingDocument
         */
        self.exportSearchOutgoing = function (searchedOutgoingDocument) {
            var vsId = searchedOutgoingDocument.hasOwnProperty('generalStepElm')
                ? (searchedOutgoingDocument.generalStepElm.hasOwnProperty('vsId') ? searchedOutgoingDocument.generalStepElm.vsId : searchedOutgoingDocument.generalStepElm)
                : (searchedOutgoingDocument.hasOwnProperty('vsId') ? searchedOutgoingDocument.vsId : searchedOutgoingDocument);

            return $http
                .put(urlService.userInboxActions + "/outgoing/" + vsId + "/export")
                .then(function (result) {
                    return searchedOutgoingDocument;
                });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteSearchOutgoing, self.updateSearchOutgoing);
    });
};
