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
        self.loadedTags = [
            'CMS_PACKAGING',
            'MOTC',
            'User_Interface',
            'New_Deign'
        ];
        // TODO: add search when tag selected
        // documentTagService.loadDocumentTags('ahmed').then(function (value) {
        //     console.log(value);
        // });
        self.searchText = '';

        self.addTagToDocument = function () {
            // outgoingService.saveTags(self.document, self.tags);
        };

        self.querySearch = function (query) {
            //tagsService.searchFor('welcome').then(function(result){
                // array -> result.filter(createFilterFor(query))
            // })

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