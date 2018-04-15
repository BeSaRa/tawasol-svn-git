module.exports = function (app) {
    app.controller('manageTagsDirectiveCtrl', function (outgoingService,
                                                        toast,
                                                        langService,
                                                        _,
                                                        $scope,
                                                        LangWatcher,
                                                        documentTagService) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageTagsDirectiveCtrl';
        self.fromDialog = false;

        LangWatcher($scope);

        //// loading 100 document tags from server and check if there are more tags //////////////////////
        self.loadedTags = [];
        self.moreThan100Tags = false;

        documentTagService
            .searchForTag('')
            .then(function (result) { // always use name convention (result) for any Http response coming from BE.
                // get here first 100 tag
                self.moreThan100Tags = result.length > 100;
                self.loadedTags = _.map(_.take(result, 100), 'tagValue');
            });


        self.searchText = '';

        self.addTagToDocument = function () {
            // outgoingService.saveTags(self.document, self.tags);
        };

        self.checkTagExists = function (text) {
            return _.find(self.loadedTags, function (item) {
                return item === text;
            });
        };

        // search for tag -- calling the search service if tags more than 100, unless filter the current tags on client side
        self.querySearch = function (query) {
            if (self.moreThan100Tags && !self.checkTagExists(query)) {
                documentTagService.searchForTag(query).then(function (result) {
                    self.loadedTags = _.map(result, 'tagValue');
                });
                return self.loadedTags;
            } else return query ? self.loadedTags.filter(createFilterFor(query)) : [];
        };

        /**
         * filter the query
         * @param query
         * @return {Function}
         */
        function createFilterFor(query) {
            query = query.toLowerCase();
            return function (item) {
                return item.toLowerCase().indexOf(query) !== -1;
            }
        }

        /**
         * transform the chip before add
         * @param chip
         * @return {string|*}
         */
        self.transformChip = function (chip) {
            chip = chip.replace(/#/g, '').replace(/\s/g, '_');
            chip = '#' + chip + '#';
            return chip;
        };

    });
};