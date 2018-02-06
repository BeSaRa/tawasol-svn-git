module.exports = function (app) {
    app.controller('departmentInboxSentItemPopCtrl', function (
                                                               dialog,
                                                               langService,
                                                               currentMonth,
                                                               currentYear) {
        'ngInject';
        var self = this;
        self.controllerName = 'departmentInboxSentItemPopCtrl';
        self.validateLabels = {};

        self.selectedMonthCopy =  angular.copy(currentMonth);
        self.selectedYearCopy = angular.copy(currentYear);

        self.selectedMonth = currentMonth || null;
        self.selectedYear = currentYear || null;

        self.months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        self.months = [
            {
                text: langService.get('january'),
                value: 1
            },
            {
                text: langService.get('february'),
                value: 2
            },
            {
                text: langService.get('march'),
                value: 3
            },
            {
                text: langService.get('april'),
                value: 4
            },
            {
                text: langService.get('may'),
                value: 5
            },
            {
                text: langService.get('june'),
                value: 6
            },
            {
                text: langService.get('july'),
                value: 7
            },
            {
                text: langService.get('august'),
                value: 8
            },
            {
                text: langService.get('september'),
                value: 9
            },
            {
                text: langService.get('october'),
                value: 10
            },
            {
                text: langService.get('november'),
                value: 11
            },
            {
                text: langService.get('december'),
                value: 12
            }
        ];
        self.years = function () {
            var currentYear = new Date().getFullYear(), years = [];
            var lastYearForRange = currentYear - 10;
            while (lastYearForRange <= currentYear) {
                years.push(currentYear--);
            }
            return years;
        };

        /**
         * @description Get Sent Items
         * @param $event
         * @returns {*|Promise<any>}
         */
        self.getSentItemsDataForMonthAndYear = function ($event) {
            dialog.hide(
                {
                    month: self.selectedMonth,
                    year: self.selectedYear
                }
            );
        };

        /**
         * @description Close the popup
         */
        self.closeDepartmentInboxSentItemPopupFromCtrl = function () {
            dialog.cancel();
        }
    });
};