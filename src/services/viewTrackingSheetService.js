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
                                                      UserFollowupBookLog,
                                                      FullHistory,
                                                      OutgoingDeliveryReport,
                                                      ExportedTrackingSheetResult,
                                                      MergedLinkedDocumentHistory,
                                                      downloadService,
                                                      employeeService,
                                                      gridService,
                                                      errorCode) {
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
            self.outgoingDeliveryReports = [];
            self.receivedIncomingHistoryRecords = [];
            self.mergedLinkedDocumentHistory = [];
            self.fullHistory = [];
            self.documentLinkViewerRecords = [];
            self.followupLogRecords = [];
            self.selectedReceivedIncomingSite = null;

            self.printPage = 'views/print/TrackingSheetPrint.html';

            var splitNumber = 7;

            function _splitToNumberOfWords(string, number) {
                var newString = [];
                var array = string.split(" ").filter(Boolean);
                var count = Math.ceil(array.length / number);
                for (var i = 0; i < count; i++) {
                    newString.push(array.splice(0, number).join(" "));
                }
                return newString.join('\n\r');
            }

            /**
             * @description Returns the view tracking sheet options for grid actions
             * @param gridOrTabs
             * @param parentGridName
             * @returns {[]}
             */
            self.getViewTrackingSheetOptions = function (gridOrTabs, parentGridName) {
                if (gridOrTabs === 'tabs') {
                    return [];
                } else {
                    /* params[0] is used to give heading to popup.
                           params[1] showing that there is a single grid only, not tabs.
                           params[2] showing a parent grid name.
                        */
                    return [
                        // Workflow History
                        {
                            type: 'action',
                            icon: '',
                            text: 'view_tracking_sheet_work_flow_history',
                            shortcut: false,
                            callback: self.viewTrackingSheet,
                            params: ['view_tracking_sheet_work_flow_history', 'grid', parentGridName],
                            class: "action-green",
                            checkShow: function (action, model) {
                                return true;
                            }
                        },
                        // Outgoing Delivery Reports
                        {
                            type: 'action',
                            icon: '',
                            text: 'view_tracking_sheet_outgoing_delivery_reports',
                            shortcut: false,
                            callback: self.viewTrackingSheet,
                            params: ['view_tracking_sheet_outgoing_delivery_reports', 'grid', parentGridName],
                            class: "action-green",
                            checkShow: function (action, model) {
                                var info = model.getInfo();
                                return info.documentClass === "outgoing";
                            }
                        },
                        // Full History
                        {
                            type: 'action',
                            icon: '',
                            text: 'view_tracking_sheet_full_history',
                            shortcut: false,
                            callback: self.viewTrackingSheet,
                            params: ['view_tracking_sheet_full_history', 'grid', parentGridName],
                            class: "action-green",
                            checkShow: function (action, model) {
                                return true;
                            }
                        },
                        // LINKED DOCUMENT WORKFLOW History (Prev. Merged Linked Document)
                        {
                            type: 'action',
                            icon: '',
                            text: 'view_tracking_sheet_merged_linked_document_history',
                            shortcut: false,
                            callback: self.viewTrackingSheet,
                            params: ['view_tracking_sheet_merged_linked_document_history', 'grid', parentGridName],
                            class: "action-green",
                            checkShow: function (action, model) {
                                return true;
                            }
                        },
                        // Attachments History
                        {
                            type: 'action',
                            icon: '',
                            text: 'view_tracking_sheet_attachments_history',
                            shortcut: false,
                            callback: self.viewTrackingSheet,
                            params: ['view_tracking_sheet_attachments_history', 'grid', parentGridName],
                            class: "action-green",
                            checkShow: function (action, model) {
                                return true;
                            }
                        },
                        // Content View History
                        {
                            type: 'action',
                            icon: '',
                            text: 'view_tracking_sheet_content_view_history',
                            shortcut: false,
                            callback: self.viewTrackingSheet,
                            permissionKey: "VIEW_CONTENT_LOG",
                            params: ['view_tracking_sheet_content_view_history', 'grid', parentGridName],
                            class: "action-green",
                            checkShow: function (action, model) {
                                return true;
                            }
                        },
                        // Linked Documents History
                        {
                            type: 'action',
                            icon: '',
                            text: 'view_tracking_sheet_linked_documents_history',
                            shortcut: false,
                            callback: self.viewTrackingSheet,
                            params: ['view_tracking_sheet_linked_documents_history', 'grid', parentGridName],
                            class: "action-green",
                            checkShow: function (action, model) {
                                return true;
                            }
                        },
                        // Linked Entities History
                        {
                            type: 'action',
                            icon: '',
                            text: 'view_tracking_sheet_linked_entities_history',
                            shortcut: false,
                            callback: self.viewTrackingSheet,
                            params: ['view_tracking_sheet_linked_entities_history', 'grid', parentGridName],
                            class: "action-green",
                            checkShow: function (action, model) {
                                return true;
                            }
                        },
                        // Destination History
                        {
                            type: 'action',
                            icon: '',
                            text: 'view_tracking_sheet_destination_history',
                            shortcut: false,
                            callback: self.viewTrackingSheet,
                            params: ['view_tracking_sheet_destination_history', 'grid', parentGridName],
                            class: "action-green",
                            checkShow: function (action, model) {
                                var info = model.getInfo();
                                return info.documentClass === "outgoing";
                            }
                        },
                        // SMS Logs
                        {
                            type: 'action',
                            icon: '',
                            text: 'view_tracking_sheet_sms_logs',
                            shortcut: false,
                            callback: self.viewTrackingSheet,
                            params: ['view_tracking_sheet_sms_logs', 'grid', parentGridName],
                            class: "action-green",
                            checkShow: function (action, model) {
                                return (parentGridName === gridService.grids.inbox.userInbox
                                    || parentGridName === gridService.grids.inbox.group
                                    || parentGridName === gridService.grids.inbox.favorite
                                    || parentGridName === gridService.grids.search.outgoing
                                    || parentGridName === gridService.grids.search.incoming
                                    || parentGridName === gridService.grids.search.internal
                                    || parentGridName === gridService.grids.search.general
                                    || parentGridName === gridService.grids.search.outgoingIncoming
                                    || parentGridName === gridService.grids.search.quick);
                            }
                        },
                        // Document Link Viewers History
                        {
                            type: 'action',
                            icon: '',
                            text: 'view_tracking_sheet_document_link_viewer_history',
                            shortcut: false,
                            callback: self.viewTrackingSheet,
                            params: ['view_tracking_sheet_document_link_viewer_history', 'grid', parentGridName],
                            class: "action-green",
                            checkShow: function (action, model) {
                                return true;
                            }
                        },
                        // Followup Logs
                        {
                            type: 'action',
                            icon: '',
                            text: 'view_tracking_sheet_followup_logs',
                            shortcut: false,
                            callback: self.viewTrackingSheet,
                            permissionKey: ["ADMIN_USER_FOLLOWUP_BOOKS", "USER_FOLLOWUP_BOOKS"],
                            checkAnyPermission: true,
                            params: ['view_tracking_sheet_followup_logs', 'grid', parentGridName],
                            class: "action-green",
                            checkShow: function (action, model) {
                                return true;
                            }
                        }
                    ];
                }
            };


            /**
             * @description Contains methods for CRUD operations for tracking sheets
             */
            self.controllerMethod = {
                /**
                 * @description open popup for tracking sheet
                 * @param document
                 * @param params
                 * Contains an array of parameters.
                 * First parameter is type of tracking sheet.
                 * Second parameter is type of popup representation(grid/tabs)
                 * third parameter is for parent grid name
                 * @param $event
                 * @param forceViewAll
                 * @returns {promise}
                 */
                viewTrackingSheetPopup: function (document, params, $event, forceViewAll) {
                    var heading = params ? params[0].toLowerCase() : 'view_tracking_sheet';
                    var gridType = params ? params[1].toLowerCase() : 'grid';
                    var parentGridName = params ? params[2] : '';
                    return dialog.showDialog({
                        templateUrl: cmsTemplate.getPopup(gridType === 'grid' ? 'view-tracking-sheet' : 'view-tracking-sheet-tabs'),
                        controller: 'viewTrackingSheetPopCtrl',
                        targetEvent: $event || false,
                        controllerAs: 'ctrl',
                        locals: {
                            document: document,
                            gridType: gridType,
                            heading: heading,
                            parentGridName: parentGridName
                        },
                        resolve: {
                            workflowHistoryRecords: function () {
                                'ngInject';
                                return (heading === 'view_tracking_sheet_work_flow_history' || gridType === 'tabs')
                                    ? self.loadWorkflowHistory(document, forceViewAll)
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
                                    ? (employeeService.hasPermissionTo('VIEW_CONTENT_LOG') ? self.loadContentViewHistory(document)
                                        .then(function (result) {
                                            return result;
                                        }) : []) : [];
                            },
                            smsLogRecords: function (organizationService, applicationUserService) {
                                'ngInject';
                                if (heading === 'view_tracking_sheet_sms_logs' || gridType === 'tabs') {
                                    var appUserDefer = $q.defer();
                                    organizationService.getOrganizations().then(function () {
                                        applicationUserService.getApplicationUsers().then(function (result) {
                                            appUserDefer.resolve(result);
                                        });
                                    });
                                    return appUserDefer.promise.then(function () {
                                        return self.loadSmsLogs(document).then(function (result) {
                                            return result;
                                        })
                                    });
                                } else {
                                    return [];
                                }
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
                                    ? self.loadFullHistory(document, forceViewAll)
                                        .then(function (result) {
                                            return result;
                                        }).catch(function (error) {
                                            return [];
                                        }) : [];
                            },
                            documentLinkViewerRecords: function () {
                                'ngInject';
                                return (heading === 'view_tracking_sheet_document_link_viewer_history' || gridType === 'tabs')
                                    ? self.loadDocumentLinkViewer(document)
                                        .then(function (result) {
                                            return result;
                                        }) : [];
                            },
                            followupLogRecords: function () {
                                'ngInject';
                                return (heading === 'view_tracking_sheet_followup_logs' || gridType === 'tabs')
                                    ? self.loadFollowupLogs(document)
                                        .then(function (result) {
                                            return [];
                                        }) : [];
                            }
                        }
                    });
                },
                /**
                 * @description Opens popup for merged linked document history events
                 * @param mergedLinkedDocumentHistory
                 * @param mergedLinkedDocumentHistoryRecords
                 * @param $event
                 * @returns {promise}
                 */
                viewMergedLinkedDocumentHistoryEvents: function (mergedLinkedDocumentHistory, mergedLinkedDocumentHistoryRecords, $event) {
                    self.mergedLinkedDocumentEvents = mergedLinkedDocumentHistory.hasOwnProperty('events') ? mergedLinkedDocumentHistory.events : mergedLinkedDocumentHistory;
                    var mergedLinkedDocumentHistoryIndex = mergedLinkedDocumentHistoryRecords.indexOf(mergedLinkedDocumentHistory);
                    return dialog.showDialog({
                        templateUrl: cmsTemplate.getPopup('merged-linked-document-history-events'),
                        controller: 'mergedLinkedDocHistoryEventsPopCtrl',
                        targetEvent: $event || false,
                        controllerAs: 'ctrl',
                        locals: {
                            mergedLinkedDocumentHistoryRecords: mergedLinkedDocumentHistoryRecords,
                            mergedLinkedDocumentHistoryIndex: mergedLinkedDocumentHistoryIndex
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
                        templateUrl: cmsTemplate.getPopup('content-view-history-viewers'),
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
                },

                viewTrackingSheetWebPage: function (heading, popupHeading) {
                    self.printTrackingSheetFromWebPage(heading, popupHeading);
                }
            };

            self.viewTrackingSheet = function (record, params, $event) {
                self
                    .controllerMethod
                    .viewTrackingSheetPopup(record, params, $event).then(function (result) {

                });
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
             * @param forceViewAll
             */
            self.loadWorkflowHistory = function (document, forceViewAll) {
                var vsId = getVsId(document);
                return $http.get(urlService.vts_userEventLog + '/vsid/' + vsId, {
                    params: {
                        forceViewAll: forceViewAll
                    }
                }).then(function (result) {
                    self.workflowHistory = generator.generateCollection(result.data.rs, EventHistory, self._sharedMethods);
                    self.workflowHistory = generator.interceptReceivedCollection('EventHistory', self.workflowHistory);
                    return self.workflowHistory;
                }).catch(function (error) {
                    if (errorCode.checkIf(error, 'ACCESS_DENIED') === true) {
                        dialog.errorMessage(langService.get('access_denied'));
                        return $q.reject(false);
                    }
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
                }).catch(function (error) {
                    if (errorCode.checkIf(error, 'ACCESS_DENIED') === true) {
                        dialog.errorMessage(langService.get('access_denied'));
                        return $q.reject(false);
                    }
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
                }).catch(function (error) {
                    if (errorCode.checkIf(error, 'ACCESS_DENIED') === true) {
                        dialog.errorMessage(langService.get('access_denied'));
                        return $q.reject(false);
                    }
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
                }).catch(function (error) {
                    if (errorCode.checkIf(error, 'ACCESS_DENIED') === true) {
                        dialog.errorMessage(langService.get('access_denied'));
                        return $q.reject(false);
                    }
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
                }).catch(function (error) {
                    if (errorCode.checkIf(error, 'ACCESS_DENIED') === true) {
                        dialog.errorMessage(langService.get('access_denied'));
                        return $q.reject(false);
                    }
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
                }).catch(function (error) {
                    if (errorCode.checkIf(error, 'ACCESS_DENIED') === true) {
                        dialog.errorMessage(langService.get('access_denied'));
                        return $q.reject(false);
                    }
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
                }).catch(function (error) {
                    if (errorCode.checkIf(error, 'ACCESS_DENIED') === true) {
                        dialog.errorMessage(langService.get('access_denied'));
                        return $q.reject(false);
                    }
                    return [];
                })
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
                }).catch(function (error) {
                    if (errorCode.checkIf(error, 'ACCESS_DENIED') === true) {
                        dialog.errorMessage(langService.get('access_denied'));
                        return $q.reject(false);
                    }
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
                }).catch(function (error) {
                    if (errorCode.checkIf(error, 'ACCESS_DENIED') === true) {
                        dialog.errorMessage(langService.get('access_denied'));
                        return $q.reject(false);
                    }
                    return [];
                });
            };

            /**
             * @description load received incoming logs by vsId
             */
            self.loadReceivedIncomingHistory = function (document) {
                var vsId = getVsId(document);
                return $http.get(urlService.vts_receivedIncomingHistory + '/' + vsId).then(function (result) {
                    self.receivedIncomingHistoryRecords = generator.generateCollection(result.data.rs, ExportedTrackingSheetResult, self._sharedMethods);
                    self.receivedIncomingHistoryRecords = generator.interceptReceivedCollection('ExportedTrackingSheetResult', self.receivedIncomingHistoryRecords);
                    return self.receivedIncomingHistoryRecords;
                }).catch(function (error) {
                    if (errorCode.checkIf(error, 'ACCESS_DENIED') === true) {
                        dialog.errorMessage(langService.get('access_denied'));
                        return $q.reject(false);
                    }
                    return [];
                });
            };

            /**
             * @description load full history logs by vsId
             */
            self.loadFullHistory = function (document, forceViewAll) {
                var vsId = getVsId(document);
                return $http.get(urlService.vts_fullHistory + '/' + vsId + '/desc', {
                    params: {
                        forceViewAll: forceViewAll
                    }
                }).then(function (result) {
                    self.fullHistory = generator.generateCollection(result.data.rs, FullHistory, self._sharedMethods);
                    self.fullHistory = generator.interceptReceivedCollection('FullHistory', self.fullHistory);
                    return self.fullHistory;
                }).catch(function (error) {
                    if (errorCode.checkIf(error, 'ACCESS_DENIED') === true) {
                        dialog.errorMessage(langService.get('access_denied'));
                        return $q.reject(false);
                    }
                    return [];
                });
            };

            /**
             * @description load document update history by vsId
             * @param document
             */
            self.loadDocumentLinkViewer = function (document) {
                var vsId = getVsId(document), employee = employeeService.getEmployee();
                var route = "/viewer-list/user-id/" + employee.id + "/ouid/" + employee.getOUID() + "/vsid/" + vsId;

                return $http.get(urlService.documentLink + route)
                    .then(function (result) {
                        self.documentLinkViewerRecords = _.map(result.data.rs, function (documentLinkViewer) {
                            documentLinkViewer.viewTime = generator.getDateFromTimeStamp(documentLinkViewer.viewTime, true);
                            return documentLinkViewer;
                        });
                        return self.documentLinkViewerRecords;
                    }).catch(function (error) {
                        if (errorCode.checkIf(error, 'ACCESS_DENIED') === true) {
                            dialog.errorMessage(langService.get('access_denied'));
                            return $q.reject(false);
                        }
                        return [];
                    });
            };

            /**
             * @description load followup logs update history by vsId
             * @param document
             */
            self.loadFollowupLogs = function (document) {
                var vsId = getVsId(document);
                return $http.get(urlService.userFollowUp + '/logs/vsid/' + vsId).then(function (result) {
                    self.followupLogRecords = generator.generateCollection(result.data.rs, UserFollowupBookLog, self._sharedMethods);
                    self.followupLogRecords = generator.interceptReceivedCollection('UserFollowupBookLog', self.followupLogRecords);
                    return self.followupLogRecords;
                }).catch(function (error) {
                    if (errorCode.checkIf(error, 'ACCESS_DENIED') === true) {
                        dialog.errorMessage(langService.get('access_denied'));
                        return $q.reject(false);
                    }
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
                var headerNames = [], data = [], i, record;

                /* Workflow History */
                if (heading === 'view_tracking_sheet_work_flow_history') {
                    if (self.workflowHistory.length) {
                        headerNames = [
                            langService.get('view_tracking_sheet_sender'),
                            langService.get('view_tracking_sheet_receiver'),
                            langService.get('view_tracking_sheet_action'),
                            //langService.get('view_tracking_sheet_creation_date'),
                            langService.get('view_tracking_sheet_action_date'),
                            langService.get('view_tracking_sheet_comments')
                        ];
                        for (i = 0; i < self.workflowHistory.length; i++) {
                            record = self.workflowHistory[i];
                            data.push([
                                record.userFromInfo.getTranslatedName(),
                                record.userToInfo.getTranslatedName(),
                                record.getTranslatedAction(),
                                //record.documentCreationDate_vts,
                                record.actionDate_vts,
                                _splitToNumberOfWords(record.comments || '', splitNumber)
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
                                record.actionByInfo.getTranslatedName(),
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
                                record.eventTypeInfo.getTranslatedName(),
                                record.actionByInfo.getTranslatedName(),
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
                                _splitToNumberOfWords(record.comments || '', splitNumber)
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
                                record.actionByInfo.getTranslatedName(),
                                record.actionDate,
                                record.eventTypeInfo.getTranslatedName(),
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
                } else if (heading === 'view_tracking_sheet_sms_logs') {
                    if (self.smsLogs.length) {
                        headerNames = [
                            langService.get('view_tracking_sheet_action_by'),
                            langService.get('organization'),
                            langService.get('view_tracking_sheet_action_date'),
                            langService.get('sms_message')
                        ];
                        for (var i = 0; i < self.smsLogs.length; i++) {
                            record = self.smsLogs[i];
                            data.push([
                                record.user.getTranslatedName(),
                                record.organization.getTranslatedName(),
                                record.actionDate_vts,
                                record.message
                            ]);
                        }
                    }
                }
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
                                _splitToNumberOfWords(record.comment || '', splitNumber)
                            ]);
                        }
                    }
                }
                /* Received Incoming Book History / ExportedTrackingSheetResult */
                else if (heading === 'view_tracking_sheet_received_incoming_history') {
                    if (self.selectedReceivedIncomingSite && self.selectedReceivedIncomingSite.eventLogViewList && self.selectedReceivedIncomingSite.eventLogViewList.length) {
                        headerNames = [
                            langService.get('view_tracking_sheet_sender'),
                            langService.get('view_tracking_sheet_receiver'),
                            langService.get('view_tracking_sheet_action'),
                            //langService.get('view_tracking_sheet_creation_date'),
                            langService.get('view_tracking_sheet_action_date'),
                            langService.get('view_tracking_sheet_comments')
                        ];
                        for (i = 0; i < self.selectedReceivedIncomingSite.eventLogViewList.length; i++) {
                            record = self.selectedReceivedIncomingSite.eventLogViewList[i];
                            data.push([
                                record.userFromInfo.getTranslatedName(),
                                record.userToInfo.getTranslatedName(),
                                record.getTranslatedAction(),
                                //record.documentCreationDate_vts,
                                record.actionDate_vts,
                                _splitToNumberOfWords(record.comments || '', splitNumber)
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
                            langService.get('view_tracking_sheet_action_to'),
                            langService.get('view_tracking_sheet_action_type'),
                            langService.get('view_tracking_sheet_comments')
                        ];
                        for (i = 0; i < self.fullHistory.length; i++) {
                            record = self.fullHistory[i];
                            data.push([
                                //record.docSubject,
                                record.actionByInfo.getTranslatedName(),
                                record.actionDate,
                                record.actionByOUInfo.getTranslatedName(),
                                record.actionToInfo.getTranslatedName(),
                                record.actionTypeInfo.getTranslatedName(),
                                _splitToNumberOfWords(record.comments || '', splitNumber)
                            ]);
                        }
                    }
                }
                /* Document Link Viewers */
                else if (heading === 'view_tracking_sheet_document_link_viewer_history') {
                    if (self.documentLinkViewerRecords.length) {
                        headerNames = [
                            langService.get('name'),
                            langService.get('mobile_number'),
                            langService.get('email'),
                            langService.get('action_date')
                        ];
                        for (i = 0; i < self.documentLinkViewerRecords.length; i++) {
                            record = self.documentLinkViewerRecords[i];
                            data.push([
                                record.sharedToFullName,
                                record.sharedToMobileNum,
                                record.sharedToEmail,
                                record.viewTime
                            ]);
                        }
                    }
                }
                /* Followup Logs */
                else if (heading === 'view_tracking_sheet_followup_logs') {
                    if (self.followupLogRecords.length) {
                        headerNames = [
                            langService.get('view_tracking_sheet_action_by'),
                            langService.get('organization'),
                            langService.get('status'),
                            langService.get('view_tracking_sheet_action_date'),
                            langService.get('view_tracking_sheet_comments')
                        ];
                        for (i = 0; i < self.followupLogRecords.length; i++) {
                            record = self.followupLogRecords[i];
                            data.push([
                                record.userInfo.getTranslatedName(),
                                record.ouInfo.getTranslatedName(),
                                record.actionStatusInfo.getTranslatedName(),
                                record.actionDate_vts,
                                record.userComment
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
                } else {
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
                } else {
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
             * @description store tracking sheet data to local storage
             * @param heading
             * @param popupHeading
             */
            self.printTrackingSheetFromWebPage = function (heading, popupHeading) {
                var exportData = self.getExportData(heading, popupHeading);
                if (!exportData.headerNames.length) {
                    toast.info(langService.get('no_data_to_print'));
                } else {
                    localStorage.setItem('trackingSheetData', JSON.stringify(exportData));
                    localStorage.setItem('currentLang', langService.current);
                    var printWindow = window.open(self.printPage, '', 'left=0,top=0,width=0,height=0,toolbar=0,scrollbars=0,status=0');
                    if (!printWindow) {
                        toast.error(langService.get('msg_error_occurred_while_processing_request'))
                    }
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
