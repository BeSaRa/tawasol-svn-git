module.exports = function (app) {
    app.controller('reviewInternalCtrl', function (lookupService,
                                                   reviewInternalService,
                                                   reviewInternals,
                                                   $q,
                                                   generator,
                                                   counterService,
                                                   langService,
                                                   toast,
                                                   dialog,
                                                   viewDocumentService,
                                                   employeeService,
                                                   managerService,
                                                   validationService,
                                                   $timeout,
                                                   viewTrackingSheetService,
                                                   distributionWorkflowService,
                                                   broadcastService,
                                                   contextHelpService,
                                                   correspondenceService,
                                                   ResolveDefer,
                                                   mailNotificationService) {
        'ngInject';
        var self = this;

        self.controllerName = 'reviewInternalCtrl';
        self.currentEmployee = employeeService.getEmployee();
        self.progress = null;
        // employee service to check the permission in html
        self.employeeService = employeeService;

        contextHelpService.setHelpTo('internal-review');

        /**
         * @description All review internal emails
         * @type {*}
         */
        self.reviewInternals = reviewInternals;

        /**
         * @description Contains the selected review internal emails
         * @type {Array}
         */
        self.selectedReviewInternals = [];

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
                        return (self.reviewInternals.length + 21);
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
            var index = _.findIndex(self.reviewInternals, {'id': record.id});
            if (index > -1)
                self.reviewInternals.splice(index, 1, record);
        };

        /**
         * @description Reload the grid of review internal email
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadReviewInternals = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return reviewInternalService
                .loadReviewInternals()
                .then(function (result) {
                    counterService.loadCounters();
                    self.reviewInternals = result;
                    self.selectedReviewInternals = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Remove single review internal email
         * @param reviewInternal
         * @param $event
         * @param defer
         */
        self.removeReviewInternal = function (reviewInternal, $event, defer) {
            //console.log('remove review internal mail : ', reviewInternal);
            reviewInternalService
                .controllerMethod
                .reviewInternalRemove(reviewInternal, $event)
                .then(function () {
                    self.reloadReviewInternals(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Remove multiple selected review internal emails
         * @param $event
         */
        self.removeBulkReviewInternals = function ($event) {
            //console.log('remove review internal mails bulk : ', self.selectedReviewInternals);
            reviewInternalService
                .controllerMethod
                .reviewInternalRemoveBulk(self.selectedReviewInternals, $event)
                .then(function () {
                    self.reloadReviewInternals(self.grid.page);
                });
        };

        /**
         * @description Launch distribution workflow for selected review internal mails
         * @param $event
         */
        self.acceptAndLaunchDistributionWorkflowBulk = function ($event) {
            var contentNotExist = _.filter(self.selectedReviewInternals, function (reviewInternal) {
                return !reviewInternal.hasContent();
            });
            if (contentNotExist.length > 0) {
                dialog.alertMessage(langService.get("content_not_found_bulk"));
                return;
            }

            /*distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSendBulk(self.selectedReviewInternals, "internal", $event)
                .then(function () {
                    self.reloadReviewInternals(self.grid.page);
                })
                .catch(function () {
                    self.reloadReviewInternals(self.grid.page);
                });*/
            return correspondenceService
                .launchCorrespondenceWorkflow(self.selectedReviewInternals, $event, 'forward', 'favorites')
                .then(function () {
                    self.reloadReviewInternals(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });
        };

        /**
         * @description Accept for selected review internal mails
         * @param $event
         */
        self.acceptInternalBulk = function ($event) {
            //console.log('accept review internal mails bulk : ', self.selectedReviewInternals);
            reviewInternalService
                .controllerMethod
                .reviewInternalAcceptBulk(self.selectedReviewInternals, $event)
                .then(function () {
                    self.reloadReviewInternals(self.grid.page);
                });
        };

        /**
         * @description Reject for selected review internal mails
         * @param $event
         */
        self.rejectInternalBulk = function ($event) {
            //console.log('reject review internal mails bulk : ', self.selectedReviewInternals);
            /*reviewInternalService
                .controllerMethod
                .reviewInternalRejectBulk(self.selectedReviewInternals, $event)
                .then(function (result) {
                    self.reloadReviewInternals(self.grid.page);
                    //self.replaceRecord(result);
                })
                .catch(function (result) {
                    self.reloadReviewInternals(self.grid.page);
                    //self.replaceRecord(result);
                });*/
            correspondenceService
                .returnBulkCorrespondences(self.selectedReviewInternals, $event)
                .then(function () {
                    self.reloadReviewInternals(self.grid.page);
                });
        };

        /**
         * @description Edit Properties
         * @param reviewInternal
         * @param $event
         */
        self.editProperties = function (reviewInternal, $event) {
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
                .manageDocumentProperties(reviewInternal.vsId, reviewInternal.docClassName, reviewInternal.docSubject, $event)
                .then(function (document) {
                    reviewInternal = generator.preserveProperties(properties, reviewInternal, document);
                    self.reloadReviewInternals(self.grid.page);
                })
                .catch(function (document) {
                    reviewInternal = generator.preserveProperties(properties, reviewInternal, document);
                    self.reloadReviewInternals(self.grid.page);
                });
        };

        /**
         * @description Edit the internal content
         * @param reviewInternal
         * @param $event
         */
        self.editContent = function (reviewInternal, $event) {
            managerService.manageDocumentContent(reviewInternal.vsId, reviewInternal.docClassName, reviewInternal.docSubject, $event)
        };

        /**
         * @description Accept and Launch Distribution Workflow
         * @param reviewInternal
         * @param $event
         * @param defer
         */
        self.acceptAndLaunchDistributionWorkflow = function (reviewInternal, $event, defer) {
            //console.log('accept and launch distribution workflow', reviewInternal);

            if (!reviewInternal.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }

            /*distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSend(reviewInternal, false, false, null, "internal", $event)
                .then(function (result) {
                    self.reloadReviewInternals(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                    //self.replaceRecord(result);
                })
                .catch(function (result) {
                    self.reloadReviewInternals(self.grid.page);
                    //self.replaceRecord(result);
                });*/
            reviewInternal.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadReviewInternals(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                });
        };
        /**
         * @description Reject the internal mail
         * @param reviewInternal
         * @param $event
         * @param defer
         */
        self.rejectInternal = function (reviewInternal, $event, defer) {
            /*reviewInternalService
                .controllerMethod
                .reviewInternalReject(reviewInternal, $event)
                .then(function (result) {
                    self.reloadReviewInternals(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                    //self.replaceRecord(result);
                })
                .catch(function (result) {
                    self.reloadReviewInternals(self.grid.page);
                    //self.replaceRecord(result);
                });*/
            reviewInternal.rejectDocument($event)
                .then(function () {
                    new ResolveDefer(defer);
                    self.reloadReviewInternals(self.grid.page);
                });
        };

        /**
         * @description Accept the review internal document
         * @param reviewInternal
         * @param $event
         * @param defer
         */
        self.acceptInternal = function (reviewInternal, $event, defer) {
            //console.log('accept internal : ', reviewInternal);
            reviewInternalService.controllerMethod
                .reviewInternalAccept(reviewInternal, $event)
                .then(function (result) {
                    self.reloadReviewInternals(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description View Tracking Sheet
         * @param reviewInternal
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (reviewInternal, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(reviewInternal, params, $event).then(function (result) {

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
         * @description Manage Tags
         * @param reviewInternal
         * @param $event
         */
        self.manageTags = function (reviewInternal, $event) {
            managerService.manageDocumentTags(reviewInternal.vsId, reviewInternal.docClassName, reviewInternal.docSubject, $event)
                .then(function (tags) {
                    reviewInternal.tags = tags;
                })
                .catch(function (tags) {
                    reviewInternal.tags = tags;
                });
        };

        /**
         * @description Manage Comments
         * @param reviewInternal
         * @param $event
         */
        self.manageComments = function (reviewInternal, $event) {
            console.log('manage comments : ', reviewInternal);
            managerService.manageDocumentComments(reviewInternal.vsId, reviewInternal.docSubject, $event)
                .then(function (documentComments) {
                    reviewInternal.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    reviewInternal.documentComments = documentComments;
                });
        };

        /**
         * @description Manage Attachments
         * @param reviewInternal
         * @param $event
         */
        self.manageAttachments = function (reviewInternal, $event) {
            console.log('manage attachments : ', reviewInternal);
            managerService.manageDocumentAttachments(reviewInternal.vsId, reviewInternal.docClassName, reviewInternal.docSubject, $event)
                .then(function (attachments) {
                    reviewInternal.attachments = attachments;
                })
                .catch(function (attachments) {
                    reviewInternal.attachments = attachments;
                });
        };

        /**
         * @description Manage Entities
         * @param reviewInternal
         * @param $event
         */
        self.manageEntities = function (reviewInternal, $event) {
            console.log('manage entities : ', reviewInternal);
            var info = reviewInternal.getInfo();
            managerService
                .manageDocumentEntities(info.vsId, info.documentClass, info.title, $event);
        };

        /**
         * @description Manage Linked Documents
         * @param reviewInternal
         * @param $event
         * @returns {*}
         */
        self.manageLinkedDocuments = function (reviewInternal, $event) {
            //console.log('manage linked documents : ', reviewInternal);
            var info = reviewInternal.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description Security
         * @param reviewInternal
         * @param $event
         */
        self.security = function (reviewInternal, $event) {
            console.log('manage security : ', reviewInternal);
        };

        /**
         * @description broadcast selected organization and workflow group
         * @param reviewInternal
         * @param $event
         */
        self.broadcast = function (reviewInternal, $event, defer) {
            /*broadcastService
                .controllerMethod
                .broadcastSend(reviewInternal, $event)
                .then(function () {
                    self.reloadReviewInternals(self.grid.page);
                })
                .catch(function () {
                    self.reloadReviewInternals(self.grid.page);
                });*/
            reviewInternal
                .correspondenceBroadcast()
                .then(function () {
                    self.reloadReviewInternals(self.grid.page)
                        .then(function () {
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
         * @param reviewInternal
         * @param $event
         */
        self.viewDocument = function (reviewInternal, $event) {
            if (!reviewInternal.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            correspondenceService.viewCorrespondence(reviewInternal, self.gridActions, checkIfEditPropertiesAllowed(reviewInternal, true), true);
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
                        gridName: 'internal-review'
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
                shortcut: false,
                callback: self.removeReviewInternal,
                class: "action-green",
                checkShow: self.checkToShowAction
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
                    return self.checkToShowAction(action, model) && (info.isPaper);
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
                    var hasPermission = (employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES") || employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT"));
                    return self.checkToShowAction(action, model) && hasPermission;
                },
                subMenu: [
                    // Content
                    {
                        type: 'action',
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
                        shortcut: false,
                        callback: self.editProperties,
                        class: "action-green",
                        permissionKey: "EDIT_INTERNAL_PROPERTIES",
                        checkShow: self.checkToShowAction
                    }
                ]
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
                checkShow: self.checkToShowAction
            },
            // Reject
            {
                type: 'action',
                icon: 'close',
                text: 'grid_action_reject',
                shortcut: true,
                callback: self.rejectInternal,
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            // Accept
            {
                type: 'action',
                icon: 'check',
                text: 'grid_action_accept',
                shortcut: true,
                callback: self.acceptInternal,
                class: "action-green",
                checkShow: self.checkToShowAction
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
                    // Entites
                    {
                        type: 'action',
                        icon: 'pencil-box-outline',
                        text: 'grid_action_entities',
                        shortcut: false,
                        callback: self.manageEntities,
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
                permissionKey: 'BROADCAST_DOCUMENT',
                callback: self.broadcast,
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && (!!model.addMethod || model.hasOwnProperty('approvers') && model.approvers !== null);
                }
            }
        ];

    });
};