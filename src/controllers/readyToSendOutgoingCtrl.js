module.exports = function (app) {
    app.controller('readyToSendOutgoingCtrl', function (lookupService,
                                                        readyToSendOutgoingService,
                                                        readyToSendOutgoings,
                                                        $q,
                                                        langService,
                                                        toast,
                                                        generator,
                                                        counterService,
                                                        dialog,
                                                        viewDocumentService,
                                                        employeeService,
                                                        managerService,
                                                        viewTrackingSheetService,
                                                        contextHelpService,
                                                        distributionWorkflowService,
                                                        broadcastService,
                                                        correspondenceService,
                                                        ResolveDefer,
                                                        mailNotificationService) {
        'ngInject';
        var self = this;

        self.controllerName = 'readyToSendOutgoingCtrl';
        self.currentEmployee = employeeService.getEmployee();
        self.progress = null;
        contextHelpService.setHelpTo('outgoing-ready-to-send');
        // employee service to check the permission in html
        self.employeeService = employeeService;

        /**
         * @description All ready to send outgoing mails
         * @type {*}
         */
        self.readyToSendOutgoings = readyToSendOutgoings;

        /**
         * @description Contains the selected ready to send outgoing mails
         * @type {Array}
         */
        self.selectedReadyToSendOutgoings = [];

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
                        return (self.readyToSendOutgoings.length + 21);
                    }
                }
            ]
        };


        /**
         * @description Reload the grid of ready to send outgoing mail
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadReadyToSendOutgoings = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return readyToSendOutgoingService
                .loadReadyToSendOutgoings()//self.currentEmployee.defaultOUID
                .then(function (result) {
                    counterService.loadCounters();
                    self.readyToSendOutgoings = result;
                    self.selectedReadyToSendOutgoings = [];
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
        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };

        /**
         * @description Launch distribution workflow for selected ready to send outgoing mails
         * @param $event
         */
        self.launchDistributionWorkflowBulk = function ($event) {
            var contentNotExist = _.filter(self.selectedReadyToSendOutgoings, function (readyToSendOutgoing) {
                return !readyToSendOutgoing.hasContent();
            });
            if (contentNotExist.length > 0) {
                dialog.alertMessage(langService.get("content_not_found_bulk"));
                return;
            }

            /*distributionWorkflowService
             .controllerMethod
             .distributionWorkflowSendBulk(self.selectedReadyToSendOutgoings, "outgoing", $event)
             .then(function () {
             self.reloadReadyToSendOutgoings(self.grid.page);
             })
             .catch(function () {
             self.reloadReadyToSendOutgoings(self.grid.page);
             });*/
            return correspondenceService
                .launchCorrespondenceWorkflow(self.selectedReadyToSendOutgoings, $event, 'forward', 'favorites')
                .then(function () {
                    self.reloadReadyToSendOutgoings(self.grid.page)
                        .then(function(){
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);;
                        });
                });
        };

        /**
         * @description Archive for selected review ready to send outgoing mails
         * @param $event
         */
        self.archiveOutgoingBulk = function ($event) {
            //console.log('archive ready to send outgoing mails bulk : ', self.selectedReadyToSendOutgoings);
            readyToSendOutgoingService
                .controllerMethod
                .readyToSendOutgoingArchiveBulk(self.selectedReadyToSendOutgoings, $event)
                .then(function (result) {
                    self.reloadReadyToSendOutgoings(self.grid.page);
                });
        };


        self.editProperties = function (readyToSendOutgoing, $event) {
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
                .manageDocumentProperties(readyToSendOutgoing.vsId, readyToSendOutgoing.docClassName, readyToSendOutgoing.docSubject, $event)
                .then(function (document) {
                    readyToSendOutgoing = generator.preserveProperties(properties, readyToSendOutgoing, document);
                    self.reloadReadyToSendOutgoings(self.grid.page);
                })
                .catch(function (document) {
                    readyToSendOutgoing = generator.preserveProperties(properties, readyToSendOutgoing, document);
                    self.reloadReadyToSendOutgoings(self.grid.page);
                });
        };

        /**
         * @description Edit the outgoing content
         * @param readyToSendOutgoing
         * @param $event
         */
        self.editContent = function (readyToSendOutgoing, $event) {
            managerService.manageDocumentContent(readyToSendOutgoing.vsId, readyToSendOutgoing.docClassName, readyToSendOutgoing.docSubject, $event)
        };

        /**
         * @description Launch Distribution Workflow
         * @param readyToSendOutgoing
         * @param $event
         * @param defer
         */
        self.launchDistributionWorkflow = function (readyToSendOutgoing, $event, defer) {
            //console.log('launch distribution workflow');

            if (!readyToSendOutgoing.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            /*distributionWorkflowService
             .controllerMethod
             .distributionWorkflowSend(readyToSendOutgoing, false, false, null, "outgoing", $event)
             .then(function (result) {
             self.reloadReadyToSendOutgoings(self.grid.page)
             .then(function () {
             new ResolveDefer(defer);
             });
             //self.replaceRecord(result);
             })
             .catch(function (result) {
             self.reloadReadyToSendOutgoings(self.grid.page);
             //self.replaceRecord(result);
             });*/
            readyToSendOutgoing.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadReadyToSendOutgoings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);;
                            new ResolveDefer(defer);
                        });
                });
        };
        /**
         * @description Archive the ready to send outgoing item
         * @param readyToSendOutgoing
         * @param $event
         * @param defer
         */
        self.archiveOutgoing = function (readyToSendOutgoing, $event, defer) {
            //console.log('archive outgoing : ', readyToSendOutgoing);
            readyToSendOutgoingService
                .controllerMethod
                .readyToSendOutgoingArchive(readyToSendOutgoing, $event)
                .then(function (result) {
                    self.reloadReadyToSendOutgoings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description View Tracking Sheet
         * @param readyToSendOutgoing
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (readyToSendOutgoing, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(readyToSendOutgoing, params, $event).then(function (result) {

            });
        };

        /**
         * @description Manage Tags
         * @param readyToSendOutgoing
         * @param $event
         */
        self.manageTags = function (readyToSendOutgoing, $event) {
            managerService.manageDocumentTags(readyToSendOutgoing.vsId, readyToSendOutgoing.classDescription, readyToSendOutgoing.docSubject, $event)
                .then(function (tags) {
                    readyToSendOutgoing.tags = tags;
                })
                .catch(function (tags) {
                    readyToSendOutgoing.tags = tags;
                });
        };

        /**
         * @description Manage Comments
         * @param readyToSendOutgoing
         * @param $event
         */
        self.manageComments = function (readyToSendOutgoing, $event) {
            managerService.manageDocumentComments(readyToSendOutgoing.vsId, readyToSendOutgoing.docSubject, $event)
                .then(function (documentComments) {
                    readyToSendOutgoing.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    readyToSendOutgoing.documentComments = documentComments;
                });
        };

        /**
         * @description Manage Attachments
         * @param readyToSendOutgoing
         * @param $event
         */
        self.manageAttachments = function (readyToSendOutgoing, $event) {
            //console.log('manage attachments');
            managerService.manageDocumentAttachments(readyToSendOutgoing.vsId, readyToSendOutgoing.classDescription, readyToSendOutgoing.docSubject, $event)
                .then(function (attachments) {
                    readyToSendOutgoing.attachments = attachments;
                })
                .catch(function (attachments) {
                    readyToSendOutgoing.attachments = attachments;
                });
        };

        /**
         * @description Manage Entities
         * @param readyToSendOutgoing
         * @param $event
         */
        self.manageEntities = function (readyToSendOutgoing, $event) {
            console.log('manage entities : ', readyToSendOutgoing);
            managerService
                .manageDocumentEntities(readyToSendOutgoing.vsId, readyToSendOutgoing.classDescription, readyToSendOutgoing.docSubject, $event);
        };

        /**
         * @description Manage Linked Documents
         * @param readyToSendOutgoing
         * @param $event
         * @returns {*}
         */
        self.manageLinkedDocuments = function (readyToSendOutgoing, $event) {
            //console.log('manage linked documents : ', readyToSendOutgoing);
            var info = readyToSendOutgoing.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description Manage Security
         * @param readyToSendOutgoing
         * @param $event
         */
        self.manageSecurity = function (readyToSendOutgoing, $event) {
            console.log('manage security : ', readyToSendOutgoing);
        };

        /**
         * @description Manage destinations
         * @param readyToSendOutgoing
         * @param $event
         */
        self.manageDestinations = function (readyToSendOutgoing, $event) {
            //console.log('manage destinations : ', readyToSendOutgoing);
            managerService.manageDocumentCorrespondence(readyToSendOutgoing.vsId, readyToSendOutgoing.docClassName, readyToSendOutgoing.docSubject, $event)
        };


        // self.broadcast = function (readyToSendOutgoing, $event) {
        //     broadcastService
        //         .controllerMethod
        //         .broadcastSend(readyToSendOutgoing, $event)
        //         .then(function () {
        //             self.reloadReadyToSendOutgoings(self.grid.page);
        //         })
        //         .catch(function () {
        //             self.reloadReadyToSendOutgoings(self.grid.page);
        //         });
        // };
        /**
         * @description broadcast selected organization and workflow group
         * @param readyToSendOutgoing
         * @param $event
         * @param defer
         */
        self.broadcast = function (readyToSendOutgoing, $event, defer) {
            readyToSendOutgoing
                .correspondenceBroadcast($event)
                .then(function () {
                    self.reloadReadyToSendOutgoings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);;
                            new ResolveDefer(defer);
                        })
                })
        };


        /**
         * @description send to ready to export
         * @param model
         * @param $event
         * @param defer
         */
        self.sentToReadyToExport = function (model, $event, defer) {
            if (model.fromCentralArchive())
                return model.sendToCentralArchive().then(function () {
                    self.reloadReadyToSendOutgoings(self.grid.page);
                    new ResolveDefer(defer);
                });

            model.sendToReadyToExport()
                .then(function () {
                    self.reloadReadyToSendOutgoings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Print Barcode
         * @param model
         * @param $event
         */
        self.printBarcode = function (model, $event) {
            model.barcodePrint($event);
        };


        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var isEditAllowed = employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES");
            if (checkForViewPopup)
                return !isEditAllowed;
            return isEditAllowed;
        };

        /**
         * @description View document
         * @param readyToSendOutgoing
         * @param $event
         */
        self.viewDocument = function (readyToSendOutgoing, $event) {
            //console.log(readyToSendOutgoing);
            if (!readyToSendOutgoing.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            correspondenceService.viewCorrespondence(readyToSendOutgoing, self.gridActions, checkIfEditPropertiesAllowed(readyToSendOutgoing, true), false);
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
            //Document Information
            {
                type: 'action',
                icon: 'information-variant',
                text: 'grid_action_document_info',
                showInView: false,
                shortcut: false,
                subMenu: [
                    {
                        type: 'info',
                        checkShow: self.checkToShowAction,
                        gridName: 'outgoing-ready-to-send'
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
                    return self.checkToShowAction(action, model) && info.isPaper;
                }
            },
            // Send To Ready To Export
            {
                type: 'action',
                icon: 'export',
                text: 'grid_action_send_to_ready_to_export',
                shortcut: true,
                callback: self.sentToReadyToExport,
                textCallback: function (model) {
                    return model.fromCentralArchive() ? 'grid_action_send_to_central_archive' : 'grid_action_send_to_ready_to_export';
                },
                class: "action-green",
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && model.addMethod && model.hasContent();
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
                text: 'view_tracking_sheet',
                shortcut: false,
                permissionKey: ["VIEW_DOCUMENT'S_TRACKING_SHEET"],
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
            // Manage Security
            {
                type: 'action',
                icon: 'security',
                text: 'grid_action_security',
                shortcut: false,
                callback: self.manageSecurity,
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
                hide: false,
                callback: self.broadcast,
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && (!!model.addMethod || (model.hasOwnProperty('approvers') && model.approvers !== null));
                }
            }
        ];
    });
};