module.exports = function (app) {
    app.controller('readyToSendInternalCtrl', function (lookupService,
                                                        readyToSendInternalService,
                                                        readyToSendInternals,
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
                                                        distributionWorkflowService,
                                                        contextHelpService,
                                                        broadcastService,
                                                        correspondenceService,
                                                        ResolveDefer) {
        'ngInject';
        var self = this;

        self.controllerName = 'readyToSendInternalCtrl';
        self.currentEmployee = employeeService.getEmployee();
        self.progress = null;
        // employee service to check the permission in html
        self.employeeService = employeeService;

        contextHelpService.setHelpTo('internal-ready-to-send');

        /**
         * @description All ready to send internal mails
         * @type {*}
         */
        self.readyToSendInternals = readyToSendInternals;

        /**
         * @description Contains the selected ready to send internal mails
         * @type {Array}
         */
        self.selectedReadyToSendInternals = [];

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
                        return (self.readyToSendInternals.length + 21);
                    }
                }
            ]
        };

        /**
         * @description Replaces the record in grid after update
         * @param record
         */
        self.replaceRecord = function (record) {
            var index = _.findIndex(self.readyToSendInternals, {'id': record.id});
            if (index > -1)
                self.readyToSendInternals.splice(index, 1, record);
        };

        /**
         * @description Reload the grid of ready to send internal mail
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadReadyToSendInternals = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return readyToSendInternalService
                .loadReadyToSendInternals()
                .then(function (result) {
                    counterService.loadCounters();
                    self.readyToSendInternals = result;
                    self.selectedReadyToSendInternals = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Launch distribution workflow for selected ready to send internal mails
         * @param $event
         */
        self.launchDistributionWorkflowBulk = function ($event) {

            var contentNotExist = _.filter(self.selectedReadyToSendInternals, function (readyToSendInternal) {
                return !readyToSendInternal.hasContent();
            });
            if (contentNotExist.length > 0) {
                dialog.alertMessage(langService.get("content_not_found_bulk"));
                return;
            }

           /* distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSendBulk(self.selectedReadyToSendInternals, "internal", $event)
                .then(function () {
                    self.reloadReadyToSendInternals(self.grid.page);
                })
                .catch(function () {
                    self.reloadReadyToSendInternals(self.grid.page);
                });*/
            return correspondenceService
                .launchCorrespondenceWorkflow(self.selectedReadyToSendInternals, $event, 'forward', 'favorites')
                .then(function () {
                    self.reloadReadyToSendInternals(self.grid.page);
                });
        };

        /**
         * @description Archive for selected review ready to send internal mails
         * @param $event
         */
        self.archiveReadyToSendInternalBulk = function ($event) {
            //console.log('archive ready to send internal mails bulk : ', self.selectedReadyToSendInternals);
            readyToSendInternalService
                .controllerMethod
                .readyToSendInternalArchiveBulk(self.selectedReadyToSendInternals, $event)
                .then(function (result) {
                    self.reloadReadyToSendInternals(self.grid.page);
                });
        };

        /**
         * @description Edit Properties
         * @param readyToSendInternal
         * @param $event
         */
        self.editProperties = function (readyToSendInternal, $event) {
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
                .manageDocumentProperties(readyToSendInternal.vsId, readyToSendInternal.docClassName, readyToSendInternal.docSubject, $event)
                .then(function (document) {
                    readyToSendInternal = generator.preserveProperties(properties, readyToSendInternal, document);
                    self.reloadReadyToSendInternals(self.grid.page);
                })
                .catch(function (document) {
                    readyToSendInternal = generator.preserveProperties(properties, readyToSendInternal, document);
                    self.reloadReadyToSendInternals(self.grid.page);
                });
        };

        /**
         * @description Edit the internal content
         * @param readyToSendInternal
         * @param $event
         */
        self.editContent = function (readyToSendInternal, $event) {
            managerService.manageDocumentContent(readyToSendInternal.vsId, readyToSendInternal.docClassName, readyToSendInternal.docSubject, $event)
        };

        /**
         * @description Launch Distribution Workflow
         * @param readyToSendInternal
         * @param $event
         * @param defer
         */
        self.launchDistributionWorkflow = function (readyToSendInternal, $event, defer) {

            if (!readyToSendInternal.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            /*distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSend(readyToSendInternal, false, false, null, "internal", $event)
                .then(function (result) {
                    self.reloadReadyToSendInternals(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
                .catch(function (result) {
                    self.reloadReadyToSendInternals(self.grid.page);
                });*/
            readyToSendInternal.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadReadyToSendInternals(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };
        /**
         * @description Archive the ready to send internal item
         * @param readyToSendInternal
         * @param $event
         * @param defer
         */
        self.archiveInternal = function (readyToSendInternal, $event, defer) {
            readyToSendInternalService
                .controllerMethod
                .readyToSendInternalArchive(readyToSendInternal, $event)
                .then(function (result) {
                    self.reloadReadyToSendInternals(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description View Tracking Sheet
         * @param readyToSendInternal
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (readyToSendInternal, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(readyToSendInternal, params, $event).then(function (result) {

            });
        };

        /**
         * @description Manage Tags
         * @param readyToSendInternal
         * @param $event
         */
        self.manageTags = function (readyToSendInternal, $event) {
            managerService.manageDocumentTags(readyToSendInternal.vsId, readyToSendInternal.docClassName, readyToSendInternal.docSubject, $event)
                .then(function (tags) {
                    readyToSendInternal.tags = tags;
                })
                .catch(function (tags) {
                    readyToSendInternal.tags = tags;
                });
        };

        /**
         * @description Manage Comments
         * @param readyToSendInternal
         * @param $event
         */
        self.manageComments = function (readyToSendInternal, $event) {
            managerService.manageDocumentComments(readyToSendInternal.vsId, readyToSendInternal.docSubject, $event)
                .then(function (documentComments) {
                    readyToSendInternal.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    readyToSendInternal.documentComments = documentComments;
                });
        };

        /**
         * @description Manage Attachments
         * @param readyToSendInternal
         * @param $event
         */
        self.manageAttachments = function (readyToSendInternal, $event) {
            managerService.manageDocumentAttachments(readyToSendInternal.vsId, readyToSendInternal.docClassName, readyToSendInternal.docSubject, $event)
                .then(function (attachments) {
                    readyToSendInternal.attachments = attachments;
                })
                .catch(function (attachments) {
                    readyToSendInternal.attachments = attachments;
                });
        };

        /**
         * @description Manage Entities
         * @param readyToSendInternal
         * @param $event
         */
        self.manageEntities = function (readyToSendInternal, $event) {
            console.log('manage entities : ', readyToSendInternal);
            var info = readyToSendInternal.getInfo();
            managerService
                .manageDocumentEntities(info.vsId, info.documentClass, info.title, $event);
        };

        /**
         * @description Manage Linked Documents
         * @param readyToSendInternal
         * @param $event
         * @returns {*}
         */
        self.manageLinkedDocuments = function (readyToSendInternal, $event) {
            console.log('manage linked documents : ', readyToSendInternal);
            var info = readyToSendInternal.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description Security
         * @param readyToSendInternal
         * @param $event
         */
        self.security = function (readyToSendInternal, $event) {
            console.log('security : ', readyToSendInternal);
        };

        /**
         * @description broadcast selected organization and workflow group
         * @param readyToSendInternal
         * @param $event
         */
        self.broadcast = function (readyToSendInternal, $event) {
            broadcastService
                .controllerMethod
                .broadcastSend(readyToSendInternal, $event)
                .then(function () {
                    self.reloadReadyToSendInternals(self.grid.page);
                })
                .catch(function () {
                    self.reloadReadyToSendInternals(self.grid.page);
                });
        };

        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var isEditAllowed = employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES");
            if (checkForViewPopup)
                return !isEditAllowed;
            return isEditAllowed;
        };

        /**
         * @description View document
         * @param readyToSendInternal
         * @param $event
         */
        self.viewDocument = function (readyToSendInternal, $event) {
            if (!readyToSendInternal.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if(!employeeService.hasPermissionTo('VIEW_DOCUMENT')){
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(readyToSendInternal, self.gridActions, checkIfEditPropertiesAllowed(readyToSendInternal, true), false);
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
                        gridName: 'internal-ready-to-send'
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
            /*// Edit Properties
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit_internal_properties',
                shortcut: false,
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
                shortcut: false,
                showInView: false,
                permissionKey: "EDIT_INTERNAL_CONTENT",
                callback: self.editContent,
                class: "action-green",
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
                callback: self.archiveInternal,
                class: "action-green",
                checkShow: self.checkToShowAction
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
            },
            // Broadcast
            {
                type: 'action',
                icon: 'bullhorn',
                text: 'grid_action_broadcast',
                shortcut: false,
                callback: self.broadcast,
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && (!!model.addMethod || model.hasOwnProperty('approvers') && model.approvers !== null);
                }
            }
        ];

    });
};