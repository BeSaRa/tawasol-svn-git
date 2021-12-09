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
        self.loadDeliveryReport = function (recordId, isInternal) {
            return $http.get(urlService.g2gInbox + 'get-delivery-report/' + isInternal + '/' + recordId).then(function (result) {
                var viewDeliveryReports = generator.generateCollection(result.data.rs, G2GMessagingHistory);
                viewDeliveryReports = generator.interceptReceivedCollection('G2GMessagingHistory', viewDeliveryReports);
                return viewDeliveryReports;
            });
        };

        /**
         * @description Load the entity names from server.
         * @returns {Promise|viewDeliveryReports}
         */
        self.loadNewDeliveryReport = function (g2gActionID) {
            return $http.get(urlService.deliveryReportG2GKuwait.replace('{g2gActionID}', g2gActionID)).then(function (result) {
                var viewDeliveryReports = generator.generateCollection(result.data.rs, G2GMessagingHistory);
                viewDeliveryReports = generator.interceptReceivedCollection('G2GMessagingHistory', viewDeliveryReports);
                return viewDeliveryReports;
            });
        };

        self.viewDeliveryReport = function (record, $event) {
            var id = record.hasOwnProperty('docId') ? record.docId : record;
            var isInternal = record.isInternalG2G();
            return dialog
                .showDialog({
                    targetEvent: $event,
                    templateUrl: cmsTemplate.getPopup('g2g-delivery-report'),
                    controller: 'g2gDeliveryReportPopCtrl',
                    controllerAs: 'ctrl',
                    bindToController: true,
                    locals: {
                        title: record.getTranslatedName()
                    },
                    resolve: {
                        records: function () {
                            return self.loadDeliveryReport(id, isInternal);
                        }
                    }
                });
        };
        /**
         * @description view delivery reports for g2g Kuwait
         * @param record
         * @param $event
         * @returns {promise}
         */
        self.viewG2GNewDeliveryReport = function (record, $event) {
            return dialog
                .showDialog({
                    targetEvent: $event,
                    templateUrl: cmsTemplate.getPopup('g2g-delivery-report'),
                    controller: 'g2gDeliveryReportPopCtrl',
                    controllerAs: 'ctrl',
                    bindToController: true,
                    locals: {
                        title: record.getTranslatedName()
                    },
                    resolve: {
                        records: function () {
                            return self.loadNewDeliveryReport(record.g2gActionID);
                        }
                    }
                });
        }
    });
};
