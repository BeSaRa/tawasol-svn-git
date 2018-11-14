module.exports = function (app) {
    app.controller('draftInternalCtrl', function (lookupService,
                                                  draftInternalService,
                                                  draftInternals,
                                                  $q,
                                                  $filter,
                                                  langService,
                                                  generator,
                                                  toast,
                                                  counterService,
                                                  dialog,
                                                  $state,
                                                  viewDocumentService,
                                                  //outgoingService,
                                                  managerService,
                                                  validationService,
                                                  employeeService,
                                                  $timeout,
                                                  viewTrackingSheetService,
                                                  distributionWorkflowService,
                                                  broadcastService,
                                                  correspondenceService,
                                                  ResolveDefer,
                                                  mailNotificationService,
                                                  gridService) {
        'ngInject';
        var self = this;

        self.controllerName = 'draftInternalCtrl';
        self.currentEmployee = employeeService.getEmployee();
        self.progress = null;
        // employee service to check the permission in html
        self.employeeService = employeeService;

        /**
         * @description All draft internal mails
         * @type {*}
         */
        self.draftInternals = draftInternals;

        /**
         * @description Contains the selected draft internal mails
         * @type {Array}
         */
        self.selectedDraftInternals = [];

        self.editInDesktop = function (workItem) {
            correspondenceService.editWordInDesktop(workItem);
        };

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.internal.draft) || 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.internal.draft, self.draftInternals),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.internal.draft, limit);
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
            var index = _.findIndex(self.draftInternals, {'id': record.id});
            if (index > -1)
                self.draftInternals.splice(index, 1, record);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.draftInternals = $filter('orderBy')(self.draftInternals, self.grid.order);
        };

        /**
         * @description Reload the grid of draft internal mail
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadDraftInternals = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return draftInternalService
                .loadDraftInternals()// self.currentEmployee.defaultOUID
                .then(function (result) {
                    counterService.loadCounters();
                    self.draftInternals = result;
                    self.selectedDraftInternals = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Remove single draft internal mail
         * @param draftInternal
         * @param $event
         * @param defer
         */
        self.removeDraftInternal = function (draftInternal, $event, defer) {
            draftInternalService
                .controllerMethod
                .draftInternalRemove(draftInternal, $event)
                .then(function () {
                    self.reloadDraftInternals(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        })
                    ;
                });
        };

        /**
         * @description Remove multiple selected draft internal mails
         * @param $event
         */
        self.removeBulkDraftInternals = function ($event) {
            draftInternalService
                .controllerMethod
                .draftInternalRemoveBulk(self.selectedDraftInternals, $event)
                .then(function () {
                    self.reloadDraftInternals(self.grid.page);
                });
        };

        /**
         * @description Launch distribution workflow for selected draft internal mails
         * @param draftInternal
         * @param $event
         */
        self.launchDistributionWorkflowBulk = function (draftInternal, $event) {
            var contentNotExist = _.filter(self.selectedDraftInternals, function (draftInternal) {
                return !draftInternal.hasContent();
            });
            if (contentNotExist.length > 0) {
                dialog.alertMessage(langService.get("content_not_found_bulk"));
                return;
            }

            /*distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSendBulk(self.selectedDraftInternals, "internal", $event)
                .then(function () {
                    self.reloadDraftInternals(self.grid.page);
                })
                .catch(function () {
                    self.reloadDraftInternals(self.grid.page);
                });*/
            return correspondenceService
                .launchCorrespondenceWorkflow(self.selectedDraftInternals, $event, 'forward', 'favorites')
                .then(function () {
                    self.reloadDraftInternals(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });
        };

        /**
         * @description Send to review for selected draft internal mails
         * @param $event
         */
        self.sendToReviewBulk = function ($event) {
            draftInternalService
                .controllerMethod
                .draftInternalSendToReviewBulk(self.selectedDraftInternals, $event)
                .then(function () {
                    self.reloadDraftInternals(self.grid.page);
                });
        };

        /**
         * @description Edit the internal properties
         * @param draftInternal
         * @param $event
         */
        self.editProperties = function (draftInternal, $event) {
            //console.log('edit internal properties : ', draftInternal);
            var properties = [
                'attachments',
                'linkedEntities',
                'documentComments',
                'linkedDocs',
                'sitesInfoTo',
                'sitesInfoCC'
            ];

            managerService
                .manageDocumentProperties(draftInternal.vsId, draftInternal.docClassName, draftInternal.docSubject, $event)
                .then(function (document) {
                    draftInternal = generator.preserveProperties(properties, draftInternal, document);
                    self.reloadDraftInternals(self.grid.page);
                })
                .catch(function (document) {
                    draftInternal = generator.preserveProperties(properties, draftInternal, document);
                    self.reloadDraftInternals(self.grid.page);
                });
        };

        /**
         * @description Edit the internal content
         * @param draftInternal
         * @param $event
         */
        self.editContent = function (draftInternal, $event) {
            managerService.manageDocumentContent(draftInternal.vsId, draftInternal.docClassName, draftInternal.docSubject, $event)
                .then(function () {
                    self.reloadDraftInternals(self.grid.page);
                })
        };

        /**
         * @description Send the draft internal to review
         * @param draftInternal
         * @param $event
         * @param defer
         */
        self.sendToReview = function (draftInternal, $event, defer) {
            draftInternalService.controllerMethod
                .draftInternalSendToReview(draftInternal, $event)
                .then(function (result) {
                    self.reloadDraftInternals(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        })
                    ;
                })
        };

        /**
         * @description Launch distribution workflow for draft internal item
         * @param draftInternal
         * @param $event
         * @param defer
         */
        self.launchDistributionWorkflow = function (draftInternal, $event, defer) {
            if (!draftInternal.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }

            /*distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSend(draftInternal, false, false, null, "internal", $event)
                .then(function (result) {
                    self.reloadDraftInternals(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
                .catch(function (result) {
                    self.reloadDraftInternals(self.grid.page);
                });*/

            draftInternal.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadDraftInternals(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description View Tracking Sheet
         * @param draftInternal
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (draftInternal, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(draftInternal, params, $event).then(function (result) {

            });
        };

        /**
         * @description Manage document tags for draft internal
         * @param draftInternal
         * @param $event
         */
        self.manageTags = function (draftInternal, $event) {
            managerService.manageDocumentTags(draftInternal.vsId, draftInternal.docClassName, draftInternal.docSubject, $event)
                .then(function (tags) {
                    draftInternal.tags = tags;
                })
                .catch(function (tags) {
                    draftInternal.tags = tags;
                });
        };

        /**
         * @description Manage document comments for draft internal
         * @param draftInternal
         * @param $event
         */
        self.manageComments = function (draftInternal, $event) {
            managerService.manageDocumentComments(draftInternal.vsId, draftInternal.docSubject, $event)
                .then(function (documentComments) {
                    draftInternal.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    draftInternal.documentComments = documentComments;
                });
        };

        /**
         * @description Manage document attachments for draft internal
         * @param draftInternal
         * @param $event
         */
        self.manageAttachments = function (draftInternal, $event) {
            draftInternal.manageDocumentAttachments($event);
        };

        /**
         * @description Manage Linked Entities
         * @param draftInternal
         * @param $event
         */
        self.manageLinkedEntities = function (draftInternal, $event) {
            var info = draftInternal.getInfo();
            managerService
                .manageDocumentEntities(info.vsId, info.documentClass, info.title, $event);
        };

        /**
         * @description Manage linked documents for draft internal
         * @param draftInternal
         * @param $event
         */
        self.manageLinkedDocuments = function (draftInternal, $event) {
            console.log('manage linked documents', draftInternal);
            var info = draftInternal.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description Manage security for draft internal
         * @param draftInternal
         * @param $event
         */
        self.security = function (draftInternal, $event) {
            console.log('security', draftInternal);
        };

        /**
         * @description broadcast selected organization and workflow group
         * @param draftInternal
         * @param $event
         * @param defer
         */
        self.broadcast = function (draftInternal, $event, defer) {
            /*broadcastService
                .controllerMethod
                .broadcastSend(draftInternal, $event)
                .then(function () {
                    self.reloadDraftInternals(self.grid.page);
                })
                .catch(function () {
                    self.reloadDraftInternals(self.grid.page);
                });*/
            draftInternal
                .correspondenceBroadcast($event)
                .then(function () {
                    self.reloadDraftInternals(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        })
                })
        };


        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var isEditAllowed = employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES");
            if (checkForViewPopup)
                return !isEditAllowed;
            return isEditAllowed;
        };

        /**
         * @description Preview document
         * @param draftInternal
         * @param $event
         */
        self.previewDocument = function (draftInternal, $event) {
            if (!draftInternal.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(draftInternal, self.gridActions, checkIfEditPropertiesAllowed(draftInternal, true), true)
                .then(function () {
                    return self.reloadDraftInternals(self.grid.page);
                })
                .catch(function () {
                    return self.reloadDraftInternals(self.grid.page);
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
            correspondence.viewFromQueue(self.gridActions, 'draftInternal', $event)
                .then(function () {
                    return self.reloadDraftInternals(self.grid.page);
                })
                .catch(function (error) {
                    return self.reloadDraftInternals(self.grid.page);
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
                    $state.go('app.internal.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        workItem: info.wobNum
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
                    $state.go('app.internal.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        workItem: info.wobNum
                    });
                });
        };

        /**
         * @description Check if action will be shown on grid or not
         * @param action
         * @param model
         * @returns {boolean}
         */
        self.checkToShowAction = function (action, model) {
            var hasPermission = true;
            if (action.hasOwnProperty('permissionKey')) {
                if (typeof action.permissionKey === 'string') {
                    hasPermission = employeeService.hasPermissionTo(action.permissionKey);
                }
                else if (angular.isArray(action.permissionKey) && action.permissionKey.length) {
                    if (action.hasOwnProperty('checkAnyPermission')) {
                        hasPermission = employeeService.getEmployee().hasAnyPermissions(action.permissionKey);
                    }
                    else {
                        hasPermission = employeeService.getEmployee().hasThesePermissions(action.permissionKey);
                    }
                }
            }
            return (!action.hide) && hasPermission;
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
                        checkShow: self.checkToShowAction,
                        gridName: 'internal-draft'
                    }
                ],
                class: "action-green",
                checkShow: self.checkToShowAction
            },
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
                    //If no content or no view document permission, hide the button
                    return self.checkToShowAction(action, model) && model.hasContent();
                }
            },
            // Separator
            {
                type: 'separator',
                checkShow: self.checkToShowAction,
                showInView: false
            },
            // Remove
            {
                type: 'action',
                icon: 'delete',
                text: 'grid_action_remove',
                shortcut: true,
                permissionKey: 'DELETE_INTERNAL',
                callback: self.removeDraftInternal,
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            /* // Edit Properties
             {
                 type: 'action',
                 icon: 'pencil',
                 text: 'grid_action_edit_internal_properties',
                 shortcut: true,
                 showInView: false,
                 permissionKey: "EDIT_INTERNAL_PROPERTIES",
                 callback: self.editProperties,
                 class: "action-green",
                 checkShow: self.checkToShowAction
             },
             // Edit Content
             {
                 type: 'action',
                 icon: 'pencil-box',
                 text: 'grid_action_edit_internal_content',
                 shortcut: true,
                 showInView: false,
                 permissionKey: "EDIT_INTERNAL_CONTENT",
                 callback: self.editContent,
                 class: "action-green",
                 checkShow: self.checkToShowAction
             },*/
            // Send To Review
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_send_to_review',
                shortcut: true,
                callback: self.sendToReview,
                class: "action-green",
                checkShow: self.checkToShowAction
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
                checkShow: self.checkToShowAction
            },
            // Edit
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit',
                shortcut: false,
                showInView: false,
                checkShow: function (action, model) {
                    var hasPermission = (employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES") || employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT"));
                    return self.checkToShowAction(action, model) && hasPermission;
                },
                permissionKey: [
                    "EDIT_INTERNAL_CONTENT",
                    "EDIT_INTERNAL_PROPERTIES"
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
                        shortcut: true,
                        callback: self.editContent,
                        class: "action-green",
                        permissionKey: "EDIT_INTERNAL_CONTENT",
                        checkShow: self.checkToShowAction
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
                        shortcut: true,
                        callback: self.editProperties,
                        class: "action-green",
                        permissionKey: "EDIT_INTERNAL_PROPERTIES",
                        checkShow: self.checkToShowAction
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
                checkShow: self.checkToShowAction,
                subMenu: viewTrackingSheetService.getViewTrackingSheetOptions(self.checkToShowAction, self.viewTrackingSheet, 'grid')
            },
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                shortcut: false,
                showInView: false,
                checkShow: self.checkToShowAction,
                permissionKey: [
                    "MANAGE_DOCUMENT’S_TAGS",
                    "MANAGE_DOCUMENT’S_COMMENTS",
                    "MANAGE_ATTACHMENTS",
                    "MANAGE_LINKED_ENTITIES",
                    "MANAGE_LINKED_DOCUMENTS"
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
                        checkShow: self.checkToShowAction
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
                        checkShow: self.checkToShowAction
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
                        checkShow: self.checkToShowAction
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
                        checkShow: self.checkToShowAction
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
                        checkShow: self.checkToShowAction
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
                checkShow: self.checkToShowAction
            },
            // Open
            {
                type: 'action',
                icon: 'book-open-variant',
                text: 'grid_action_open',
                shortcut: false,
                callback: self.viewDocument,
                class: "action-green",
                showInView: false,
                permissionKey: 'VIEW_DOCUMENT',
                checkShow: function (action, model) {
                    //If no content or no view document permission, hide the button
                    return self.checkToShowAction(action, model) && model.hasContent();
                }
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
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && (model.addMethod || model.approvers !== null) && (model.getSecurityLevelLookup().lookupKey !== 4);
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
                        hasPermission = employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT");
                    } else if (info.documentClass === 'incoming') {
                        hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT");
                    }
                    else if (info.documentClass === 'internal') {
                        hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT");
                    }
                    return self.checkToShowAction(action, model)
                        && !info.isPaper
                        && (info.documentClass !== 'incoming')
                        && model.needApprove()
                        && hasPermission;
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
                checkShow: self.checkToShowAction
            },
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
                    return self.checkToShowAction(action, model) && !info.isPaper;
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
                checkShow: self.checkToShowAction
            }
        ];

    });
};