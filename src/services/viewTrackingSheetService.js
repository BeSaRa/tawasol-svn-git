module.exports = function (app) {
    app.service('viewTrackingSheetService', function (urlService,
                                                      $http,
                                                      $q,
                                                      generator,
                                                      _,
                                                      dialog,
                                                      langService,
                                                      toast,
                                                      cmsTemplate,
                                                      EventHistory,
                                                      LinkedEntity,
                                                      LinkedAttachment,
                                                      LinkedDocument,
                                                      DestinationHistory,
                                                      ContentViewHistory,
                                                      SmsLog,
                                                      FullHistory,
                                                      OutgoingDeliveryReport,
                                                      MergedLinkedDocumentHistory,
                                                      downloadService) {
            'ngInject';
            var self = this;
            self.serviceName = 'viewTrackingSheetService';

            self.viewTrackingSheetsUserEvents = [];
            self.workflowHistory = [];
            self.documentUpdateHistory = [];
            self.linkedDocumentHistory = [];
            self.linkedAttachments = [];
            self.linkedEntities = [];
            self.smsLogs = [];
            self.destinationHistory = [];
            self.contentViewHistory = [];
            self.smsLogs = [];
            self.outgoingDeliveryReports = [];
            self.mergedLinkedDocumentHistory = [];
            self.fullHistory = [];


            /**
             * @description Returns the view tracking sheet options for grid actions
             * @param checkToShowAction
             * @param callback
             * @param gridOrTabs
             * @returns {[]}
             */
            self.getViewTrackingSheetOptions = function (checkToShowAction, callback, gridOrTabs) {
                if (gridOrTabs === 'tabs')
                    return [];
                return [
                    // Workflow History
                    {
                        type: 'action',
                        icon: '',
                        text: 'view_tracking_sheet_work_flow_history',
                        shortcut: false,
                        callback: callback,
                        params: ['view_tracking_sheet_work_flow_history', 'grid'], /* params[0] is used to give heading to popup and params[1] showing that there is only a grid only*/
                        class: "action-green",
                        checkShow: checkToShowAction
                    },
                    // Linked Documents History
                    {
                        type: 'action',
                        icon: '',
                        text: 'view_tracking_sheet_linked_documents_history',
                        shortcut: false,
                        callback: callback,
                        params: ['view_tracking_sheet_linked_documents_history', 'grid'], /* params[0] is used to give heading to popup and params[1] showing that there is only a grid only*/
                        class: "action-green",
                        checkShow: checkToShowAction
                    },
                    // Attachments History
                    {
                        type: 'action',
                        icon: '',
                        text: 'view_tracking_sheet_attachments_history',
                        shortcut: false,
                        callback: callback,
                        params: ['view_tracking_sheet_attachments_history', 'grid'], /* params[0] is used to give heading to popup and params[1] showing that there is only a grid only*/
                        class: "action-green",
                        checkShow: checkToShowAction
                    },
                    // Merged Linked Document History
                    {
                        type: 'action',
                        icon: '',
                        text: 'view_tracking_sheet_merged_linked_document_history',
                        shortcut: false,
                        callback: callback,
                        params: ['view_tracking_sheet_merged_linked_document_history', 'grid'], /* params[0] is used to give heading to popup and params[1] showing that there is only a grid only*/
                        class: "action-green",
                        checkShow: checkToShowAction
                    },
                    // Linked Entities History
                    {
                        type: 'action',
                        icon: '',
                        text: 'view_tracking_sheet_linked_entities_history',
                        shortcut: false,
                        callback: callback,
                        params: ['view_tracking_sheet_linked_entities_history', 'grid'], /* params[0] is used to give heading to popup and params[1] showing that there is only a grid only*/
                        class: "action-green",
                        checkShow: checkToShowAction
                    },
                    // Destination History
                    {
                        type: 'action',
                        icon: '',
                        text: 'view_tracking_sheet_destination_history',
                        shortcut: false,
                        callback: callback,
                        params: ['view_tracking_sheet_destination_history', 'grid'], /* params[0] is used to give heading to popup and params[1] showing that there is only a grid only*/
                        class: "action-green",
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            return checkToShowAction(action, model) && info.documentClass === "outgoing";
                        }
                    },
                    // Content View History
                    {
                        type: 'action',
                        icon: '',
                        text: 'view_tracking_sheet_content_view_history',
                        shortcut: false,
                        callback: callback,
                        params: ['view_tracking_sheet_content_view_history', 'grid'], /* params[0] is used to give heading to popup and params[1] showing that there is only a grid only*/
                        class: "action-green",
                        checkShow: checkToShowAction
                    },
                    // SMS Logs
                    {
                        type: 'action',
                        icon: '',
                        text: 'view_tracking_sheet_sms_logs',
                        shortcut: false,
                        hide: true,
                        callback: callback,
                        params: ['view_tracking_sheet_sms_logs', 'grid'], /* params[0] is used to give heading to popup and params[1] showing that there is only a grid only*/
                        class: "action-red",
                        checkShow: checkToShowAction
                    },
                    // Outgoing Delivery Reports
                    {
                        type: 'action',
                        icon: '',
                        text: 'view_tracking_sheet_outgoing_delivery_reports',
                        shortcut: false,
                        callback: callback,
                        params: ['view_tracking_sheet_outgoing_delivery_reports', 'grid'],
                        class: "action-green",
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            return checkToShowAction(action, model) && info.documentClass === "outgoing";
                        }
                    },
                    // Full History
                    {
                        type: 'action',
                        icon: '',
                        text: 'view_tracking_sheet_full_history',
                        shortcut: false,
                        callback: callback,
                        params: ['view_tracking_sheet_full_history', 'grid'], /* params[0] is used to give heading to popup and params[1] showing that there is only a grid only*/
                        class: "action-green",
                        checkShow: checkToShowAction
                    }
                ];
            };


            /**
             * @description Contains methods for CRUD operations for tracking sheets
             */
            self.controllerMethod = {
                /**
                 * @description open popup for tracking sheet
                 * @param document
                 * @param params
                 * @param $event
                 * @returns {promise}
                 */
                viewTrackingSheetPopup: function (document, params, $event) {
                    var heading = params ? params[0].toLowerCase() : 'view_tracking_sheet';
                    var gridType = params ? params[1].toLowerCase() : 'grid';
                    return dialog.showDialog({
                        template: cmsTemplate.getPopup('view-tracking-sheet'),
                        controller: 'viewTrackingSheetPopCtrl',
                        targetEvent: $event || false,
                        controllerAs: 'ctrl',
                        locals: {
                            document: document,
                            gridType: gridType,
                            heading: heading
                        },
                        resolve: {
                            workflowHistoryRecords: function () {
                                'ngInject';
                                return (heading === 'view_tracking_sheet_work_flow_history' || gridType === 'tabs')
                                    ? self.loadWorkflowHistory(document)
                                    .then(function (result) {
                                        return result;
                                    }) : [];
                            },
                            linkedDocumentsHistoryRecords: function () {
                                'ngInject';
                                return (heading === 'view_tracking_sheet_linked_documents_history' || gridType === 'tabs')
                                    ? self.loadLinkedDocumentsHistory(document)
                                    .then(function (result) {
                                        return result;
                                    }) : [];
                            },
                            attachmentsHistoryRecords: function () {
                                'ngInject';
                                return (heading === 'view_tracking_sheet_attachments_history' || gridType === 'tabs')
                                    ? self.loadAttachmentsHistory(document)
                                    .then(function (result) {
                                        return result;
                                    }) : [];
                            },
                            mergedLinkedDocumentHistoryRecords: function () {
                                'ngInject';
                                return (heading === 'view_tracking_sheet_merged_linked_document_history' || gridType === 'tabs')
                                    ? self.loadMergedLinkedDocumentHistory(document)
                                    .then(function (result) {
                                        return result;
                                    }) : [];
                            },
                            linkedEntitiesHistoryRecords: function () {
                                'ngInject';
                                return (heading === 'view_tracking_sheet_linked_entities_history' || gridType === 'tabs')
                                    ? self.loadLinkedEntitiesHistory(document)
                                    .then(function (result) {
                                        return result;
                                    }) : [];
                            },
                            destinationHistoryRecords: function () {
                                'ngInject';
                                return (heading === 'view_tracking_sheet_destination_history' || gridType === 'tabs')
                                    ? self.loadDestinationHistory(document)
                                    .then(function (result) {
                                        return result;
                                    }) : [];
                            },
                            contentViewHistoryRecords: function () {
                                'ngInject';
                                return (heading === 'view_tracking_sheet_content_view_history' || gridType === 'tabs')
                                    ? self.loadContentViewHistory(document)
                                    .then(function (result) {
                                        return result;
                                    }).catch(function (error) {
                                        return [];
                                    }) : [];
                            },
                            smsLogRecords: function () {
                                'ngInject';
                                return (heading === 'view_tracking_sheet_sms_logs' || gridType === 'tabs')
                                    ? self.loadSmsLogs(document)
                                    .then(function (result) {
                                        return result;
                                    }) : [];
                            },
                            outgoingDeliveryReportRecords: function () {
                                'ngInject';
                                var info = document.getInfo();
                                return (heading === 'view_tracking_sheet_outgoing_delivery_reports' || (gridType === 'tabs' && info.documentClass === 'outgoing'))
                                    ? self.loadOutgoingDeliveryReports(document)
                                    .then(function (result) {
                                        return result;
                                    }) : [];
                            },
                            fullHistoryRecords: function () {
                                'ngInject';
                                return (heading === 'view_tracking_sheet_full_history' || gridType === 'tabs')
                                    ? self.loadFullHistory(document)
                                    .then(function (result) {
                                        return result;
                                    }).catch(function (error) {
                                        return [];
                                    }) : [];
                            },
                            /*docUpdateHistoryRecords: function () {
                             'ngInject';
                             return (heading === 'view_tracking_sheet_doc_update_history' || gridType === 'tabs')
                             ? self.loadDocumentUpdateHistory(document)
                             .then(function (result) {
                             return result;
                             }).catch(function(error){
                             return [];
                             }) : [];
                             },
                             docStatusHistoryRecords: function () {
                             'ngInject';
                             return (heading === 'view_tracking_sheet_doc_status_history' || gridType === 'tabs')
                             ? self.loadDocumentStatusHistory(document)
                             .then(function (result) {
                             return result;
                             }).catch(function(error){
                             return [];
                             }) : [];
                             }*/
                        }
                    });
                },
                /**
                 * @description Opens popup for merged linked document history events
                 * @param mergedLinkedDocumentHistory
                 * @param $event
                 * @returns {promise}
                 */
                viewMergedLinkedDocumentHistoryEvents: function (mergedLinkedDocumentHistory, $event) {
                    self.mergedLinkedDocumentEvents = mergedLinkedDocumentHistory.hasOwnProperty('events') ? mergedLinkedDocumentHistory.events : mergedLinkedDocumentHistory;
                    return dialog.showDialog({
                        template: cmsTemplate.getPopup('merged-linked-document-history-events'),
                        controller: 'mergedLinkedDocHistoryEventsPopCtrl',
                        targetEvent: $event || false,
                        controllerAs: 'ctrl',
                        locals: {
                            mergedLinkedDocHistoryEvents: self.mergedLinkedDocumentEvents,
                            mergedLinkedDocHistorySubject: mergedLinkedDocumentHistory.docSubject
                        }
                    });
                },
                /**
                 * @description Opens popup for content view history events
                 * @param contentViewHistory
                 * @param $event
                 * @returns {promise}
                 */
                viewContentViewHistoryViewers: function (contentViewHistory, $event) {
                    self.contentViewHistoryViewers = contentViewHistory.hasOwnProperty('events') ? contentViewHistory.events : contentViewHistory;
                    return dialog.showDialog({
                        template: cmsTemplate.getPopup('content-view-history-viewers'),
                        controller: 'contentViewHistoryViewersPopCtrl',
                        targetEvent: $event || false,
                        controllerAs: 'ctrl',
                        locals: {
                            contentViewHistoryViewers: self.contentViewHistoryViewers,
                            contentViewHistorySubject: contentViewHistory.docSubject
                        }
                    });
                },

                /**
                 * @description Export the tracking sheet to excel
                 * @param heading
                 * @param popupHeading
                 */
                viewTrackingSheetExportToExcel: function (heading, popupHeading) {
                    self.exportTrackingSheetToExcel(heading, popupHeading);
                },

                /**
                 * @description Export the tracking sheet to excel
                 * @param heading
                 * @param popupHeading
                 */
                viewTrackingSheetPrint: function (heading, popupHeading) {
                    self.printTrackingSheet(heading, popupHeading);
                }
            };

            var getVsId = function (document) {
                return document.hasOwnProperty('vsId')
                    ? document.vsId
                    : (document.hasOwnProperty('documentVSID')
                    ? document.documentVSID
                    : (document.hasOwnProperty('generalStepElm')
                    ? document.generalStepElm.vsId
                    : document));
            };

            /**
             * @description load workflow history by vsId
             * @param document
             */
            self.loadWorkflowHistory = function (document) {
                var vsId = getVsId(document);
                return $http.get(urlService.vts_userEventLog + '/vsid/' + vsId).then(function (result) {
                    self.eventHistory = generator.generateCollection(result.data.rs, EventHistory, self._sharedMethods);
                    self.eventHistory = generator.interceptReceivedCollection('EventHistory', self.eventHistory);
                    return self.eventHistory;
                })
                    .catch(function (error) {
                        return [];
                    });
            };

            /**
             * @description load document update history by vsId
             * @param document
             */
            self.loadLinkedDocumentsHistory = function (document) {
                var vsId = getVsId(document);
                return $http.get(urlService.vts_linkedDocuments + vsId).then(function (result) {
                    self.linkedDocumentHistory = generator.generateCollection(result.data.rs, LinkedDocument, self._sharedMethods);
                    self.linkedDocumentHistory = generator.interceptReceivedCollection('LinkedDocument', self.linkedDocumentHistory);
                    return self.linkedDocumentHistory;
                })
                    .catch(function (error) {
                        return [];
                    });
            };

            /**
             * @description load attachments history by vsId
             */
            self.loadAttachmentsHistory = function (document) {
                var vsId = getVsId(document);
                return $http.get(urlService.vts_linkedAttachments + vsId).then(function (result) {
                    self.linkedAttachments = generator.generateCollection(result.data.rs, LinkedAttachment, self._sharedMethods);
                    self.linkedAttachments = generator.interceptReceivedCollection('LinkedAttachment', self.linkedAttachments);
                    return self.linkedAttachments;
                })
                    .catch(function (error) {
                        return [];
                    });
            };

            /**
             * @description load merged linked document history
             */
            self.loadMergedLinkedDocumentHistory = function (document) {
                var vsId = getVsId(document);
                return $http.get(urlService.vts_userEventLog + '/main/' + vsId + '/linkedvsids').then(function (result) {
                    self.mergedLinkedDocumentHistory = generator.generateCollection(result.data.rs, MergedLinkedDocumentHistory, self._sharedMethods);
                    if (self.mergedLinkedDocumentHistory.length) {
                        // sort the records by creation date and put main doc on top
                        var records = _.orderBy(self.mergedLinkedDocumentHistory, 'documentCreationDate', 'desc');
                        var mainDoc = _.find(records, 'mainDoc');
                        var indexOfMainDoc = _.findIndex(records, ['mainDoc', true]);
                        records.splice(indexOfMainDoc, 1);
                        records.unshift(mainDoc);

                        self.mergedLinkedDocumentHistory = generator.interceptReceivedCollection('MergedLinkedDocumentHistory', records);
                    }
                    return self.mergedLinkedDocumentHistory;
                })
                    .catch(function (error) {
                        return [];
                    });
            };

            /**
             * @description load linked entities by vsId
             */
            self.loadLinkedEntitiesHistory = function (document) {
                var vsId = getVsId(document);
                return $http.get(urlService.vts_linkedEntity + vsId).then(function (result) {
                    self.linkedEntities = generator.generateCollection(result.data.rs, LinkedEntity, self._sharedMethods);
                    self.linkedEntities = generator.interceptReceivedCollection('LinkedEntity', self.linkedEntities);
                    return self.linkedEntities;
                })
                    .catch(function (error) {
                        return [];
                    });
            };

            /**
             * @description load destination history logs by vsId
             */
            self.loadDestinationHistory = function (document) {
                var vsId = getVsId(document);
                return $http.get(urlService.vts_destinations + vsId).then(function (result) {
                    self.destinationHistory = generator.generateCollection(result.data.rs, DestinationHistory, self._sharedMethods);
                    self.destinationHistory = generator.interceptReceivedCollection('DestinationHistory', self.destinationHistory);
                    return self.destinationHistory;
                })
                    .catch(function (error) {
                        return [];
                    });
            };

            /**
             * @description load content view history logs by vsId
             */
            self.loadContentViewHistory = function (document) {
                var vsId = getVsId(document);
                return $http.get(urlService.vts_viewContentLog + vsId).then(function (result) {
                    self.contentViewHistory = generator.generateCollection(result.data.rs, ContentViewHistory, self._sharedMethods);
                    self.contentViewHistory = generator.interceptReceivedCollection('ContentViewHistory', self.contentViewHistory);
                    return self.contentViewHistory;
                })
                    .catch(function (error) {
                        return [];
                    });
            };

            /**
             * @description load sms logs by vsId
             */
            self.loadSmsLogs = function (document) {
                var vsId = getVsId(document);
                return $http.get(urlService.vts_smsLog + vsId).then(function (result) {
                    self.smsLogs = generator.generateCollection(result.data.rs, SmsLog, self._sharedMethods);
                    self.smsLogs = generator.interceptReceivedCollection('SmsLog', self.smsLogs);
                    return self.smsLogs;
                })
                    .catch(function (error) {
                        return [];
                    });
            };

            /**
             * @description load outgoing delivery report logs by vsId
             */
            self.loadOutgoingDeliveryReports = function (document) {
                var vsId = getVsId(document);
                return $http.get(urlService.vts_messagingHistory + '/' + vsId).then(function (result) {
                    self.outgoingDeliveryReports = generator.generateCollection(result.data.rs, OutgoingDeliveryReport, self._sharedMethods);
                    self.outgoingDeliveryReports = generator.interceptReceivedCollection('OutgoingDeliveryReport', self.outgoingDeliveryReports);
                    return self.outgoingDeliveryReports;
                }).catch(function () {
                    return [];
                });
            };

            /**
             * @description load full history logs by vsId
             */
            self.loadFullHistory = function (document) {
                var vsId = getVsId(document);
                return $http.get(urlService.vts_fullHistory + '/' + vsId + '/desc').then(function (result) {
                    self.fullHistory = generator.generateCollection(result.data.rs, FullHistory, self._sharedMethods);
                    self.fullHistory = generator.interceptReceivedCollection('FullHistory', self.fullHistory);
                    return self.fullHistory;
                })
                    .catch(function (error) {
                        return [];
                    });
            };

            /* self.loadDocumentUpdateHistory = function(document){
             var vsId = getVsId(document);
             return $http.get(urlService.vts_viewActionLog + '/' + vsId).then(function (result) {
             self.fullHistory = generator.generateCollection(result.data.rs, FullHistory, self._sharedMethods);
             self.fullHistory = generator.interceptReceivedCollection('FullHistory', self.fullHistory);
             return self.fullHistory;
             });
             };

             self.loadDocumentStatusHistory= function(document){
             var vsId = getVsId(document);
             return $http.get(urlService.vts_viewActionLog + '/' + vsId).then(function (result) {
             self.fullHistory = generator.generateCollection(result.data.rs, FullHistory, self._sharedMethods);
             self.fullHistory = generator.interceptReceivedCollection('FullHistory', self.fullHistory);
             return self.fullHistory;
             });
             };*/


            self.getExportData = function (heading, popupHeading) {
                var headerNames = [];
                var data = [];
                var i, record;

                /* Workflow History */
                if (heading === 'view_tracking_sheet_work_flow_history') {
                    if (self.eventHistory.length) {
                        headerNames = [
                            langService.get('view_tracking_sheet_sender'),
                            langService.get('view_tracking_sheet_receiver'),
                            langService.get('view_tracking_sheet_action'),
                            //langService.get('view_tracking_sheet_creation_date'),
                            langService.get('view_tracking_sheet_action_date'),
                            langService.get('view_tracking_sheet_comments')
                        ];
                        for (i = 0; i < self.eventHistory.length; i++) {
                            record = self.eventHistory[i];
                            data.push([
                                record.getTranslatedUserFrom(),
                                record.getTranslatedUserTo(),
                                record.getTranslatedAction(),
                                //record.documentCreationDate_vts,
                                record.actionDate_vts,
                                record.comments
                            ]);
                        }
                    }
                }
                /* Linked Documents History */
                else if (heading === 'view_tracking_sheet_linked_documents_history') {
                    if (self.linkedDocumentHistory.length) {
                        headerNames = [
                            langService.get('view_tracking_sheet_doc_subject'),
                            langService.get('view_tracking_sheet_action'),
                            langService.get('view_tracking_sheet_action_by'),
                            langService.get('view_tracking_sheet_action_date'),
                            langService.get('view_tracking_sheet_full_serial_number')//,
                            //langService.get('view_tracking_sheet_type')
                        ];
                        for (i = 0; i < self.linkedDocumentHistory.length; i++) {
                            record = self.linkedDocumentHistory[i];
                            data.push([
                                record.itemName,
                                record.eventTypeInfo.getTranslatedName(),
                                record.getTranslatedActionBy(),
                                record.actionDate,
                                record.itemFullSerial//,
                                //record.itemType
                            ]);
                        }
                    }
                }
                /* Attachments History */
                else if (heading === 'view_tracking_sheet_attachments_history') {
                    if (self.linkedAttachments.length) {
                        headerNames = [
                            langService.get('view_tracking_sheet_doc_subject'),
                            langService.get('view_tracking_sheet_action'),
                            langService.get('view_tracking_sheet_action_by'),
                            langService.get('view_tracking_sheet_action_date')
                        ];
                        for (i = 0; i < self.linkedAttachments.length; i++) {
                            record = self.linkedAttachments[i];
                            data.push([
                                record.itemName,
                                record.getTranslatedAction(),
                                record.getTranslatedActionBy(),
                                record.actionDate
                            ]);
                        }
                    }
                }
                /* Merged Linked Documents History */
                else if (heading === 'view_tracking_sheet_merged_linked_document_history') {
                    if (self.mergedLinkedDocumentHistory.length) {
                        headerNames = [
                            langService.get('view_tracking_sheet_doc_subject'),
                            langService.get('view_tracking_sheet_creation_date'),
                            langService.get('view_tracking_sheet_main_doc')//,
                            //langService.get('view_tracking_sheet_actions')
                        ];
                        for (i = 0; i < self.mergedLinkedDocumentHistory.length; i++) {
                            record = self.mergedLinkedDocumentHistory[i];
                            data.push([
                                record.docSubject,
                                record.documentCreationDate,
                                record.getTranslatedMainDocument()//,
                                //""
                            ]);
                        }
                    }
                }
                /* Merged Linked Document History Events */
                else if (heading === 'merged_linked_document_history_events') {
                    if (self.mergedLinkedDocumentEvents.length) {
                        headerNames = [
                            langService.get('view_tracking_sheet_sender'),
                            langService.get('view_tracking_sheet_receiver'),
                            langService.get('view_tracking_sheet_action'),
                            langService.get('view_tracking_sheet_creation_date'),
                            langService.get('view_tracking_sheet_action_date'),
                            langService.get('view_tracking_sheet_comments')
                        ];
                        for (i = 0; i < self.mergedLinkedDocumentEvents.length; i++) {
                            record = self.mergedLinkedDocumentEvents[i];
                            data.push([
                                record.getTranslatedUserFrom(),
                                record.getTranslatedUserTo(),
                                record.getTranslatedAction(),
                                record.documentCreationDate_vts,
                                record.actionDate_vts,
                                record.comments
                            ]);
                        }
                    }
                }
                /* Linked Entities History */
                else if (heading === 'view_tracking_sheet_linked_entities_history') {
                    if (self.linkedEntities.length) {
                        headerNames = [
                            langService.get('view_tracking_sheet_action_by'),
                            langService.get('view_tracking_sheet_action_date'),
                            langService.get('view_tracking_sheet_action'),
                            //langService.get('view_tracking_sheet_entity_identifier'),
                            langService.get('view_tracking_sheet_entity_type'),
                            langService.get('view_tracking_sheet_destination_full_name')
                        ];
                        for (i = 0; i < self.linkedEntities.length; i++) {
                            record = self.linkedEntities[i];
                            data.push([
                                record.getTranslatedActionBy(),
                                record.actionDate,
                                record.getTranslatedAction(),
                                //record.getTranslatedItemType(),
                                record.itemTypeInfo.getTranslatedName(),
                                record.itemName
                            ]);
                        }
                    }
                }
                /* Destination History */
                else if (heading === 'view_tracking_sheet_destination_history') {
                    if (self.destinationHistory.length) {
                        headerNames = [
                            langService.get('view_tracking_sheet_action_by'),
                            langService.get('view_tracking_sheet_action_date'),
                            langService.get('view_tracking_sheet_action'),
                            //langService.get('view_tracking_sheet_destination_identifier'),
                            langService.get('view_tracking_sheet_destination_full_name')
                        ];
                        for (i = 0; i < self.destinationHistory.length; i++) {
                            record = self.destinationHistory[i];
                            data.push([
                                record.actionByInfo.getTranslatedName(),
                                record.actionDate,
                                record.eventTypeInfo.getTranslatedName(),
                                //'',
                                record.itemInfo.getTranslatedName()
                            ]);
                        }
                    }
                }
                /* Content View History */
                else if (heading === 'view_tracking_sheet_content_view_history') {
                    if (self.contentViewHistory.length) {
                        headerNames = [
                            langService.get('view_tracking_sheet_doc_subject'),
                            langService.get('view_tracking_sheet_document_type')
                        ];
                        for (i = 0; i < self.contentViewHistory.length; i++) {
                            record = self.contentViewHistory[i];
                            data.push([
                                record.docSubject,
                                record.documentType
                            ]);
                        }
                    }
                }
                /* Content View History Viewers */
                else if (heading === 'content_view_history_viewers') {
                    if (self.contentViewHistoryViewers.length) {
                        headerNames = [
                            langService.get('view_tracking_sheet_action_by'),
                            langService.get('view_tracking_sheet_department'),
                            langService.get('view_tracking_sheet_action_date')
                        ];
                        for (i = 0; i < self.contentViewHistoryViewers.length; i++) {
                            record = self.contentViewHistoryViewers[i];
                            data.push([
                                record.actionByInfo.getTranslatedName(),
                                record.ouInfo.getTranslatedName(),
                                record.actionDate_vts
                            ]);
                        }
                    }
                }
                /*else if (heading === 'view_tracking_sheet_sms_logs') {
                 if (self.smsLogs.length) {
                 headerNames = [
                 langService.get('sms_message'),
                 langService.get('sms_template'),
                 langService.get('organizations'),
                 langService.get('username'),
                 langService.get('view_tracking_sheet_action_date')
                 ];
                 for (var i = 0; i < self.smsLogs.length; i++) {
                 record = self.smsLogs[i];
                 data.push([
                 record.message,
                 record.smsTemplateId,
                 record.ouId,
                 record.actionBy,
                 record.actionDate
                 ]);
                 }
                 }
                 }*/
                /* Outgoing Delivery Reports / Messaging History */
                else if (heading === 'view_tracking_sheet_outgoing_delivery_reports') {
                    if (self.outgoingDeliveryReports.length) {
                        headerNames = [
                            langService.get('view_tracking_sheet_sent_by'),
                            langService.get('view_tracking_sheet_main_site_from'),
                            langService.get('view_tracking_sheet_sub_site_from'),
                            //langService.get('view_tracking_sheet_priority_level'),
                            langService.get('view_tracking_sheet_received_by'),
                            langService.get('view_tracking_sheet_main_site_to'),
                            langService.get('view_tracking_sheet_sub_site_to'),
                            langService.get('view_tracking_sheet_action_date'),
                            langService.get('view_tracking_sheet_delivery_date'),
                            langService.get('view_tracking_sheet_message_status'),
                            langService.get('view_tracking_sheet_comments')
                        ];
                        for (i = 0; i < self.outgoingDeliveryReports.length; i++) {
                            record = self.outgoingDeliveryReports[i];
                            data.push([
                                record.sentByIdInfo.getTranslatedName(),
                                record.mainSiteFromIdInfo.getTranslatedName(),
                                record.subSiteFromIdInfo.getTranslatedName(),
                                //record.priorityLevelInfo.getTranslatedName(),
                                record.receivedByIdInfo.getTranslatedName(),
                                record.mainSiteToIdInfo.getTranslatedName(),
                                record.subSiteToIdInfo.getTranslatedName(),
                                record.actionDate_vts,
                                record.deliveryDate_vts,
                                record.messageStatus.getTranslatedName(),
                                record.comment
                            ]);
                        }
                    }
                }
                /* Full History */
                else if (heading === 'view_tracking_sheet_full_history') {
                    if (self.fullHistory.length) {
                        headerNames = [
                            //langService.get('view_tracking_sheet_doc_subject'),
                            langService.get('view_tracking_sheet_action_by'),
                            langService.get('view_tracking_sheet_action_date'),
                            langService.get('view_tracking_sheet_action_by_department'),
                            langService.get('view_tracking_sheet_action_type')
                        ];
                        for (i = 0; i < self.fullHistory.length; i++) {
                            record = self.fullHistory[i];
                            data.push([
                                //record.docSubject,
                                record.actionByInfo.getTranslatedName(),
                                record.actionDate,
                                record.actionByOUInfo.getTranslatedName(),
                                record.actionTypeInfo.getTranslatedName()
                            ]);
                        }
                    }
                }

                return {
                    headerText: popupHeading,
                    headerNames: headerNames,
                    data: data
                };
            };

            /**
             * @description Returns the url to download the excel sheet after generating it.
             * @param heading
             * @param popupHeading
             * @returns {string}
             */
            self.exportTrackingSheetToExcel = function (heading, popupHeading) {
                var exportData = self.getExportData(heading, popupHeading);
                if (!exportData.headerNames.length) {
                    toast.info(langService.get('no_data_to_export'));
                }
                else {
                    $http.post(urlService.exportToExcel, exportData)
                        //{headerText: exportData.headerText, headerNames: exportData.headerNames, data: exportData.data})
                        .then(function (result) {
                            if (!result.data.rs)
                                toast.error(langService.get('error_export_to_excel'));
                            else
                                downloadService.controllerMethod.fileDownload(result.data.rs);
                        })
                        .catch(function (error) {
                            toast.error(langService.get('error_export_to_excel'));
                        });
                }
            };

            /**
             * @description Returns the url to download the pdf after generating it.
             * @param heading
             * @param popupHeading
             * @returns {string}
             */
            self.printTrackingSheet = function (heading, popupHeading) {
                var exportData = self.getExportData(heading, popupHeading);
                if (!exportData.headerNames.length) {
                    toast.info(langService.get('no_data_to_print'));
                }
                else {
                    return $http.post(urlService.exportToPdf, exportData)
                        //{headerText: exportData.headerText, headerNames: exportData.headerNames, data: exportData.data})
                        .then(function (result) {
                            if (!result.data.rs)
                                toast.error(langService.get('error_print'));
                            else
                                downloadService.controllerMethod.fileDownload(result.data.rs);
                        })
                        .catch(function (error) {
                            toast.error(langService.get('error_print'));
                        });
                }
            };

            /**
             * @description Create the shared method to the model.
             * @type {{delete: generator.delete, update: generator.update}}
             * @private
             */
            self._sharedMethods = generator.generateSharedMethods(self.deleteViewTrackingSheet, self.updateViewTrackingSheet);
        }
    );
};
