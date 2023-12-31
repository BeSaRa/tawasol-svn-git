module.exports = function (app) {
    app.controller('viewTrackingSheetPopCtrl', function (_,
                                                         $filter,
                                                         toast,
                                                         document,
                                                         gridType,
                                                         heading,
                                                         parentGridName,
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
                                                         documentLinkViewerRecords,
                                                         followupLogRecords,
                                                         annotationLogRecords,
                                                         viewTrackingSheetService,
                                                         gridService,
                                                         employeeService,
                                                         rootEntity,
                                                         $q) {
        'ngInject';
        var self = this;
        self.controllerName = 'viewTrackingSheetPopCtrl';
        self.document = document;
        var info = document.getInfo();
        self.gridType = gridType;
        self.heading = heading;
        self.trackingSheetService = viewTrackingSheetService;
        self.employee = employeeService.getEmployee();
        var docSubject = info.title ? info.title : self.document.docSubject;
        self.globalSettings = rootEntity.getGlobalSettings();

        if (self.gridType !== 'tabs') {
            self.popupHeading = self.popupHeadingForPrint = langService.get(self.heading);
            if (docSubject)
                self.popupHeading = self.popupHeadingForPrint = self.popupHeading + ' : ' + docSubject;
            if (info.docFullSerial)
                self.popupHeading = self.popupHeadingForPrint = self.popupHeading + ' : ' + info.docFullSerial;
        } else if (self.gridType === 'tabs') {
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
        self.receivedIncomingHistoryRecords = [];
        self.fullHistoryRecords = fullHistoryRecords;
        self.documentLinkViewerRecords = documentLinkViewerRecords;
        self.followupLogRecords = followupLogRecords;
        self.annotationLogRecords = annotationLogRecords;
        self.selectedReceivedIncomingSiteLength = 0;
        self.trackingSheetService.selectedReceivedIncomingSite = null;
        // self.selectedReceivedIncomingSite = null;

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataWorkflowHistory = function () {
            self.workflowHistoryRecords = $filter('orderBy')(self.workflowHistoryRecords, self.workflowHistoryGrid.order);
        };

        self.workflowHistoryGrid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.trackingSheet.workflowHistory) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.trackingSheet.workflowHistory, self.workflowHistoryRecords.length),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.trackingSheet.workflowHistory, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.trackingSheet.workflowHistory),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.trackingSheet.workflowHistory, self.workflowHistoryGrid.truncateSubject);
            }
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataLinkedDocumentsHistory = function () {
            self.linkedDocumentsHistoryRecords = $filter('orderBy')(self.linkedDocumentsHistoryRecords, self.linkedDocumentsHistoryGrid.order);
        };

        self.linkedDocumentsHistoryGrid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.trackingSheet.linkedDocsHistory) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.trackingSheet.linkedDocsHistory, self.linkedDocumentsHistoryRecords.length),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.trackingSheet.linkedDocsHistory, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.trackingSheet.linkedDocsHistory),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.trackingSheet.linkedDocsHistory, self.linkedDocumentsHistoryGrid.truncateSubject);
            }
        };


        self.mergedLinkedDocHistoryGrid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.trackingSheet.mergedLinkedDocsHistory) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.trackingSheet.mergedLinkedDocsHistory, self.mergedLinkedDocumentHistoryRecords.length),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.trackingSheet.mergedLinkedDocsHistory, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.trackingSheet.mergedLinkedDocsHistory),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.trackingSheet.mergedLinkedDocsHistory, self.mergedLinkedDocHistoryGrid.truncateSubject);
            }
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataAttachmentsHistory = function () {
            self.attachmentsHistoryRecords = $filter('orderBy')(self.attachmentsHistoryRecords, self.attachmentsHistoryGrid.order);
        };

        self.attachmentsHistoryGrid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.trackingSheet.attachmentsHistory) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.trackingSheet.attachmentsHistory, self.attachmentsHistoryRecords.length),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.trackingSheet.attachmentsHistory, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.trackingSheet.attachmentsHistory),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.trackingSheet.attachmentsHistory, self.attachmentsHistoryGrid.truncateSubject);
            }
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataLinkedEntitiesHistory = function () {
            self.linkedEntitiesHistoryRecords = $filter('orderBy')(self.linkedEntitiesHistoryRecords, self.linkedEntitiesHistoryGrid.order);
        };

        self.linkedEntitiesHistoryGrid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.trackingSheet.linkedEntitiesHistory) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.trackingSheet.linkedEntitiesHistory, self.linkedEntitiesHistoryRecords.length),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.trackingSheet.linkedEntitiesHistory, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.trackingSheet.linkedEntitiesHistory),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.trackingSheet.linkedEntitiesHistory, self.linkedEntitiesHistoryGrid.truncateSubject);
            }
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataDestinationHistory = function () {
            self.destinationHistoryRecords = $filter('orderBy')(self.destinationHistoryRecords, self.destinationHistoryGrid.order);
        };

        self.destinationHistoryGrid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.trackingSheet.destinationsHistory) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.trackingSheet.destinationsHistory, self.destinationHistoryRecords.length),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.trackingSheet.destinationsHistory, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.trackingSheet.destinationsHistory),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.trackingSheet.destinationsHistory, self.destinationHistoryGrid.truncateSubject);
            }
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataContentViewHistory = function () {
            self.contentViewHistoryRecords = $filter('orderBy')(self.contentViewHistoryRecords, self.contentViewHistoryGrid.order);
        };

        self.contentViewHistoryGrid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.trackingSheet.contentViewHistory) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.trackingSheet.contentViewHistory, self.contentViewHistoryRecords.length),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.trackingSheet.contentViewHistory, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.trackingSheet.contentViewHistory),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.trackingSheet.contentViewHistory, self.contentViewHistoryGrid.truncateSubject);
            }
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataSMSLog = function () {
            self.smsLogRecords = $filter('orderBy')(self.smsLogRecords, self.smsLogsGrid.order);
        };
        self.smsLogsGrid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.trackingSheet.smsLogs) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.trackingSheet.smsLogs, self.smsLogRecords.length),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.trackingSheet.smsLogs, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.trackingSheet.smsLogs),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.trackingSheet.smsLogs, self.smsLogsGrid.truncateSubject);
            }
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataOutgoingDeliveryReport = function () {
            self.outgoingDeliveryReportRecords = $filter('orderBy')(self.outgoingDeliveryReportRecords, self.outgoingDeliveryReportGrid.order);
        };

        self.outgoingDeliveryReportGrid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.trackingSheet.outgoingDeliveryReport) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.trackingSheet.outgoingDeliveryReport, self.outgoingDeliveryReportRecords.length),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.trackingSheet.outgoingDeliveryReport, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.trackingSheet.outgoingDeliveryReport),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.trackingSheet.outgoingDeliveryReport, self.outgoingDeliveryReportGrid.truncateSubject);
            }
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataReceivedIncomingHistory = function () {
            self.receivedIncomingHistoryRecords = $filter('orderBy')(self.receivedIncomingHistoryRecords, self.receivedIncomingHistoryGrid.order);
        };

        self.setSelectedReceivedIncomingSiteLength = function ($event) {
            if (self.trackingSheetService.selectedReceivedIncomingSite && self.trackingSheetService.selectedReceivedIncomingSite.eventLogViewList) {
                self.selectedReceivedIncomingSiteLength = self.trackingSheetService.selectedReceivedIncomingSite.eventLogViewList.length;
                _setGridNameRecordCountMap('view_tracking_sheet_received_incoming_history', self.selectedReceivedIncomingSiteLength);
            }
        };

        self.receivedIncomingHistoryGrid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.trackingSheet.receivedIncomingHistory) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.trackingSheet.receivedIncomingHistory, self.selectedReceivedIncomingSiteLength),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.trackingSheet.receivedIncomingHistory, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.trackingSheet.receivedIncomingHistory),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.trackingSheet.receivedIncomingHistory, self.receivedIncomingHistoryGrid.truncateSubject);
            },
            firstLoaded: false
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataFullHistory = function () {
            self.fullHistoryRecords = $filter('orderBy')(self.fullHistoryRecords, self.fullHistoryGrid.order);
        };

        self.fullHistoryGrid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.trackingSheet.fullHistory) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.trackingSheet.fullHistory, self.fullHistoryRecords.length),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.trackingSheet.fullHistory, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.trackingSheet.fullHistory),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.trackingSheet.fullHistory, self.fullHistoryGrid.truncateSubject);
            }
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataFollowupLog = function () {
            self.followupLogRecords = $filter('orderBy')(self.followupLogRecords, self.followupLogGrid.order);
        };

        self.followupLogGrid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.trackingSheet.followupLog) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.trackingSheet.followupLog, self.followupLogRecords.length),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.trackingSheet.followupLog, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.trackingSheet.followupLog),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.trackingSheet.followupLog, self.followupLogGrid.truncateSubject);
            }
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataDocumentLinkViewerHistory = function () {
            self.documentLinkViewerRecords = $filter('orderBy')(self.documentLinkViewerRecords, self.documentLinkViewerGrid.order);
        };

        self.documentLinkViewerGrid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.trackingSheet.docLinkViewers) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.trackingSheet.docLinkViewers, self.documentLinkViewerRecords.length),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.trackingSheet.docLinkViewers, limit);
            }
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataAnnotationLog = function () {
            self.annotationLogRecords = $filter('orderBy')(self.annotationLogRecords, self.annotationLogGrid.order);
        };

        self.annotationLogGrid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.trackingSheet.annotationLog) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.trackingSheet.annotationLog, self.annotationLogRecords.length),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.trackingSheet.annotationLog, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.trackingSheet.annotationLog),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.trackingSheet.annotationLog, self.annotationLogGrid.truncateSubject);
            }
        };

        self.sortMergedLinkedDocs = function () {
            self.mergedLinkedDocumentHistoryRecords = $filter('orderBy')(self.mergedLinkedDocumentHistoryRecords, self.mergedLinkedDocHistoryGrid.order);

            var mainDoc = _.find(self.mergedLinkedDocumentHistoryRecords, 'mainDoc');
            var indexOfMainDoc = _.findIndex(self.mergedLinkedDocumentHistoryRecords, ['mainDoc', true]);
            self.mergedLinkedDocumentHistoryRecords.splice(indexOfMainDoc, 1);
            self.mergedLinkedDocumentHistoryRecords.unshift(mainDoc);
        };
        if (self.mergedLinkedDocumentHistoryRecords.length) {
            self.sortMergedLinkedDocs();
        }

        /**
         * @description View merged linked document history actions
         * @param mergedLinkedDocumentHistory
         * @param $event
         */
        self.viewMergedLinkedDocumentsHistoryEvents = function (mergedLinkedDocumentHistory, $event) {
            viewTrackingSheetService.controllerMethod
                .viewMergedLinkedDocumentHistoryEvents(mergedLinkedDocumentHistory, self.mergedLinkedDocumentHistoryRecords, $event);
        };

        /**
         * @description View content view history actions
         * @param contentViewHistory
         * @param $event
         */
        self.viewContentViewHistoryViewers = function (contentViewHistory, $event) {
            viewTrackingSheetService.controllerMethod
                .viewContentViewHistoryViewers(contentViewHistory, $event);
        };

        /**
         * @description Returns the tabs to show in the grid
         * @type {string[]}
         */
        self.tabsToShow = [
            'view_tracking_sheet_work_flow_history',
            'view_tracking_sheet_outgoing_delivery_reports',
            'view_tracking_sheet_received_incoming_history',
            'view_tracking_sheet_full_history',
            'view_tracking_sheet_merged_linked_document_history',
            'view_tracking_sheet_attachments_history',
            'view_tracking_sheet_content_view_history',
            'view_tracking_sheet_linked_documents_history',
            'view_tracking_sheet_linked_entities_history',
            'view_tracking_sheet_destination_history',
            'view_tracking_sheet_sms_logs',
            'view_tracking_sheet_document_link_viewer_history',
            'view_tracking_sheet_followup_logs',
            'view_tracking_sheet_annotation_logs'
            //'view_tracking_sheet_doc_update_history',
            //'view_tracking_sheet_doc_status_history'
        ];

        /**
         * @description Returns whether to show tab or not
         * @param tabName
         * @returns {boolean}
         */
        self.showTab = function (tabName) {
            if (tabName === 'view_tracking_sheet_outgoing_delivery_reports' || tabName === 'view_tracking_sheet_destination_history') {
                return (self.tabsToShow.indexOf(tabName) > -1 && info.documentClass === 'outgoing');
            } else if (tabName === 'view_tracking_sheet_received_incoming_history') {
                return (self.showTab('view_tracking_sheet_outgoing_delivery_reports') && employeeService.hasPermissionTo('VIEW_INCOMING_TRACKING'));
            } else if (tabName === 'view_tracking_sheet_content_view_history') {
                return (self.tabsToShow.indexOf(tabName) > -1 && employeeService.hasPermissionTo('VIEW_CONTENT_LOG'));
            } else if (tabName === 'view_tracking_sheet_followup_logs') {
                return (self.tabsToShow.indexOf(tabName) > -1 && (employeeService.hasPermissionTo('USER_FOLLOWUP_BOOKS') || employeeService.hasPermissionTo('ADMIN_USER_FOLLOWUP_BOOKS')));
            } else if (tabName === 'view_tracking_sheet_sms_logs') {
                return (parentGridName === gridService.grids.inbox.userInbox
                    || parentGridName === gridService.grids.inbox.group
                    || parentGridName === gridService.grids.inbox.favorite
                    || parentGridName === gridService.grids.search.outgoing
                    || parentGridName === gridService.grids.search.incoming
                    || parentGridName === gridService.grids.search.internal
                    || parentGridName === gridService.grids.search.general
                    || parentGridName === gridService.grids.search.outgoingIncoming
                    || parentGridName === gridService.grids.search.quick
                    || parentGridName === gridService.grids.others.linkedDoc)
            } else if (tabName === 'view_tracking_sheet_annotation_logs') {
                return rootEntity.hasPSPDFViewer();
            }
            return (self.tabsToShow.indexOf(tabName) > -1);
        };

        self.selectedTab = '';
        self.setCurrentTab = function (tabName) {
            var defer = $q.defer();
            if (tabName === 'view_tracking_sheet_received_incoming_history') {
                if (self.receivedIncomingHistoryGrid.firstLoaded) {
                    defer.resolve(tabName);
                } else {
                    self.loadGridRecordsOnDemand(tabName)
                        .then(function (result) {
                            defer.resolve(tabName);
                        })
                }
            } else {
                defer.resolve(tabName);
            }

            defer.promise.then(function (tab) {
                self.selectedTab = tab;
                self.heading = tab;

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
            })
        };

        self.gridNameRecordCountMap = {
            'view_tracking_sheet_work_flow_history': self.workflowHistoryRecords.length,
            'view_tracking_sheet_outgoing_delivery_reports': self.outgoingDeliveryReportRecords.length,
            'view_tracking_sheet_received_incoming_history': self.selectedReceivedIncomingSiteLength,
            'view_tracking_sheet_full_history': self.fullHistoryRecords.length,
            'view_tracking_sheet_merged_linked_document_history': self.mergedLinkedDocumentHistoryRecords.length,
            'view_tracking_sheet_attachments_history': self.attachmentsHistoryRecords.length,
            'view_tracking_sheet_content_view_history': self.contentViewHistoryRecords.length,
            'view_tracking_sheet_linked_documents_history': self.linkedDocumentsHistoryRecords.length,
            'view_tracking_sheet_linked_entities_history': self.linkedEntitiesHistoryRecords.length,
            'view_tracking_sheet_destination_history': self.destinationHistoryRecords.length,
            'view_tracking_sheet_sms_logs': self.smsLogRecords.length,
            'view_tracking_sheet_document_link_viewer_history': self.documentLinkViewerRecords.length,
            'view_tracking_sheet_followup_logs': self.followupLogRecords.length,
            'view_tracking_sheet_annotation_logs': self.annotationLogRecords.length
        };

        self.checkDisabled = function ($event) {
            var gridOrTab = self.selectedTab || self.heading;
            return !(!!self.gridNameRecordCountMap[gridOrTab]);
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
         * @description print legacy tracking sheet (Actions Report)
         * @param $event
         */
        self.printTrackingSheetByActions = function ($event) {
            viewTrackingSheetService.controllerMethod.viewTrackingSheetPrintByActions(self.document);
        }

        self.printSheetFromWebPage = function ($event) {
            viewTrackingSheetService.controllerMethod.viewTrackingSheetWebPage(self.heading, self.popupHeadingForPrint);
        };

        self.loadGridRecordsOnDemand = function (tabName) {
            if (tabName === 'view_tracking_sheet_received_incoming_history') {
                return viewTrackingSheetService.loadReceivedIncomingHistory(self.document)
                    .then(function (result) {
                        self.receivedIncomingHistoryRecords = result;
                        self.receivedIncomingHistoryGrid.firstLoaded = true;
                        if (result.length) {
                            viewTrackingSheetService.selectedReceivedIncomingSite = result[0];
                            self.setSelectedReceivedIncomingSiteLength();
                        }
                        return result;
                    })
            }
            return $q.reject('GRID_NOT_AVAILABLE');
        };

        /**
         * @description Close the popup
         */
        self.closeTrackingSheetPopupFromCtrl = function () {
            dialog.cancel();
        };

        function _setGridNameRecordCountMap(gridName, count) {
            self.gridNameRecordCountMap[gridName] = count;
        }

    });
};
