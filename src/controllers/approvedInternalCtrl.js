module.exports = function (app) {
    app.controller('approvedInternalCtrl', function (lookupService,
                                                     approvedInternalService,
                                                     approvedInternals,
                                                     configurationService,
                                                     counterService,
                                                     correspondenceStorageService,
                                                     $q,
                                                     $filter,
                                                     langService,
                                                     toast,
                                                     dialog,
                                                     rootEntity,
                                                     _,
                                                     viewDocumentService,
                                                     downloadService,
                                                     userFolders,
                                                     $window,
                                                     tokenService,
                                                     contextHelpService,
                                                     userFolderService,
                                                     readyToExportService,
                                                     viewTrackingSheetService,
                                                     employeeService,
                                                     favoriteDocumentsService,
                                                     ResolveDefer,
                                                     correspondenceService,
                                                     listGeneratorService,
                                                     $state,
                                                     mailNotificationService,
                                                     gridService,
                                                     errorCode,
                                                     generator) {
        'ngInject';

        var self = this;

        self.controllerName = 'approvedInternalCtrl';

        contextHelpService.setHelpTo('approved-internal');
        // employee service to check the permission in html
        self.employeeService = employeeService;

        /**
         * @description All approved internals
         * @type {*}
         */
        self.approvedInternals = approvedInternals;
        self.approvedInternalsCopy = angular.copy(self.approvedInternals);
        self.userFolders = userFolders;

        /**
         * @description Contains methods for Star operations for approved internal items
         */
        self.starServices = {
            'false': approvedInternalService.controllerMethod.approvedInternalStar,
            'true': approvedInternalService.controllerMethod.approvedInternalUnStar,
            'starBulk': approvedInternalService.controllerMethod.approvedInternalStarBulk,
            'unStarBulk': approvedInternalService.controllerMethod.approvedInternalUnStarBulk
        };

        /**
         * @description Contains the selected approved internals
         * @type {Array}
         */
        self.selectedApprovedInternals = [];
        self.globalSetting = rootEntity.returnRootEntity().settings;

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.internal.approved) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.internal.approved, self.approvedInternals),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.internal.approved, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.internal.approved),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.internal.approved, self.grid.truncateSubject);
            },
            searchColumns: {
                serial: 'generalStepElm.docFullSerial',
                subject: 'generalStepElm.docSubject',
                receivedDate: 'generalStepElm.receivedDate',
                sender: function (record) {
                    return self.getSortingKey('senderInfo', 'SenderInfo');
                },
                dueDate: 'generalStepElm.dueDate',
                numberOfDays: 'generalStepElm.numberOfDays'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.approvedInternals = gridService.searchGridData(self.grid, self.approvedInternalsCopy);
            }
        };

        /**
         * @description Replaces the record in grid after update
         * @param record
         */
        self.replaceRecord = function (record) {
            var index = _.findIndex(self.approvedInternals, function (approvedInternal) {
                return approvedInternal.generalStepElm.vsId === record.generalStepElm.vsId;
            });
            if (index > -1)
                self.approvedInternals.splice(index, 1, record);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.approvedInternals = $filter('orderBy')(self.approvedInternals, self.grid.order);
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
         * @description Reload the grid of approved internals
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadApprovedInternals = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return approvedInternalService
                .loadApprovedInternals()
                .then(function (result) {
                    counterService.loadCounters();
                    self.approvedInternals = result;
                    self.approvedInternalsCopy = angular.copy(self.approvedInternals);
                    self.selectedApprovedInternals = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Terminate approved internals Bulk
         * @param $event
         */
        self.terminateBulk = function ($event) {
            var numberOfRecordsToTerminate = angular.copy(self.selectedApprovedInternals.length);
            approvedInternalService.controllerMethod
                .approvedInternalTerminateBulk(self.selectedApprovedInternals, $event)
                .then(function (result) {
                    self.reloadApprovedInternals(self.grid.page)
                        .then(function () {
                            if (numberOfRecordsToTerminate === 1)
                                toast.success(langService.get("selected_terminate_success"));
                        });
                });
        };

        /**
         * @description Change the starred for approved internal
         * @param approvedInternal
         * @param $event
         */
        self.changeApprovedInternalStar = function (approvedInternal, $event) {
            if (approvedInternal.isLocked() && !approvedInternal.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(approvedInternal, null));
                return;
            }
            self.starServices[approvedInternal.generalStepElm.starred](approvedInternal)
                .then(function (result) {
                    if (result) {
                        self.reloadApprovedInternals(self.grid.page)
                            .then(function () {
                                if (!approvedInternal.generalStepElm.starred)
                                    toast.success(langService.get("star_specific_success").change({name: approvedInternal.generalStepElm.docSubject}));
                                else
                                    toast.success(langService.get("unstar_specific_success").change({name: approvedInternal.generalStepElm.docSubject}));
                            });
                    } else {
                        dialog.errorMessage(langService.get('something_happened_when_update_starred'));
                    }
                })
                .catch(function () {
                    dialog.errorMessage(langService.get('something_happened_when_update_starred'));
                });
        };

        /**
         * @description Terminate approved internal Item
         * @param approvedInternal
         * @param $event
         * @param defer
         */
        self.terminate = function (approvedInternal, $event, defer) {
            if (approvedInternal.isLocked() && !approvedInternal.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(approvedInternal, null));
                return;
            }
            approvedInternalService.controllerMethod
                .approvedInternalTerminate(approvedInternal, $event)
                .then(function (result) {
                    self.reloadApprovedInternals(self.grid.page)
                        .then(function () {
                            toast.success(langService.get("terminate_specific_success").change({name: approvedInternal.generalStepElm.docSubject}));
                            new ResolveDefer(defer);
                        });
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
                    self.reloadApprovedInternals(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
                .catch(function () {
                    self.reloadApprovedInternals(self.grid.page)
                });
        };

        /**
         * @description add an item to the favorite documents
         * @param approvedInternal
         * @param $event
         */
        self.addToFavorite = function (approvedInternal, $event) {
            if (approvedInternal.isLocked() && !approvedInternal.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(approvedInternal, null));
                return;
            }
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAdd(approvedInternal.generalStepElm.vsId, $event)
                .then(function (result) {
                    if (result.status) {
                        self.reloadApprovedInternals(self.grid.page)
                            .then(function () {
                                toast.success(langService.get("add_to_favorite_specific_success").change({
                                    name: approvedInternal.getTranslatedName()
                                }));
                            });
                    } else {
                        dialog.alertMessage(langService.get(result.message));
                    }
                });
        };

        /**
         * @description Archive the document to icn
         * @param workItem
         * @param $event
         * @param defer
         */
        self.addToIcnArchive = function (workItem, $event, defer) {
            workItem.addToIcnArchiveDialog($event)
                .then(function () {
                    self.reloadApprovedInternals(self.grid.page);
                    new ResolveDefer(defer);
                });
        };

        /**
         * @description Get the link of approved internal
         * @param approvedInternal
         * @param $event
         */
        self.getApprovedInternalLink = function (approvedInternal, $event) {
            if (approvedInternal.isLocked() && !approvedInternal.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(approvedInternal, null));
                return;
            }
            //  console.log('getApprovedInternalLink', approvedInternal);
        };

        /**
         * @description View Tracking Sheet
         * @param approvedInternal
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (approvedInternal, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(approvedInternal, params, $event).then(function (result) {

            });
        };

        /**
         * @description Launch distribution workflow for approved internal item
         * @param approvedInternal
         * @param $event
         * @param defer
         */
        self.launchDistributionWorkflow = function (approvedInternal, $event, defer) {
            if (!approvedInternal.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            if (approvedInternal.isLocked() && !approvedInternal.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(approvedInternal, null));
                return;
            }
            approvedInternal
                .launchWorkFlow($event, 'forward')
                .then(function () {
                    self.reloadApprovedInternals(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Launch Distribution Workflow with quick send
         * @param record
         * @param $event
         * @param defer
         */
        self.quickSend = function (record, $event, defer) {
            if (!record.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            if (record.isLocked() && !record.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(record, null));
                return;
            }
            record.quickSendLaunchWorkflow($event, 'favorites')
                .then(function () {
                    self.reloadApprovedInternals(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description Launch distribution workflow for selected approved internal items
         * @param $event
         */
        self.launchDistributionWorkflowBulk = function ($event) {
            var contentNotExist = _.filter(self.selectedApprovedInternals, function (approvedInternal) {
                return !approvedInternal.hasContent();
            });
            if (contentNotExist.length > 0) {
                dialog.alertMessage(langService.get("content_not_found_bulk"));
                return;
            }
            correspondenceService
                .launchCorrespondenceWorkflow(self.selectedApprovedInternals, $event)
                .then(function () {
                    self.reloadApprovedInternals(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                })
                .catch(function () {
                    self.reloadApprovedInternals(self.grid.page);
                });
        };

        /**
         * @description View Direct Linked Documents
         * @param approvedInternal
         * @param $event
         */
        self.viewApprovedInternalDirectLinkedDocuments = function (approvedInternal, $event) {
            if (approvedInternal.isLocked() && !approvedInternal.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(approvedInternal, null));
                return;
            }
            //  console.log('viewApprovedInternalDirectLinkedDocuments : ', approvedInternal);
        };

        /**
         * @description View Complete Linked Documents
         * @param approvedInternal
         * @param $event
         */
        self.viewApprovedInternalCompleteLinkedDocuments = function (approvedInternal, $event) {
            if (approvedInternal.isLocked() && !approvedInternal.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(approvedInternal, null));
                return;
            }
            //  console.log('viewApprovedInternalCompleteLinkedDocuments : ', approvedInternal);
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
         * @param workItem
         * @param $event
         */
        self.downloadSelected = function (workItem, $event) {
            downloadService.openSelectedDownloadDialog(workItem, $event);
        };
        /**
         * @description merge and download
         * @param workItem
         */
        self.mergeAndDownloadFullDocument = function (workItem) {
            downloadService.mergeAndDownload(workItem);
        };

        /**
         * @description Send Link To Document By Email
         * @param approvedInternal
         * @param $event
         */
        self.sendApprovedInternalLinkToDocumentByEmail = function (approvedInternal, $event) {
            if (approvedInternal.isLocked() && !approvedInternal.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(approvedInternal, null));
                return;
            }
            // console.log('sendApprovedInternalLinkToDocumentByEmail : ', approvedInternal);
        };

        /**
         * @description Send Composite Document As Attachment
         * @param approvedInternal
         * @param $event
         */
        self.sendApprovedInternalCompositeDocumentAsAttachment = function (approvedInternal, $event) {
            if (approvedInternal.isLocked() && !approvedInternal.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(approvedInternal, null));
                return;
            }
            //  console.log('sendApprovedInternalCompositeDocumentAsAttachment : ', approvedInternal);
        };

        /**
         * @description Send Composite Document As Attachment By Email
         * @param approvedInternal
         * @param $event
         */
        self.sendApprovedInternalCompositeDocumentAsAttachmentByEmail = function (approvedInternal, $event) {
            if (approvedInternal.isLocked() && !approvedInternal.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(approvedInternal, null));
                return;
            }
            //   console.log('sendApprovedInternalCompositeDocumentAsAttachmentByEmail : ', approvedInternal);
        };

        /**
         * @description Send Main Document Fax
         * @param approvedInternal
         * @param $event
         */
        self.sendApprovedInternalMainDocumentFax = function (approvedInternal, $event) {
            if (approvedInternal.isLocked() && !approvedInternal.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(approvedInternal, null));
                return;
            }
            //  console.log('sendApprovedInternalMainDocumentFax : ', approvedInternal);
        };

        /**
         * @description Send SMS
         * @param workItem
         * @param $event
         * @param defer
         */
        self.sendSMS = function (workItem, $event, defer) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            workItem.openSendSMSDialog($event)
                .then(function (result) {
                    new ResolveDefer(defer);
                });
        };

        /**
         * @description Send Main Document As Attachment
         * @param approvedInternal
         * @param $event
         */
        self.sendApprovedInternalMainDocumentAsAttachment = function (approvedInternal, $event) {
            if (approvedInternal.isLocked() && !approvedInternal.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(approvedInternal, null));
                return;
            }
            //  console.log('sendApprovedInternalMainDocumentAsAttachment : ', approvedInternal);
        };

        /**
         * @description Send Link
         * @param approvedInternal
         * @param $event
         */
        self.sendApprovedInternalLink = function (approvedInternal, $event) {
            if (approvedInternal.isLocked() && !approvedInternal.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(approvedInternal, null));
                return;
            }
            //  console.log('sendApprovedInternalLink : ', approvedInternal);
        };
        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            /*var isEditAllowed = employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES");
             if (checkForViewPopup)
             return !isEditAllowed;
             return isEditAllowed;*/
            return true;
        };

        /**
         * @description Preview document
         * @param approvedInternal
         * @param $event
         */
        self.previewDocument = function (approvedInternal, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            if (approvedInternal.isLocked() && !approvedInternal.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(approvedInternal, null));
                return;
            }
            return correspondenceService.viewCorrespondence(approvedInternal, self.gridActions, checkIfEditPropertiesAllowed(approvedInternal, true), true, false, false, true)
                .then(function () {
                    correspondenceService.unlockWorkItem(approvedInternal, true, $event).then(function () {
                        return self.reloadApprovedInternals(self.grid.page);
                    });
                })
                .catch(function (error) {
                    if (error !== 'itemLocked')
                        return self.reloadApprovedInternals(self.grid.page);
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
            workItem.viewNewApprovedInternalWorkItemDocument(self.gridActions, 'approvedInternal', $event)
                .then(function () {
                    correspondenceService.unlockWorkItem(workItem, true, $event).then(function () {
                        self.reloadApprovedInternals(self.grid.page);
                    });
                })
                .catch(function (error) {
                    if (error !== 'itemLocked')
                        self.reloadApprovedInternals(self.grid.page);
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
                    $state.go('app.internal.add', {
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
                    $state.go('app.internal.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        wobNum: info.wobNumber
                    });
                });
        };

        /**
         * @description do broadcast for workItem.
         */
        self.broadcast = function (workItem, $event, defer) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            workItem
                .correspondenceBroadcast()
                .then(function () {
                    self.reloadApprovedInternals(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        })
                })
        };

        /**
         * @description Edit After Approve
         * @param model
         * @param $event
         */
        self.editAfterApprove = function (model, $event) {
            if (model.isLocked() && !model.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            var info = model.getInfo(), list = listGeneratorService.createUnOrderList(),
                langKeys = ['signature_serial_will_removed', 'the_book_will_go_to_audit', 'serial_retained'];
            _.map(langKeys, function (item) {
                list.addItemToList(langService.get(item));
            });

            dialog.confirmMessage(list.getList(), null, null, $event)
                .then(function () {
                    correspondenceStorageService
                        .runEditAfter('Approved', model)
                        .then(function () {
                            $state.go('app.internal.add', {
                                wobNum: info.wobNumber,
                                vsId: info.vsId,
                                action: 'editAfterApproved'
                            });
                        });
                });

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
                        self.reloadApprovedInternals(self.grid.page);
                });
        };

        self.checkIfUnlockBulkAvailable = function () {
            self.itemsWithoutUnlock = [];
            _.map(self.selectedApprovedInternals, function (workItem) {
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
            var selectedItems = angular.copy(self.selectedApprovedInternals);
            if (!self.checkIfUnlockBulkAvailable()) {
                if (self.itemsWithoutUnlock.length === selectedItems.length) {
                    dialog.alertMessage(langService.get('selected_items_can_not_be_unlocked'));
                    return false;
                }
                dialog.confirmMessage(langService.get('some_items_cannot_be_unlocked_skip_and_unlock'), null, null, $event).then(function () {
                    self.selectedApprovedInternals = selectedItems = _.filter(self.selectedApprovedInternals, function (workItem) {
                        return self.itemsWithoutUnlock.indexOf(workItem.generalStepElm.vsId) === -1;
                    });
                    if (self.selectedApprovedInternals.length)
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
                    self.reloadApprovedInternals(self.grid.page);
                });
        };

        /**
         * @description Mark item as read/unread
         * @param workItem
         * @param $event
         */
        self.markAsReadUnread = function (workItem, $event) {
            return workItem.markAsReadUnread($event)
                .then(function (result) {
                    self.reloadApprovedInternals(self.grid.page);
                    counterService.loadCounters();
                })
        };

        /**
         * @description add workItem To My FollowUp
         * @param item
         */
        self.addToDirectFollowUp = function (item) {
            item.addToMyDirectFollowUp();
        };

        /**
         * @description add workItem To other user's FollowUp
         * @param item
         */
        self.addToEmployeeFollowUp = function (item) {
            item.addToUserFollowUp();
        };

        /**
         * @description Create Reply
         * @param workItem
         * @param $event
         * @param defer
         */
        self.createReply = function (workItem, $event, defer) {
            workItem.createReply($event)
                .then(function (result) {
                    new ResolveDefer(defer);
                }).catch(function (error) {
                if (error && errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                    dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: workItem.getInfo().wobNumber}));
                    return false;
                }
            });
        };
        /**
         * @description Create Reply Specific version
         * @param workItem
         * @param $event
         * @param defer
         */
        self.createReplySpecificVersion = function (workItem, $event, defer) {
            workItem.createReply($event, true)
                .then(function (result) {
                    new ResolveDefer(defer);
                }).catch(function (error) {
                if (error && errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                    dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: workItem.getInfo().wobNumber}));
                    return false;
                }
            });
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
                        gridName: 'internal-approved'
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
                        shortcut: false,
                        showInView: false,
                        callback: self.previewDocument,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        disabled: function (model) {
                            return model.isLocked() && !model.isLockedByCurrentUser();
                        },
                        checkShow: function (action, model) {
                            //If no content, hide the button
                            return model.hasContent();
                        }
                    },
                    // Open
                    {
                        type: 'action',
                        icon: 'book-open-page-variant',
                        text: 'grid_action_open',
                        shortcut: false,
                        showInView: false,
                        callback: self.viewDocument,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        disabled: function (model) {
                            return model.isLocked() && !model.isLockedByCurrentUser();
                        },
                        checkShow: function (action, model) {
                            //If no content, hide the button
                            return model.hasContent();
                        }
                    },
                    // show versions
                    {
                        type: 'action',
                        icon: 'animation',
                        text: 'grid_action_view_specific_version',
                        shortcut: false,
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
                stickyIndex: 1,
                checkShow: function (action, model) {
                    return model.userCanAnnotate() && rootEntity.hasPSPDFViewer() && employeeService.hasPermissionTo(configurationService.ANNOTATE_DOCUMENT_PERMISSION) && !model.isTerminatedSEQ();
                }
            },
            // Add To
            {
                type: 'action',
                icon: 'plus',
                text: 'grid_action_add_to',
                class: "action-green",
                permissionKey: [
                    'MANAGE_FAVORITE',
                    'ICN_ENTRY_TEMPLATE',
                    'USER_FOLLOWUP_BOOKS',
                    'ADMIN_USER_FOLLOWUP_BOOKS'
                ],
                checkAnyPermission: true,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                subMenu: [
                    // Add To Favorite
                    {
                        type: 'action',
                        icon: 'star',
                        text: 'grid_action_to_favorite',
                        permissionKey: "MANAGE_FAVORITE",
                        shortcut: false,
                        callback: self.addToFavorite,
                        class: "action-green",
                        disabled: function (model) {
                            return model.isLocked() && !model.isLockedByCurrentUser();
                        },
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Add To ICN Archive
                    {
                        type: 'action',
                        icon: 'archive',
                        text: 'grid_action_icn_archive',
                        callback: self.addToIcnArchive,
                        class: "action-green",
                        permissionKey: 'ICN_ENTRY_TEMPLATE',
                        disabled: function (model) {
                            return model.isLocked() && !model.isLockedByCurrentUser();
                        },
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // add to my follow up
                    {
                        type: 'action',
                        icon: 'book-search-outline',
                        text: 'grid_action_to_my_followup',
                        shortcut: true,
                        callback: self.addToDirectFollowUp,
                        permissionKey: 'USER_FOLLOWUP_BOOKS',
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // add to employee follow up
                    {
                        type: 'action',
                        icon: 'book-search-outline',
                        text: 'grid_action_to_employee_followup',
                        shortcut: true,
                        callback: self.addToEmployeeFollowUp,
                        permissionKey: 'ADMIN_USER_FOLLOWUP_BOOKS',
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Create Reply
            {
                type: 'action',
                icon: 'pen',
                text: 'grid_action_create_reply',
                callback: self.createReply,
                class: "action-green",
                checkShow: function (action, model) {
                    return model.checkCreateReplyPermission() && !model.isBroadcasted();
                }
            },
            // Create Reply For Specific Version
            {
                type: 'action',
                icon: 'pen',
                text: 'grid_action_create_reply_specific_version',
                callback: self.createReplySpecificVersion,
                class: "action-green",
                checkShow: function (action, model) {
                    return model.checkCreateReplyPermission(true) && !model.isBroadcasted();
                }
            },
            // Launch Distribution Workflow
            {
                type: 'action',
                icon: 'sitemap',
                text: 'grid_action_launch_distribution_workflow',
                shortcut: true,
                callback: self.launchDistributionWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Quick Send (Quick Launch)
            {
                type: 'action',
                icon: 'sitemap',
                text: 'grid_action_quick_send',
                shortcut: true,
                callback: self.quickSend,
                class: "action-green",
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    return !model.hasActiveSeqWF();
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
            // Broadcast
            {
                type: 'action',
                icon: 'bullhorn',
                text: 'grid_action_broadcast',
                shortcut: false,
                hide: false,
                permissionKey: 'BROADCAST_DOCUMENT',
                callback: self.broadcast,
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    return !model.isBroadcasted() && (model.getSecurityLevelLookup().lookupKey !== 4)
                        && !model.hasActiveSeqWF();
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
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                permissionKey: "EDIT_INTERNAL_CONTENT", //TODO: Apply correct permission when added to database.
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return !info.isPaper;
                }
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
                    "DOWNLOAD_COMPOSITE_BOOK"
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
            // Send
            {
                type: 'action',
                icon: 'send',
                text: 'send',
                shortcut: false,
                hide: true,
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "SEND_LINK_TO_THE_DOCUMENT_BY_EMAIL",
                    "SEND_COMPOSITE_DOCUMENT_BY_EMAIL",
                    "",
                    "SEND_SMS",
                    "",
                    ""
                ],
                checkAnyPermission: true,
                subMenu: [
                    // Link To Document By Email
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_link_to_document_by_email',
                        shortcut: false,
                        permissionKey: 'SEND_COMPOSITE_DOCUMENT_BY_EMAIL',
                        callback: self.sendApprovedInternalLinkToDocumentByEmail,
                        class: "action-red",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Composite Document As Attachment By Email
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_composite_document_as_attachment_by_email',
                        shortcut: false,
                        permissionKey: 'SEND_COMPOSITE_DOCUMENT_BY_EMAIL',
                        callback: self.sendApprovedInternalCompositeDocumentAsAttachmentByEmail,
                        class: "action-red",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Composite Document
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'composite_document_as_attachment',
                        shortcut: false,
                        callback: self.sendApprovedInternalCompositeDocumentAsAttachment,
                        class: "action-red",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // SMS
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'grid_action_send_sms',
                        shortcut: false,
                        permissionKey: "SEND_SMS",
                        callback: self.sendSMS,
                        class: "action-red",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Main Document As Attachment
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'main_document_as_attachment',
                        shortcut: false,
                        callback: self.sendApprovedInternalMainDocumentAsAttachment,
                        class: "action-red",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Link
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_send_link',
                        shortcut: false,
                        callback: self.sendApprovedInternalLink,
                        class: "action-red",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
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
                        callback: self.duplicateCurrentVersion,
                        class: "action-green",
                        permissionKey: 'DUPLICATE_BOOK_CURRENT',
                        showInView: true,
                        disabled: function (model) {
                            return model.isLocked() && !model.isLockedByCurrentUser();
                        },
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            return !info.isPaper;
                        }
                    },
                    // duplicate specific version
                    {
                        type: 'action',
                        icon: 'content-duplicate',
                        text: 'grid_action_duplication_specific_version',
                        shortcut: false,
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

    });
};
