module.exports = function (app) {
    app.service('searchGeneralService', function (urlService,
                                                  $http,
                                                  $q,
                                                  generator,
                                                  General,
                                                  Correspondence,
                                                  tokenService,
                                                  _) {
        'ngInject';
        var self = this;
        self.serviceName = 'searchGeneralService';

        self.searchGenerals = [];


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
         * @description Search the general document
         * @param model
         * @param properties
         * @return {Promise|searchGenerals}
         */
        self.searchGeneralDocuments = function (model, properties) {
            var criteria = generator.interceptSendInstance('SearchGeneral', model);

            criteria = _checkPropertyConfiguration(criteria, properties);

            return $http
                .post(urlService.searchDocument.change({searchType: 'general'}),
                    generator.interceptSendInstance('SearchCriteria', criteria))
                .then(function (result) {
                    self.searchGenerals = generator.generateCollection(result.data.rs, General, self._sharedMethods);
                    self.searchGenerals = generator.interceptReceivedCollection(['Correspondence', 'General'], self.searchGenerals);
                    return self.searchGenerals;
                });
        };
        /**
         * @description Search the general document
         * @param model
         * @param properties
         * @return {Promise|searchGenerals}
         */
        self.searchForDocuments = function (model, properties) {
            var criteria = generator.interceptSendInstance('SearchGeneral', model);

            criteria = _checkPropertyConfiguration(criteria, properties);

            return $http
                .post(urlService.searchDocument.change({searchType: 'general'}),
                    generator.interceptSendInstance('SearchCriteria', criteria))
                .then(function (result) {
                    self.searchGenerals = generator.generateCollection(result.data.rs, General, self._sharedMethods);
                    self.searchGenerals = generator.interceptReceivedCollection(['Correspondence', 'General'], self.searchGenerals);
                    return self.searchGenerals;
                });
        };

        /**
         * @description Export searched General Document item
         * @param searchedGeneralDocument
         */
        self.exportSearchGeneral = function (searchedGeneralDocument) {
            var vsId = searchedGeneralDocument.hasOwnProperty('generalStepElm')
                ? (searchedGeneralDocument.generalStepElm.hasOwnProperty('vsId') ? searchedGeneralDocument.generalStepElm.vsId : searchedGeneralDocument.generalStepElm)
                : (searchedGeneralDocument.hasOwnProperty('vsId') ? searchedGeneralDocument.vsId : searchedGeneralDocument);

            return $http
                .put(urlService.userInboxActions + "/general/" + vsId + "/export")
                .then(function (result) {
                    return searchedGeneralDocument;
                });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteSearchGeneral, self.updateSearchGeneral);
    });
};
