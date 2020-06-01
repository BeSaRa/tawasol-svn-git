module.exports = function (app) {
    app.controller('serialsScreenCtrl', function (registryOrganizations, langService, printService, configurationService, gridService, referencePlanNumberService, _) {
        'ngInject';
        var self = this;
        self.controllerName = 'serialsScreenCtrl';
        self.registryOrganizations = angular.copy(registryOrganizations);
        self.selectedOrganizations = [];
        self.selectedYear = (new Date()).getFullYear();
        self.years = _.range(configurationService.SEARCH_YEARS, ((new Date()).getFullYear() + 1));
        self.ouSearchText = '';
        self.records = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.serialNumbers) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.serialNumbers, self.records),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.serialNumbers, limit);
            },
            searchColumns: {
                arabicName: 'arName',
                englishName: 'enName'
            },
            searchText: ''
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.records = $filter('orderBy')(self.records, self.grid.order);
        };

        self.selectedOrganizationsChanged = function () {
            if (!self.selectedYear || !self.selectedOrganizations.length) {
                return null;
            }

            referencePlanNumberService
                .loadSerials(self.selectedYear, self.selectedOrganizations)
                .then(function (result) {
                    self.records = result;
                });
        };

        self.selectedYearChanged = function () {
            self.selectedOrganizationsChanged();
        };

        self.printRecords = function () {
            printService.printData(self.records, Object.keys(self.records[0].getExportedData()), langService.get('menu_item_serials') + ' : ' + self.selectedYear);
        }

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };

        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of dropdown
         * @param $event
         */
        self.preventSearchKeyDown = function ($event) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                if (code !== 38 && code !== 40)
                    $event.stopPropagation();
            }
        };

    });
};
