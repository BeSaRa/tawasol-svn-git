module.exports = function (app) {
    app.controller('searchDocDateRangePopCtrl', function (dialog, generator, moment, $timeout, langService) {
            'ngInject';
            var self = this;

            self.controllerName = 'searchDocDateRangePopCtrl';

            $timeout(function () {
                self.documentCopy = angular.copy(self.document);
                self.popupLabel = langService.get('select_date_range');
                if (self.year !== 'All')
                    self.popupLabel += " : " + self.year;
            });

            /**
             * @description Set the min and max range of date
             * @param requestType
             * @param $event
             */
            self.setMinMaxDocDate = function (requestType, $event) {
                if (requestType === 'default') {
                    if (self.year !== 'All') {
                        self.minDateForFrom = new Date(self.year + '-01-01');
                        self.maxDateForTo = new Date(self.year + '-12-31');
                    }
                    else {
                        self.minDateForFrom = null;
                        self.maxDateForTo = null;
                    }
                }
                self.maxDocDate = self.document.docDateTo;
                self.minDocDate = self.document.docDateFrom;

            };
            self.setMinMaxDocDate('default');

            /**
             * @description Close the popup and return the selected values
             * @param $event
             */
            self.returnSearchDocDates = function ($event) {
                dialog.hide({
                    dateFrom: self.document.docDateFrom,
                    dateTo: self.document.docDateTo,
                    dateFromLabel: self.document.docDateFrom ? moment(self.document.docDateFrom).format(generator.defaultDateFormat) : null,
                    dateToLabel: self.document.docDateTo ? moment(self.document.docDateTo).format(generator.defaultDateFormat) : null
                })
            };

            /**
             * @description Close the popup and return the original values
             * @param $event
             */
            self.closeSearchDocDatePopup = function ($event) {
                dialog.cancel({
                    dateFrom: self.documentCopy.docDateFrom,
                    dateTo: self.documentCopy.docDateTo,
                    dateFromLabel: self.documentCopy.docDateFrom ? moment(self.documentCopy.docDateFrom).format(generator.defaultDateFormat) : null,
                    dateToLabel: self.documentCopy.docDateTo ? moment(self.documentCopy.docDateTo).format(generator.defaultDateFormat) : null
                });
            }
        }
    )
};