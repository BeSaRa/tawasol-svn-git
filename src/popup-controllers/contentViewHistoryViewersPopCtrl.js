module.exports = function (app) {
    app.controller('contentViewHistoryViewersPopCtrl', function (_,
                                                                 generator,
                                                                 dialog,
                                                                 langService,
                                                                 contentViewHistoryViewers,
                                                                 contentViewHistorySubject,
                                                                 viewTrackingSheetService,
                                                                 $filter,
                                                                 gridService,
                                                                 employeeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'contentViewHistoryViewersPopCtrl';
        self.contentViewHistoryViewers = angular.copy(contentViewHistoryViewers);
        self.contentViewHistorySubject = contentViewHistorySubject;
        self.employee = employeeService.getEmployee();

        self.grid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.trackingSheet.contentViewHistoryViewers) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.trackingSheet.contentViewHistoryViewers, self.contentViewHistoryViewers.length),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.trackingSheet.contentViewHistoryViewers, limit);
            }
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
