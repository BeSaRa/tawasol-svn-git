module.exports = function (app) {
    app.controller('manageTagsDirectiveCtrl', function (outgoingService,
                                                        toast,
                                                        langService,
                                                        _,
                                                        $scope,
                                                        LangWatcher,
                                                        documentTagService,
                                                        employeeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageTagsDirectiveCtrl';
        self.fromDialog = false;
        self.employeeService = employeeService;
        self.searchResult = [];

        LangWatcher($scope);

        self.searchText = '';

        self.normalizeTag = function (tag) {
            if (!tag) {
                return '';
            }
            return tag.substr(1, tag.length - 2);
        };

        self.addTagToDocument = function (tag) {
            if (self.notifyAfterChanges) {
                self.notifyAfterChanges('add');
            }

            self.checkTagExists(tag) ? null : documentTagService.addBulkTags(tag);
        };

        self.removeTagToDocument = function (tag) {
            if (self.notifyAfterChanges) {
                self.notifyAfterChanges('delete');
            }

            return true;
        }

        self.checkTagExists = function (tag) {
            return self.searchResult && self.searchResult.length && self.searchResult.indexOf(self.normalizeTag(tag)) !== -1;
        };

        // search for tag -- calling the search service if tags more than 100, unless filter the current tags on client side
        self.querySearch = function (query) {
            return documentTagService
                .searchForTag(query)
                .then(function (result) {
                    return self.searchResult = _.uniq(_.map(result, 'tagValue'));
                });
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
            var maxLength = 150;
            chip = chip.replace(/#/g, '').replace(/\s/g, '_');
            chip = '#' + chip + '#';

            if (chip.length > maxLength) {
                chip = chip.substring(0, maxLength);
                toast.error(langService.get('max_length').change({length: maxLength}));
            }

            return chip;
        };

    });
};
