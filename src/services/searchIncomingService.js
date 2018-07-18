module.exports = function (app) {
    app.service('searchIncomingService', function (urlService,
                                                   $http,
                                                   $q,
                                                   generator,
                                                   Incoming,
                                                   tokenService,
                                                   _,
                                                   $timeout,
                                                   dialog,
                                                   langService,
                                                   toast,
                                                   cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'searchIncomingService';

        self.searchIncomings = [];
        function _findProperty(property, model) {
            var value = null;
            _.map(model, function (item, key) {
                if (property === key.toLowerCase())
                    value = item;
            });
            return value;
        }

        function _checkPropertyConfiguration(model, properties) {
            var criteria = {};
            _.map(properties, function (item) {
                criteria[item.symbolicName] = _findProperty(item.symbolicName.toLowerCase(), model);
            });
            return criteria;
        }
        /**
         * @description Search the Incoming document
         * @param model
         * @param properties
         * @return {Promise|searchIncomings}
         */
        self.searchIncomingDocuments = function (model, properties) {
            var criteria = generator.interceptSendInstance('SearchIncoming', model);
            criteria = _checkPropertyConfiguration(criteria, properties);
            return $http
                .post(urlService.searchDocument.change({searchType: 'incoming'}),
                    generator.interceptSendInstance('SearchCriteria', criteria))
                .then(function (result) {
                    self.searchIncomings = generator.generateCollection(result.data.rs, Incoming, self._sharedMethods);
                    self.searchIncomings = generator.interceptReceivedCollection(['Correspondence', 'Incoming'], self.searchIncomings);
                    return self.searchIncomings;
                });
        };

        /**
         * @description Export searched Incoming Document item
         * @param searchedIncomingDocument
         */
        self.exportSearchIncoming = function (searchedIncomingDocument) {
            var vsId = searchedIncomingDocument.hasOwnProperty('generalStepElm')
                ? (searchedIncomingDocument.generalStepElm.hasOwnProperty('vsId') ? searchedIncomingDocument.generalStepElm.vsId : searchedIncomingDocument.generalStepElm)
                : (searchedIncomingDocument.hasOwnProperty('vsId') ? searchedIncomingDocument.vsId : searchedIncomingDocument);

            return $http
                .put(urlService.userInboxActions + "/incoming/" + vsId + "/export")
                .then(function (result) {
                    return searchedIncomingDocument;
                });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteSearchIncoming, self.updateSearchIncoming);
    });
};
