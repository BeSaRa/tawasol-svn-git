module.exports = function (app) {
    app.controller('rejectedIncomingCtrl', function (lookupService,
                                                     rejectedIncomingService,
                                                     rejectedIncomings,
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

        self.controllerName = 'rejectedIncomingCtrl';
        self.currentEmployee = employeeService.getEmployee();
        self.progress = null;
        contextHelpService.setHelpTo('incoming-rejected');
        // employee service to check the permission in html
        self.employeeService = employeeService;

        /**
         * @description All rejected incoming mails
         * @type {*}
         */
        self.rejectedIncomings = rejectedIncomings;

        /**
         * @description Contains the selected rejected incoming mails
         * @type {Array}
         */
        self.selectedRejectedIncomings = [];

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
                        return (self.rejectedIncomings.length + 21);
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
        self.getSortingKey = function(property, modelType){
            return generator.getColumnSortingKey(property, modelType);
        };

        /**
         * @description Contains methods for CRUD operations for rejected incoming mails
         */
        self.statusServices = {
            'activate': rejectedIncomingService.activateBulkRejectedIncomings,
            'deactivate': rejectedIncomingService.deactivateBulkRejectedIncomings,
            'true': rejectedIncomingService.activateRejectedIncoming,
            'false': rejectedIncomingService.deactivateRejectedIncoming
        };

       /* /!**
         * @description Opens dialog for add new rejected incoming mail
         * @param $event
         *!/
        self.openAddRejectedIncomingDialog = function ($event) {
            rejectedIncomingService
                .controllerMethod
                .rejectedIncomingAdd($event)
                .then(function (result) {
                    self.reloadRejectedIncomings(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('add_success').change({name: result.getNames()}));
                        });
                });
        };

        /!**
         * @description Opens dialog for edit rejected incoming mail
         * @param $event
         * @param rejectedIncoming
         *!/
        self.openEditRejectedIncomingDialog = function (rejectedIncoming, $event) {
            rejectedIncomingService
                .controllerMethod
                .rejectedIncomingEdit(rejectedIncoming, $event)
                .then(function (result) {
                    self.reloadRejectedIncomings(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getNames()}));
                        });
                });
        };*/

        /**
         * @description Replaces the record in grid after update
         * @param record
         */
        self.replaceRecord = function (record) {
            var index = _.findIndex(self.rejectedIncomings, {'id': record.id});
            if (index > -1)
                self.rejectedIncomings.splice(index, 1, record);
        };

        /**
         * @description Reload the grid of rejected incoming mail
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadRejectedIncomings = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return rejectedIncomingService
                .loadRejectedIncomings()
                .then(function (result) {
                    counterService.loadCounters();
                    self.rejectedIncomings = result;
                    self.selectedRejectedIncomings = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Remove single rejected incoming mail
         * @param rejectedIncoming
         * @param $event
         * @param defer
         */
        self.removeRejectedIncoming = function (rejectedIncoming, $event, defer) {
            rejectedIncomingService
                .controllerMethod
                .rejectedIncomingRemove(rejectedIncoming, $event)
                .then(function () {
                    self.reloadRejectedIncomings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Remove multiple selected rejected incoming mails
         * @param $event
         */
        self.removeBulkRejectedIncomings = function ($event) {
            rejectedIncomingService
                .controllerMethod
                .rejectedIncomingRemoveBulk(self.selectedRejectedIncomings, $event)
                .then(function () {
                    self.reloadRejectedIncomings(self.grid.page);
                });
        };

        /**
         * @description Change the status of rejected incoming mail
         * @param rejectedIncoming
         */
        self.changeStatusRejectedIncoming = function (rejectedIncoming) {
            self.statusServices[rejectedIncoming.status](rejectedIncoming)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    rejectedIncoming.status = !rejectedIncoming.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected rejected incoming mails
         * @param status
         */
        self.changeStatusBulkRejectedIncomings = function (status) {
            self.statusServices[status](self.selectedRejectedIncomings)
                .then(function () {
                    self.reloadRejectedIncomings(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('selected_status_updated'));
                        });
                });
        };

        /**
         * @description Launch distribution workflow for selected rejected incoming mails
         * @param $event
         */
        self.launchDistributionWorkflowBulk = function ($event) {

            var contentNotExist = _.filter(self.selectedRejectedIncomings, function (rejectedIncoming) {
                return !rejectedIncoming.hasContent();
            });
            if (contentNotExist.length > 0) {
                dialog.alertMessage(langService.get("content_not_found_bulk"));
                return;
            }

            /*distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSendBulk(self.selectedRejectedIncomings, "incoming", $event)
                .then(function () {
                    self.reloadRejectedIncomings(self.grid.page);
                })
                .catch(function () {
                    self.reloadRejectedIncomings(self.grid.page);
                });*/
            return correspondenceService
                .launchCorrespondenceWorkflow(self.selectedRejectedIncomings, $event, 'forward', 'favorites')
                .then(function () {
                    self.reloadRejectedIncomings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });

        };

        /**
         * @description Archive for selected review rejected incoming mails
         * @param $event
         */
        self.archiveIncomingBulk = function ($event) {
            rejectedIncomingService
                .controllerMethod
                .rejectedIncomingArchiveBulk(self.selectedRejectedIncomings, $event)
                .then(function (result) {
                    self.reloadRejectedIncomings(self.grid.page);
                });
        };

        /**
         * @description Send to review for selected rejected incoming mails
         * @param $event
         */
        self.sendToReviewBulk = function ($event) {
            rejectedIncomingService
                .controllerMethod
                .rejectedIncomingSendToReviewBulk(self.selectedRejectedIncomings, $event)
                .then(function () {
                    self.reloadRejectedIncomings(self.grid.page);
                });
        };


        self.editProperties = function (rejectedIncoming, $event) {
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
                .manageDocumentProperties(rejectedIncoming.vsId, rejectedIncoming.docClassName, rejectedIncoming.docSubject, $event)
                .then(function (document) {
                    rejectedIncoming = generator.preserveProperties(properties, rejectedIncoming, document);
                    self.reloadRejectedIncomings(self.grid.page);
                })
                .catch(function (document) {
                    rejectedIncoming = generator.preserveProperties(properties, rejectedIncoming, document);
                    self.reloadRejectedIncomings(self.grid.page);
                });
        };

        /**
         * @description Edit the Incoming content
         * @param rejectedIncoming
         * @param $event
         */
        self.editContent = function (rejectedIncoming, $event) {
            managerService.manageDocumentContent(rejectedIncoming.vsId, rejectedIncoming.docClassName, rejectedIncoming.docSubject, $event)
        };

        /**
         * @description Launch Distribution Workflow for the rejected incoming item
         * @param rejectedIncoming
         * @param $event
         * @param defer
         */
        self.launchDistributionWorkflow = function (rejectedIncoming, $event, defer) {

            if (!rejectedIncoming.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            /*distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSend(rejectedIncoming, false, false, null, "incoming", $event)
                .then(function (result) {
                    self.reloadRejectedIncomings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                    //self.replaceRecord(result);
                })
                .catch(function (result) {
                    self.reloadRejectedIncomings(self.grid.page);
                    //self.replaceRecord(result);
                });*/
            rejectedIncoming.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadRejectedIncomings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                });
        };
        /**
         * @description Archive the rejected incoming item
         * @param rejectedIncoming
         * @param $event
         * @param defer
         */
        self.archive = function (rejectedIncoming, $event, defer) {
            rejectedIncomingService
                .controllerMethod
                .rejectedIncomingArchive(rejectedIncoming, $event)
                .then(function (result) {
                    self.reloadRejectedIncomings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })

        };

        /**
         * @description Send the rejected incoming to review
         * @param rejectedIncoming
         * @param $event
         * @param defer
         */
        self.sendToReview = function (rejectedIncoming, $event, defer) {
            rejectedIncomingService.controllerMethod
                .rejectedIncomingSendToReview(rejectedIncoming, $event)
                .then(function (result) {
                    self.reloadRejectedIncomings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description View Tracking Sheet
         * @param rejectedIncoming
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (rejectedIncoming, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(rejectedIncoming, params, $event).then(function (result) {

            });
        };

        /**
         * @description Manage Tags
         * @param rejectedIncoming
         * @param $event
         */
        self.manageTags = function (rejectedIncoming, $event) {
            managerService.manageDocumentTags(rejectedIncoming.vsId, rejectedIncoming.docClassName, rejectedIncoming.docSubject, $event)
                .then(function (tags) {
                    rejectedIncoming.tags = tags;
                })
                .catch(function (tags) {
                    rejectedIncoming.tags = tags;
                });
        };

        /**
         * @description Manage Comments
         * @param rejectedIncoming
         * @param $event
         */
        self.manageComments = function (rejectedIncoming, $event) {
            managerService.manageDocumentComments(rejectedIncoming.vsId, rejectedIncoming.docSubject, $event)
                .then(function (documentComments) {
                    rejectedIncoming.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    rejectedIncoming.documentComments = documentComments;
                });
        };

        /**
         * @description Manage Attachments
         * @param rejectedIncoming
         * @param $event
         */
        self.manageAttachments = function (rejectedIncoming, $event) {
            rejectedIncoming.manageDocumentAttachments($event);
        };

        /**
         * @description Manage Linked Entities
         * @param rejectedIncoming
         * @param $event
         */
        self.manageLinkedEntities = function (rejectedIncoming, $event) {
            managerService
                .manageDocumentEntities(rejectedIncoming.vsId, rejectedIncoming.docClassName, rejectedIncoming.docSubject, $event);
        };

        /**
         * @description Manage Linked Documents
         * @param rejectedIncoming
         * @param $event
         * @returns {*}
         */
        self.manageLinkedDocuments = function (rejectedIncoming, $event) {
            var info = rejectedIncoming.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description Security
         * @param rejectedIncoming
         * @param $event
         */
        self.security = function (rejectedIncoming, $event) {
            console.log('manage security : ', rejectedIncoming);
        };

        /**
         * @description Destinations
         * @param rejectedIncoming
         * @param $event
         */
        self.manageDestinations = function (rejectedIncoming, $event) {
            managerService.manageDocumentCorrespondence(rejectedIncoming.vsId, rejectedIncoming.docClassName, rejectedIncoming.docSubject, $event)
        };

        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var isEditAllowed = employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES");
            if (checkForViewPopup)
                return !isEditAllowed;
            return isEditAllowed;
        };

        /**
         * @description Preview document
         * @param rejectedIncoming
         * @param $event
         */
        self.previewDocument = function (rejectedIncoming, $event) {
            if (!rejectedIncoming.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if(!employeeService.hasPermissionTo('VIEW_DOCUMENT')){
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            correspondenceService.viewCorrespondence(rejectedIncoming, self.gridActions, checkIfEditPropertiesAllowed(rejectedIncoming, true), true)
                .then(function () {
                    return self.reloadRejectedIncomings(self.grid.page);
                })
                .catch(function () {
                    return self.reloadRejectedIncomings(self.grid.page);
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
            console.log('view document');
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
                        gridName: 'incoming-rejected'
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
                showInView: false,
                callback: self.previewDocument,
                class: "action-green",
                permissionKey: 'VIEW_DOCUMENT',
                checkShow: function (action, model) {
                    //If no content or no view document permission, hide the button
                    return self.checkToShowAction(action, model) && model.hasContent();
                }
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
                callback: self.removeRejectedIncoming,
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
                    var hasPermission = (employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES") || employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT"));
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
                        permissionKey: "EDIT_INCOMING’S_CONTENT",
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
                        permissionKey: "EDIT_INCOMING’S_PROPERTIES",
                        checkShow: self.checkToShowAction
                    }
                ]
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
            // Archive
            {
                type: 'action',
                icon: 'archive',
                text: 'grid_action_archive',
                shortcut: true,
                callback: self.archive,
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
                showInView: false,
                callback: self.viewDocument,
                class: "action-green",
                permissionKey: 'VIEW_DOCUMENT',
                checkShow: function (action, model) {
                    //If no content or no view document permission, hide the button
                    return self.checkToShowAction(action, model) && model.hasContent();
                }
            }
        ];
    });
};