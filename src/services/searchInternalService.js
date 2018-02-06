module.exports = function (app) {
    app.service('searchInternalService', function (urlService,
                                                   $http,
                                                   $q,
                                                   generator,
                                                   Internal,
                                                   tokenService,
                                                   _,
                                                   $timeout,
                                                   dialog,
                                                   langService,
                                                   toast,
                                                   cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'searchInternalService';

        self.searchInternals = [];

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
         * @description Search the internal document
         * @param model
         * @return {Promise|searchInternals}
         */
        self.searchInternalDocuments = function (model , properties) {
            var criteria = generator.interceptSendInstance('SearchInternal', model);

            criteria = _checkPropertyConfiguration(criteria, properties);

            return $http
                .post(urlService.searchDocument.change({searchType :'internal'}),
                    generator.interceptSendInstance('SearchCriteria', criteria))
                .then(function (result) {
                    self.searchInternals = generator.generateCollection(result.data.rs, Internal, self._sharedMethods);
                    self.searchInternals = generator.interceptReceivedCollection(['Correspondence', 'Internal'], self.searchInternals);
                    return self.searchInternals;
                });
        };

        /**
         * @description Export searched Internal Document item
         * @param searchedInternalDocument
         */
        self.exportSearchInternal = function (searchedInternalDocument) {
            var vsId = searchedInternalDocument.hasOwnProperty('generalStepElm')
                ? (searchedInternalDocument.generalStepElm.hasOwnProperty('vsId') ? searchedInternalDocument.generalStepElm.vsId : searchedInternalDocument.generalStepElm)
                : (searchedInternalDocument.hasOwnProperty('vsId') ? searchedInternalDocument.vsId : searchedInternalDocument);

            return $http
                .put(urlService.userInboxActions + "/internal/" + vsId + "/export")
                .then(function (result) {
                    return searchedInternalDocument;
                });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteSearchInternal, self.updateSearchInternal);
    });
};
