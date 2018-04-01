module.exports = function (app) {
    app.controller('manageTagsDirectiveCtrl', function (outgoingService,
                                                        toast,
                                                        langService,
                                                        $scope,
                                                        LangWatcher,
                                                        documentTagService) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageTagsDirectiveCtrl';
        self.fromDialog = false;

        LangWatcher($scope);

        ////  load all document tags rom server //////////////////////
        self.loadedTags = [];
        documentTagService.searchForTag('').then(function (allDocTags){
            angular.forEach(allDocTags, function (tag) {
                self.loadedTags.push(tag.tagValue);
            });

        });


        // TODO: add search when tag selected
        // documentTagService.loadDocumentTags('ahmed').then(function (value) {
        //     console.log(value);
        // });
        self.searchText = '';

        self.addTagToDocument = function () {
            // outgoingService.saveTags(self.document, self.tags);
        };

        self.querySearch = function (query) {
            return query ? self.loadedTags.filter(createFilterFor(query)) : [];
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