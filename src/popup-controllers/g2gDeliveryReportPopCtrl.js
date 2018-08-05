module.exports = function (app) {
    app.controller('g2gDeliveryReportPopCtrl', function (viewDeliveryReportService,
                                                          _,
                                                          toast,
                                                          generator,
                                                          dialog,
                                                          langService,
                                                          records) {
        'ngInject';
        var self = this;
        self.controllerName = 'g2gDeliveryReportPopCtrl';
        self.deliveryReportRecords = records;


        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.deliveryReportRecords.length + 21);
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

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        }
    });
};