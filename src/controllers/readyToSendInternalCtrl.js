module.exports = function (app) {
    app.controller('readyToSendInternalCtrl', function (lookupService,
                                                        readyToSendInternalService,
                                                        readyToSendInternals,
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
                                                        viewTrackingSheetService,
                                                        contextHelpService,
                                                        broadcastService,
                                                        correspondenceService,
                                                        ResolveDefer,
                                                        mailNotificationService,
                                                        rootEntity,
                                                        gridService) {
        'ngInject';
        var self = this;

        self.controllerName = 'readyToSendInternalCtrl';

        // employee service to check the permission in html
        self.employeeService = employeeService;
        self.employee = employeeService.getEmployee();

        contextHelpService.setHelpTo('internal-ready-to-send');

        /**
         * @description All ready to send internal mails
         * @type {*}
         */
        self.readyToSendInternals = readyToSendInternals;
        self.readyToSendInternalsCopy = angular.copy(self.readyToSendInternals);

        /**
         * @description Contains the selected ready to send internal mails
         * @type {Array}
         */
        self.selectedReadyToSendInternals = [];

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
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.internal.readyToSend) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.internal.readyToSend, self.readyToSendInternals),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.internal.readyToSend, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.internal.readyToSend),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.internal.readyToSend, self.grid.truncateSubject);
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
                self.readyToSendInternals = gridService.searchGridData(self.grid, self.readyToSendInternalsCopy);
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
            var index = _.findIndex(self.readyToSendInternals, {'id': record.id});
            if (index > -1)
                self.readyToSendInternals.splice(index, 1, record);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.readyToSendInternals = $filter('orderBy')(self.readyToSendInternals, self.grid.order);
        };

        /**
         * @description Reload the grid of ready to send internal mail
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadReadyToSendInternals = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return readyToSendInternalService
                .loadReadyToSendInternals()
                .then(function (result) {
                    counterService.loadCounters();
                    self.readyToSendInternals = result;
                    self.readyToSendInternalsCopy = angular.copy(self.readyToSendInternals);
                    self.selectedReadyToSendInternals = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
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
            return correspondenceService
                .launchCorrespondenceWorkflow(self.selectedReadyToSendInternals, $event, 'forward', self.employee.isDefaultTabFavoriteAtLaunch() ? 'favorites' : 'users')
                .then(function () {
                    self.reloadReadyToSendInternals(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });
        };

        /**
         * @description Archive for selected ready to send internal mails
         * @param $event
         */
        self.archiveBulk = function ($event) {
            correspondenceService
                .archiveBulkCorrespondences(self.selectedReadyToSendInternals, $event)
                .then(function () {
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

            readyToSendInternal.launchWorkFlow($event, 'forward', self.employee.isDefaultTabFavoriteAtLaunch() ? 'favorites' : 'users')
                .then(function () {
                    self.reloadReadyToSendInternals(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Launch distribution workflow with quick send
         * @param record
         * @param $event
         * @param defer
         */
        self.quickSend = function (record, $event, defer) {
            if (!record.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            record.quickSendLaunchWorkflow($event, self.employee.isDefaultTabFavoriteAtLaunch() ? 'favorites' : 'users')
                .then(function () {
                    self.reloadReadyToSendInternals(self.grid.page)
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
                    self.reloadReadyToSendInternals(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description Archive the ready to send internal item
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.archive = function (correspondence, $event, defer) {
            correspondence.archiveDocument($event)
                .then(function () {
                    self.reloadReadyToSendInternals(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
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
            readyToSendInternal.manageDocumentComments($event)
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
            readyToSendInternal.manageDocumentAttachments($event);
        };

        /**
         * @description Manage Linked Entities
         * @param readyToSendInternal
         * @param $event
         */
        self.manageLinkedEntities = function (readyToSendInternal, $event) {
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
         * @param defer
         */
        self.broadcast = function (readyToSendInternal, $event, defer) {
            readyToSendInternal
                .correspondenceBroadcast($event)
                .then(function () {
                    self.reloadReadyToSendInternals(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        })
                });
        };

        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var isEditAllowed = employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES");
            if (checkForViewPopup)
                return !isEditAllowed;
            return isEditAllowed;
        };

        /**
         * @description Preview document
         * @param readyToSendInternal
         * @param $event
         */
        self.previewDocument = function (readyToSendInternal, $event) {
            if (!readyToSendInternal.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(readyToSendInternal, self.gridActions, checkIfEditPropertiesAllowed(readyToSendInternal, true), false)
                .then(function () {
                    return self.reloadReadyToSendInternals(self.grid.page);
                })
                .catch(function () {
                    return self.reloadReadyToSendInternals(self.grid.page);
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
            correspondence.viewFromQueue(self.gridActions, 'readyToSendInternal', $event)
                .then(function () {
                    return self.reloadReadyToSendInternals(self.grid.page);
                })
                .catch(function (error) {
                    return self.reloadReadyToSendInternals(self.grid.page);
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
            return correspondence
                .duplicateSpecificVersion($event)
                .then(function () {
                    $state.go('app.internal.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        wobNum: info.wobNumber
                    });
                });
        };

        /**
         * @description Approve the document
         * @param correspondence
         * @param $event
         * @param defer
         * @returns {*}
         */
        self.docActionApprove = function (correspondence, $event, defer) {
            correspondence.approveDocument($event, defer, false)
                .then(function (result) {
                    self.reloadReadyToSendInternals(self.grid.page).then(function () {
                        counterService.loadCounters();
                        mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
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
         * @description add workItem to broadcast FollowUp
         * @param item
         */
        self.addToBroadcastFollowUp = function (item) {
            item.addToBroadcastFollowUp();
        };

        self.getTrackingSheetCallback = function (record, $event) {
            var action = self.gridActions.find(action => {
                return action.text === "grid_action_view_tracking_sheet" && action.onlyShortcut;
            });

            return action.callback(record, action.params, $event);
        }

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
                        gridName: 'internal-ready-to-send'
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
                        showInView: false,
                        callback: self.previewDocument,
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
                        showInView: false,
                        callback: self.viewDocument,
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
                        icon: 'book-search',
                        text: 'grid_action_to_employee_followup',
                        shortcut: true,
                        callback: self.addToEmployeeFollowUp,
                        permissionKey: 'ADMIN_USER_FOLLOWUP_BOOKS',
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // add to broadcast follow up
                    {
                        type: 'action',
                        icon: 'book-multiple',
                        text: 'grid_action_to_broadcast_followup',
                        shortcut: true,
                        callback: self.addToBroadcastFollowUp,
                        permissionKey: 'ADMIN_USER_FOLLOWUP_BOOKS',
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
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
                    "EDIT_INTERNAL_CONTENT",
                    "EDIT_INTERNAL_PROPERTIES"
                ],
                checkAnyPermission: true,
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
                        permissionKey: "EDIT_INTERNAL_PROPERTIES",
                        checkShow: function (action, model) {
                            return true;
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
                    return rootEntity.hasPSPDFViewer() && !model.hasActiveSeqWF() && !model.isCorrespondenceApprovedBefore() && !model.isBroadcasted();
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
            // View Tracking Sheet (Shortcut Only)
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view_tracking_sheet',
                shortcut: true,
                onlyShortcut: true,
                showInView: false,
                hide: true,
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: function (action, model) {
                    return true;
                },
                callback: self.viewTrackingSheet,
                params: ['view_tracking_sheet', 'tabs']
            },
            // e-Signature
            {
                type: 'action',
                icon: 'check-decagram',
                text: 'grid_action_electronic_approve',
                callback: self.docActionApprove,
                class: "action-green",
                permissionKey: 'ELECTRONIC_SIGNATURE_MEMO',
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return !info.isPaper;
                }
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
                        checkShow: function (action, model) {
                            return true;
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
                permissionKey: 'BROADCAST_DOCUMENT',
                callback: self.broadcast,
                checkShow: function (action, model) {
                    return (!!model.addMethod || model.hasOwnProperty('approvers') && model.approvers !== null) && (model.getSecurityLevelLookup().lookupKey !== 4)
                        && !model.hasActiveSeqWF();
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
                    "DUPLICATE_BOOK_FROM_VERSION",
                    "DUPLICATE_BOOK_CURRENT"
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
