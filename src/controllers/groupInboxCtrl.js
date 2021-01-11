module.exports = function (app) {
    app.controller('groupInboxCtrl', function (langService,
                                               $q,
                                               $filter,
                                               userInboxService,
                                               ResolveDefer,
                                               generator,
                                               correspondenceService,
                                               $state,
                                               toast,
                                               errorCode,
                                               _,
                                               dialog,
                                               rootEntity,
                                               counterService,
                                               viewDocumentService,
                                               managerService,
                                               $window,
                                               tokenService,
                                               contextHelpService,
                                               userFolderService,
                                               readyToExportService,
                                               viewTrackingSheetService,
                                               downloadService,
                                               employeeService,
                                               favoriteDocumentsService,
                                               Information,
                                               mailNotificationService,
                                               workItems,
                                               emailItem,
                                               gridService,
                                               $timeout,
                                               sequentialWorkflowService) {
        'ngInject';
        var self = this;
        self.controllerName = 'groupInboxCtrl';
        // selected workItems
        self.selectedWorkItems = [];
        // langService
        self.langService = langService;

        self.workItems = workItems;
        self.workItemsCopy = angular.copy(self.workItems);
        self.psPDFViewerEnabled = rootEntity.hasPSPDFViewer();

        contextHelpService.setHelpTo('group-inbox');

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
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.inbox.group) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.inbox.group, self.workItems),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.inbox.group, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.inbox.group),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.inbox.group, self.grid.truncateSubject);
            },
            searchColumns: {
                serial: 'generalStepElm.docFullSerial',
                subject: 'generalStepElm.docSubject',
                receivedDateTime: 'receivedDateTime',
                action: function (record) {
                    return self.getSortingKey('action', 'WorkflowAction');
                },
                sender: function (record) {
                    return self.getSortingKey('senderInfo', 'SenderInfo');
                },
                corrSite: function (record) {
                    return self.getSortingKey('mainSiteSubSiteString', 'Information');
                },
                //dueDate: 'generalStepElm.dueDate'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.workItems = gridService.searchGridData(self.grid, self.workItemsCopy);
            }
        };

        /**
         * @description Contains methods for Star operations for user inbox items
         */
        self.starServices = {
            'false': userInboxService.controllerMethod.userInboxStar,
            'true': userInboxService.controllerMethod.userInboxUnStar,
            'starBulk': userInboxService.controllerMethod.userInboxStarBulk,
            'unStarBulk': userInboxService.controllerMethod.userInboxUnStarBulk
        };

        /**
         * @description Terminate User Inbox Item
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.terminate = function (userInbox, $event, defer) {
            if (userInbox.isLocked() && !userInbox.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(userInbox, null));
                return;
            }
            // BeSara:  i used the same service for inbox to terminate till check with Issawi.
            userInboxService
                .controllerMethod
                .userInboxTerminate(userInbox, $event)
                .then(function () {
                    self.reloadGroupInbox(self.grid.page)
                        .then(function () {
                            toast.success(langService.get("terminate_specific_success").change({name: userInbox.getTranslatedName()}));
                            // to resolve the defer com from correspondence view.
                            new ResolveDefer(defer);
                        });
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
                    self.reloadGroupInbox(self.grid.page);
                    new ResolveDefer(defer);
                });
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.workItems = $filter('orderBy')(self.workItems, self.grid.order);
        };

        /**
         * @description reload group Inbox grid
         */
        self.reloadGroupInbox = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return correspondenceService
                .loadGroupInbox()
                .then(function (workItems) {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.workItems = workItems;
                    self.workItemsCopy = angular.copy(self.workItems);
                    self.selectedWorkItems = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return self.workItems;
                });
        };
        /**
         * @description terminate bulk group inbox
         */
        self.terminateBulk = function ($event) {
            correspondenceService
                .terminateBulkWorkItem(self.selectedWorkItems, $event)
                .then(function () {
                    self.reloadGroupInbox(self.grid.page);
                });
        };

        /**
         * @description Launch distribution workflow for selected work items
         * @param $event
         */
        self.forwardBulk = function ($event) {
            /*var selectedItems = angular.copy(self.selectedWorkItems);
            if (!self.checkIfForwardBulkAvailable()) {
                if (self.itemsAlreadyBroadCasted.length === selectedItems.length) {
                    dialog.alertMessage(langService.get('selected_items_are_broadcasted_can_not_forward'));
                    return false;
                }
                dialog.confirmMessage(langService.get('some_items_are_broadcasted_skip_and_forward'), null, null, $event).then(function () {
                    self.selectedWorkItems = selectedItems = _.filter(self.selectedWorkItems, function (workItem) {
                        return self.itemsAlreadyBroadCasted.indexOf(workItem.generalStepElm.vsId) === -1;
                    });
                    if (self.selectedWorkItems.length)
                        forwardBulk(selectedItems, $event);
                })
            } else {
                forwardBulk(selectedItems, $event);
            }*/
            forwardBulk(self.selectedWorkItems, $event);
        };

        function forwardBulk(selectedItems, $event) {
            return correspondenceService
                .launchCorrespondenceWorkflow(selectedItems, $event, 'forward', 'favorites')
                .then(function () {
                    self.reloadGroupInbox(self.grid.page);
                });
        }

        self.checkIfForwardBulkAvailable = function () {
            return _.every(self.selectedWorkItems, function (item) {
                return !item.hasActiveSeqWF();
            });
        };

        /**
         * @description Create Reply
         * @param workItem
         * @param $event
         * @param defer
         */
        self.createReply = function (workItem, $event, defer) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            workItem.createReply($event, false)
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
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
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
         * @description Forward
         * @param workItem
         * @param $event
         * @param defer
         */
        self.forward = function (workItem, $event, defer) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            workItem.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadGroupInbox(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Launch Distribution Workflow with quick send
         * @param workItem
         * @param $event
         * @param defer
         */
        self.quickSend = function (workItem, $event, defer) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            workItem.quickSendLaunchWorkflow($event, 'favorites')
                .then(function () {
                    self.reloadGroupInbox(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description Reply
         * @param workItem
         * @param $event
         * @param defer
         */
        self.reply = function (workItem, $event, defer) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            workItem.replySimple($event, 'reply')
                .then(function () {
                    self.reloadGroupInbox(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Launch distribution workflow with sequential workflow
         * @param workItem
         * @param $event
         * @param defer
         */
        self.launchSequentialWorkflow = function (workItem, $event, defer) {
            workItem.openLaunchSequentialWorkflowDialog($event)
                .then(function () {
                    self.reloadGroupInbox(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
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
                    self.reloadGroupInbox(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        })
                })
        };

        /**
         * @description Change the starred for user inbox
         * @param workItem
         * @param $event
         */
        self.changeStar = function (workItem, $event) {
            /*workItem.toggleStar().then(function () {
                self.reloadGroupInbox(self.grid.page);
            });*/
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            self.starServices[workItem.generalStepElm.starred](workItem)
                .then(function (result) {
                    if (result) {
                        self.reloadGroupInbox(self.grid.page)
                            .then(function () {
                                if (!workItem.generalStepElm.starred)
                                    toast.success(langService.get("star_specific_success").change({name: workItem.getTranslatedName()}));
                                else
                                    toast.success(langService.get("unstar_specific_success").change({name: workItem.getTranslatedName()}));
                            });
                    } else {
                        dialog.errorMessage(langService.get('something_happened_when_update_starred'));
                    }
                })
                .catch(function () {
                    dialog.errorMessage(langService.get('something_happened_when_update_starred'));
                });
        };


        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var info = model.getInfo();
            var hasPermission = false;
            if (info.documentClass === "internal") {
                //If approved internal electronic, don't allow to edit
                if (info.docStatus >= 24 && !info.isPaper)
                    hasPermission = false;
                else
                    hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES");
            } else if (info.documentClass === "incoming")
                hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES");
            else if (info.documentClass === "outgoing") {
                //If approved outgoing electronic, don't allow to edit
                if (info.docStatus >= 24 && !info.isPaper)
                    hasPermission = false;
                else
                    hasPermission = employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES");
            }
            if (checkForViewPopup)
                return !hasPermission || model.isBroadcasted();
            return hasPermission && !model.isBroadcasted();
        };


        var checkIfEditCorrespondenceSiteAllowed = function (model, checkForViewPopup) {
            var info = model.getInfo();
            var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
            var allowed = (hasPermission && info.documentClass !== "internal");
            if (checkForViewPopup)
                return !(allowed);
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
            correspondenceService.viewCorrespondenceGroupMail(workItem, self.gridActions, checkIfEditPropertiesAllowed(workItem, true), checkIfEditCorrespondenceSiteAllowed(workItem, true))
                .then(function () {
                    correspondenceService.unlockWorkItem(workItem, true, $event).then(function () {
                        return self.reloadGroupInbox(self.grid.page);
                    });
                })
                .catch(function (error) {
                    if (error !== 'itemLocked')
                        return self.reloadGroupInbox(self.grid.page);
                });
        };

        /**
         * @description View document
         * @param workItem
         * @param $event
         */
        self.viewDocument = function (workItem, $event) {
            var info = workItem.getInfo();
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }

            if (info.hasActiveSeqWF && info.docStatus < 24 && self.psPDFViewerEnabled) {
                return workItem.openSequentialDocument()
                    .then(function () {
                        self.reloadGroupInbox(self.grid.page);
                    })
                    .catch(function () {
                        self.reloadGroupInbox(self.grid.page);
                    });
            }

            workItem.viewNewGroupMailDocument(self.gridActions, 'groupMail', $event)
                .then(function () {
                    correspondenceService.unlockWorkItem(workItem, true, $event).then(function () {
                        return self.reloadGroupInbox(self.grid.page);
                    });
                })
                .catch(function (error) {
                    if (error !== 'itemLocked')
                        return self.reloadGroupInbox(self.grid.page);
                });
        };

        /**
         * @description View Tracking Sheet
         * @param workItem
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (workItem, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(workItem, params, $event)
                .then(function (result) {
                });
        };

        /**
         * @description Manage Tags
         * @param workItem
         * @param $event
         */
        self.manageTags = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            var info = workItem.getInfo();
            managerService.manageDocumentTags(info.vsId, info.documentClass, workItem.getTranslatedName(), $event)
                .then(function () {
                    self.reloadGroupInbox(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadGroupInbox(self.grid.page);
                });
        };

        /**
         * @description Manage Comments
         * @param workItem
         * @param $event
         */
        self.manageComments = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            var info = workItem.getInfo();
            workItem.manageDocumentComments($event)
                .then(function () {
                    self.reloadGroupInbox(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadGroupInbox(self.grid.page);
                });
        };

        /**
         *@description reset workflow
         * @param workItem
         * @param $event
         */
        self.resetWorkflow = function (workItem, $event) {
            sequentialWorkflowService.resetSeqWF(workItem, $event)
                .then(function (result) {
                    toast.success(langService.get('success_reset_seq_wf'));
                    self.reloadGroupInbox(self.grid.page);
                    dialog.cancel();
                })
        };

        /**
         * @description Manage Tasks
         * @param workItem
         * @param $event
         */
        self.manageTasks = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            //  console.log('manageUserInboxTasks : ', workItem);
        };

        /**
         * @description Manage Attachments
         * @param workItem
         * @param $event
         */
        self.manageAttachments = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            workItem.manageDocumentAttachments($event);
        };

        /**
         * @description Manage Linked Documents
         * @param workItem
         * @param $event
         */
        self.manageLinkedDocuments = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            var info = workItem.getInfo();
            managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass, "welcome")
                .then(function () {
                    self.reloadGroupInbox(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadGroupInbox(self.grid.page);
                });
        };

        /**
         * @description Manage Linked Entities
         * @param workItem
         * @param $event
         */
        self.manageLinkedEntities = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            var info = workItem.getInfo();
            managerService
                .manageDocumentEntities(info.vsId, info.documentClass, info.title, $event);
        };

        /**
         * @description Destinations
         * @param workItem
         * @param $event
         */
        self.manageDestinations = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            var info = workItem.getInfo();
            managerService.manageDocumentCorrespondence(info.vsId, info.documentClass, info.title, $event)
        };

        /**
         * @description Export user inbox (export to ready to export)
         * @param workItem
         * @param $event
         * @param defer
         */
        self.sendWorkItemToReadyToExport = function (workItem, $event, defer) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            workItem.sendToReadyToExport($event).then(function () {
                self.reloadGroupInbox(self.grid.page)
                    .then(function () {
                        toast.success(langService.get('export_success'));
                        new ResolveDefer(defer);
                    });
            })
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
         * @param workItem
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }

            workItem
                .getMainDocumentEmailContent($event);
        };

        /**
         * @description Send Composite Document As Attachment By Email
         * @param workItem
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            workItem
                .getCompositeDocumentEmailContent($event);
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
         * @description Send Main Document Fax
         * @param workItem
         * @param $event
         */
        self.sendMainDocumentFax = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            //  console.log('sendMainDocumentFax : ', workItem);
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
         * @description Sign e-Signature
         * @param workItem
         * @param $event
         * @param defer
         */
        self.signESignature = function (workItem, $event, defer) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            userInboxService
                .controllerMethod
                .userInboxSignaturePopup(workItem, false, $event)
                .then(function (result) {
                    if (result)
                        self.reloadGroupInbox(self.grid.page)
                            .then(function () {
                                toast.success(langService.get('sign_specific_success').change({name: workItem.getTranslatedName()}));
                                new ResolveDefer(defer);
                            });
                })
                .catch(function (error) {
                    errorCode.checkIf(error, 'AUTHORIZE_FAILED', function () {
                        dialog.errorMessage(langService.get('authorize_failed'))
                    })
                });
        };

        /**
         * @description Sign Digital Signature
         * @param workItem
         * @param $event
         * @param defer
         */
        self.signDigitalSignature = function (workItem, $event, defer) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            //   console.log('signDigitalSignature : ', workItem);
        };

        /**
         * @description Edit Content
         * @param workItem
         * @param $event
         */
        self.editContent = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            workItem.manageDocumentContent($event);
        };

        /**
         * @description Edit Properties
         * @param workItem
         * @param $event
         */
        self.editProperties = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            var info = workItem.getInfo();
            managerService
                .manageDocumentProperties(info.vsId, info.documentClass, info.title, $event)
                .finally(function () {
                    self.reloadGroupInbox(self.grid.page)
                });
        };

        /**
         * @description Replaces the record in grid after update
         * @param record
         */
        self.replaceRecord = function (record) {
            var index = _.findIndex(self.workItems, function (workItem) {
                return workItem.generalStepElm.vsId === record.generalStepElm.vsId;
            });
            if (index > -1)
                self.workItems.splice(index, 1, record);
            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
        };
        /**
         * @description Mark item as read/unread
         * @param workItem
         * @param $event
         */
        self.markAsReadUnread = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            return workItem.markAsReadUnread($event, true)
                .then(function (result) {
                    self.replaceRecord(result);
                    counterService.loadCounters();
                })
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
         * @description Unlocks the workItem
         * @param workItem
         * @param $event
         * @returns {*}
         */
        self.unlockWorkItem = function (workItem, $event) {
            return workItem.unlockWorkItem($event)
                .then(function (result) {
                    if (result)
                        self.reloadGroupInbox(self.grid.page);
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
                    self.reloadGroupInbox(self.grid.page);
                });
        };

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
                        gridName: 'group-inbox'
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
                        disabled: function (model) {
                            return model.isLocked() && !model.isLockedByCurrentUser();
                        },
                        permissionKey: 'VIEW_DOCUMENT',
                        showInView: false,
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
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        showInView: false,
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
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Add To
            {
                type: 'action',
                icon: 'plus',
                text: 'grid_action_add_to',
                class: "action-green",
                permissionKey: [
                    //'', // folder
                    //'MANAGE_FAVORITE',
                    'ICN_ENTRY_TEMPLATE'
                ],
                checkAnyPermission: true,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                subMenu: [
                    // Add To Folder
                    {
                        type: 'action',
                        icon: 'folder-plus',
                        text: 'grid_action_to_folder',
                        shortcut: false,
                        callback: self.addToFolder,
                        class: "action-green",
                        hide: true,
                        disabled: function (model) {
                            return model.isLocked() && !model.isLockedByCurrentUser();
                        },
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Add To Favorite
                    {
                        type: 'action',
                        icon: 'star',
                        text: 'grid_action_to_favorite',
                        permissionKey: "MANAGE_FAVORITE",
                        shortcut: false,
                        callback: self.addToFavorite,
                        hide: true,
                        disabled: function (model) {
                            return model.isLocked() && !model.isLockedByCurrentUser();
                        },
                        class: "action-green",
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
                    }
                ]
            },
            // Create Reply
            {
                type: 'action',
                icon: 'pen',
                text: 'grid_action_create_reply',
                shortcut: false,
                callback: self.createReply,
                class: "action-green",
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    // if docFullSerial exists, its either paper or electronic approved document
                    return model.checkCreateReplyPermission() && !!info.docFullSerial;
                }
            },
            // Create Reply For Specific Version
            {
                type: 'action',
                icon: 'pen',
                text: 'grid_action_create_reply_specific_version',
                callback: self.createReplySpecificVersion,
                class: "action-green",
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    // if docFullSerial exists, its either paper or electronic approved document
                    return model.checkCreateReplyPermission(true) && !!info.docFullSerial;
                }
            },
            // Forward
            {
                type: 'action',
                icon: 'share',
                text: 'grid_action_forward',
                shortcut: true,
                callback: self.forward,
                class: "action-green",
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
            // Launch Sequential Workflow
            {
                type: 'action',
                icon: gridService.gridIcons.actions.sequentialWF,
                text: 'grid_action_launch_sequential_workflow',
                callback: self.launchSequentialWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_SEQ_WF',
                checkShow: function (action, model) {
                    return rootEntity.hasPSPDFViewer() && !model.hasActiveSeqWF()
                        && !model.isCorrespondenceApprovedBefore() && !model.isComposite()
                        && !model.isBroadcasted();
                }
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
                    return (!model.needApprove() || model.hasDocumentClass('incoming')) && !model.isBroadcasted() && (model.getSecurityLevelLookup().lookupKey !== 4)
                        && !model.hasActiveSeqWF();
                }
            },
            // Reply
            {
                type: 'action',
                icon: 'reply',
                text: 'grid_action_reply',
                shortcut: false,
                callback: self.reply,
                class: "action-green",
                hide: true,
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    return !model.hasActiveSeqWF();
                }
            },
            // Get Link
            {
                type: 'action',
                icon: 'link',
                text: 'grid_action_get_link',
                shortcut: false,
                permissionKey: 'GET_A_LINK_TO_THE_DOCUMENT',
                callback: self.getLink,
                class: "action-green",
                hide: true,
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
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
                class: "action-red",
                hide: true,
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Export (Send to ready to export)
            {
                type: 'action',
                icon: 'export',
                text: 'grid_action_send_to_ready_to_export',
                shortcut: true,
                callback: self.sendWorkItemToReadyToExport,
                class: "action-green",
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                permissionKey: 'SEND_TO_READY_TO_EXPORT_QUEUE',
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return info.isPaper && info.documentClass === 'outgoing' && (info.docStatus <= 22) && !model.hasActiveSeqWF();
                }
            },
            // Reset Workflow
            {
                type: 'action',
                icon: 'playlist-remove',
                text: 'reset_seq_wf',
                permissionKey: "MULTI_SIGNATURE_RESET",
                callback: self.resetWorkflow,
                class: "action-green",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    if (info.documentClass === 'incoming') {
                        return false;
                    }

                    return model.hasActiveSeqWF() ||
                        (!info.isPaper && info.docStatus === 23);
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
                subMenu: viewTrackingSheetService.getViewTrackingSheetOptions('grid', gridService.grids.inbox.group)
            },
            // View Tracking Sheet (Shortcut Only)
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view_tracking_sheet',
                shortcut: true,
                onlyShortcut: true,
                showInView: false,
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: function (action, model) {
                    return true;
                },
                callback: self.viewTrackingSheet,
                params: ['view_tracking_sheet', 'tabs']
            },
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                shortcut: false,
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
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                showInView: false,
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
                        hide: false,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return checkIfEditCorrespondenceSiteAllowed(model, false);
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
                        callback: self.viewDirectLinkedDocuments,
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
                        callback: self.viewCompleteLinkedDocuments,
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
                text: 'grid_action_send',
                shortcut: false,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "SEND_LINK_TO_THE_DOCUMENT_BY_EMAIL",
                    "SEND_COMPOSITE_DOCUMENT_BY_EMAIL",
                    "SEND_DOCUMENT_BY_FAX",
                    "SEND_SMS"
                ],
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
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
                    // send Document by Fax
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
                        permissionKey: "SEND_SMS",
                        callback: self.sendSMS,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Sign(Approve)
            {
                type: 'action',
                icon: 'pencil-lock',
                text: 'grid_action_approve',//signature
                shortcut: false,
                hide: true,
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    if (model.hasActiveSeqWF()) {
                        return false;
                    }
                    //addMethod = 0 (Electronic/Digital) - show the button
                    //addMethod = 1 (Paper) - hide the button

                    // If outgoing or internal, show the button

                    /*If document is unapproved or partially approved, show the button. If fully approved, hide the button.
                     docStatus = 24 is approved
                     */
                    var info = model.getInfo();
                    return !info.isPaper
                        && model.checkElectronicSignaturePermission()
                        && model.needApprove()
                        && gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "ELECTRONIC_SIGNATURE",
                    "ELECTRONIC_SIGNATURE_MEMO"
                    // "DIGITAL_SIGNATURE"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // e-Signature
                    {
                        type: 'action',
                        //icon: 'link-variant',
                        text: 'grid_action_electronic',//e_signature
                        shortcut: false,
                        callback: self.signESignature,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Digital Signature
                    {
                        type: 'action',
                        icon: 'draw',
                        text: 'grid_action_digital',//digital_signature
                        shortcut: false,
                        callback: self.signDigitalSignature,
                        class: "action-red",
                        permissionKey: "DIGITAL_SIGNATURE",
                        hide: true,
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Edit
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit',
                shortcut: false,
                showInView: false,
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model) && !model.isBroadcasted();
                },
                subMenu: [
                    // Content
                    {
                        type: 'action',
                        icon: 'pencil-box',
                        //text: 'grid_action_content',
                        text: function () {
                            return {
                                contextText: 'grid_action_content',
                                shortcutText: 'grid_action_edit_content'
                            };
                        },
                        shortcut: false,
                        callback: self.editContent,
                        class: "action-green",
                        checkShow: function (action, model) {
                            var info = model.getInfo(), isAllowed = true;
                            if (model.hasActiveSeqWF()) {
                                return false;
                            }
                            if (model.isCorrespondenceApprovedBefore()) {
                                isAllowed = rootEntity.getGlobalSettings().isAllowEditAfterFirstApprove();
                            }
                            if (!isAllowed || info.docStatus >= 24) {
                                return false;
                            }
                            var hasPermission = false;
                            if (info.documentClass === "internal")
                                hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT");
                            else if (info.documentClass === "incoming")
                                hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT");
                            else if (info.documentClass === "outgoing") {
                                hasPermission = (info.isPaper ? employeeService.hasPermissionTo("EDIT_OUTGOING_PAPER") : employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
                            }

                            return hasPermission;
                        }
                    },
                    // Properties
                    {
                        type: 'action',
                        icon: 'pencil',
                        //text: 'grid_action_properties',
                        text: function () {
                            return {
                                contextText: 'grid_action_properties',
                                shortcutText: 'grid_action_edit_properties'
                            };
                        },
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

        self.openEmailItem = function () {
            emailItem ? self.viewDocument(emailItem) : null;
        };
        // to open Email item if it exists.
        self.openEmailItem();

        self.refreshGrid = function (time) {
            $timeout(function () {
                $state.is('app.inbox.group-inbox') && self.reloadGroupInbox(self.grid.page);
            }, time)
                .then(function () {
                    $state.is('app.inbox.group-inbox') && self.refreshGrid(time);
                });
        };

        if (employeeService.getEmployee().getIntervalMin()) {
            self.refreshGrid(employeeService.getEmployee().getIntervalMin());
        }
    });
};
