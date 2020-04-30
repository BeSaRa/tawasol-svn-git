module.exports = function (app) {
    app.controller('reviewOutgoingCtrl', function (lookupService,
                                                   reviewOutgoingService,
                                                   reviewOutgoings,
                                                   $q,
                                                   _,
                                                   $filter,
                                                   generator,
                                                   readyToExportService,
                                                   correspondenceService,
                                                   counterService,
                                                   langService,
                                                   toast,
                                                   dialog,
                                                   $state,
                                                   viewDocumentService,
                                                   employeeService,
                                                   managerService,
                                                   gridService,
                                                   validationService,
                                                   viewTrackingSheetService,
                                                   contextHelpService,
                                                   distributionWFService,
                                                   broadcastService,
                                                   ResolveDefer,
                                                   mailNotificationService,
                                                   userSubscriptionService) {
        'ngInject';
        var self = this;

        self.controllerName = 'reviewOutgoingCtrl';

        contextHelpService.setHelpTo('outgoing-review');
        // employee service to check the permission in html
        self.employeeService = employeeService;

        /**
         * @description All review outgoing emails
         * @type {*}
         */
        self.reviewOutgoings = reviewOutgoings;
        self.reviewOutgoingsCopy = angular.copy(self.reviewOutgoings);

        /**
         * @description Contains the selected review outgoing emails
         * @type {Array}
         */
        self.selectedReviewOutgoings = [];

        self.editInDesktop = function (workItem) {
            return correspondenceService.editWordInDesktop(workItem);
        };

        self.viewInDeskTop = function (workItem) {
            return correspondenceService.viewWordInDesktop(workItem);
        };

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.outgoing.review) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order,
            limitOptions: gridService.getGridLimitOptions(gridService.grids.outgoing.review, self.reviewOutgoings),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.outgoing.review, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.outgoing.review),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.outgoing.review, self.grid.truncateSubject);
            },
            searchColumns: {
                subject: 'docSubject',
                priorityLevel: function (record) {
                    return self.getSortingKey('priorityLevel', 'Lookup');
                },
                securityLevel: function (record) {
                    return self.getSortingKey('securityLevel', 'Lookup');
                },
                creator: function () {
                    return self.getSortingKey('creatorInfo', 'Information');
                },
                createdOn: 'createdOn'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.reviewOutgoings = gridService.searchGridData(self.grid, self.reviewOutgoingsCopy);
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
         * @description Replaces the record in grid after update
         * @param record
         */
        self.replaceRecord = function (record) {
            var index = _.findIndex(self.reviewOutgoings, {'id': record.id});
            if (index > -1)
                self.reviewOutgoings.splice(index, 1, record);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.reviewOutgoings = $filter('orderBy')(self.reviewOutgoings, self.grid.order);
        };

        /**
         * @description Reload the grid of review outgoing email
         * @param pageNumber
         * @return {*|Promise<>}
         */
        self.reloadReviewOutgoings = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return reviewOutgoingService
                .loadReviewOutgoings()
                .then(function (result) {
                    counterService.loadCounters();
                    self.reviewOutgoings = result;
                    self.reviewOutgoingsCopy = angular.copy(self.reviewOutgoings);
                    self.selectedReviewOutgoings = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Remove single review outgoing email
         * @param reviewOutgoing
         * @param $event
         * @param defer
         */
        self.removeReviewOutgoing = function (reviewOutgoing, $event, defer) {
            reviewOutgoingService
                .controllerMethod
                .reviewOutgoingRemove(reviewOutgoing, $event)
                .then(function () {
                    self.reloadReviewOutgoings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Remove multiple selected review outgoing emails
         * @param $event
         */
        self.removeBulkReviewOutgoings = function ($event) {
            reviewOutgoingService
                .controllerMethod
                .reviewOutgoingRemoveBulk(self.selectedReviewOutgoings, $event)
                .then(function () {
                    self.reloadReviewOutgoings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });
        };

        /**
         * @description Launch distribution workflow for selected review outgoing mails
         * @param $event
         */
        self.acceptAndLaunchDistributionWorkflowBulk = function ($event) {
            var contentNotExist = _.filter(self.selectedReviewOutgoings, function (reviewOutgoing) {
                return !reviewOutgoing.hasContent();
            });
            if (contentNotExist.length > 0) {
                dialog.alertMessage(langService.get("content_not_found_bulk"));
                return;
            }
            return correspondenceService
                .launchCorrespondenceWorkflow(self.selectedReviewOutgoings, $event, 'forward', 'favorites')
                .then(function () {
                    self.reloadReviewOutgoings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });
        };

        /**
         * @description Accept for selected review outgoing mails
         * @param $event
         */
        self.acceptOutgoingBulk = function ($event) {
            reviewOutgoingService
                .controllerMethod
                .reviewOutgoingAcceptBulk(self.selectedReviewOutgoings, $event)
                .then(function () {
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.reloadReviewOutgoings(self.grid.page);
                });
        };

        /**
         * @description Reject for selected review outgoing mails
         * @param $event
         */
        self.rejectOutgoingBulk = function ($event) {
            correspondenceService
                .rejectBulkCorrespondences(self.selectedReviewOutgoings, $event)
                .then(function () {
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.reloadReviewOutgoings(self.grid.page);
                });
        };


        self.editProperties = function (reviewOutgoing, $event) {
            // properties to preserve from override.
            var properties = [
                'attachments',
                'linkedEntities',
                'documentComments',
                'linkedDocs',
                'sitesInfoTo',
                'sitesInfoCC'
            ];

            managerService
                .manageDocumentProperties(reviewOutgoing.vsId, reviewOutgoing.docClassName, reviewOutgoing.docSubject, $event)
                .then(function (document) {
                    reviewOutgoing = generator.preserveProperties(properties, reviewOutgoing, document);
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.reloadReviewOutgoings(self.grid.page);
                })
                .catch(function (document) {
                    reviewOutgoing = generator.preserveProperties(properties, reviewOutgoing, document);
                    self.reloadReviewOutgoings(self.grid.page);
                });
        };

        /**
         * @description Edit the outgoing content
         * @param reviewOutgoing
         * @param $event
         */
        self.editContent = function (reviewOutgoing, $event) {
            managerService.manageDocumentContent(reviewOutgoing.vsId, reviewOutgoing.docClassName, reviewOutgoing.docSubject, $event)
                .then(function () {
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                })
        };

        /**
         * @description Accept and launch distribution workflow
         * @param reviewOutgoing
         * @param $event
         * @param defer
         */
        self.acceptAndLaunchDistributionWorkflow = function (reviewOutgoing, $event, defer) {
            if (!reviewOutgoing.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            reviewOutgoing.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadReviewOutgoings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Accept and launch distribution workflow with quick send
         * @param record
         * @param $event
         * @param defer
         */
        self.quickSend = function (record, $event, defer) {
            if (!record.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            record.quickSendLaunchWorkflow($event, 'favorites')
                .then(function () {
                    self.reloadReviewOutgoings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description Archive the review outgoing item
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.archive = function (correspondence, $event, defer) {
            correspondence.archiveDocument($event)
                .then(function () {
                    self.reloadReviewOutgoings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Archive for selected review outgoing correspondence
         * @param $event
         */
        self.archiveBulk = function ($event) {
            correspondenceService
                .archiveBulkCorrespondences(self.selectedReviewOutgoings, $event)
                .then(function () {
                    self.reloadReviewOutgoings(self.grid.page);
                });
        };

        /**
         * @description Reject the outgoing mail
         * @param reviewOutgoing
         * @param $event
         * @param defer
         */
        self.rejectOutgoing = function (reviewOutgoing, $event, defer) {
            reviewOutgoing.rejectDocument($event)
                .then(function () {
                    new ResolveDefer(defer);
                    self.reloadReviewOutgoings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });
        };

        /**
         * @description Accept the review outgoing document
         * @param reviewOutgoing
         * @param $event
         * @param defer
         */
        self.acceptOutgoing = function (reviewOutgoing, $event, defer) {
            reviewOutgoingService.controllerMethod
                .reviewOutgoingAccept(reviewOutgoing, $event)
                .then(function (result) {
                    self.reloadReviewOutgoings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description Subscribe to actions on the workItem
         * @param correspondence
         * @param $event
         */
        self.subscribe = function (correspondence, $event) {
            userSubscriptionService.controllerMethod.openAddSubscriptionDialog(correspondence, $event);
        };

        /**
         * @description View Tracking Sheet
         * @param reviewOutgoing
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (reviewOutgoing, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(reviewOutgoing, params, $event).then(function (result) {

            });
        };

        /**
         * @description Manage Tags
         * @param reviewOutgoing
         * @param $event
         */
        self.manageTags = function (reviewOutgoing, $event) {
            managerService.manageDocumentTags(reviewOutgoing.vsId, reviewOutgoing.docClassName, reviewOutgoing.docSubject, $event)
                .then(function (tags) {
                    reviewOutgoing.tags = tags;
                })
                .catch(function (tags) {
                    reviewOutgoing.tags = tags;
                });
        };

        /**
         * @description Manage Comments
         * @param reviewOutgoing
         * @param $event
         */
        self.manageComments = function (reviewOutgoing, $event) {
            managerService.manageDocumentComments(reviewOutgoing.vsId, reviewOutgoing.docSubject, $event)
                .then(function (documentComments) {
                    reviewOutgoing.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    reviewOutgoing.documentComments = documentComments;
                });
        };

        /**
         * @description Manage Attachments
         * @param reviewOutgoing
         * @param $event
         */
        self.manageAttachments = function (reviewOutgoing, $event) {
            reviewOutgoing.manageDocumentAttachments($event);
        };

        /**
         * @description Manage Linked Entities
         * @param reviewOutgoing
         * @param $event
         */
        self.manageLinkedEntities = function (reviewOutgoing, $event) {
            managerService
                .manageDocumentEntities(reviewOutgoing.vsId, reviewOutgoing.docClassName, reviewOutgoing.docSubject, $event);
        };

        /**
         * @description Manage Linked Documents
         * @param reviewOutgoing
         * @param $event
         */
        self.manageLinkedDocuments = function (reviewOutgoing, $event) {
            var info = reviewOutgoing.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description Security
         * @param reviewOutgoing
         * @param $event
         */
        self.security = function (reviewOutgoing, $event) {
            console.log('manage security : ', reviewOutgoing);
        };

        /**
         * @description Destinations
         * @param reviewOutgoing
         * @param $event
         */
        self.manageDestinations = function (reviewOutgoing, $event) {
            //var info = reviewOutgoing.getInfo();
            managerService.manageDocumentCorrespondence(reviewOutgoing.vsId, reviewOutgoing.docClassName, reviewOutgoing.docSubject, $event);
        };

        /**
         * @description broadcast selected organization and workflow group
         * @param reviewOutgoing
         * @param $event
         * @param defer
         */
        self.broadcast = function (reviewOutgoing, $event, defer) {
            /*broadcastService
             .controllerMethod
             .broadcastSend(reviewOutgoing, $event)
             .then(function () {
             self.reloadReviewOutgoings(self.grid.page);
             })
             .catch(function () {
             self.reloadReviewOutgoings(self.grid.page);
             });*/
            reviewOutgoing
                .correspondenceBroadcast($event)
                .then(function () {
                    self.reloadReviewOutgoings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        })
                })
        };

        /**
         * @description Send To Ready To Export
         * @param model
         * @param $event
         * @param defer
         */
        self.sendToReadyToExport = function (model, $event, defer) {
            if (model.fromCentralArchive())
                return model.sendToCentralArchive(false, $event).then(function () {
                    self.reloadReviewOutgoings(self.grid.page);
                    new ResolveDefer(defer);
                });

            model.sendToReadyToExport($event)
                .then(function () {
                    self.reloadReviewOutgoings(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('export_success'));
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * print Barcode
         * @param model
         * @param $event
         */
        self.printBarcode = function (model, $event) {
            model.barcodePrint(model, $event);
        };


        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var isEditAllowed = employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES");
            if (checkForViewPopup)
                return !isEditAllowed;
            return isEditAllowed;
        };

        var checkIfEditCorrespondenceSiteAllowed = function (model, checkForViewPopup) {
            var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
            if (checkForViewPopup)
                return !(hasPermission);
            return hasPermission;
        };

        /**
         * @description Preview document
         * @param reviewOutgoing
         * @param $event
         */
        self.previewDocument = function (reviewOutgoing, $event) {
            if (!reviewOutgoing.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(reviewOutgoing, self.gridActions, checkIfEditPropertiesAllowed(reviewOutgoing, true), false)
                .then(function () {
                    return self.reloadReviewOutgoings(self.grid.page);
                })
                .catch(function () {
                    return self.reloadReviewOutgoings(self.grid.page);
                });
        };

        /**
         * @description View document
         * @param correspondence
         * @param $event
         */
        self.viewDocument = function (correspondence, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondence.viewFromQueue(self.gridActions, 'reviewOutgoing', $event)
                .then(function () {
                    return self.reloadReviewOutgoings(self.grid.page);
                })
                .catch(function (error) {
                    return self.reloadReviewOutgoings(self.grid.page);
                });
        };

        /**
         * @description get document versions
         * @param correspondence
         * @param $event
         * @return {*}
         */
        self.getDocumentVersions = function (correspondence, $event) {
            return correspondence
                .viewSpecificVersion(self.gridActions, $event);
        };
        /**
         * @description duplicate current version
         * @param correspondence
         * @param $event
         */
        self.duplicateCurrentVersion = function (correspondence, $event) {
            var info = correspondence.getInfo();
            return correspondence
                .duplicateVersion($event)
                .then(function () {
                    $state.go('app.outgoing.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        wobNum: info.wobNum
                    });
                });
        };
        /**
         * @description duplicate specific version
         * @param correspondence
         * @param $event
         * @return {*}
         */
        self.duplicateVersion = function (correspondence, $event) {
            var info = correspondence.getInfo();
            return correspondence
                .duplicateSpecificVersion($event)
                .then(function () {
                    $state.go('app.outgoing.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        wobNum: info.wobNum
                    });
                });
        };

        /**
         * @description Approve the document
         * @param correspondence
         * @param $event
         * @param defer
         * @returns {*}
         */
        self.docActionApprove = function (correspondence, $event, defer) {
            correspondence.approveDocument($event, defer, false)
                .then(function (result) {
                    self.reloadReviewOutgoings(self.grid.page).then(function () {
                        counterService.loadCounters();
                        mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    });
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
                        gridName: 'outgoing-review'
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
                        callback: self.previewDocument,
                        class: "action-green",
                        showInView: false,
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
                        shortcut: false,
                        callback: self.viewDocument,
                        class: "action-green",
                        showInView: false,
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
                        callback: self.getDocumentVersions,
                        permissionKey: "VIEW_DOCUMENT_VERSION",
                        class: "action-green",
                        showInView: true,
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // viewInDeskTop
                    {
                        type: 'action',
                        icon: 'monitor',
                        text: 'grid_action_view_in_desktop',
                        shortcut: false,
                        hide: false,
                        callback: self.viewInDeskTop,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        showInView: false,
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            return !info.isPaper;
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
            // Send To Ready To Export
            {
                type: 'action',
                icon: 'export',
                text: 'grid_action_send_to_ready_to_export',
                shortcut: true,
                callback: self.sendToReadyToExport,
                permissionKey: 'SEND_TO_READY_TO_EXPORT_QUEUE',
                textCallback: function (model) {
                    return model.fromCentralArchive() ? 'grid_action_send_to_central_archive' : 'grid_action_send_to_ready_to_export';
                },
                class: "action-green",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return info.documentClass === 'outgoing' && model.hasContent() && info.isPaper;
                }
            },
            // Remove
            {
                type: 'action',
                icon: 'delete',
                text: 'grid_action_remove',
                shortcut: false,
                permissionKey: "DELETE_OUTGOING",
                callback: self.removeReviewOutgoing,
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Print Barcode
            {
                type: 'action',
                icon: 'barcode-scan',
                text: 'content_action_print_barcode',
                shortcut: true,
                callback: self.printBarcode,
                class: "action-green",
                permissionKey: "PRINT_BARCODE",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return (info.isPaper);
                }
            },
            //Launch Distribution Workflow
            {
                type: 'action',
                icon: 'sitemap',
                text: 'grid_action_accept_launch_distribution_workflow',
                shortcut: true,
                callback: self.acceptAndLaunchDistributionWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
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
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Archive
            {
                type: 'action',
                icon: 'archive',
                text: 'grid_action_archive',
                shortcut: true,
                callback: self.archive,
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Reject
            {
                type: 'action',
                icon: 'close',
                text: 'grid_action_reject',
                shortcut: true,
                callback: self.rejectOutgoing,
                permissionKey: "REJECT_OUTGOING",
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Accept
            {
                type: 'action',
                icon: 'check',
                text: 'grid_action_accept',
                shortcut: true,
                callback: self.acceptOutgoing,
                permissionKey: "ACCEPT_OUTGOING",
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
                }
            },
            // e-Signature
            {
                type: 'action',
                icon: 'check-decagram',
                text: 'grid_action_electronic_approve',
                callback: self.docActionApprove,
                class: "action-green",
                permissionKey: 'ELECTRONIC_SIGNATURE',
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return !info.isPaper;
                }
            },
            // Subscribe
            {
                type: 'action',
                icon: 'bell-plus',
                text: 'grid_action_subscribe',
                callback: self.subscribe,
                class: "action-green",
                hide: false,
                checkShow: function (action, model) {
                    return !model.isBroadcasted();
                }
            },
            // Edit
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit',
                shortcut: false,
                showInView: false,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
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
                            var info = model.getInfo(),
                                hasPermission = (info.isPaper ? employeeService.hasPermissionTo("EDIT_OUTGOING_PAPER") : employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));

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
                    },
                    // editInDeskTop
                    {
                        type: 'action',
                        icon: 'desktop-classic',
                        text: 'grid_action_edit_in_desktop',
                        shortcut: true,
                        hide: false,
                        callback: self.editInDesktop,
                        class: "action-green",
                        showInView: false,
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            var hasPermission = false;
                            if (info.documentClass === 'outgoing') {
                                hasPermission = (info.isPaper ? employeeService.hasPermissionTo("EDIT_OUTGOING_PAPER") : employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
                            } else if (info.documentClass === 'incoming') {
                                hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT");
                            } else if (info.documentClass === 'internal') {
                                hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT");
                            }
                            return !info.isPaper
                                && (info.documentClass !== 'incoming')
                                && model.needApprove()
                                && hasPermission;
                        }
                    }
                ]
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
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "MANAGE_DOCUMENT’S_TAGS",
                    "MANAGE_DOCUMENT’S_COMMENTS",
                    "MANAGE_ATTACHMENTS",
                    "MANAGE_LINKED_ENTITIES",
                    "MANAGE_LINKED_DOCUMENTS",
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
                    // Linked Entities
                    {
                        type: 'action',
                        icon: 'pencil-box-outline',
                        text: 'grid_action_linked_entities',
                        shortcut: false,
                        callback: self.manageLinkedEntities,
                        class: "action-green",
                        permissionKey: "MANAGE_LINKED_ENTITIES",
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
                        //hide: true,
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
                        checkShow: function (action, model) {
                            return checkIfEditCorrespondenceSiteAllowed(model, false);
                        }
                    }
                ]
            },
            // Security
            {
                type: 'action',
                icon: 'security',
                text: 'grid_action_security',
                shortcut: false,
                callback: self.security,
                class: "action-red",
                hide: true,
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Broadcast
            {
                type: 'action',
                icon: 'bullhorn',
                text: 'grid_action_broadcast',
                shortcut: false,
                class: 'action-green',
                permissionKey: 'BROADCAST_DOCUMENT',
                callback: self.broadcast,
                checkShow: function (action, model) {
                    return (!model.needApprove() || model.hasDocumentClass('incoming'))
                        && !model.isBroadcasted()
                        && (model.getSecurityLevelLookup().lookupKey !== 4);
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
                        callback: self.duplicateCurrentVersion,
                        class: "action-green",
                        permissionKey: 'DUPLICATE_BOOK_CURRENT',
                        showInView: true,
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
                        permissionKey: 'DUPLICATE_BOOK_FROM_VERSION',
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            }
        ];

        self.shortcutActions = gridService.getShortcutActions(self.gridActions);
        self.contextMenuActions = gridService.getContextMenuActions(self.gridActions);
    });
};
