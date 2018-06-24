module.exports = function (app) {
    app.controller('rejectedOutgoingCtrl', function (lookupService,
                                                     rejectedOutgoingService,
                                                     rejectedOutgoings,
                                                     $q,
                                                     counterService,
                                                     langService,
                                                     generator,
                                                     toast,
                                                     dialog,
                                                     viewDocumentService,
                                                     managerService,
                                                     validationService,
                                                     employeeService,
                                                     viewTrackingSheetService,
                                                     contextHelpService,
                                                     distributionWorkflowService,
                                                     correspondenceService,
                                                     ResolveDefer,
                                                     mailNotificationService) {
        'ngInject';
        var self = this;

        self.controllerName = 'rejectedOutgoingCtrl';
        self.currentEmployee = employeeService.getEmployee();
        self.progress = null;
        contextHelpService.setHelpTo('outgoing-rejected');
        // employee service to check the permission in html
        self.employeeService = employeeService;
        /**
         * @description All rejected outgoing mails
         * @type {*}
         */
        self.rejectedOutgoings = rejectedOutgoings;

        /**
         * @description Contains the selected rejected outgoing mails
         * @type {Array}
         */
        self.selectedRejectedOutgoings = [];

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
                        return (self.rejectedOutgoings.length + 21);
                    }
                }
            ]
        };

        /**
         * @description Reload the grid of rejected outgoing mail
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadRejectedOutgoings = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return rejectedOutgoingService
                .loadRejectedOutgoings()//self.currentEmployee.defaultOUID
                .then(function (result) {
                    counterService.loadCounters();
                    self.rejectedOutgoings = result;
                    self.selectedRejectedOutgoings = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function(property, modelType){
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

            /*distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSendBulk(self.selectedRejectedOutgoings, "outgoing", $event)
                .then(function () {
                    self.reloadRejectedOutgoings(self.grid.page);
                })
                .catch(function () {
                    self.reloadRejectedOutgoings(self.grid.page);
                });*/
            return correspondenceService
                .launchCorrespondenceWorkflow(self.selectedRejectedOutgoings, $event, 'forward', 'favorites')
                .then(function () {
                    self.reloadRejectedOutgoings(self.grid.page)
                        .then(function(){
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });
        };

        /**
         * @description Archive for selected review rejected outgoing mails
         * @param $event
         */
        self.archiveOutgoingBulk = function ($event) {
            rejectedOutgoingService
                .controllerMethod
                .rejectedOutgoingArchiveBulk(self.selectedRejectedOutgoings, $event)
                .then(function (result) {
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
            /*distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSend(rejectedOutgoing, false, false, null, "outgoing", $event)
                .then(function (result) {
                    self.reloadRejectedOutgoings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        })
                    ;
                    //self.replaceRecord(result);
                })
                .catch(function (result) {
                    self.reloadRejectedOutgoings(self.grid.page);
                    //self.replaceRecord(result);
                });*/

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
         * @description Archive the rejected outgoing item
         * @param rejectedOutgoing
         * @param $event
         * @param defer
         */
        self.archiveOutgoing = function (rejectedOutgoing, $event, defer) {
            rejectedOutgoingService
                .controllerMethod
                .rejectedOutgoingArchive(rejectedOutgoing, $event)
                .then(function (result) {
                    self.reloadRejectedOutgoings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        })
                    ;
                })

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
            managerService.manageDocumentComments(rejectedOutgoing.vsId, rejectedOutgoing.docSubject, $event)
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
            console.log('security : ', rejectedOutgoing);
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

        /**
         * @description View document
         * @param rejectedOutgoing
         * @param $event
         */
        self.viewDocument = function (rejectedOutgoing, $event) {
            if (!rejectedOutgoing.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(rejectedOutgoing, self.gridActions, checkIfEditPropertiesAllowed(rejectedOutgoing, true), false);
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
                        gridName: 'outgoing-rejected'
                    }
                ],
                class: "action-green",
                checkShow: self.checkToShowAction
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
                callback: self.removeRejectedOutgoing,
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            /* // Edit Outgoing Properties
             {
                 type: 'action',
                 icon: 'pencil',
                 text: 'grid_action_edit_outgoing_properties',
                 shortcut: false,
                 permissionKey: "EDIT_OUTGOING_PROPERTIES",
                 callback: self.editProperties,
                 class: "action-green",
                 showInView: false,
                 checkShow: self.checkToShowAction
             },
             // Edit Outgoing Content
             {
                 type: 'action',
                 icon: 'pencil-box',
                 text: 'grid_action_edit_outgoing_content',
                 shortcut: false,
                 callback: self.editContent,
                 permissionKey: "EDIT_OUTGOING_CONTENT",
                 class: "action-green",
                 showInView: false,
                 checkShow: self.checkToShowAction
             },*/
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
            // Archive
            {
                type: 'action',
                icon: 'archive',
                text: 'grid_action_archive',
                shortcut: true,
                callback: self.archiveOutgoing,
                class: "action-green",
                checkShow: self.checkToShowAction
            },
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
            // Edit
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit',
                shortcut: false,
                showInView: false,
                checkShow: function (action, model) {
                    var hasPermission = (employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES") || employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
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
                        shortcut: false,
                        callback: self.editContent,
                        class: "action-green",
                        permissionKey: "EDIT_OUTGOING_CONTENT",
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
                        permissionKey: "EDIT_OUTGOING_PROPERTIES",
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
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    },
                    // Linked Documents
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_linked_documents',
                        shortcut: false,
                        permissionKey:"MANAGE_LINKED_DOCUMENTS",
                        callback: self.manageLinkedDocuments,
                        class: "action-green",
                        //hide: true,
                        checkShow: self.checkToShowAction
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
            }
        ];
    });
};