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
            }),
            new Report({
                id: 2,
                reportName: 'تقرير احصاء المراسلات',
                langKey: 'menu_item_reports_statistical_correspondence_report'
            }),
            new Report({
                id: 3,
                reportName: 'تقرير الدورات المستندية',
                langKey: 'menu_item_reports_documentary_report'
            }),
            new Report({
                id: 4,
                reportName: 'تقرير المتابعه',
                langKey: 'menu_item_reports_followup_report'
            }),
            new Report({
                id: 5,
                reportName: 'تقرير بريد المستخدم',
                langKey: 'menu_item_reports_user_mail_report'
            }),
            new Report({
                id: 6,
                reportName: 'سجل عمليات الدخول للنظام',
                langKey: 'menu_item_reports_login_logs_report'
            }),
            new Report({
                id: 7,
                reportName: 'لوحة استخدام النظام',
                langKey: 'menu_item_reports_system_usage_report'
            }),
            new Report({
                id: 8,
                reportName: 'لوحة بيان المراسلات التي بحاجة الى رد',
                langKey: 'menu_item_reports_message_board_response'
            }),
            new Report({
                id: 9,
                reportName: 'لوحة تقييم أداء مستخدم',
                langKey: 'menu_item_reports_user_performance_panel'
            }),
            new Report({
                id: 10,
                reportName: 'لوحة رصد الدورات المستندية للمراسلات',
                langKey: 'menu_item_reports_monitoring_correspondence_documentary_panel'
            }),
            new Report({
                id: 11,
                reportName: 'تقرير العمليات التي تمت على المستندات',
                langKey: 'menu_item_reports_processed_documents'
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
