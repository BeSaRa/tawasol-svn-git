module.exports = function (app) {
    app.controller('reviewIncomingCtrl', function (lookupService,
                                                   reviewIncomingService,
                                                   reviewIncomings,
                                                   $q,
                                                   _,
                                                   $filter,
                                                   generator,
                                                   counterService,
                                                   langService,
                                                   toast,
                                                   $state,
                                                   dialog,
                                                   viewDocumentService,
                                                   employeeService,
                                                   managerService,
                                                   validationService,
                                                   $timeout,
                                                   viewTrackingSheetService,
                                                   contextHelpService,
                                                   broadcastService,
                                                   correspondenceService,
                                                   ResolveDefer,
                                                   mailNotificationService,
                                                   gridService,
                                                   userSubscriptionService,
                                                   rootEntity,
                                                   configurationService) {
        'ngInject';
        var self = this;

        self.controllerName = 'reviewIncomingCtrl';

        contextHelpService.setHelpTo('incoming-review');
        // employee service to check the permission in html
        self.employeeService = employeeService;

        /**
         * @description All review incoming emails
         * @type {*}
         */
        self.reviewIncomings = reviewIncomings;
        self.reviewIncomingsCopy = angular.copy(self.reviewIncomings);

        /**
         * @description Contains the selected review incoming emails
         * @type {Array}
         */
        self.selectedReviewIncomings = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.incoming.review) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.incoming.review, self.reviewIncomings),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.incoming.review, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.incoming.review),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.incoming.review, self.grid.truncateSubject);
            },
            searchColumns: {
                subject: 'docSubject',
                priorityLevel: function (record) {
                    return self.getSortingKey('priorityLevel', 'Lookup');
                },
                securityLevel: function (record) {
                    return self.getSortingKey('securityLevel', 'Lookup');
                },
                mainSite: function(record){
                    return self.getSortingKey('mainSite', 'Site');
                },
                subSite: function(record){
                    return self.getSortingKey('subSite', 'Site');
                },
                createdOn: 'createdOn'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.reviewIncomings = gridService.searchGridData(self.grid, self.reviewIncomingsCopy);
            }
        };

        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function (property, modelType) {
            var currentLang = langService.current === 'en' ? 'En' : 'Ar';
            if (property === 'mainSite') {
                return 'site.' + 'main' + currentLang + 'SiteText';
            } else if (property === 'subSite') {
                return 'site.' + 'sub' + currentLang + 'SiteText';
            }
            return generator.getColumnSortingKey(property, modelType);
        };

        /**
         * @description Replaces the record in grid after update
         * @param record
         */
        self.replaceRecord = function (record) {
            var index = _.findIndex(self.reviewIncomings, {'id': record.id});
            if (index > -1)
                self.reviewIncomings.splice(index, 1, record);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.reviewIncomings = $filter('orderBy')(self.reviewIncomings, self.grid.order);
        };

        /**
         * @description Reload the grid of review incoming email
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadReviewIncomings = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return reviewIncomingService
                .loadReviewIncomings()
                .then(function (result) {
                    counterService.loadCounters();
                    self.reviewIncomings = result;
                    self.reviewIncomingsCopy = angular.copy(self.reviewIncomings);
                    self.selectedReviewIncomings = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Remove single review incoming email
         * @param reviewIncoming
         * @param $event
         * @param defer
         */
        self.removeReviewIncoming = function (reviewIncoming, $event, defer) {
            reviewIncomingService
                .controllerMethod
                .reviewIncomingRemove(reviewIncoming, $event)
                .then(function () {
                    self.reloadReviewIncomings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Remove multiple selected review incoming emails
         * @param $event
         */
        self.removeBulkReviewIncomings = function ($event) {
            reviewIncomingService
                .controllerMethod
                .reviewIncomingRemoveBulk(self.selectedReviewIncomings, $event)
                .then(function () {
                    self.reloadReviewIncomings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });
        };

        /**
         * @description annotate document
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.annotateDocument = function (correspondence, $event, defer) {
            correspondence.openForAnnotation()
                .then(function () {
                    self.reloadReviewIncomings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                })
                .catch(function () {
                    self.reloadReviewIncomings(self.grid.page);
                });
        };

        /**
         * @description Launch distribution workflow for selected review incoming mails
         * @param $event
         */
        self.acceptAndLaunchDistributionWorkflowBulk = function ($event) {

            var contentNotExist = _.filter(self.selectedReviewIncomings, function (reviewIncoming) {
                return !reviewIncoming.hasContent();
            });
            if (contentNotExist.length > 0) {
                dialog.alertMessage(langService.get("content_not_found_bulk"));
                return;
            }
            return correspondenceService
                .launchCorrespondenceWorkflow(self.selectedReviewIncomings, $event, 'forward', 'favorites')
                .then(function () {
                    self.reloadReviewIncomings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });
        };

        /**
         * @description Accept for selected review incoming mails
         * @param $event
         */
        self.acceptIncomingBulk = function ($event) {
            reviewIncomingService
                .controllerMethod
                .reviewIncomingAcceptBulk(self.selectedReviewIncomings, $event)
                .then(function () {
                    self.reloadReviewIncomings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });
        };

        /**
         * @description Reject for selected review incoming mails
         * @param $event
         */
        self.rejectIncomingBulk = function ($event) {
            correspondenceService
                .rejectBulkCorrespondences(self.selectedReviewIncomings, $event)
                .then(function () {
                    self.reloadReviewIncomings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });
        };


        self.editProperties = function (reviewIncoming, $event) {
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
                .manageDocumentProperties(reviewIncoming.vsId, reviewIncoming.docClassName, reviewIncoming.docSubject, $event)
                .then(function (document) {
                    reviewIncoming = generator.preserveProperties(properties, reviewIncoming, document);
                    self.reloadReviewIncomings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                })
                .catch(function (document) {
                    reviewIncoming = generator.preserveProperties(properties, reviewIncoming, document);
                    self.reloadReviewIncomings(self.grid.page);
                });
        };

        /**
         * @description Edit the outgoing content
         * @param reviewIncoming
         * @param $event
         */
        self.editContent = function (reviewIncoming, $event) {
            managerService.manageDocumentContent(reviewIncoming.vsId, reviewIncoming.docClassName, reviewIncoming.docSubject, $event)
                .then(function () {
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                })
        };

        /**
         * @description Accept and Launch Distribution Workflow
         * @param reviewIncoming
         * @param $event
         * @param defer
         */
        self.acceptAndLaunchDistributionWorkflow = function (reviewIncoming, $event, defer) {

            if (!reviewIncoming.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }

            reviewIncoming.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadReviewIncomings(self.grid.page)
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
                    self.reloadReviewIncomings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description Launch distribution workflow with sequential workflow
         * @param record
         * @param $event
         * @param defer
         */
        self.launchSequentialWorkflow = function (record, $event, defer) {
            if (!record.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            record.openLaunchSequentialWorkflowDialog($event)
                .then(function () {
                    self.reloadReviewIncomings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description Archive the review incoming item
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.archive = function (correspondence, $event, defer) {
            correspondence.archiveDocument($event)
                .then(function () {
                    self.reloadReviewIncomings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Archive for selected review incoming correspondence
         * @param $event
         */
        self.archiveBulk = function ($event) {
            correspondenceService
                .archiveBulkCorrespondences(self.selectedReviewIncomings, $event)
                .then(function () {
                    self.reloadReviewIncomings(self.grid.page);
                });
        };

        /**
         * print Barcode
         * @param model
         * @param $event
         */
        self.printBarcode = function (model, $event) {
            model.barcodePrint(model, $event);
        };


        /**
         * @description Reject the incoming mail
         * @param reviewIncoming
         * @param $event
         * @param defer
         */
        self.rejectIncoming = function (reviewIncoming, $event, defer) {
            reviewIncoming.rejectDocument($event)
                .then(function () {
                    new ResolveDefer(defer);
                    self.reloadReviewIncomings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });
        };

        /**
         * @description Accept the review incoming document
         * @param reviewIncoming
         * @param $event
         * @param defer
         */
        self.acceptIncoming = function (reviewIncoming, $event, defer) {
            reviewIncomingService.controllerMethod
                .reviewIncomingAccept(reviewIncoming, $event)
                .then(function (result) {
                    self.reloadReviewIncomings(self.grid.page)
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
         * @param reviewIncoming
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (reviewIncoming, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(reviewIncoming, params, $event).then(function (result) {

            });
        };

        /**
         * @description Manage Tags
         * @param reviewIncoming
         * @param $event
         */
        self.manageTags = function (reviewIncoming, $event) {
            managerService.manageDocumentTags(reviewIncoming.vsId, reviewIncoming.docClassName, reviewIncoming.docSubject, $event)
                .then(function (tags) {
                    reviewIncoming.tags = tags;
                })
                .catch(function (tags) {
                    reviewIncoming.tags = tags;
                });
        };

        /**
         * @description Manage Comments
         * @param reviewIncoming
         * @param $event
         */
        self.manageComments = function (reviewIncoming, $event) {
            reviewIncoming.manageDocumentComments($event)
                .then(function (documentComments) {
                    reviewIncoming.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    reviewIncoming.documentComments = documentComments;
                });
        };

        /**
         * @description Manage Attachments
         * @param reviewIncoming
         * @param $event
         */
        self.manageAttachments = function (reviewIncoming, $event) {
            reviewIncoming.manageDocumentAttachments($event);
        };

        /**
         * @description Manage Linked Entities
         * @param reviewIncoming
         * @param $event
         */
        self.manageLinkedEntities = function (reviewIncoming, $event) {
            managerService
                .manageDocumentEntities(reviewIncoming.vsId, reviewIncoming.docClassName, reviewIncoming.docSubject, $event);
        };

        /**
         * @description Manage Linked Documents
         * @param reviewIncoming
         * @param $event
         */
        self.manageLinkedDocuments = function (reviewIncoming, $event) {
            var info = reviewIncoming.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description Security
         * @param reviewIncoming
         * @param $event
         */
        self.security = function (reviewIncoming, $event) {
         //   console.log('manage security : ', reviewIncoming);
        };

        /**
         * @description Destinations
         * @param reviewIncoming
         * @param $event
         */
        self.manageDestinations = function (reviewIncoming, $event) {
            managerService.manageDocumentCorrespondence(reviewIncoming.vsId, reviewIncoming.docClassName, reviewIncoming.docSubject, $event)
                .then(function () {
                    self.reloadReviewIncomings(self.grid.page);
                })
        };

        /**
         * @description broadcast selected organization and workflow group
         * @param reviewIncoming
         * @param $event
         * @param defer
         */
        self.broadcast = function (reviewIncoming, $event, defer) {
            reviewIncoming
                .correspondenceBroadcast($event)
                .then(function () {
                    self.reloadReviewIncomings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        })
                })
        };


        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var isEditAllowed = employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES");
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
         * @param reviewIncoming
         * @param $event
         */
        self.previewDocument = function (reviewIncoming, $event) {
            if (!reviewIncoming.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(reviewIncoming, self.gridActions, checkIfEditPropertiesAllowed(reviewIncoming, true), false)
                .then(function () {
                    return self.reloadReviewIncomings(self.grid.page);
                })
                .catch(function () {
                    return self.reloadReviewIncomings(self.grid.page);
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
            correspondence.viewFromQueue(self.gridActions, 'reviewIncoming', $event)
                .then(function () {
                    return self.reloadReviewIncomings(self.grid.page);
                })
                .catch(function (error) {
                    return self.reloadReviewIncomings(self.grid.page);
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
                    $state.go('app.incoming.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        wobNum: info.wobNumber
                    });
                });
        };

        /**
         * @description add Correspondence To My FollowUp
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
                        gridName: 'incoming-review'
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
                        hide: false,
                        callback: self.getDocumentVersions,
                        permissionKey: "VIEW_DOCUMENT_VERSION",
                        class: "action-green",
                        showInView: true,
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
            // Add To
            {
                type: 'action',
                icon: 'plus',
                text: 'grid_action_add_to',
                class: "action-green",
                permissionKey: [
                    'USER_FOLLOWUP_BOOKS',
                    'ADMIN_USER_FOLLOWUP_BOOKS'
                ],
                checkAnyPermission: true,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                subMenu: [
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
            // Remove
            {
                type: 'action',
                icon: 'delete',
                text: 'grid_action_remove',
                shortcut: false,
                permissionKey: 'DELETE_INCOMING',
                callback: self.removeReviewIncoming,
                class: "action-green",
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
                    return true;
                }
            },
            // Accept and Launch Distribution Workflow
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
                    return rootEntity.hasPSPDFViewer() && !model.hasActiveSeqWF() && !model.isCorrespondenceApprovedBefore() && !model.isBroadcasted();
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
                callback: self.rejectIncoming,
                permissionKey: "REJECT_INCOMING",
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
                callback: self.acceptIncoming,
                permissionKey: "ACCEPT_INCOMING",
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
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
                permissionKey: [
                    "EDIT_INCOMING’S_CONTENT",
                    "EDIT_INCOMING’S_PROPERTIES"
                ],
                checkAnyPermission: true,
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
                        permissionKey: "EDIT_INCOMING’S_CONTENT",
                        checkShow: function (action, model) {
                            return true;
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
                        permissionKey: "EDIT_INCOMING’S_PROPERTIES",
                        checkShow: function (action, model) {
                            return true;
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
                        permissionKey: "MANAGE_LINKED_ENTITIES",
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
                    return (model.getSecurityLevelLookup().lookupKey !== 4) && !model.hasActiveSeqWF();
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
                    "DUPLICATE_BOOK_FROM_VERSION"
                ],
                checkAnyPermission: true,
                subMenu: [
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
