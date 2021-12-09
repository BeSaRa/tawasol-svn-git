module.exports = function (app) {
    app.controller('administratorOusListPopCtrl', function (dialog,
                                                            $filter,
                                                            gridService,
                                                            administrator,
                                                            adminOus) {
        'ngInject';
        var self = this;
        self.controllerName = 'administratorOusListPopCtrl';
        self.administrator = administrator;
        self.adminOus = adminOus;
        self.adminOusCopy = angular.copy(self.adminOus);
        self.selectedOus = [];

        /**
         * @description Contains the selected organizations
         * @type {Array}
         */
        self.selectedOus = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(),
            searchColumns: {
                arName: 'adminOnRegOUInfo.arName',
                enName: 'adminOnRegOUInfo.enName'
            },
            searchText: '',
            searchCallback: function () {
                self.adminOus = gridService.searchGridData(self.grid, self.adminOusCopy);
            }
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.adminOus = $filter('orderBy')(self.adminOus, self.grid.order);
        };

        self.closePopup = function ($event) {
            return dialog.cancel();
        }
    });
};
