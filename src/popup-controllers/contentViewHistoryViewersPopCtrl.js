module.exports = function (app) {
    app.controller('contentViewHistoryViewersPopCtrl', function (_,
                                                                 generator,
                                                                 dialog,
                                                                 langService,
                                                                 contentViewHistoryViewers,
                                                                 contentViewHistorySubject,
                                                                 viewTrackingSheetService,
                                                                 $filter) {
        'ngInject';
        var self = this;
        self.controllerName = 'contentViewHistoryViewersPopCtrl';
        self.contentViewHistoryViewers = angular.copy(contentViewHistoryViewers);
        self.contentViewHistorySubject = contentViewHistorySubject;

        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.contentViewHistoryViewers.length + 21);
                    }
                }
            ]
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.contentViewHistoryViewers = $filter('orderBy')(self.contentViewHistoryViewers, self.grid.order);
        };

        /**
         * @description Export Tracking Sheet To Excel
         * @param $event
         */
        self.exportToExcel = function ($event) {
            viewTrackingSheetService.controllerMethod.viewTrackingSheetExportToExcel('content_view_history_viewers', langService.get('view_tracking_sheet_viewers') + ' : ' + self.contentViewHistorySubject);
        };

        /**
         * @description Print Tracking Sheet
         */
        self.printSheet = function ($event) {
            viewTrackingSheetService.controllerMethod.viewTrackingSheetPrint('content_view_history_viewers', langService.get('view_tracking_sheet_viewers') + ' : ' + self.contentViewHistorySubject);
        };

        /**
         * @description Close the popup
         */
        self.closeContentViewHistoryViewersPopupFromCtrl = function () {
            dialog.cancel();
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

    });
};