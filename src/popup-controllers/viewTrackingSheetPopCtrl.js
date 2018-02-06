module.exports = function (app) {
    app.controller('viewTrackingSheetPopCtrl', function (_,
                                                         toast,
                                                         document,
                                                         gridType,
                                                         heading,
                                                         validationService,
                                                         generator,
                                                         dialog,
                                                         langService,
                                                         workflowHistoryRecords,
                                                         linkedDocumentsHistoryRecords,
                                                         attachmentsHistoryRecords,
                                                         mergedLinkedDocumentHistoryRecords,
                                                         linkedEntitiesHistoryRecords,
                                                         destinationHistoryRecords,
                                                         contentViewHistoryRecords,
                                                         smsLogRecords,
                                                         outgoingDeliveryReportRecords,
                                                         fullHistoryRecords,
                                                         viewTrackingSheetService) {
        'ngInject';
        var self = this;
        self.controllerName = 'viewTrackingSheetPopCtrl';
        self.document = document;
        var info = document.getInfo();
        self.gridType = gridType;
        self.heading = heading;
        var docSubject = info.title ? info.title : self.document.docSubject;

        if (self.gridType !== 'tabs') {
            self.popupHeading = self.popupHeadingForPrint = langService.get(self.heading);
            if (docSubject)
                self.popupHeading = self.popupHeadingForPrint = self.popupHeading + ' : ' + docSubject;
            if (info.docFullSerial)
                self.popupHeading = self.popupHeadingForPrint = self.popupHeading + ' : ' + info.docFullSerial;
        }
        else if (self.gridType === 'tabs') {
            self.popupHeading = langService.get('view_tracking_sheet');
            self.popupHeadingForPrint = langService.get(self.selectedTab);
            if (docSubject) {
                self.popupHeading = self.popupHeading + ' : ' + docSubject;
                self.popupHeadingForPrint = self.popupHeadingForPrint + ' : ' + docSubject;
            }
            if (info.docFullSerial) {
                self.popupHeading = self.popupHeading + ' : ' + info.docFullSerial;
                self.popupHeadingForPrint = self.popupHeadingForPrint + ' : ' + info.docFullSerial;
            }
        }

        self.workflowHistoryRecords = workflowHistoryRecords;
        self.linkedDocumentsHistoryRecords = linkedDocumentsHistoryRecords;
        self.attachmentsHistoryRecords = attachmentsHistoryRecords;
        self.mergedLinkedDocumentHistoryRecords = mergedLinkedDocumentHistoryRecords;
        self.linkedEntitiesHistoryRecords = linkedEntitiesHistoryRecords;
        self.destinationHistoryRecords = destinationHistoryRecords;
        self.contentViewHistoryRecords = contentViewHistoryRecords;
        self.smsLogRecords = smsLogRecords;
        self.outgoingDeliveryReportRecords = outgoingDeliveryReportRecords;
        self.fullHistoryRecords = fullHistoryRecords;

        self.workflowHistoryGrid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.workflowHistoryRecords.length + 21);
                    }
                }
            ]
        };

        self.linkedDocumentsHistoryGrid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.linkedDocumentsHistoryRecords.length + 21);
                    }
                }
            ]
        };

        self.attachmentsHistoryGrid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.attachmentsHistoryRecords.length + 21);
                    }
                }
            ]
        };

        self.mergedLinkedDocHistoryGrid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.mergedLinkedDocumentHistoryRecords.length + 21);
                    }
                }
            ]
        };

        self.linkedEntitiesHistoryGrid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.linkedEntitiesHistoryRecords.length + 21);
                    }
                }
            ]
        };

        self.destinationHistoryGrid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.destinationHistoryRecords.length + 21);
                    }
                }
            ]
        };

        self.contentViewHistoryGrid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.contentViewHistoryRecords.length + 21);
                    }
                }
            ]
        };

        self.smsLogsGrid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.smsLogRecords.length + 21);
                    }
                }
            ]
        };

        self.outgoingDeliveryReportGrid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.outgoingDeliveryReportRecords.length + 21);
                    }
                }
            ]
        };

        self.fullHistoryGrid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.fullHistoryRecords.length + 21);
                    }
                }
            ]
        };

        self.sortMergedLinkedDocs = function () {
            var mainDoc = _.find(self.mergedLinkedDocumentHistoryRecords, 'mainDoc');
            var indexOfMainDoc = _.findIndex(self.mergedLinkedDocumentHistoryRecords, ['mainDoc', true]);
            self.mergedLinkedDocumentHistoryRecords.splice(indexOfMainDoc, 1);
            self.mergedLinkedDocumentHistoryRecords.unshift(mainDoc);
        };

        /**
         * @description View merged linked document history actions
         * @param mergedLinkedDocumentHistory
         * @param $event
         */
        self.viewMergedLinkedDocumentsHistoryEvents = function (mergedLinkedDocumentHistory, $event) {
            viewTrackingSheetService.controllerMethod
                .viewMergedLinkedDocumentHistoryEvents(mergedLinkedDocumentHistory, $event);
        };

        /**
         * @description View content view history actions
         * @param contentViewHistory
         * @param $event
         */
        self.viewContentViewHistoryEvents = function(contentViewHistory, $event){
            viewTrackingSheetService.controllerMethod
                .viewContentViewHistoryEvents(contentViewHistory, $event);
        };

        /**
         * @description Returns the tabs to show in the grid
         * @type {string[]}
         */
        self.tabsToShow = [
            'view_tracking_sheet_work_flow_history',
            'view_tracking_sheet_linked_documents_history',
            'view_tracking_sheet_attachments_history',
            'view_tracking_sheet_merged_linked_document_history',
            'view_tracking_sheet_linked_entities_history',
            'view_tracking_sheet_destination_history',
            'view_tracking_sheet_content_view_history',
            //'view_tracking_sheet_sms_logs',
            'view_tracking_sheet_outgoing_delivery_reports',
            'view_tracking_sheet_full_history',
            //'view_tracking_sheet_doc_update_history',
            //'view_tracking_sheet_doc_status_history'
        ];

        /**
         * @description Returns whether to show tab or not
         * @param tabName
         * @returns {boolean}
         */
        self.showTab = function (tabName) {
            if (tabName === 'view_tracking_sheet_outgoing_delivery_reports')
                return (self.tabsToShow.indexOf(tabName) > -1 && info.documentClass === 'outgoing');
            return (self.tabsToShow.indexOf(tabName) > -1);
        };

        self.selectedTab = "view_tracking_sheet_work_flow_history";
        self.setCurrentTab = function (tabName) {
            self.selectedTab = tabName;
            self.heading = tabName;

            self.popupHeading = langService.get('view_tracking_sheet');
            self.popupHeadingForPrint = langService.get(self.selectedTab);
            if (docSubject) {
                self.popupHeading = self.popupHeading + ' : ' + docSubject;
                self.popupHeadingForPrint = self.popupHeadingForPrint + ' : ' + docSubject;
            }
            if (info.docFullSerial) {
                self.popupHeading = self.popupHeading + ' : ' + info.docFullSerial;
                self.popupHeadingForPrint = self.popupHeadingForPrint + ' : ' + info.docFullSerial;
            }
        };

        /**
         * @description Export Tracking Sheet To Excel
         * @param $event
         */
        self.exportToExcel = function ($event) {
            viewTrackingSheetService.controllerMethod.viewTrackingSheetExportToExcel(self.heading, self.popupHeadingForPrint);
        };

        /**
         * @description Print Tracking Sheet
         */
        self.printSheet = function ($event) {
            viewTrackingSheetService.controllerMethod.viewTrackingSheetPrint(self.heading, self.popupHeadingForPrint);
        };

        /**
         * @description Close the popup
         */
        self.closeTrackingSheetPopupFromCtrl = function () {
            dialog.cancel();
        }

    });
};