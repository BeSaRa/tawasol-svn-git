module.exports = function (app) {
    app.controller('mergedLinkedDocHistoryEventsPopCtrl', function (_,
                                                                    $filter,
                                                                    generator,
                                                                    dialog,
                                                                    langService,
                                                                    mergedLinkedDocumentHistoryRecords,
                                                                    mergedLinkedDocumentHistoryIndex,
                                                                    viewTrackingSheetService,
                                                                    gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'mergedLinkedDocHistoryEventsPopCtrl';
        self.mergedLinkedDocumentHistoryRecords = mergedLinkedDocumentHistoryRecords;
        self.mergedLinkedDocumentHistoryIndex = mergedLinkedDocumentHistoryIndex;

        var _setMergedLinkedDocumentHistory = function () {
            var selectedMergedLinkedDocument = self.mergedLinkedDocumentHistoryRecords[self.mergedLinkedDocumentHistoryIndex];
            self.mergedLinkedDocHistoryEvents = selectedMergedLinkedDocument.events;
            self.mergedLinkedDocHistorySubject = selectedMergedLinkedDocument.docSubject;
            //reset events for print/export
            viewTrackingSheetService.mergedLinkedDocumentEvents = self.mergedLinkedDocHistoryEvents;
            //reset grid
            if (self.grid) {
                self.grid.page = 1;
                self.grid.order = '';
                self.grid.limitOptions = gridService.getGridLimitOptions(gridService.grids.trackingSheet.mergedLinkedDocsHistoryActions, self.mergedLinkedDocHistoryEvents.length)
            }
        };

        _setMergedLinkedDocumentHistory();

        self.grid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.trackingSheet.mergedLinkedDocsHistoryActions) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.trackingSheet.mergedLinkedDocsHistoryActions, self.mergedLinkedDocHistoryEvents.length),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.trackingSheet.mergedLinkedDocsHistoryActions, limit);
            }
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.mergedLinkedDocHistoryEvents = $filter('orderBy')(self.mergedLinkedDocHistoryEvents, self.grid.order);
        };

        /**
         * @description Export Tracking Sheet To Excel
         * @param $event
         */
        self.exportToExcel = function ($event) {
            viewTrackingSheetService.controllerMethod.viewTrackingSheetExportToExcel('merged_linked_document_history_events', langService.get('view_tracking_sheet_actions') + ' : ' + self.mergedLinkedDocHistorySubject);
        };

        /**
         * @description Print Tracking Sheet
         */
        self.printSheet = function ($event) {
            viewTrackingSheetService.controllerMethod.viewTrackingSheetPrint('merged_linked_document_history_events', langService.get('view_tracking_sheet_actions') + ' : ' + self.mergedLinkedDocHistorySubject);
        };

        self.printSheetFromWebPage = function ($event) {
            viewTrackingSheetService.controllerMethod.viewTrackingSheetWebPage('merged_linked_document_history_events', langService.get('view_tracking_sheet_actions') + ' : ' + self.mergedLinkedDocHistorySubject);
        };

        /**
         * @description Close the popup
         */
        self.closeMergedLinkedDocHistoryEventsPopupFromCtrl = function () {
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

        self.next = function ($event) {
            self.mergedLinkedDocumentHistoryIndex++;
            _setMergedLinkedDocumentHistory();
        };
        self.previous = function ($event) {
            self.mergedLinkedDocumentHistoryIndex--;
            _setMergedLinkedDocumentHistory();
        };

    });
};
