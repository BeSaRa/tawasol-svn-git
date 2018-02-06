module.exports = function (app) {
    app.service('quickSearchCorrespondenceService', function (urlService,
                                                              $http,
                                                              $q,
                                                              generator,
                                                              QuickSearchCorrespondence,
                                                              tokenService,
                                                              $rootScope,
                                                              correspondenceService,
                                                              $timeout,
                                                              _,
                                                              dialog,
                                                              langService,
                                                              toast,
                                                              cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'quickSearchCorrespondenceService';

        self.quickSearchCorrespondence = [];

        self.searchForm = false;

        self.hideSearchForm = function () {
            self.searchForm = false;
            return self;
        };

        self.showSearchForm = function () {
            self.searchForm = true;
            return self;
        };

        self.toggleSearchFrom = function () {
            self.searchFrom = !self.searchForm;
            return self;
        };

        self.emptySearchInput = function () {
            $rootScope.$broadcast('$emptySearchInput');
            return self;
        };
        /**
         * @description Load the quick Search Correspondence from server.
         * @returns {Promise|quickSearchCorrespondence}
         */
        self.loadQuickSearchCorrespondence = function (quickSearch) {
            return $http.post(urlService.quickSearchCorrespondence, quickSearch)
                .then(function (result) {
                    // self.quickSearchCorrespondence = generator.generateCollection(result.data.rs, QuickSearchCorrespondence, self._sharedMethods);
                    self.quickSearchCorrespondence = correspondenceService.interceptReceivedCollectionBasedOnEachDocumentClass(result.data.rs);
                    return self.quickSearchCorrespondence;
                });
        };

        /**
         * @description Get quick Search Correspondence from self.quickSearchCorrespondence if found and if not load it from server again.
         * @returns {Promise|quickSearchCorrespondence}
         */
        self.getQuickSearchCorrespondence = function () {
            return self.quickSearchCorrespondence.length ? $q.when(self.quickSearchCorrespondence) : self.loadQuickSearchCorrespondence();
        };

        /**
         * @description Export searched Correspondence Document item
         * @param searchedCorrespondenceDocument
         */
        self.exportQuickSearchCorrespondence = function (searchedCorrespondenceDocument) {
            var vsId = searchedCorrespondenceDocument.hasOwnProperty('generalStepElm')
                ? (searchedCorrespondenceDocument.generalStepElm.hasOwnProperty('vsId') ? searchedCorrespondenceDocument.generalStepElm.vsId : searchedCorrespondenceDocument.generalStepElm)
                : (searchedCorrespondenceDocument.hasOwnProperty('vsId') ? searchedCorrespondenceDocument.vsId : searchedCorrespondenceDocument);

            return $http
                .put(urlService.userInboxActions + "/outgoing/" + vsId + "/export")
                .then(function (result) {
                    return searchedCorrespondenceDocument;
                });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteQuickSearchCorrespondence, self.updateQuickSearchCorrespondence);
    });
};
