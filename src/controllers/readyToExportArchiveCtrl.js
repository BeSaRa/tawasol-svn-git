module.exports = function (app) {
    app.controller('readyToExportArchiveCtrl', function (lookupService,
                                                         readyToExportService,
                                                         workItems,
                                                         userInboxService,
                                                         $state,
                                                         employeeService,
                                                         listGeneratorService,
                                                         correspondenceStorageService,
                                                         correspondenceService,
                                                         $q,
                                                         $filter,
                                                         langService,
                                                         toast,
                                                         counterService,
                                                         _,
                                                         Outgoing,
                                                         viewDocumentService,
                                                         managerService,
                                                         contextHelpService,
                                                         dialog,
                                                         viewTrackingSheetService,
                                                         broadcastService,
                                                         downloadService,
                                                         favoriteDocumentsService,
                                                         ResolveDefer,
                                                         generator,
                                                         mailNotificationService,
                                                         gridService,
                                                         $timeout,
                                                         errorCode,
                                                         rootEntity,
                                                         configurationService) {
        'ngInject';
        var self = this;
        self.controllerName = 'readyToExportArchiveCtrl';

        /*
         IT WILL ALWAYS GET OUTGOING DOCUMENTS ONLY
         */

        contextHelpService.setHelpTo('central-archive-ready-to-export');
        self.employeeService = employeeService;
        /**
         * @description All ready To Exports
         * @type {*}
         */
        self.workItems = workItems;
        self.workItemsCopy = angular.copy(self.workItems);

        /**
         * @description Contains the selected ready To Exports
         * @type {Array}
         */
        self.selectedWorkItems = [];

        self.starServices = {
            'false': readyToExportService.controllerMethod.readyToExportStar,
            'true': readyToExportService.controllerMethod.readyToExportUnStar,
            'starBulk': readyToExportService.controllerMethod.readyToExportStarBulk,
            'unStarBulk': readyToExportService.controllerMethod.readyToExportUnStarBulk
        };

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.centralArchive.readyToExport) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.centralArchive.readyToExport, self.workItems),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.centralArchive.readyToExport, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.centralArchive.readyToExport),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.centralArchive.readyToExport, self.grid.truncateSubject);
            },
            searchColumns: {
                serial: 'generalStepElm.docFullSerial',
                subject: 'generalStepElm.docSubject',
                receivedDate: 'generalStepElm.receivedDate',
                sender: function (record) {
                    return self.getSortingKey('fromOuInfo', 'Information');
                },
                mainSiteSubSiteString: function (record) {
                    return self.getSortingKey('mainSiteSubSiteString', 'Information');
                },
                numberOfDays: 'generalStepElm.numberOfDays'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.workItems = gridService.searchGridData(self.grid, self.workItemsCopy);
            }
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
         * @description Contains methods for CRUD operations for ready To Exports
         */
        self.statusServices = {
            'activate': readyToExportService.activateBulkReadyToExports,
            'deactivate': readyToExportService.deactivateBulkReadyToExports,
            'true': readyToExportService.activateReadyToExport,
            'false': readyToExportService.deactivateReadyToExport
        };

        /**
         * @description Opens dialog for add new ready To Export
         * @param $event
         */
        self.openAddReadyToExportDialog = function ($event) {
            readyToExportService
                .controllerMethod
                .readyToExportAdd($event)
                .then(function () {
                    self.reloadReadyToExports(self.grid.page);
                })
        };

        /**
         * @description Opens dialog for edit ready To Export
         * @param readyToExport
         * @param $event
         */
        self.openEditReadyToExportDialog = function (readyToExport, $event) {
            readyToExportService
                .controllerMethod
                .readyToExportEdit(readyToExport, $event)
                .then(function () {
                    self.reloadReadyToExports(self.grid.page);
                });
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.workItems = $filter('orderBy')(self.workItems, self.grid.order);
        };

        /**
         * @description Reload the grid of ready To Export
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadReadyToExports = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return correspondenceService
                .loadCentralArchiveWorkItems()
                .then(function (result) {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.workItems = result;
                    self.workItemsCopy = angular.copy(self.workItems);
                    self.selectedWorkItems = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Delete single ready To Export
         * @param readyToExport
         * @param $event
         * @param defer
         */
        self.removeReadyToExport = function (readyToExport, $event, defer) {
            readyToExportService
                .controllerMethod
                .readyToExportDelete(readyToExport, $event)
                .then(function () {
                    self.reloadReadyToExports(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Delete multiple selected ready To Exports
         * @param $event
         */
        self.removeBulkReadyToExports = function ($event) {
            readyToExportService
                .controllerMethod
                .readyToExportDeleteBulk(self.selectedWorkItems, $event)
                .then(function () {
                    self.reloadReadyToExports(self.grid.page);
                });
        };

        /**
         * @description Change the status of ready To Export
         * @param readyToExport
         */
        self.changeStatusReadyToExport = function (readyToExport) {
            self.statusServices[readyToExport.status](readyToExport)
                .then(function () {
                    toast.show(langService.get('status_success'));
                })
                .catch(function () {
                    readyToExport.status = !readyToExport.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected ready To Exports
         * @param status
         */
        self.changeStatusBulkReadyToExports = function (status) {
            self.statusServices[status](self.selectedWorkItems).then(function () {
                self.reloadReadyToExports(self.grid.page).then(function () {
                    toast.show(langService.get('selected_status_updated'));
                });
            });
        };

        /**
         * @description Export user inbox
         * @param readyToExport
         * @param $event
         * @param defer
         */
        self.exportReadyToExport = function (readyToExport, $event, defer) {
            if (readyToExport.isLocked() && !readyToExport.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(readyToExport, null));
                return;
            }
            readyToExport
                .exportWorkItem($event)
                .then(function () {
                    self.reloadReadyToExports(self.grid.page);
                    new ResolveDefer(defer);
                });
        };

        /**
         * @description Export workitem and opens the launch screen
         * @param readyToExport
         * @param $event
         * @param defer
         */
        self.exportAndSend = function (readyToExport, $event, defer) {
            if (readyToExport.isLocked() && !readyToExport.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(readyToExport, null));
                return;
            }
            var info = readyToExport.getInfo(),
                correspondenceToLaunch = new Outgoing({
                    docSubject: info.title,
                    documentTitle: info.title,
                    vsId: info.vsId,
                    securityLevel: readyToExport.generalStepElm.securityLevel,
                    sitesInfoTo: generator.isJsonString(readyToExport.generalStepElm.sitesInfoTo) ? JSON.parse(readyToExport.generalStepElm.sitesInfoTo) : readyToExport.generalStepElm.sitesInfoTo,
                    sitesInfoCC: generator.isJsonString(readyToExport.generalStepElm.sitesInfoCC) ? JSON.parse(readyToExport.generalStepElm.sitesInfoCC) : readyToExport.generalStepElm.sitesInfoCC
                });

            readyToExport
                .exportWorkItem($event)
                .then(function () {
                    return correspondenceToLaunch.launchWorkFlow($event, 'forward', 'favorites')
                        .then(function () {
                            self.reloadReadyToExports(self.grid.page);
                            new ResolveDefer(defer);
                        })
                        .catch(function () {
                            self.reloadReadyToExports(self.grid.page);
                            new ResolveDefer(defer);
                        });
                })
                .catch(function (error) {
                    if (error && error !== 'close')
                        toast.error(langService.get('export_failed'));
                });
        };

        /**
         * @description Export workItem and add to icn archive
         * @param workItem
         * @param $event
         * @param defer
         */
        self.exportAndAddToIcnArchive = function (workItem, $event, defer) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }

            workItem
                .exportWorkItem($event)
                .then(function () {
                    return workItem.addToIcnArchiveDialog($event)
                        .then(function () {
                            self.reloadReadyToExports(self.grid.page);
                            new ResolveDefer(defer);
                        }).catch(function (error) {
                            if (error && errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                                dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: workItem.getInfo().wobNumber}));
                                return false;
                            }
                            self.reloadReadyToExports(self.grid.page);
                            new ResolveDefer(defer);
                        });
                })
                .catch(function (error) {
                    if (error && error !== 'close')
                        toast.error(langService.get('export_failed'));
                });
        };

        /**
         * @description Terminate Ready To Export Bulk
         * @param $event
         */
        self.terminateBulk = function ($event) {
            correspondenceService
                .terminateBulkWorkItem(self.selectedWorkItems, $event)
                .then(function () {
                    self.reloadReadyToExports(self.grid.page);
                });
        };

        self.exportReadyToExportBulk = function ($event) {
            correspondenceService.exportBulkWorkItemsDialog(self.selectedWorkItems)
                .then(function () {
                    self.reloadReadyToExports(self.grid.page);
                });
        };


        /**
         * @description Change the starred for Ready To Export
         * @param readyToExport
         * @param $event
         */
        self.changeReadyToExportStar = function (readyToExport, $event) {
            self.starServices[readyToExport.generalStepElm.starred](readyToExport)
                .then(function (result) {
                    if (result) {
                        self.reloadReadyToExports(self.grid.page)
                            .then(function () {
                                if (!readyToExport.generalStepElm.starred)
                                    toast.success(langService.get("star_specific_success").change({name: readyToExport.getTranslatedName()}));
                                else
                                    toast.success(langService.get("unstar_specific_success").change({name: readyToExport.getTranslatedName()}));
                            });
                    } else {
                        dialog.errorMessage(langService.get('something_happened_when_update_starred'));
                    }
                })
                .catch(function () {
                    readyToExport.generalStepElm.starred = !readyToExport.generalStepElm.starred;
                    dialog.errorMessage(langService.get('something_happened_when_update_starred'));
                });
        };

        /**
         * @description Change the starred for Ready To Export Bulk
         * @param starUnStar
         * @param $event
         */
        self.changeReadyToExportStarBulk = function (starUnStar, $event) {
            self.starServices[starUnStar](self.selectedWorkItems)
                .then(function (result) {
                    self.reloadReadyToExports(self.grid.page);
                });
        };

        /**
         * @description Terminate Ready To Export Item
         * @param readyToExport
         * @param $event
         * @param defer
         */
        self.terminate = function (readyToExport, $event, defer) {
            if (readyToExport.isLocked() && !readyToExport.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(readyToExport, null));
                return;
            }
            readyToExport
                .terminate($event)
                .then(function () {
                    new ResolveDefer(defer);
                    self.reloadReadyToExports(self.grid.page);
                });
        };

        /**
         * @description annotate document
         * @param workItem
         * @param $event
         * @param defer
         */
        self.annotateDocument = function (workItem, $event, defer) {
            workItem.openForAnnotation()
                .then(function () {
                    self.reloadReadyToExports(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
                .catch(function () {
                    self.reloadReadyToExports(self.grid.page);
                });
        };

        /**
         * @description add an item to the favorite documents
         * @param readyToExport
         * @param $event
         */
        self.addToFavorite = function (readyToExport, $event) {
            if (readyToExport.isLocked() && !readyToExport.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(readyToExport, null));
                return;
            }
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAdd(readyToExport.generalStepElm.vsId, $event)
                .then(function (result) {
                        if (result.status) {
                            self.reloadReadyToExports(self.grid.page)
                                .then(function () {
                                    toast.success(langService.get("add_to_favorite_specific_success").change({
                                        name: readyToExport.getTranslatedName()
                                    }));
                                });
                        } else {
                            dialog.alertMessage(langService.get(result.message));
                        }
                    }
                );
        };


        /**
         * @description Download Main Document
         * @param workItem
         * @param $event
         */
        self.downloadMainDocument = function (workItem, $event) {
            workItem
                .mainDocumentDownload($event);
        };

        /**
         * @description Download Composite Document
         * @param workItem
         * @param $event
         */
        self.downloadCompositeDocument = function (workItem, $event) {
            workItem
                .compositeDocumentDownload($event);
        };

        /**
         * @description download selected document
         * @param readyToExport
         * @param $event
         */
        self.downloadSelected = function (readyToExport, $event) {
            downloadService.openSelectedDownloadDialog(readyToExport, $event);
        };

        /**
         * @description merge and download
         * @param readyToExport
         */
        self.mergeAndDownloadFullDocument = function (readyToExport) {
            downloadService.mergeAndDownload(readyToExport);
        };

        /**
         * @description Manage Tags
         * @param readyToExport
         * @param $event
         */
        self.manageTags = function (readyToExport, $event) {
            if (readyToExport.isLocked() && !readyToExport.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(readyToExport, null));
                return;
            }
            var info = readyToExport.getInfo();
            managerService.manageDocumentTags(info.vsId, info.documentClass, readyToExport.getTranslatedName(), $event)
                .then(function () {
                    self.reloadReadyToExports(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadReadyToExports(self.grid.page);
                });
        };

        /**
         * @description Manage Comments
         * @param readyToExport
         * @param $event
         */
        self.manageComments = function (readyToExport, $event) {
            if (readyToExport.isLocked() && !readyToExport.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(readyToExport, null));
                return;
            }
            readyToExport.manageDocumentComments($event)
                .then(function () {
                    self.reloadReadyToExports(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadReadyToExports(self.grid.page);
                });
        };

        /**
         * @description Manage Tasks
         * @param readyToExport
         * @param $event
         */
        self.manageTasks = function (readyToExport, $event) {
            if (readyToExport.isLocked() && !readyToExport.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(readyToExport, null));
                return;
            }
          //  console.log('manageReadyToExportTasks : ', readyToExport);
        };

        /**
         * @description Manage Attachments
         * @param readyToExport
         * @param $event
         */
        self.manageAttachments = function (readyToExport, $event) {
            if (readyToExport.isLocked() && !readyToExport.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(readyToExport, null));
                return;
            }
            readyToExport.manageDocumentAttachments($event);
        };

        /**
         * @description Manage Linked Documents
         * @param readyToExport
         * @param $event
         */
        self.manageLinkedDocuments = function (readyToExport, $event) {
            if (readyToExport.isLocked() && !readyToExport.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(readyToExport, null));
                return;
            }
            var info = readyToExport.getInfo();
            managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass, "welcome");
        };

        /**
         * @description Manage Linked Entities
         * @param readyToExport
         * @param $event
         */
        self.manageLinkedEntities = function (readyToExport, $event) {
            if (readyToExport.isLocked() && !readyToExport.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(readyToExport, null));
                return;
            }
            managerService
                .manageDocumentEntities(readyToExport.generalStepElm.vsId, readyToExport.generalStepElm.workFlowName, readyToExport.generalStepElm.docSubject, $event);
        };

        /**
         * @description Destinations
         * @param readyToExport
         * @param $event
         */
        self.manageDestinations = function (readyToExport, $event) {
            if (readyToExport.isLocked() && !readyToExport.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(readyToExport, null));
                return;
            }
            var info = readyToExport.getInfo();
            managerService.manageDocumentCorrespondence(info.vsId, info.documentClass, info.title, $event)
        };

        /**
         * @description View Tracking Sheet
         * @param readyToExport
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (readyToExport, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(readyToExport, params, $event).then(function (result) {
            });
        };

        /**
         * @description View Direct Linked Documents
         * @param readyToExport
         * @param $event
         */
        self.viewReadyToExportDirectLinkedDocuments = function (readyToExport, $event) {
            if (readyToExport.isLocked() && !readyToExport.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(readyToExport, null));
                return;
            }
          //  console.log('viewReadyToExportDirectLinkedDocuments : ', readyToExport);
        };

        /**
         * @description View Complete Linked Documents
         * @param readyToExport
         * @param $event
         */
        self.viewReadyToExportCompleteLinkedDocuments = function (readyToExport, $event) {
            if (readyToExport.isLocked() && !readyToExport.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(readyToExport, null));
                return;
            }
          //  console.log('viewReadyToExportCompleteLinkedDocuments : ', readyToExport);
        };

        /**
         * @description Edit Outgoing Content
         * @param readyToExport
         * @param $event
         */
        self.editContent = function (readyToExport, $event) {
            if (readyToExport.isLocked() && !readyToExport.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(readyToExport, null));
                return;
            }
            var info = readyToExport.getInfo();
            managerService.manageDocumentContent(info.vsId, info.workFlow, info.title, $event);
        };


        /**
         * @description Edit Outgoing Properties
         * @param readyToExport
         * @param $event
         */
        self.editProperties = function (readyToExport, $event) {
            if (readyToExport.isLocked() && !readyToExport.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(readyToExport, null));
                return;
            }
            var info = readyToExport.getInfo();
            managerService
                .manageDocumentProperties(info.vsId, info.documentClass, info.title, $event)
                .finally(function (document) {
                    self.reloadReadyToExports(self.grid.page)
                });
        };

        /**
         * @description broadcast selected organization and workflow group
         * @param readyToExport
         * @param $event
         */
        self.broadcast = function (readyToExport, $event) {
            if (readyToExport.isLocked() && !readyToExport.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(readyToExport, null));
                return;
            }
            broadcastService
                .controllerMethod
                .broadcastSend(readyToExport, $event)
                .then(function () {
                    self.reloadReadyToExports(self.grid.page);
                })
                .catch(function () {
                    self.reloadReadyToExports(self.grid.page);
                });
        };

        /**
         * @description Edit After Approve
         * @param workItem
         * @param $event
         */
        self.editAfterApprove = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            var info = workItem.getInfo(), list = listGeneratorService.createUnOrderList(),
                langKeys = ['signature_serial_will_removed', 'the_book_will_go_to_audit', 'serial_retained'];
            _.map(langKeys, function (item) {
                list.addItemToList(langService.get(item));
            });
            dialog.confirmMessage(list.getList(), null, null, $event)
                .then(function () {
                    correspondenceStorageService
                        .runEditAfter('Approved', workItem)
                        .then(function () {
                            $state.go('app.outgoing.add', {
                                wobNum: info.wobNumber,
                                vsId: info.vsId,
                                action: 'editAfterApproved'
                            });
                        })
                        .catch(function () {
                            dialog.errorMessage(langService.get('error_messages'));
                        });
                });
        };

        /**
         * @description Print Barcode
         * @param workItem
         * @param $event
         */
        self.printBarcode = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            workItem.barcodePrint($event);
        };


        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var info = model.getInfo();
            var hasPermission = (employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES"));
            var allowed = hasPermission && info.isPaper;// && info.docStatus < 24
            if (checkForViewPopup)
                return !allowed;
            return allowed;
        };

        /**
         * @description Preview document
         * @param readyToExport
         * @param $event
         */
        self.previewDocument = function (readyToExport, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT', true)) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            if (readyToExport.isLocked() && !readyToExport.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(readyToExport, null));
                return;
            }
            correspondenceService.viewCorrespondence(readyToExport, self.gridActions, checkIfEditPropertiesAllowed(readyToExport, true), false, true, true)
                .then(function () {
                    correspondenceService.unlockWorkItem(readyToExport, true, $event).then(function () {
                        self.reloadReadyToExports(self.grid.page);
                    });
                })
                .catch(function (error) {
                    if (error !== 'itemLocked')
                        self.reloadReadyToExports(self.grid.page);
                });
        };

        /**
         * @description View document
         * @param workItem
         * @param $event
         */
        self.viewDocument = function (workItem, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            workItem.viewNewCentralArchiveReadyToExport(self.gridActions, 'centralArchiveReadyToExport', $event)
                .then(function () {
                    correspondenceService.unlockWorkItem(workItem, true, $event).then(function () {
                        return self.reloadReadyToExports(self.grid.page);
                    });
                })
                .catch(function (error) {
                    if (error !== 'itemLocked')
                        self.reloadReadyToExports(self.grid.page);
                });
        };

        /**
         * @description get document versions
         * @param workItem
         * @param $event
         * @return {*}
         */
        self.getDocumentVersions = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            return workItem
                .viewSpecificVersion(self.gridActions, $event);
        };
        /**
         * @description duplicate current version
         * @param workItem
         * @param $event
         */
        self.duplicateCurrentVersion = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            var info = workItem.getInfo();
            return workItem
                .duplicateVersion($event)
                .then(function () {
                    $state.go('app.' + info.documentClass.toLowerCase() + '.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        wobNum: info.wobNumber
                    });
                });
        };
        /**
         * @description duplicate specific version
         * @param workItem
         * @param $event
         * @return {*}
         */
        self.duplicateVersion = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            var info = workItem.getInfo();
            return workItem
                .duplicateSpecificVersion($event)
                .then(function () {
                    $state.go('app.' + info.documentClass.toLowerCase() + '.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        wobNum: info.wobNumber
                    });
                });
        };

        /**
         * @description return from ready to central archive ready to export.
         * @param readyToExport
         * @param $event
         * @param defer
         */
        self.returnWorkItemFromCentral = function (readyToExport, $event, defer) {
            if (readyToExport.isLocked() && !readyToExport.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(readyToExport, null));
                return;
            }
            return readyToExport
                .returnWorkItemFromCentralArchive($event)
                .then(function () {
                    new ResolveDefer(defer);
                    self.reloadReadyToExports();
                })
        };
        /**
         * @description return bulk from central archive
         * @param $event
         */
        self.returnBulkWorkItemsFromCentral = function ($event) {
            correspondenceService
                .centralArchiveReturnBulk(self.selectedWorkItems, $event)
                .then(function () {
                    self.reloadReadyToExports();
                })
        };

        /**
         * @description Unlocks the workItem
         * @param workItem
         * @param $event
         * @returns {*}
         */
        self.unlockWorkItem = function (workItem, $event) {
            return workItem.unlockWorkItem($event)
                .then(function (result) {
                    if (result)
                        self.reloadReadyToExports(self.grid.page);
                });
        };

        self.checkIfUnlockBulkAvailable = function () {
            self.itemsWithoutUnlock = [];
            _.map(self.selectedWorkItems, function (workItem) {
                if (!workItem.isLocked())
                    self.itemsWithoutUnlock.push(workItem.generalStepElm.vsId);
            });
            return !(self.itemsWithoutUnlock && self.itemsWithoutUnlock.length);
        };

        /**
         * @description Unlocks the selected workItems
         * @param $event
         * @returns {*}
         */
        self.unlockWorkItemsBulk = function ($event) {
            var selectedItems = angular.copy(self.selectedWorkItems);
            if (!self.checkIfUnlockBulkAvailable()) {
                if (self.itemsWithoutUnlock.length === selectedItems.length) {
                    dialog.alertMessage(langService.get('selected_items_can_not_be_unlocked'));
                    return false;
                }
                dialog.confirmMessage(langService.get('some_items_cannot_be_unlocked_skip_and_unlock'), null, null, $event).then(function () {
                    self.selectedWorkItems = selectedItems = _.filter(self.selectedWorkItems, function (workItem) {
                        return self.itemsWithoutUnlock.indexOf(workItem.generalStepElm.vsId) === -1;
                    });
                    if (self.selectedWorkItems.length)
                        _unlockBulk(selectedItems, $event);
                })
            } else {
                _unlockBulk(selectedItems, $event);
            }
        };

        var _unlockBulk = function (selectedItems, $event) {
            correspondenceService
                .unlockBulkWorkItems(selectedItems, $event)
                .then(function () {
                    self.reloadReadyToExports(self.grid.page);
                });
        };

        /**
         * @description Send Link To Document By Email
         * @param workItem
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (workItem, $event) {
            workItem
                .getMainDocumentEmailContent($event);
        };

        /**
         * @description Send Main Document Fax
         * @param workItem
         * @param $event
         */
        self.sendMainDocumentFax = function (workItem, $event) {
            workItem.openSendFaxDialog($event);
        };


        /**
         * @description Array of actions that can be performed on grid
         * @type {[*]}
         */
        self.gridActions = [
            // Document Information
            {
                type: 'action',
                icon: 'information-variant',
                text: 'grid_action_document_info',
                shortcut: false,
                showInView: false,
                subMenu: [
                    {
                        type: 'info',
                        checkShow: function (action, model) {
                            return true;
                        },
                        gridName: 'department-ready-to-export'
                    }
                ],
                class: "action-green",
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                }
            },
            // view
            {
                type: 'action',
                icon: 'book-open-variant',
                text: 'grid_action_view',
                shortcut: false,
                callback: self.previewDocument,
                class: "action-green",
                showInView: false,
                permissionKey: [
                    'VIEW_DOCUMENT',
                    'VIEW_DOCUMENT_VERSION'
                ],
                checkAnyPermission: true,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                subMenu: [
                    // Preview
                    {
                        type: 'action',
                        icon: 'book-open-variant',
                        text: 'grid_action_preview_document',
                        shortcut: true,
                        callback: self.previewDocument,
                        class: "action-green",
                        showInView: false,
                        disabled: function (model) {
                            return model.isLocked() && !model.isLockedByCurrentUser();
                        },
                        permissionKey: 'VIEW_DOCUMENT',
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Open
                    {
                        type: 'action',
                        icon: 'book-open-page-variant',
                        text: 'grid_action_open',
                        shortcut: true,
                        callback: self.viewDocument,
                        class: "action-green",
                        showInView: false,
                        disabled: function (model) {
                            return model.isLocked() && !model.isLockedByCurrentUser();
                        },
                        permissionKey: 'VIEW_DOCUMENT',
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // show versions
                    {
                        type: 'action',
                        icon: 'animation',
                        text: 'grid_action_view_specific_version',
                        shortcut: false,
                        hide: false,
                        callback: self.getDocumentVersions,
                        permissionKey: "VIEW_DOCUMENT_VERSION",
                        class: "action-green",
                        showInView: true,
                        disabled: function (model) {
                            return model.isLocked() && !model.isLockedByCurrentUser();
                        },
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Separator
            {
                type: 'separator',
                checkShow: function (action, model) {
                    return true;
                },
                showInView: false
            },
            // Terminate
            {
                type: 'action',
                icon: 'stop',
                text: 'grid_action_terminate',
                shortcut: true,
                callback: self.terminate,
                class: "action-green",
                hide: false,
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Annotate Document
            {
                type: 'action',
                icon: 'draw',
                text: 'grid_action_annotate_document',
                shortcut: true,
                callback: self.annotateDocument,
                class: "action-green",
                sticky: true,
                checkShow: function (action, model) {
                    return model.userCanAnnotate() && rootEntity.hasPSPDFViewer() && employeeService.hasPermissionTo(configurationService.ANNOTATE_DOCUMENT_PERMISSION);
                }
            },
            // Add To Favorite
            {
                type: 'action',
                icon: 'star',
                text: 'grid_action_add_to_favorite',
                permissionKey: "MANAGE_FAVORITE",
                shortcut: false,
                callback: self.addToFavorite,
                class: "action-green",
                hide: true,
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Export
            {
                type: 'action',
                icon: 'export',
                text: 'grid_action_export',
                shortcut: true,
                callback: self.exportReadyToExport,
                class: "action-green",
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Export and send
            {
                type: 'action',
                icon: 'file-export-outline',
                text: 'grid_action_export_and_send',
                shortcut: true,
                callback: self.exportAndSend,
                class: "action-green",
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    return employeeService.hasPermissionTo('LAUNCH_DISTRIBUTION_WORKFLOW') && !model.hasActiveSeqWF()
                }
            },
            // Export and add to icn archive
            {
                type: 'action',
                icon: 'file-export-outline',
                text: 'grid_action_export_and_add_to_icn_archive',
                shortcut: true,
                callback: self.exportAndAddToIcnArchive,
                class: "action-green",
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    return employeeService.hasPermissionTo('ICN_ENTRY_TEMPLATE');
                }
            },
            // Print Barcode
            {
                type: 'action',
                icon: 'barcode-scan',
                text: 'content_action_print_barcode',
                shortcut: true,
                callback: self.printBarcode,
                permissionKey: "PRINT_BARCODE",
                class: "action-green",
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Return
            {
                type: 'action',
                icon: 'undo-variant',
                text: 'grid_action_return',
                shortcut: true,
                callback: self.returnWorkItemFromCentral,
                class: "action-green",
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Edit After Approve (Only electronic)
            {
                type: 'action',
                icon: 'eraser-variant',
                text: 'grid_action_edit_after_approved',
                shortcut: true,
                callback: self.editAfterApprove,
                class: "action-green",
                showInView: false,
                hide: true,
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                permissionKey: "EDIT_OUTGOING_CONTENT",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return !info.isPaper;
                }
            },
            // View Tracking Sheet
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view_tracking_sheet',
                shortcut: false,
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: function (action, model) {
                    return true;
                },
                subMenu: viewTrackingSheetService.getViewTrackingSheetOptions('grid')
            },
            // View Tracking Sheet (Sticky Only)
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view_tracking_sheet',
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: gridService.checkToShowAction,
                sticky: true,
                showInView: false,
                showInViewOnly: true,
                callback: self.viewTrackingSheet,
                params: ['view_tracking_sheet', 'tabs', gridService.grids.centralArchive.readyToExport]
            },
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                shortcut: false,
                showInView: false,
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "MANAGE_DOCUMENT’S_TAGS",
                    "MANAGE_DOCUMENT’S_COMMENTS",
                    "MANAGE_TASKS",
                    "MANAGE_ATTACHMENTS",
                    "MANAGE_LINKED_DOCUMENTS",
                    "MANAGE_LINKED_ENTITIES",
                    "MANAGE_DESTINATIONS"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // Tags
                    {
                        type: 'action',
                        icon: 'tag',
                        text: 'grid_action_tags',
                        shortcut: false,
                        permissionKey: "MANAGE_DOCUMENT’S_TAGS",
                        callback: self.manageTags,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Comments
                    {
                        type: 'action',
                        icon: 'comment',
                        text: 'grid_action_comments',
                        shortcut: false,
                        permissionKey: "MANAGE_DOCUMENT’S_COMMENTS",
                        callback: self.manageComments,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Tasks
                    {
                        type: 'action',
                        icon: 'note-multiple',
                        text: 'grid_action_tasks',
                        shortcut: false,
                        permissionKey: "MANAGE_TASKS",
                        callback: self.manageTasks,
                        class: "action-red",
                        hide: true,
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Attachments
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_attachments',
                        shortcut: false,
                        permissionKey: "MANAGE_ATTACHMENTS",
                        callback: self.manageAttachments,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Linked Documents
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_linked_documents',
                        shortcut: false,
                        permissionKey: "MANAGE_LINKED_DOCUMENTS",
                        callback: self.manageLinkedDocuments,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Linked Entities
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_linked_entities',
                        shortcut: false,
                        callback: self.manageLinkedEntities,
                        permissionKey: "MANAGE_LINKED_ENTITIES",
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Destinations
                    {
                        type: 'action',
                        icon: 'stop',
                        text: 'grid_action_destinations',
                        shortcut: false,
                        callback: self.manageDestinations,
                        permissionKey: "MANAGE_DESTINATIONS",
                        class: "action-green",
                        hide: false,
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Send
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_send',
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model) && !model.isBroadcasted();
                },
                permissionKey: [
                    "SEND_COMPOSITE_DOCUMENT_BY_EMAIL",
                    "SEND_DOCUMENT_BY_FAX"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // Link To Document By Email
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_link_to_document_by_email',
                        permissionKey: 'SEND_COMPOSITE_DOCUMENT_BY_EMAIL',
                        callback: self.sendLinkToDocumentByEmail,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Send Document by Fax
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_send_document_by_fax',
                        permissionKey: "SEND_DOCUMENT_BY_FAX",
                        callback: self.sendMainDocumentFax,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return model.canSendByFax();
                        }
                    }
                ]
            },
            // View
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view',
                shortcut: false,
                hide: true,
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                subMenu: [
                    // Direct Linked Documents
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_direct_linked_documents',
                        shortcut: false,
                        callback: self.viewReadyToExportDirectLinkedDocuments,
                        class: "action-red",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Complete Linked Documents
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_complete_linked_documents',
                        shortcut: false,
                        callback: self.viewReadyToExportCompleteLinkedDocuments,
                        class: "action-red",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Download
            {
                type: 'action',
                icon: 'download',
                text: 'grid_action_download',
                shortcut: false,
                checkShow: function (action, model) {
                    var isAllowed = true;
                    if (model.isCorrespondenceApprovedBefore() && model.getInfo().authorizeByAnnotation) {
                        isAllowed = rootEntity.getGlobalSettings().isAllowEditAfterFirstApprove();
                    }

                    return isAllowed && gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "DOWNLOAD_MAIN_DOCUMENT",
                    "DOWNLOAD_COMPOSITE_BOOK" // Composite Document
                ],
                checkAnyPermission: true,
                subMenu: [
                    // Main Document
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_main_document',
                        shortcut: false,
                        permissionKey: "DOWNLOAD_MAIN_DOCUMENT",
                        callback: self.downloadMainDocument,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Composite Document
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_composite_document',
                        permissionKey: 'DOWNLOAD_COMPOSITE_BOOK',
                        shortcut: false,
                        callback: self.downloadCompositeDocument,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // download selected
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'selective_document',
                        permissionKey: 'DOWNLOAD_COMPOSITE_BOOK',
                        callback: self.downloadSelected,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // merge and download
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'merge_and_download',
                        permissionKey: 'DOWNLOAD_COMPOSITE_BOOK',
                        callback: self.mergeAndDownloadFullDocument,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Edit(Paper Only)
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit',
                shortcut: false,
                showInView: false,
                hide: true,
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                subMenu: [
                    // Content
                    {
                        type: 'action',
                        //icon: 'link-variant',
                        text: 'grid_action_content',
                        shortcut: false,
                        callback: self.editContent,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                            var info = model.getInfo();
                            return info.isPaper && employeeService.hasPermissionTo("EDIT_OUTGOING_PAPER");
                        }
                    },
                    // Edit properties
                    {
                        type: 'action',
                        //icon: 'pencil',
                        text: 'grid_action_properties',
                        shortcut: false,
                        callback: self.editProperties,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return checkIfEditPropertiesAllowed(model);
                        }
                    }
                ]
            },
            // Broadcast
            {
                type: 'action',
                icon: 'bullhorn',
                text: 'grid_action_broadcast',
                shortcut: false,
                hide: true,
                permissionKey: 'BROADCAST_DOCUMENT',
                callback: self.broadcast,
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    return !model.hasActiveSeqWF();
                }
            },
            // Duplicate
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_duplicate',
                shortcut: false,
                showInView: false,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "DUPLICATE_BOOK_CURRENT",
                    "DUPLICATE_BOOK_FROM_VERSION"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // duplicate current version
                    {
                        type: 'action',
                        icon: 'content-copy',
                        text: 'grid_action_duplication_current_version',
                        shortcut: false,
                        hide: false,
                        callback: self.duplicateCurrentVersion,
                        class: "action-green",
                        permissionKey: 'DUPLICATE_BOOK_CURRENT',
                        showInView: true,
                        disabled: function (model) {
                            return model.isLocked() && !model.isLockedByCurrentUser();
                        },
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            return (info.documentClass === 'outgoing' || info.documentClass === 'internal') && !info.isPaper
                        }
                    },
                    // duplicate specific version
                    {
                        type: 'action',
                        icon: 'content-duplicate',
                        text: 'grid_action_duplication_specific_version',
                        shortcut: false,
                        hide: false,
                        callback: self.duplicateVersion,
                        class: "action-green",
                        showInView: true,
                        disabled: function (model) {
                            return model.isLocked() && !model.isLockedByCurrentUser();
                        },
                        permissionKey: 'DUPLICATE_BOOK_FROM_VERSION',
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Unlock
            {
                type: 'action',
                icon: 'lock-open',
                text: 'grid_action_unlock',
                shortcut: false,
                callback: self.unlockWorkItem,
                class: "action-green",
                showInView: true,
                permissionKey: '',
                checkShow: function (action, model) {
                    return model.isLocked() && model.getLockingInfo().domainName !== employeeService.getEmployee().domainName;
                }
            }
        ];

        self.shortcutActions = gridService.getShortcutActions(self.gridActions);
        self.contextMenuActions = gridService.getContextMenuActions(self.gridActions);


        self.refreshGrid = function (time) {
            $timeout(function () {
                $state.is('app.central-archive.ready-to-export') && self.reloadReadyToExports(self.grid.page);
            }, time)
                .then(function () {
                    $state.is('app.central-archive.ready-to-export') && self.refreshGrid(time);
                });
        };

        if (employeeService.getEmployee().getIntervalMin()) {
            self.refreshGrid(employeeService.getEmployee().getIntervalMin());
        }
    });
};
