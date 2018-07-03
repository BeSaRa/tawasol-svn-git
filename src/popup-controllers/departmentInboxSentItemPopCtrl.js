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

        //self.months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        self.months = [
            {
                text: 'january',
                value: 1
            },
            {
                text: 'february',
                value: 2
            },
            {
                text: 'march',
                value: 3
            },
            {
                text: 'april',
                value: 4
            },
            {
                text: 'may',
                value: 5
            },
            {
                text: 'june',
                value: 6
            },
            {
                text: 'july',
                value: 7
            },
            {
                text: 'august',
                value: 8
            },
            {
                text: 'september',
                value: 9
            },
            {
                text: 'october',
                value: 10
            },
            {
                text: 'november',
                value: 11
            },
            {
                text: 'december',
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
                    year: self.selectedYear,
                    monthText: self.months[self.selectedMonth - 1].text
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