module.exports = function (app) {
    app.controller('readyToSendIncomingCtrl', function (lookupService,
                                                        readyToSendIncomingService,
                                                        readyToSendIncomings,
                                                        $q,
                                                        _,
                                                        $filter,
                                                        langService,
                                                        toast,
                                                        $state,
                                                        generator,
                                                        counterService,
                                                        dialog,
                                                        viewDocumentService,
                                                        employeeService,
                                                        managerService,
                                                        contextHelpService,
                                                        viewTrackingSheetService,
                                                        broadcastService,
                                                        correspondenceService,
                                                        ResolveDefer,
                                                        mailNotificationService,
                                                        rootEntity,
                                                        gridService) {
        'ngInject';
        var self = this;

        self.controllerName = 'readyToSendIncomingCtrl';

        contextHelpService.setHelpTo('incoming-ready-to-send');
        // employee service to check the permission in html
        self.employeeService = employeeService;

        /**
         * @description All ready to send incoming mails
         * @type {*}
         */
        self.readyToSendIncomings = readyToSendIncomings;
        self.readyToSendIncomingsCopy = angular.copy(self.readyToSendIncomings);

        /**
         * @description Contains the selected ready to send incoming mails
         * @type {Array}
         */
        self.selectedReadyToSendIncomings = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.incoming.readyToSend) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.incoming.readyToSend, self.readyToSendIncomings),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.incoming.readyToSend, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.incoming.readyToSend),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.incoming.readyToSend, self.grid.truncateSubject);
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
                self.readyToSendIncomings = gridService.searchGridData(self.grid, self.readyToSendIncomingsCopy);
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
            var index = _.findIndex(self.readyToSendIncomings, {'id': record.id});
            if (index > -1)
                self.readyToSendIncomings.splice(index, 1, record);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.readyToSendIncomings = $filter('orderBy')(self.readyToSendIncomings, self.grid.order);
        };

        /**
         * @description Reload the grid of ready to send incoming mail
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadReadyToSendIncomings = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return readyToSendIncomingService
                .loadReadyToSendIncomings()
                .then(function (result) {
                    counterService.loadCounters();
                    self.readyToSendIncomings = result;
                    self.readyToSendIncomingsCopy = angular.copy(self.readyToSendIncomings);
                    self.selectedReadyToSendIncomings = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
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
            return correspondenceService
                .launchCorrespondenceWorkflow(self.selectedReadyToSendIncomings, $event, 'forward', 'favorites')
                .then(function () {
                    self.reloadReadyToSendIncomings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });

        };

        /**
         * @description Archive for selected ready to send incoming mails
         * @param $event
         */
        self.archiveBulk = function ($event) {
            correspondenceService
                .archiveBulkCorrespondences(self.selectedReadyToSendIncomings, $event)
                .then(function () {
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

            readyToSendIncoming.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadReadyToSendIncomings(self.grid.page)
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
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            record.quickSendLaunchWorkflow($event, 'favorites')
                .then(function () {
                    self.reloadReadyToSendIncomings(self.grid.page)
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
            record.openLaunchSequentialWorkflowDialog($event)
                .then(function () {
                    self.reloadReadyToSendIncomings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description Archive the ready to send incoming item
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.archive = function (correspondence, $event, defer) {
            correspondence.archiveDocument($event)
                .then(function () {
                    self.reloadReadyToSendIncomings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
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
            readyToSendIncoming.manageDocumentComments($event)
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
            readyToSendIncoming.manageDocumentAttachments($event);
        };

        /**
         * @description Manage Linked Entities
         * @param readyToSendIncoming
         * @param $event
         */
        self.manageLinkedEntities = function (readyToSendIncoming, $event) {
            managerService
                .manageDocumentEntities(readyToSendIncoming.vsId, readyToSendIncoming.docClassName, readyToSendIncoming.docSubject, $event);
        };

        /**
         * @description Manage Linked Documents
         * @param readyToSendIncoming
         * @param $event
         */
        self.manageLinkedDocuments = function (readyToSendIncoming, $event) {
            var info = readyToSendIncoming.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description Security
         * @param readyToSendIncoming
         * @param $event
         */
        self.security = function (readyToSendIncoming, $event) {
          //  console.log('security : ', readyToSendIncoming);
        };

        /**
         * @description Destinations
         * @param readyToSendIncoming
         * @param $event
         */
        self.manageDestinations = function (readyToSendIncoming, $event) {
            managerService.manageDocumentCorrespondence(readyToSendIncoming.vsId, readyToSendIncoming.docClassName, readyToSendIncoming.docSubject, $event)
        };

        /**
         * @description broadcast selected organization and workflow group
         * @param readyToSendIncoming
         * @param $event
         * @param defer
         */
        self.broadcast = function (readyToSendIncoming, $event, defer) {
            readyToSendIncoming
                .correspondenceBroadcast($event)
                .then(function () {
                    self.reloadReadyToSendIncomings(self.grid.page)
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
         * @param readyToSendIncoming
         * @param $event
         */
        self.previewDocument = function (readyToSendIncoming, $event) {
            if (!readyToSendIncoming.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(readyToSendIncoming, self.gridActions, checkIfEditPropertiesAllowed(readyToSendIncoming, true), false)
                .then(function () {
                    return self.reloadReadyToSendIncomings(self.grid.page);
                })
                .catch(function () {
                    return self.reloadReadyToSendIncomings(self.grid.page);
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
            correspondence.viewFromQueue(self.gridActions, 'readyToSendIncoming', $event)
                .then(function () {
                    return self.reloadReadyToSendIncomings(self.grid.page);
                })
                .catch(function (error) {
                    return self.reloadReadyToSendIncomings(self.grid.page);
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
                        gridName: 'incoming-ready-to-send'
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
                        showInView: false,
                        class: "action-green",
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
                        showInView: false,
                        class: "action-green",
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
                    },
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
            // Launch Sequential Workflow
            {
                type: 'action',
                icon: gridService.gridIcons.actions.sequentialWF,
                text: 'grid_action_launch_sequential_workflow',
                callback: self.launchSequentialWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_SEQ_WF',
                checkShow: function (action, model) {
                    return rootEntity.hasPSPDFViewer() && !model.hasActiveSeqWF()
                        && !model.isCorrespondenceApprovedBefore() && !model.isBroadcasted();
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
                        class: "action-green",
                        permissionKey: "MANAGE_LINKED_ENTITIES",
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
                class: "action-green",
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
