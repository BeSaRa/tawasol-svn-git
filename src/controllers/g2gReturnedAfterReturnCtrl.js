module.exports = function (app) {
    app.controller('g2gReturnedAfterReturnCtrl', function (gridService,
                                                           $q,
                                                           langService,
                                                           g2gReturnedService,
                                                           generator,
                                                           $filter,
                                                           contextHelpService,
                                                           g2gSentItemsService,
                                                           printService) {
        'ngInject';
        var self = this;
        self.controllerName = 'g2gReturnedAfterReturnCtrl';

        contextHelpService.setHelpTo('returned-after-return-g2g');


        /**
         * @description Contains the selected g2g inbox items
         * @type {Array}
         */
        self.selectedG2gItems = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.g2g.returnedAfterReturn) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.g2g.returnedAfterReturn, self.g2gItems),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.g2g.returnedAfterReturn, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.g2g.returnedAfterReturn),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.g2g.returnedAfterReturn, self.grid.truncateSubject);
            },
            searchColumns: {
                subject: 'subject',
                docType: function (record) {
                    return self.getSortingKey('typeInfo', 'Information');
                },
                documentNumber: 'outgoingSerial',
                g2gBookNumber: 'g2GRefNo',
                date: 'updateDate',
                mainSiteSubSiteString: function (record) {
                    return self.getSortingKey('mainSiteSubSiteString', 'Information');
                },
                comment: 'comment',
                senderForTrackingSheet: 'senderForTrackingSheet'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.g2gItems = gridService.searchGridData(self.grid, self.g2gItemsCopy);
            }
        };


        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.g2gItems = $filter('orderBy')(self.g2gItems, self.grid.order);
        };

        self.printResult = function ($event) {
            var printTitle = langService.get('menu_item_government_returned_after_return'),
                headers = [
                    'subject',
                    'document_type',
                    'security_level',
                    'sent_date',
                    'document_number',
                    'g2g_book_number',
                    'received_date',
                    'status',
                    'correspondence_sites',
                    'comment',
                    'returned_by'
                ];
            printService
                .printData(self.g2gItems, headers, printTitle);

        };

        /**
         * @description Reload the grid of returned after return
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadG2gReturnedAfterReturn = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return g2gReturnedService
                .loadG2gReturnedAfterReturn(self.selectedMonth, self.selectedYear)
                .then(function (result) {
                    self.g2gItems = result;
                    self.g2gItemsCopy = angular.copy(self.g2gItems);
                    self.selectedG2gItems = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };


        var today = new Date();
        self.selectedYear = today.getFullYear();
        self.selectedMonth = today.getMonth() + 1;
        self.getMonthYearForSentItems = function ($event) {
            g2gSentItemsService
                .openDateAndYearDialog(self.selectedMonth, self.selectedYear, $event)
                .then(function (result) {
                    self.selectedMonth = result.month;
                    self.selectedYear = result.year;
                    self.selectedMonthText = angular.copy(result.monthText);
                    self.reloadG2gReturnedAfterReturn(self.grid.page);
                });
        };
        self.selectedMonthText = generator.months[self.selectedMonth - 1].text;
        self.reloadG2gReturnedAfterReturn(self.grid.page);

    });
};


