module.exports = function (app) {
    app.controller('returnedDepartmentInboxCtrl', function (lookupService,
                                                            returnedDepartmentInboxService,
                                                            returnedDepartmentInboxes,
                                                            listGeneratorService,
                                                            correspondenceStorageService,
                                                            userInboxService,
                                                            $q,
                                                            $filter,
                                                            errorCode,
                                                            $state,
                                                            $timeout,
                                                            langService,
                                                            rootEntity,
                                                            toast,
                                                            _,
                                                            dialog,
                                                            managerService,
                                                            viewDocumentService,
                                                            contextHelpService,
                                                            counterService,
                                                            viewTrackingSheetService,
                                                            downloadService,
                                                            generator,
                                                            employeeService,
                                                            ResolveDefer,
                                                            correspondenceService,
                                                            favoriteDocumentsService,
                                                            mailNotificationService,
                                                            gridService,
                                                            emailItem) {
        'ngInject';
        var self = this;
        /*
         IT WILL ALWAYS GET OUTGOING DOCUMENTS ONLY
         */
        self.controllerName = 'returnedDepartmentInboxCtrl';

        contextHelpService.setHelpTo('department-inbox-returned');
        // employee service to check the permission in html
        self.employeeService = employeeService;
        self.isInternalOutgoingEnabled = rootEntity.isInternalOutgoingEnabled();
        self.employee = employeeService.getEmployee();

        /**
         * @description All returned department inbox items
         * @type {*}
         */
        self.returnedDepartmentInboxes = returnedDepartmentInboxes;
        self.returnedDepartmentInboxesCopy = angular.copy(self.returnedDepartmentInboxes);

        /**
         * @description Contains the selected returned department inbox items
         * @type {Array}
         */
        self.selectedReturnedDepartmentInboxes = [];
        self.globalSetting = rootEntity.returnRootEntity().settings;

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            name: gridService.grids.department.returned,
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.department.returned) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.department.returned, self.returnedDepartmentInboxes),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.department.returned, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.department.returned),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.department.returned, self.grid.truncateSubject);
            },
            searchColumns: {
                serial: 'generalStepElm.docFullSerial',
                subject: 'generalStepElm.docSubject',
                receivedDate: 'generalStepElm.receivedDate',
                department: function (record) {
                    return self.getSortingKey('toOU', 'Information');
                },
                sender: function (record) {
                    return self.getSortingKey('senderInfo', 'SenderInfo');
                },
                correspondence_sites: function (record) {
                    return self.getSortingKey('fromOU', 'Information');
                },
                type: 'type',
                numberOfDays: 'generalStepElm.numberOfDays'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.returnedDepartmentInboxes = gridService.searchGridData(self.grid, self.returnedDepartmentInboxesCopy);
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
         * @description Contains methods for Star operations for returned department inbox items
         */
        self.starServices = {
            'false': returnedDepartmentInboxService.controllerMethod.returnedDepartmentInboxStar,
            'true': returnedDepartmentInboxService.controllerMethod.returnedDepartmentInboxUnStar,
            'starBulk': returnedDepartmentInboxService.controllerMethod.returnedDepartmentInboxesStarBulk,
            'unStarBulk': returnedDepartmentInboxService.controllerMethod.returnedDepartmentInboxesUnStarBulk
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.returnedDepartmentInboxes = $filter('orderBy')(self.returnedDepartmentInboxes, self.grid.order);
        };

        /**
         * @description Reload the grid of returned department inbox item
         * @param pageNumber
         * @param isAutoReload
         * @return {*|Promise<U>}
         */
        self.reloadReturnedDepartmentInboxes = function (pageNumber, isAutoReload) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return returnedDepartmentInboxService
                .loadReturnedDepartmentInboxes(!!isAutoReload)
                .then(function (result) {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.returnedDepartmentInboxes = result;
                    self.returnedDepartmentInboxesCopy = angular.copy(self.returnedDepartmentInboxes);
                    self.selectedReturnedDepartmentInboxes = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Resend returned department inbox item
         * @param $event
         */
        self.resendBulkReturnedDepartmentInbox = function ($event) {
            returnedDepartmentInboxService
                .controllerMethod.resendBulk(self.selectedReturnedDepartmentInboxes, $event)
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                })
        };

        /**
         * @description add an item to the favorite documents
         * @param workItem
         * @param $event
         */
        self.addToFavorite = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            workItem.addToFavorite().then(function () {
                self.reloadReturnedDepartmentInboxes(self.grid.page)
            });
        };


        /**
         * @description Terminate returned department inbox item
         * @param workItem
         * @param $event
         * @param defer
         */
        self.terminate = function (workItem, $event, defer) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            workItem
                .terminate($event)
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Get Link
         * @param workItem
         * @param $event
         */
        self.getLink = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            var info = workItem.getInfo();
            viewDocumentService.loadDocumentViewUrlWithOutEdit(info.vsId).then(function (result) {
                //var docLink = "<a target='_blank' href='" + result + "'>" + result + "</a>";
                dialog.successMessage(langService.get('link_message').change({result: result}), null, null, null, null, true);
                return true;
            });
        };

        /**
         * @description Subscribe
         * @param workItem
         * @param $event
         */
        self.subscribe = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            //   console.log('subscribe for returned department inbox : ', workItem)
        };

        /**
         * @description View Tracking Sheet
         * @param returnedDepartmentInbox
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (returnedDepartmentInbox, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(returnedDepartmentInbox, params, $event).then(function (result) {
            });
        };

        /**
         * @description Resend returned department inbox item
         * @param workItem
         * @param $event
         * @param defer
         */
        self.resend = function (workItem, $event, defer) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            workItem.resendWorkItem($event)
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page)
                        .then(function (result) {
                            toast.success(langService.get('resend_specific_success').change({name: workItem.getTranslatedName()}));
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description Launch new distribution workflow for returned department inbox item
         * @param workItem
         * @param $event
         * @param defer
         */
        self.launchNewDistributionWorkflow = function (workItem, $event, defer) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            //returnedDepartmentInbox.generalStepElm.workFlowName = Export,
            // but it need in DW popup to create URL, records will always come from Outgoing export
            workItem.generalStepElm.workFlowName = "Outgoing";
            workItem.hideForwardSenderInfo = true;
            workItem.recordGridName = gridService.grids.department.returned;
            dialog.confirmMessage(langService.get("confirm_launch_workflow")).then(function () {
                workItem.launchWorkFlow($event, 'forward', self.employee.isDefaultTabFavoriteAtLaunch() ? 'favorites' : 'users')
                    .then(function () {
                        self.reloadReturnedDepartmentInboxes(self.grid.page)
                            .then(function () {
                                mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                                new ResolveDefer(defer);
                            });
                    });
            });
        };

        /**
         * @description Launch New Distribution Workflow with quick send
         * @param workItem
         * @param $event
         * @param defer
         */
        self.quickSend = function (workItem, $event, defer) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            workItem.generalStepElm.workFlowName = "Outgoing";
            workItem.recordGridName = gridService.grids.department.returned;
            dialog.confirmMessage(langService.get("confirm_launch_workflow")).then(function () {
                workItem.quickSendLaunchWorkflow($event, self.employee.isDefaultTabFavoriteAtLaunch() ? 'favorites' : 'users')
                    .then(function () {
                        self.reloadReturnedDepartmentInboxes(self.grid.page)
                            .then(function () {
                                mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                                new ResolveDefer(defer);
                            });
                    })
            });
        };

        /**
         * @description Manage Tags for returned department inbox item
         * @param workItem
         * @param $event
         */
        self.manageTags = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            var info = workItem.getInfo();
            var wfName = "outgoing";
            managerService.manageDocumentTags(info.vsId, wfName.toLowerCase(), info.title, $event)
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                });
        };

        /**
         * @description Manage comments for returned department inbox item
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.manageComments = function (returnedDepartmentInbox, $event) {
            if (returnedDepartmentInbox.isLocked() && !returnedDepartmentInbox.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(returnedDepartmentInbox, null));
                return;
            }
            var wfName = 'outgoing';
            returnedDepartmentInbox.manageDocumentComments($event)
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                });
        };

        /**
         * @description Manage tasks for returned department inbox item
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.manageTasks = function (returnedDepartmentInbox, $event) {
            if (returnedDepartmentInbox.isLocked() && !returnedDepartmentInbox.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(returnedDepartmentInbox, null));
                return;
            }
            //   console.log('manageTasksReturnedDepartmentInbox', returnedDepartmentInbox);
        };

        /**
         * @description Manage attachments for returned department inbox item
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.manageAttachments = function (returnedDepartmentInbox, $event) {
            if (returnedDepartmentInbox.isLocked() && !returnedDepartmentInbox.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(returnedDepartmentInbox, null));
                return;
            }
            returnedDepartmentInbox.manageDocumentAttachments($event)
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                }).catch(function () {
                self.reloadReturnedDepartmentInboxes(self.grid.page);
            });
        };

        /**
         * @description Manage linked documents for returned department inbox item
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.manageLinkedDocuments = function (returnedDepartmentInbox, $event) {
            if (returnedDepartmentInbox.isLocked() && !returnedDepartmentInbox.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(returnedDepartmentInbox, null));
                return;
            }
            var info = returnedDepartmentInbox.getInfo();
            managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass, "welcome")
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                }).catch(function () {
                self.reloadReturnedDepartmentInboxes(self.grid.page);
            });
        };

        /**
         * @description Manage Linked Entities
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.manageLinkedEntities = function (returnedDepartmentInbox, $event) {
            if (returnedDepartmentInbox.isLocked() && !returnedDepartmentInbox.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(returnedDepartmentInbox, null));
                return;
            }
            var wfName = 'outgoing';
            managerService
                .manageDocumentEntities(returnedDepartmentInbox.generalStepElm.vsId, wfName.toLowerCase(), returnedDepartmentInbox.generalStepElm.docSubject, $event);
        };

        /**
         * @description Destinations
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.manageDestinations = function (returnedDepartmentInbox, $event) {
            returnedDepartmentInbox.manageDocumentCorrespondence($event)
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                });
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
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.downloadSelected = function (returnedDepartmentInbox, $event) {
            downloadService.openSelectedDownloadDialog(returnedDepartmentInbox, $event);
        };

        /**
         * @description merge and download
         * @param returnedDepartmentInbox
         */
        self.mergeAndDownloadFullDocument = function (returnedDepartmentInbox) {
            downloadService.mergeAndDownload(returnedDepartmentInbox);
        };

        /**
         * @description Send Link To Document By Email
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (returnedDepartmentInbox, $event) {
            if (returnedDepartmentInbox.isLocked() && !returnedDepartmentInbox.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(returnedDepartmentInbox, null));
                return;
            }
            returnedDepartmentInbox
                .getMainDocumentEmailContent($event);
        };

        /**
         * @description Send composite document as attachment By Email
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (returnedDepartmentInbox, $event) {
            if (returnedDepartmentInbox.isLocked() && !returnedDepartmentInbox.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(returnedDepartmentInbox, null));
                return;
            }
            returnedDepartmentInbox
                .getCompositeDocumentEmailContent($event);
        };

        /**
         * @description Send SMS
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.sendSMS = function (returnedDepartmentInbox, $event) {
            if (returnedDepartmentInbox.isLocked() && !returnedDepartmentInbox.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(returnedDepartmentInbox, null));
                return;
            }
            //  console.log('sendSMS : ', returnedDepartmentInbox);
        };

        /**
         * @description Send Main Document Fax
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.sendMainDocumentFax = function (returnedDepartmentInbox, $event) {
            if (returnedDepartmentInbox.isLocked() && !returnedDepartmentInbox.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(returnedDepartmentInbox, null));
                return;
            }
            console.log('sendMainDocumentFax : ', returnedDepartmentInbox);
        };

        /**
         * @description Edit After Export
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.editAfterExport = function (returnedDepartmentInbox, $event) {
            if (returnedDepartmentInbox.isLocked() && !returnedDepartmentInbox.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(returnedDepartmentInbox, null));
                return;
            }
            var info = returnedDepartmentInbox.getInfo(), list = listGeneratorService.createUnOrderList(),
                langKeys = ['signature_serial_will_removed', 'the_book_will_go_to_audit', 'serial_retained', 'exported_not_received_documents_will_be_recalled'];
            _.map(langKeys, function (item) {
                list.addItemToList(langService.get(item));
            });
            dialog.confirmMessage(list.getList(), null, null, $event)
                .then(function () {
                    var page = (self.isInternalOutgoingEnabled && returnedDepartmentInbox.isInternalOutgoing()) ? 'app.outgoing.add-internal' : 'app.outgoing.add';
                    correspondenceStorageService
                        .runEditAfter('Export', returnedDepartmentInbox)
                        .then(function () {
                            dialog.hide();
                            $state.go(page, {
                                wobNum: info.wobNumber,
                                vsId: info.vsId,
                                action: 'editAfterExport'
                            });
                        })
                        .catch(function (error) {
                            //dialog.errorMessage(langService.get('error_messages'));
                            errorCode.checkIf(error, 'CANNOT_EDIT_AFTER_EXPORT_BECAUSE_RECEIVED_BY_ONE_SITE', function () {
                                dialog.errorMessage(langService.get('can_not_edit_after_export_because_received_by_one_site'));
                            });
                        });

                });
        };

        /**
         * @description Edit Outgoing Content
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.editContent = function (returnedDepartmentInbox, $event) {
            if (returnedDepartmentInbox.isLocked() && !returnedDepartmentInbox.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(returnedDepartmentInbox, null));
                return;
            }
            var info = returnedDepartmentInbox.getInfo();
            managerService.manageDocumentContent(info.vsId, 'outgoing', info.title, $event);//info.workFlow
        };

        /**
         * @description Edit Outgoing Properties
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.editProperties = function (returnedDepartmentInbox, $event) {
            if (returnedDepartmentInbox.isLocked() && !returnedDepartmentInbox.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(returnedDepartmentInbox, null));
                return;
            }
            var info = returnedDepartmentInbox.getInfo();
            managerService
                .manageDocumentProperties(info.vsId, info.documentClass, info.title, $event)
                .finally(function (document) {
                    self.reloadReturnedDepartmentInboxes(self.grid.page)
                });
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
         * @param workItem
         * @param $event
         */
        self.previewDocument = function (workItem, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            var info = workItem.getInfo();
            correspondenceService.viewCorrespondenceReturnedWorkItem(info, self.gridActions, checkIfEditPropertiesAllowed(workItem, true), true, true)
                .then(function () {
                    correspondenceService.unlockWorkItem(workItem, true, $event).then(function () {
                        self.reloadReturnedDepartmentInboxes(self.grid.page);
                    });
                })
                .catch(function (error) {
                    if (error !== 'itemLocked')
                        self.reloadReturnedDepartmentInboxes(self.grid.page);
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
            workItem.viewNewDepartmentReturned(self.gridActions, 'departmentReturned', $event)
                .then(function () {
                    correspondenceService.unlockWorkItem(workItem, true, $event).then(function () {
                        self.reloadReturnedDepartmentInboxes(self.grid.page);
                    });
                })
                .catch(function (error) {
                    if (error !== 'itemLocked')
                        self.reloadReturnedDepartmentInboxes(self.grid.page);
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
         * @description Terminate User inboxes Bulk
         * @param $event
         */
        self.terminateBulk = function ($event) {
            var numberOfRecordsToTerminate = angular.copy(self.selectedReturnedDepartmentInboxes.length);
            userInboxService
                .controllerMethod
                .userInboxTerminateBulk(self.selectedReturnedDepartmentInboxes, $event)
                .then(function () {
                    $timeout(function () {
                        self.reloadReturnedDepartmentInboxes(self.grid.page)
                            .then(function () {
                                if (numberOfRecordsToTerminate === 1)
                                    toast.success(langService.get("selected_terminate_success"));
                            });
                    }, 100);
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
                        self.reloadReturnedDepartmentInboxes(self.grid.page);
                });
        };

        self.checkIfUnlockBulkAvailable = function () {
            self.itemsWithoutUnlock = [];
            _.map(self.selectedReturnedDepartmentInboxes, function (workItem) {
                if (!workItem.isLocked())
                    self.itemsWithoutUnlock.push(workItem.generalStepElm.vsId);
            });
            return !(self.itemsWithoutUnlock && self.itemsWithoutUnlock.length);
        };

        /**
         * @description Mark item as read/unread
         * @param workItem
         * @param $event
         */
        self.markAsReadUnread = function (workItem, $event) {
            return workItem.markAsReadUnread($event)
                .then(function (result) {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                    counterService.loadCounters();
                })
        };


        /**
         * @description Unlocks the selected workItems
         * @param $event
         * @returns {*}
         */
        self.unlockWorkItemsBulk = function ($event) {
            var selectedItems = angular.copy(self.selectedReturnedDepartmentInboxes);
            if (!self.checkIfUnlockBulkAvailable()) {
                if (self.itemsWithoutUnlock.length === selectedItems.length) {
                    dialog.alertMessage(langService.get('selected_items_can_not_be_unlocked'));
                    return false;
                }
                dialog.confirmMessage(langService.get('some_items_cannot_be_unlocked_skip_and_unlock'), null, null, $event).then(function () {
                    self.selectedReturnedDepartmentInboxes = selectedItems = _.filter(self.selectedReturnedDepartmentInboxes, function (workItem) {
                        return self.itemsWithoutUnlock.indexOf(workItem.generalStepElm.vsId) === -1;
                    });
                    if (self.selectedReturnedDepartmentInboxes.length)
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
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
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
                        gridName: 'department-returned'
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
                        showInView: false,
                        class: "action-green",
                        disabled: function (model) {
                            return model.isLocked() && !model.isLockedByCurrentUser();
                        },
                        permissionKey: 'VIEW_DOCUMENT',
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
                        shortcut: true,
                        callback: self.viewDocument,
                        showInView: false,
                        class: "action-green",
                        disabled: function (model) {
                            return model.isLocked() && !model.isLockedByCurrentUser();
                        },
                        permissionKey: 'VIEW_DOCUMENT',
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
                        hide: true,
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
            // Add To Favorite
            {
                type: 'action',
                icon: 'star',
                text: 'grid_action_add_to_favorite',
                permissionKey: "MANAGE_FAVORITE",
                shortcut: false,
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                callback: self.addToFavorite,
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Terminate
            {
                type: 'action',
                icon: 'stop',
                text: 'grid_action_terminate',
                shortcut: true,
                callback: self.terminate,
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Get Link
            {
                type: 'action',
                icon: 'link',
                text: 'grid_action_get_link',
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                shortcut: false,
                permissionKey: 'GET_A_LINK_TO_THE_DOCUMENT',
                callback: self.getLink,
                class: "action-green",
                hide: true,
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Subscribe
            {
                type: 'action',
                icon: 'bell-plus',
                text: 'grid_action_subscribe',
                shortcut: false,
                callback: self.subscribe,
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                class: "action-red",
                hide: true,
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Resend
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_resend',
                shortcut: true,
                callback: self.resend,
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Launch New Distribution Workflow
            {
                type: 'action',
                icon: 'sitemap',
                text: 'grid_action_launch_new_distribution_workflow',
                shortcut: false,
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                callback: self.launchNewDistributionWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
                hide: false, /*As discussed with Mr. Ahmed Abu Al Nassr*/
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Quick Send (Quick Launch)
            {
                type: 'action',
                icon: 'sitemap',
                text: 'grid_action_quick_send',
                shortcut: false,
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
                    "MANAGE_TASKS",
                    "MANAGE_ATTACHMENTS",
                    "MANAGE_LINKED_DOCUMENTS",
                    "MANAGE_LINKED_ENTITIES"
                    // "MANAGE_DESTINATIONS"
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
                        callback: self.manageDestinations,
                        permissionKey: "MANAGE_DESTINATIONS",
                        class: "action-green",
                        hide: true,
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
                            return hasPermission && info.documentClass !== "internal";
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
                showInViewOnly: true,
                checkShow: function (action, model) {
                    var isAllowed = true;
                    if (model.isCorrespondenceApprovedBefore() && model.getInfo().authorizeByAnnotation) {
                        isAllowed = rootEntity.getGlobalSettings().isAllowEditAfterFirstApprove();
                    }

                    return isAllowed && gridService.checkToShowMainMenuBySubMenu(action, model) && !correspondenceService.isLimitedCentralUnitAccess(model);
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
            // Send
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_send',
                shortcut: false,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model) && !correspondenceService.isLimitedCentralUnitAccess(model);
                },
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                permissionKey: [
                    "SEND_LINK_TO_THE_DOCUMENT_BY_EMAIL",
                    "SEND_COMPOSITE_DOCUMENT_BY_EMAIL",
                    "SEND_DOCUMENT_BY_FAX",
                    "SEND_SMS"
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
                        callback: self.sendLinkToDocumentByEmail,
                        class: "action-green",
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
                        callback: self.sendCompositeDocumentAsAttachmentByEmail,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Main Document Fax
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_send_document_by_fax',
                        shortcut: false,
                        hide: true,
                        permissionKey: "SEND_DOCUMENT_BY_FAX",
                        callback: self.sendMainDocumentFax,
                        class: "action-red",
                        checkShow: function (action, model) {
                            return model.canSendByFax();
                        }
                    },
                    // SMS
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'grid_action_send_sms',
                        shortcut: false,
                        hide: false,
                        permissionKey: "SEND_SMS",
                        callback: self.sendSMS,
                        class: "action-red",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            //Edit After Export
            {
                type: 'action',
                icon: 'eraser-variant',
                text: 'grid_action_edit_after_export',
                shortcut: false,
                showInView: true,
                class: 'action-green',
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                callback: self.editAfterExport, //TODO: Service is not available yet
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    var hasPermission = (employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES")
                        || (info.isPaper ? employeeService.hasPermissionTo("EDIT_OUTGOING_PAPER") : employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT")));
                    return hasPermission;
                }
            },
            // Edit (Paper Only)
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit',
                shortcut: false,
                showInView: false,
                hide: true, //TODO: as mentioned by Issawi on 16 Oct, 2018 as we have edit after export enabled for paper document too. (TFS - 17249)
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
                            var info = model.getInfo();
                            return info.isPaper && employeeService.hasPermissionTo("EDIT_OUTGOING_PAPER") && !model.hasActiveSeqWF();
                        }
                    },
                    // Properties
                    {
                        type: 'action',
                        //icon: 'attachment',
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
                        hide: true,
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
                        hide: true,
                        callback: self.duplicateVersion,
                        class: "action-green",
                        showInView: true,
                        permissionKey: 'DUPLICATE_BOOK_FROM_VERSION',
                        disabled: function (model) {
                            return model.isLocked() && !model.isLockedByCurrentUser();
                        },
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

        self.openEmailItem = function () {
            emailItem ? self.viewDocument(emailItem) : null;
        };
        // to open Email item if it exists.
        self.openEmailItem();

        self.refreshGrid = function (time) {
            $timeout(function () {
                $state.is('app.department-inbox.returned') && self.reloadReturnedDepartmentInboxes(self.grid.page, true);
            }, time)
                .then(function () {
                    $state.is('app.department-inbox.returned') && self.refreshGrid(time);
                });
        };
        if (employeeService.getEmployee().getIntervalMin()) {
            self.refreshGrid(employeeService.getEmployee().getIntervalMin());
        }
    });
};
