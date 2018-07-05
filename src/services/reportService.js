module.exports = function (app) {
    app.service('reportService', function (urlService, $http, $q, generator, Report, _) {
        'ngInject';
        var self = this;
        self.serviceName = 'reportService';

        self.reports = [
            new Report({
                id: 1,
                reportName: 'تقرير احصاء المدخلات',
                langKey: 'menu_item_reports_statistical_report'
            })
        ];
        /**
         * @description get all reports.
         * @return {*[]|*}
         */
        self.getReports = function () {
            return self.reports;
        };
        /**
         * @description get report by lang key.
         * @param langKey
         */
        self.getReportByKey = function (langKey) {
            return _.find(self.reports, function (report) {
                return report.langKey.toLowerCase() === langKey.toLowerCase();
            });
        }

    });
};
