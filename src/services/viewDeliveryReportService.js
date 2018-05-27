module.exports = function (app) {
    app.service('viewDeliveryReportService', function (urlService,
                                                       $http,
                                                       $q,
                                                       generator,
                                                       G2GMessagingHistory,
                                                       _,
                                                       dialog,
                                                       langService,
                                                       toast,
                                                       cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'viewDeliveryReportService';

        self.viewDeliveryReports = [];

        /**
         * @description Load the entity names from server.
         * @returns {Promise|viewDeliveryReports}
         */
        self.loadDeliveryReport = function (recordId) {
            return $http.get(urlService.g2gInbox + 'getDeliveryReport/' + recordId).then(function (result) {
                var viewDeliveryReports = generator.generateCollection(result.data.rs, G2GMessagingHistory);
                viewDeliveryReports = generator.interceptReceivedCollection('G2GMessagingHistory', viewDeliveryReports);
                return viewDeliveryReports;
            });
        };

        self.viewDeliveryReport = function (record, $event) {
            return dialog
                .showDialog({
                    targetEvent: $event,
                    template: cmsTemplate.getPopup('view-delivery-report'),
                    controller: 'viewDeliveryReportPopCtrl',
                    controllerAs: 'ctrl',
                    resolve: {
                        records: function () {
                            return self.loadDeliveryReport(record);
                        }
                    }
                });
        }
    });
};
