module.exports = function (app) {
    app.controller('draftInternalCtrl', function (lookupService,
                                                  draftInternalService,
                                                  draftInternals,
                                                  $q,
                                                  langService,
                                                  generator,
                                                  toast,
                                                  counterService,
                                                  dialog,
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
                                                  mailNotificationService) {
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

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.draftInternals.length + 21);
                    }
                }
            ]
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
            managerService.manageDocumentAttachments(draftInternal.vsId, draftInternal.docClassName, draftInternal.docSubject, $event)
                .then(function (attachments) {
                    draftInternal = attachments;
                })
                .catch(function (attachments) {
                    draftInternal = attachments;
                });
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
         * @description View document
         * @param draftInternal
         * @param $event
         */
        self.viewDocument = function (draftInternal, $event) {
            if (!draftInternal.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(draftInternal, self.gridActions, checkIfEditPropertiesAllowed(draftInternal, true), true);
            return;
        };

        /**
         * @description Check if action will be shown on grid or not
         * @param action
         * @param model
         * @returns {boolean}
         */
        self.checkToShowAction = function (action, model) {
            /*if (action.hasOwnProperty('permissionKey'))
                return !action.hide && employeeService.hasPermissionTo(action.permissionKey);
            return (!action.hide);*/

            if (action.hasOwnProperty('permissionKey')) {
                if (typeof action.permissionKey === 'string') {
                    return (!action.hide) && employeeService.hasPermissionTo(action.permissionKey);
                }
                else if (angular.isArray(action.permissionKey)) {
                    if (!action.permissionKey.length) {
                        return (!action.hide);
                    }
                    else {
                        var hasPermissions = _.map(action.permissionKey, function (key) {
                            return employeeService.hasPermissionTo(key);
                        });
                        return (!action.hide) && !(_.some(hasPermissions, function (isPermission) {
                            return isPermission !== true;
                        }));
                    }
                }
            }
            return (!action.hide);
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
                subMenu: [
                    // Tags
                    {
                        type: 'action',
                        icon: 'tag',
                        text: 'grid_action_tags',
                        shortcut: false,
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
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    },
                    // Linked Documents
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_linked_documents',
                        shortcut: false,
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
                    return self.checkToShowAction(action, model) && (model.addMethod || model.approvers !== null);
                }
            }
        ];

    });
};