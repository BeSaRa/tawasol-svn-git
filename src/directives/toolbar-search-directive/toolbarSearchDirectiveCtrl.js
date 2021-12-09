module.exports = function (app) {
    app.controller('toolbarSearchDirectiveCtrl', function ($element,
                                                           $state,
                                                           loadingIndicatorService,
                                                           $location,
                                                           $scope,
                                                           quickSearchCorrespondenceService,
                                                           $timeout,
                                                           _,
                                                           employeeService,
                                                           documentTagService,
                                                           gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'toolbarSearchDirectiveCtrl';
        self.quick = quickSearchCorrespondenceService;
        self.query = null;
        self.tagsSearchText = '';

        self.labels = {
            search: 'search'
        };
        self.loadingService = loadingIndicatorService;

        self.employeeService = employeeService;

        self.availableSearchCriteria = [
            {id: 1, key: 'DocSubjectSrc', value: 'document_subject', checkShow: gridService.checkToShowAction},
            {id: 2, key: 'DocFullSerial', value: 'full_serial', checkShow: gridService.checkToShowAction},
            {id: 3, key: 'Barcode', value: 'barcode', checkShow: gridService.checkToShowAction},
            {id: 4, key: 'Tags', value: 'tags', permissionKey: "TAG_SEARCH", checkShow: gridService.checkToShowAction},
            {
                id: 5,
                key: 'Content',
                value: 'search_content',
                permissionKey: "CONTENT_SEARCH",
                checkShow: gridService.checkToShowAction
            },
            {id: 6, key: 'WATERMARK_CODE', value: 'search_by_water_mark', checkShow: gridService.checkToShowAction},
            {id: 7, key: 'QR', value: 'search_by_qr_code', checkShow: gridService.checkToShowAction}
        ];

        self.showSearch = function () {
            self.quick.showSearchForm();
            if (self.query) {
                $state.go('app.search.quick-search',
                    {
                        key: self.searchCriteria.key,
                        q: self.query,
                        random: (Date.now()).toString()
                    });
            }
            $timeout(function () {
                $element.find('input').focus();
            });
        };

        self.hideSearch = function () {
            self.quick.hideSearchForm();
            self.query = null;
            self.searchCriteria = self.availableSearchCriteria[0];
        };

        self.toggleSearchForm = function () {
            self.quick.toggleSearchForm();
        };

        self.openMenu = function ($mdMenu, ev) {
            $mdMenu.open(ev);
        };

        self.setSelectedKey = function (menuItem) {
            self.searchCriteria = menuItem;
            self.tagsSearchText = '';
            if (self.searchCriteria.key === 'QR' || self.isTagKeySelected()) {
                self.query = '';
            }
            angular.element($element).find('input#query').focus();
        };

        self.onKeyPressSearch = function (event) {
            var code = event.which || event.code;
            if (code === 13 || event === 'mouse-clicked')
                self.showSearch();
            else if (code === 27) {
                self.hideSearch();
            }
        };

        self.searchCriteria = self.availableSearchCriteria[0];

        if ($location.search().key && $location.search().q) {
            self.quick.showSearchForm();
            $element.find('input').focus();
            self.query = $location.search().q;
            self.searchCriteria = _.filter(self.availableSearchCriteria, function (val) {
                return val.key === $location.search().key;
            })[0];
        }

        self.querySearchTags = function (query) {
            return documentTagService
                .searchForTag(query)
                .then(function (result) {
                    return self.searchResult = _.uniq(_.map(result, 'tagValue'));
                });
        };

        self.isTagKeySelected = function () {
            return self.searchCriteria.key === 'Tags';
        }

        $scope.$on('$emptySearchInput', function () {
            //$element.find('input').val("");
            self.query = null;
            self.searchCriteria = self.availableSearchCriteria[0];
        })
    });
};
