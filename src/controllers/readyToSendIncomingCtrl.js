module.exports = function (app) {
    app.controller('readyToSendIncomingCtrl', function (lookupService,
                                                        readyToSendIncomingService,
                                                        readyToSendIncomings,
                                                        $q,
                                                        langService,
                                                        toast,
                                                        generator,
                                                        counterService,
                                                        dialog,
                                                        viewDocumentService,
                                                        employeeService,
                                                        managerService,
                                                        contextHelpService,
                                                        viewTrackingSheetService,
                                                        distributionWorkflowService,
                                                        broadcastService,
                                                        correspondenceService,
                                                        ResolveDefer) {
        'ngInject';
        var self = this;

        self.controllerName = 'readyToSendIncomingCtrl';
        self.currentEmployee = employeeService.getEmployee();
        self.progress = null;
        contextHelpService.setHelpTo('incoming-ready-to-send');
        // employee service to check the permission in html
        self.employeeService = employeeService;

        /**
         * @description All ready to send incoming mails
         * @type {*}
         */
        self.readyToSendIncomings = readyToSendIncomings;

        /**
         * @description Contains the selected ready to send incoming mails
         * @type {Array}
         */
        self.selectedReadyToSendIncomings = [];

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
                        return (self.readyToSendIncomings.length + 21);
                    }
                }
            ]
        };

        /**
         * @description Replaces the record in grid after update
         * @param record
         */
        self.replaceRecord = function (record) {
            var index = _.findIndex(self.readyToSendIncomings, {'id': record.id});
            if (index > -1)
                self.readyToSendIncomings.splice(index, 1, record);
        };

        /**
         * @description Reload the grid of ready to send incoming mail
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadReadyToSendIncomings = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return readyToSendIncomingService
                .loadReadyToSendIncomings()
                .then(function (result) {
                    counterService.loadCounters();
                    self.readyToSendIncomings = result;
                    self.selectedReadyToSendIncomings = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Delete multiple selected ready to send incoming mails
         * @param $event
         */
        self.removeBulkReadyToSendIncomings = function ($event) {
            console.log('delete ready to send incoming mails bulk : ', self.selectedReadyToSendIncomings);
        };

        /**
         * @description Change the status of ready to send incoming mail
         * @param readyToSendIncoming
         */
        self.changeStatusReadyToSendIncoming = function (readyToSendIncoming) {
            self.statusServices[readyToSendIncoming.status](readyToSendIncoming)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    readyToSendIncoming.status = !readyToSendIncoming.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected ready to send incoming mails
         * @param status
         */
        self.changeStatusBulkReadyToSendIncomings = function (status) {
            self.statusServices[status](self.selectedReadyToSendIncomings)
                .then(function () {
                    self.reloadReadyToSendIncomings(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('selected_status_updated'));
                        });
                });
        };

        /**
         * @description Launch distribution workflow for selected ready to send incoming mails
         * @param $event
         */
        self.launchDistributionWorkflowBulk = function ($event) {

            var contentNotExist = _.filter(self.selectedReadyToSendIncomings, function (readyToSendIncoming) {
                return !readyToSendIncoming.hasContent();
            });
            if (contentNotExist.length > 0) {
                dialog.alertMessage(langService.get("content_not_found_bulk"));
                return;
            }

            /*distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSendBulk(self.selectedReadyToSendIncomings, "incoming", $event)
                .then(function () {
                    self.reloadReadyToSendIncomings(self.grid.page);
                })
                .catch(function () {
                    self.reloadReadyToSendIncomings(self.grid.page);
                });*/
            return correspondenceService
                .launchCorrespondenceWorkflow(self.selectedReadyToSendIncomings, $event, 'forward', 'favorites')
                .then(function () {
                    self.reloadReadyToSendIncomings(self.grid.page);
                });

        };

        /**
         * @description Archive for selected review ready to send incoming mails
         * @param $event
         */
        self.archiveBulk = function ($event) {
            //console.log('archive ready to send incoming mails bulk : ', self.selectedReadyToSendIncomings);
            readyToSendIncomingService
                .controllerMethod
                .readyToSendIncomingArchiveBulk(self.selectedReadyToSendIncomings, $event)
                .then(function (result) {
                    self.reloadReadyToSendIncomings(self.grid.page);
                });

        };


        self.editProperties = function (readyToSendIncoming, $event) {
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
                .manageDocumentProperties(readyToSendIncoming.vsId, readyToSendIncoming.docClassName, readyToSendIncoming.docSubject, $event)
                .then(function (document) {
                    readyToSendIncoming = generator.preserveProperties(properties, readyToSendIncoming, document);
                    self.reloadReadyToSendIncomings(self.grid.page);
                })
                .catch(function (document) {
                    readyToSendIncoming = generator.preserveProperties(properties, readyToSendIncoming, document);
                    self.reloadReadyToSendIncomings(self.grid.page);
                });
        };

        /**
         * @description Edit the incoming content
         * @param readyToSendIncoming
         * @param $event
         */
        self.editContent = function (readyToSendIncoming, $event) {
            managerService.manageDocumentContent(readyToSendIncoming.vsId, readyToSendIncoming.docClassName, readyToSendIncoming.docSubject, $event)
        };

        /**
         * @description Launch Distribution Workflow
         * @param readyToSendIncoming
         * @param $event
         * @param defer
         */
        self.launchDistributionWorkflow = function (readyToSendIncoming, $event, defer) {

            if (!readyToSendIncoming.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
           /* distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSend(readyToSendIncoming, false, false, null, "incoming", $event)
                .then(function (result) {
                    self.reloadReadyToSendIncomings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
                .catch(function (result) {
                    self.reloadReadyToSendIncomings(self.grid.page);
                });*/
            readyToSendIncoming.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadReadyToSendIncomings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });

        };

        /**
         * @description Archive the ready to send incoming item
         * @param readyToSendIncoming
         * @param $event
         * @param defer
         */
        self.archive = function (readyToSendIncoming, $event, defer) {
            readyToSendIncomingService
                .controllerMethod
                .readyToSendIncomingArchive(readyToSendIncoming, $event)
                .then(function (result) {
                    self.reloadReadyToSendIncomings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description View Tracking Sheet
         * @param readyToSendIncoming
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (readyToSendIncoming, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(readyToSendIncoming, params, $event).then(function (result) {

            });
        };

        /**
         * @description Manage Tags
         * @param readyToSendIncoming
         * @param $event
         */
        self.manageTags = function (readyToSendIncoming, $event) {
            //console.log('manage tags', readyToSendIncoming);
            managerService.manageDocumentTags(readyToSendIncoming.vsId, readyToSendIncoming.docClassName, readyToSendIncoming.docSubject, $event)
                .then(function (tags) {
                    readyToSendIncoming.tags = tags;
                })
                .catch(function (tags) {
                    readyToSendIncoming.tags = tags;
                });
        };

        /**
         * @description Manage Comments
         * @param readyToSendIncoming
         * @param $event
         */
        self.manageComments = function (readyToSendIncoming, $event) {
            managerService.manageDocumentComments(readyToSendIncoming.vsId, readyToSendIncoming.docSubject, $event)
                .then(function (documentComments) {
                    readyToSendIncoming.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    readyToSendIncoming.documentComments = documentComments;
                });
        };

        /**
         * @description Manage Attachments
         * @param readyToSendIncoming
         * @param $event
         */
        self.manageAttachments = function (readyToSendIncoming, $event) {
            managerService.manageDocumentAttachments(readyToSendIncoming.vsId, readyToSendIncoming.docClassName, readyToSendIncoming.docSubject, $event)
                .then(function (attachments) {
                    readyToSendIncoming.attachments = attachments;
                })
                .catch(function (attachments) {
                    readyToSendIncoming.attachments = attachments;
                });
        };

        /**
         * @description Manage Entities
         * @param readyToSendIncoming
         * @param $event
         */
        self.manageEntities = function (readyToSendIncoming, $event) {
            console.log('manage entities : ', readyToSendIncoming);
            managerService
                .manageDocumentEntities(readyToSendIncoming.vsId, readyToSendIncoming.docClassName, readyToSendIncoming.docSubject, $event);
        };

        /**
         * @description Manage Linked Documents
         * @param readyToSendIncoming
         * @param $event
         */
        self.manageLinkedDocuments = function (readyToSendIncoming, $event) {
            //console.log('manage linked documents : ', readyToSendIncoming);
            var info = readyToSendIncoming.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description Security
         * @param readyToSendIncoming
         * @param $event
         */
        self.security = function (readyToSendIncoming, $event) {
            console.log('security : ', readyToSendIncoming);
        };

       /* /!**
         * @description Destinations
         * @param readyToSendIncoming
         * @param $event
         *!/
        self.manageDestinations = function (readyToSendIncoming, $event) {
            managerService.manageDocumentCorrespondence(readyToSendIncoming.vsId, readyToSendIncoming.docClassName, readyToSendIncoming.docSubject, $event)
        };*/

        /**
         * @description broadcast selected organization and workflow group
         * @param readyToSendIncoming
         * @param $event
         */
        self.broadcast = function (readyToSendIncoming, $event) {
            broadcastService
                .controllerMethod
                .broadcastSend(readyToSendIncoming, $event)
                .then(function () {
                    self.reloadReadyToSendIncomings(self.grid.page);
                })
                .catch(function () {
                    self.reloadReadyToSendIncomings(self.grid.page);
                });
        };


        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var isEditAllowed = employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES");
            if (checkForViewPopup)
                return !isEditAllowed;
            return isEditAllowed;
        };

        /**
         * @description View document
         * @param readyToSendIncoming
         * @param $event
         */
        self.viewDocument = function (readyToSendIncoming, $event) {
            if (!readyToSendIncoming.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(readyToSendIncoming, self.gridActions, checkIfEditPropertiesAllowed(readyToSendIncoming, true), true);
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
                        gridName: 'incoming-ready-to-send'
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
                        shortcut: false,
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
                        shortcut: false,
                        callback: self.editProperties,
                        class: "action-green",
                        permissionKey: "EDIT_INCOMING’S_PROPERTIES",
                        checkShow: self.checkToShowAction
                    }
                ]
            },
            // View Tracking Sheet
            {
                type: 'action',
                icon: 'eye',
                text: 'view_tracking_sheet',
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
                    // Entities
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
                    },
                    /*// Destinations
                    {
                        type: 'action',
                        icon: 'stop',
                        text: 'grid_action_destinations',
                        shortcut: false,
                        callback: self.manageDestinations,
                        permissionKey: "MANAGE_DESTINATIONS",
                        hide: false,
                        class: "action-yellow",
                        checkShow: self.checkToShowAction
                    }*/
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
                showInView: false,
                class: "action-green",
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
                class: "action-green",
                callback: self.broadcast,
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && (model.addMethod || model.approvers !== null);
                }
            }
        ];
    });
};