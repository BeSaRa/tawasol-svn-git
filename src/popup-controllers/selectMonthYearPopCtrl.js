module.exports = function (app) {
    app.controller('selectMonthYearPopCtrl', function (
                                                               dialog,
                                                               generator,
                                                               langService,
                                                               currentMonth,
                                                               currentYear) {
        'ngInject';
        var self = this;
        self.controllerName = 'selectMonthYearPopCtrl';
        self.validateLabels = {};

        self.selectedMonthCopy =  angular.copy(currentMonth);
        self.selectedYearCopy = angular.copy(currentYear);

        self.selectedMonth = currentMonth || null;
        self.selectedYear = currentYear || null;

        self.months = generator.months;

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
        self.returnMonthAndYear = function ($event) {
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
        self.closeMonthAndYearPopup = function () {
            dialog.cancel();
        }
    });
};