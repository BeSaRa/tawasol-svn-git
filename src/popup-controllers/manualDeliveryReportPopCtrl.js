module.exports = function (app) {
    app.controller('manualDeliveryReportPopCtrl', function ($q,
                                                            $filter,
                                                            langService,
                                                            toast,
                                                            dialog,
                                                            _,
                                                            manualDeliveryReports,
                                                            correspondence,
                                                            correspondenceService,
                                                            generator) {
            'ngInject';
            var self = this;

            self.controllerName = 'manualDeliveryReportPopCtrl';

            self.correspondence = correspondence
            self.manualDeliveryReports = manualDeliveryReports;
            self.selectedManualDeliveryReports = [];
            self.withNotification = true;
            self.comment = null;
            self.exportDate = generator.getDateObjectFromTimeStamp(self.correspondence.exportDate);
            var currentDate = new Date();
            self.today = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate()
            );

            self.progress = null;
            self.grid = {
                limit: 5, // default limit
                page: 1, // first page
                order: '', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.manualDeliveryReports.length + 21);
                        }
                    }
                ]
            };


            /**
             * @description Get the sorting key for information or lookup model
             * @param property
             * @param modelType
             * @returns {*}
             */
            self.getSortingKey = function (property, modelType) {
                return generator.getColumnSortingKey(property, modelType);
            };

            self.getSortedData = function () {
                self.manualDeliveryReports = $filter('orderBy')(self.manualDeliveryReports, self.grid.order);
            };

            self.saveManualDeliveryReport = function ($event) {
                _setCommentsAndWithNotification();
                correspondenceService.addManualDeliveryReport(self.correspondence, self.selectedManualDeliveryReports)
                    .then(function () {
                        toast.success(langService.get('successfully_save_manual_delivery_report'));
                        dialog.hide();
                    })
            }

            function _setCommentsAndWithNotification() {
                return self.selectedManualDeliveryReports.map(item => {
                    item.comment = self.comment;
                    item.withNotification = self.withNotification;
                    return item
                });
            }

            /**
             * @description close broadcast popup
             */
            self.closePopup = function () {
                dialog.cancel();
            };
        }
    );
};
