module.exports = function (app) {
    app.controller('mergedLinkedDocHistoryEventsPopCtrl', function (_,
                                                                    generator,
                                                                    dialog,
                                                                    langService,
                                                                    mergedLinkedDocHistoryEvents,
                                                                    mergedLinkedDocHistorySubject,
                                                                    viewTrackingSheetService) {
        'ngInject';
        var self = this;
        self.controllerName = 'mergedLinkedDocHistoryEventsPopCtrl';
        self.mergedLinkedDocHistoryEvents = angular.copy(mergedLinkedDocHistoryEvents);
        self.mergedLinkedDocHistorySubject = mergedLinkedDocHistorySubject;
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.mergedLinkedDocHistoryEvents.length + 21);
                    }
                }
            ]
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

        /**
         * @description Close the popup
         */
        self.closeMergedLinkedDocHistoryEventsPopupFromCtrl = function () {
            dialog.cancel();
        }
    });
};