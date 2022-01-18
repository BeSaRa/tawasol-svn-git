module.exports = function (app) {
    app.controller('rejectedOutgoingCtrl', function (lookupService,
                                                     rejectedOutgoingService,
                                                     rejectedOutgoings,
                                                     $q,
                                                     _,
                                                     $filter,
                                                     counterService,
                                                     langService,
                                                     generator,
                                                     toast,
                                                     $state,
                                                     dialog,
                                                     viewDocumentService,
                                                     managerService,
                                                     validationService,
                                                     employeeService,
                                                     viewTrackingSheetService,
                                                     contextHelpService,
                                                     correspondenceService,
                                                     ResolveDefer,
                                                     mailNotificationService,
                                                     rootEntity,
                                                     gridService) {
        'ngInject';
        var self = this;

        self.controllerName = 'rejectedOutgoingCtrl';

        contextHelpService.setHelpTo('outgoing-rejected');
        // employee service to check the permission in html
        self.employeeService = employeeService;
        /**
         * @description All rejected outgoing mails
         * @type {*}
         */
        self.rejectedOutgoings = rejectedOutgoings;
        self.rejectedOutgoingsCopy = angular.copy(self.rejectedOutgoings);
        self.isInternalOutgoingEnabled = rootEntity.isInternalOutgoingEnabled();

        /**
         * @description Contains the selected rejected outgoing mails
         * @type {Array}
         */
        self.selectedRejectedOutgoings = [];

        self.editInDesktop = function (workItem) {
            correspondenceService.editWordInDesktop(workItem);
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
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.outgoing.rejected) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.outgoing.rejected, self.rejectedOutgoings),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.outgoing.rejected, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.outgoing.rejected),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.outgoing.rejected, self.grid.truncateSubject);
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
                self.rejectedOutgoings = gridService.searchGridData(self.grid, self.rejectedOutgoingsCopy);
            }
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.rejectedOutgoings = $filter('orderBy')(self.rejectedOutgoings, self.grid.order);
        };

        /**
         * @description Reload the grid of rejected outgoing mail
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadRejectedOutgoings = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return rejectedOutgoingService
                .loadRejectedOutgoings()
                .then(function (result) {
                    counterService.loadCounters();
                    self.rejectedOutgoings = result;
                    self.rejectedOutgoingsCopy = angular.copy(self.rejectedOutgoings);
                    self.selectedRejectedOutgoings = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
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
         * @description Remove single rejected outgoing mail
         * @param rejectedOutgoing
         * @param $event
         * @param defer
         */
        self.removeRejectedOutgoing = function (rejectedOutgoing, $event, defer) {
            rejectedOutgoingService
                .controllerMethod
                .rejectedOutgoingRemove(rejectedOutgoing, $event)
                .then(function () {
                    self.reloadRejectedOutgoings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        })
                    ;
                });
        };

        /**
         * @description Remove multiple selected rejected outgoing mails
         * @param $event
         */
        self.removeBulkRejectedOutgoings = function ($event) {
            rejectedOutgoingService
                .controllerMethod
                .rejectedOutgoingRemoveBulk(self.selectedRejectedOutgoings, $event)
                .then(function () {
                    self.reloadRejectedOutgoings(self.grid.page);
                });
        };

        /*/!**
         * @description Change the status of rejected outgoing mail
         * @param rejectedOutgoing
         *!/
        self.changeStatusRejectedOutgoing = function (rejectedOutgoing) {
            self.statusServices[rejectedOutgoing.status](rejectedOutgoing)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    rejectedOutgoing.status = !rejectedOutgoing.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /!**
         * @description Change the status of selected rejected outgoing mails
         * @param status
         *!/
        self.changeStatusBulkRejectedOutgoings = function (status) {
            self.statusServices[status](self.selectedRejectedOutgoings)
                .then(function () {
                    self.reloadRejectedOutgoings(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('selected_status_updated'));
                        });
                });
        };*/


        /**
         * @description Launch distribution workflow for selected rejected outgoing mails
         * @param $event
         */
        self.launchDistributionWorkflowBulk = function ($event) {
            var contentNotExist = _.filter(self.selectedRejectedOutgoings, function (rejectedOutgoing) {
                return !rejectedOutgoing.hasContent();
            });
            if (contentNotExist.length > 0) {
                dialog.alertMessage(langService.get("content_not_found_bulk"));
                return;
            }
            return correspondenceService
                .launchCorrespondenceWorkflow(self.selectedRejectedOutgoings, $event, 'forward', 'favorites')
                .then(function () {
                    self.reloadRejectedOutgoings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });
        };

        /**
         * @description Archive for selected rejected outgoing mails
         * @param $event
         */
        self.archiveBulk = function ($event) {
            correspondenceService
                .archiveBulkCorrespondences(self.selectedRejectedOutgoings, $event)
                .then(function () {
                    self.reloadRejectedOutgoings(self.grid.page);
                });
        };

        /**
         * @description Send to review for selected rejected outgoing mails
         * @param $event
         */
        self.sendToReviewBulk = function ($event) {
            rejectedOutgoingService
                .controllerMethod
                .rejectedOutgoingSendToReviewBulk(self.selectedRejectedOutgoings, $event)
                .then(function () {
                    self.reloadRejectedOutgoings(self.grid.page);
                });
        };


        self.editProperties = function (rejectedOutgoing, $event) {
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
                .manageDocumentProperties(rejectedOutgoing.vsId, rejectedOutgoing.docClassName, rejectedOutgoing.docSubject, $event)
                .then(function (document) {
                    rejectedOutgoing = generator.preserveProperties(properties, rejectedOutgoing, document);
                    self.reloadRejectedOutgoings(self.grid.page);
                })
                .catch(function (document) {
                    rejectedOutgoing = generator.preserveProperties(properties, rejectedOutgoing, document);
                    self.reloadRejectedOutgoings(self.grid.page);
                });
        };

        /**
         * @description Edit the outgoing content
         * @param rejectedOutgoing
         * @param $event
         */
        self.editContent = function (rejectedOutgoing, $event) {
            managerService.manageDocumentContent(rejectedOutgoing.vsId, rejectedOutgoing.docClassName, rejectedOutgoing.docSubject, $event)
        };

        /**
         * @description Launch Distribution Workflow for the rejected outgoing item
         * @param rejectedOutgoing
         * @param $event
         * @param defer
         */
        self.launchDistributionWorkflow = function (rejectedOutgoing, $event, defer) {
            if (!rejectedOutgoing.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }

            rejectedOutgoing.recordGridName = gridService.grids.outgoing.rejected;
            rejectedOutgoing.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadRejectedOutgoings(self.grid.page)
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
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            record.recordGridName = gridService.grids.outgoing.rejected;
            record.quickSendLaunchWorkflow($event, 'favorites')
                .then(function () {
                    self.reloadRejectedOutgoings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description Archive the rejected outgoing item
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.archive = function (correspondence, $event, defer) {
            correspondence.archiveDocument($event)
                .then(function () {
                    self.reloadRejectedOutgoings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Send the rejected outgoing to review
         * @param rejectedOutgoing
         * @param $event
         * @param defer
         */
        self.sendToReview = function (rejectedOutgoing, $event, defer) {
            rejectedOutgoingService.controllerMethod
                .rejectedOutgoingSendToReview(rejectedOutgoing, $event)
                .then(function (result) {
                    self.reloadRejectedOutgoings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        })
                    ;
                })
        };

        /**
         * @description View Tracking Sheet
         * @param rejectedOutgoing
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (rejectedOutgoing, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(rejectedOutgoing, params, $event).then(function (result) {
            });
        };

        /**
         * @description Manage Tags
         * @param rejectedOutgoing
         * @param $event
         */
        self.manageTags = function (rejectedOutgoing, $event) {
            managerService.manageDocumentTags(rejectedOutgoing.vsId, rejectedOutgoing.docClassName, rejectedOutgoing.docSubject, $event)
                .then(function (tags) {
                    rejectedOutgoing.tags = tags;
                })
                .catch(function (tags) {
                    rejectedOutgoing.tags = tags;
                });
        };

        /**
         * @description Manage Comments
         * @param rejectedOutgoing
         * @param $event
         */
        self.manageComments = function (rejectedOutgoing, $event) {
            rejectedOutgoing.manageDocumentComments($event)
                .then(function (documentComments) {
                    rejectedOutgoing.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    rejectedOutgoing.documentComments = documentComments;
                });
        };

        /**
         * @description Manage Attachments
         * @param rejectedOutgoing
         * @param $event
         */
        self.manageAttachments = function (rejectedOutgoing, $event) {
            rejectedOutgoing.manageDocumentAttachments($event);
        };

        /**
         * @description Manage Linked Entities
         * @param rejectedOutgoing
         * @param $event
         */
        self.manageLinkedEntities = function (rejectedOutgoing, $event) {
            managerService
                .manageDocumentEntities(rejectedOutgoing.vsId, rejectedOutgoing.docClassName, rejectedOutgoing.docSubject, $event);
        };

        /**
         * @description Manage Linked Documents
         * @param rejectedOutgoing
         * @param $event
         * @returns {*}
         */
        self.manageLinkedDocuments = function (rejectedOutgoing, $event) {
            var info = rejectedOutgoing.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description Manage Security
         * @param rejectedOutgoing
         * @param $event
         */
        self.security = function (rejectedOutgoing, $event) {
            //  console.log('security : ', rejectedOutgoing);
        };

        /**
         * @description Manage Destinations
         * @param rejectedOutgoing
         * @param $event
         */
        self.manageDestinations = function (rejectedOutgoing, $event) {
            managerService.manageDocumentCorrespondence(rejectedOutgoing.vsId, rejectedOutgoing.docClassName, rejectedOutgoing.docSubject, $event)
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
         * @param rejectedOutgoing
         * @param $event
         */
        self.previewDocument = function (rejectedOutgoing, $event) {
            if (!rejectedOutgoing.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(rejectedOutgoing, self.gridActions, checkIfEditPropertiesAllowed(rejectedOutgoing, true), false)
                .then(function () {
                    return self.reloadRejectedOutgoings(self.grid.page);
                })
                .catch(function () {
                    return self.reloadRejectedOutgoings(self.grid.page);
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
            correspondence.viewFromQueue(self.gridActions, 'rejectedOutgoing', $event)
                .then(function () {
                    return self.reloadRejectedOutgoings(self.grid.page);
                })
                .catch(function (error) {
                    return self.reloadRejectedOutgoings(self.grid.page);
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
            var page = (self.isInternalOutgoingEnabled && correspondence.isInternalOutgoing()) ? 'app.outgoing.add-internal' : 'app.outgoing.add';
            return correspondence
                .duplicateVersion($event)
                .then(function () {
                    $state.go(page, {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        wobNum: info.wobNumber
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
            var page = (self.isInternalOutgoingEnabled && correspondence.isInternalOutgoing()) ? 'app.outgoing.add-internal' : 'app.outgoing.add';
            return correspondence
                .duplicateSpecificVersion($event)
                .then(function () {
                    $state.go(page, {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        wobNum: info.wobNumber
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
                        gridName: 'outgoing-rejected'
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
                            return info.needToApprove();
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
            // Remove
            {
                type: 'action',
                icon: 'delete',
                text: 'grid_action_remove',
                shortcut: true,
                permissionKey: "DELETE_OUTGOING",
                callback: self.removeRejectedOutgoing,
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
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
            // Send To Review
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_send_to_review',
                shortcut: true,
                callback: self.sendToReview,
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
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
                                && hasPermission
                                && !correspondenceService.isLimitedCentralUnitAccess(model);
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
