module.exports = function (app) {
    app.controller('readyToSendOutgoingCtrl', function (lookupService,
                                                        readyToSendOutgoingService,
                                                        readyToSendOutgoings,
                                                        $q,
                                                        _,
                                                        $filter,
                                                        langService,
                                                        toast,
                                                        generator,
                                                        counterService,
                                                        dialog,
                                                        viewDocumentService,
                                                        employeeService,
                                                        managerService,
                                                        $state,
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

        self.controllerName = 'readyToSendOutgoingCtrl';

        contextHelpService.setHelpTo('outgoing-ready-to-send');
        // employee service to check the permission in html
        self.employeeService = employeeService;

        /**
         * @description All ready to send outgoing mails
         * @type {*}
         */
        self.readyToSendOutgoings = readyToSendOutgoings;
        self.readyToSendOutgoingsCopy = angular.copy(self.readyToSendOutgoings);

        /**
         * @description Contains the selected ready to send outgoing mails
         * @type {Array}
         */
        self.selectedReadyToSendOutgoings = [];

        self.editInDesktop = function (workItem) {
            correspondenceService.editWordInDesktop(workItem);
        };

        self.viewInDeskTop = function (workItem) {
            return correspondenceService.viewWordInDesktop(workItem);
        };

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.outgoing.readyToSend) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.outgoing.readyToSend, self.readyToSendOutgoings),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.outgoing.readyToSend, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.outgoing.readyToSend),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.outgoing.readyToSend, self.grid.truncateSubject);
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
                self.readyToSendOutgoings = gridService.searchGridData(self.grid, self.readyToSendOutgoingsCopy);
            }
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.readyToSendOutgoings = $filter('orderBy')(self.readyToSendOutgoings, self.grid.order);
        };

        /**
         * @description Reload the grid of ready to send outgoing mail
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadReadyToSendOutgoings = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return readyToSendOutgoingService
                .loadReadyToSendOutgoings()
                .then(function (result) {
                    counterService.loadCounters();
                    self.readyToSendOutgoings = result;
                    self.readyToSendOutgoingsCopy = angular.copy(self.readyToSendOutgoings);
                    self.selectedReadyToSendOutgoings = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
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
            return correspondenceService
                .launchCorrespondenceWorkflow(self.selectedReadyToSendOutgoings, $event, 'forward', 'favorites')
                .then(function () {
                    self.reloadReadyToSendOutgoings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });
        };

        /**
         * @description Archive for selected ready to send outgoing mails
         * @param $event
         */
        self.archiveBulk = function ($event) {
            correspondenceService
                .archiveBulkCorrespondences(self.selectedReadyToSendOutgoings, $event)
                .then(function () {
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
            if (!readyToSendOutgoing.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }

            readyToSendOutgoing.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadReadyToSendOutgoings(self.grid.page)
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
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            record.quickSendLaunchWorkflow($event, 'favorites')
                .then(function () {
                    self.reloadReadyToSendOutgoings(self.grid.page)
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
                    self.reloadReadyToSendOutgoings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description Archive the ready to send outgoing item
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.archive = function (correspondence, $event, defer) {
            correspondence.archiveDocument($event)
                .then(function () {
                    self.reloadReadyToSendOutgoings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
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
            readyToSendOutgoing.manageDocumentComments($event)
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
            readyToSendOutgoing.manageDocumentAttachments($event);
        };

        /**
         * @description Manage Linked Entities
         * @param readyToSendOutgoing
         * @param $event
         */
        self.manageLinkedEntities = function (readyToSendOutgoing, $event) {
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
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
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
                return model.sendToCentralArchive(false, $event).then(function () {
                    self.reloadReadyToSendOutgoings(self.grid.page);
                    new ResolveDefer(defer);
                });

            model.sendToReadyToExport($event)
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

        var checkIfEditCorrespondenceSiteAllowed = function (model, checkForViewPopup) {
            var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
            if (checkForViewPopup)
                return !(hasPermission);
            return hasPermission;
        };

        /**
         * @description Preview document
         * @param readyToSendOutgoing
         * @param $event
         */
        self.previewDocument = function (readyToSendOutgoing, $event) {
            if (!readyToSendOutgoing.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            correspondenceService.viewCorrespondence(readyToSendOutgoing, self.gridActions, checkIfEditPropertiesAllowed(readyToSendOutgoing, true), false)
                .then(function () {
                    return self.reloadReadyToSendOutgoings(self.grid.page);
                })
                .catch(function () {
                    return self.reloadReadyToSendOutgoings(self.grid.page);
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
            correspondence.viewFromQueue(self.gridActions, 'readyToSendOutgoing', $event)
                .then(function () {
                    return self.reloadReadyToSendOutgoings(self.grid.page);
                })
                .catch(function (error) {
                    return self.reloadReadyToSendOutgoings(self.grid.page);
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
                    $state.go('app.outgoing.add', {
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
                    $state.go('app.outgoing.add', {
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
                    self.reloadReadyToSendOutgoings(self.grid.page).then(function () {
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
                        checkShow: function (action, model) {
                            return true;
                        },
                        gridName: 'outgoing-ready-to-send'
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
                    // preview
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
                    return info.isPaper;
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
                permissionKey: 'SEND_TO_READY_TO_EXPORT_QUEUE',
                checkShow: function (action, model) {
                    return model.addMethod && model.hasContent() && !model.hasActiveSeqWF();
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
                    return rootEntity.hasPSPDFViewer() && !model.hasActiveSeqWF() && !model.isCorrespondenceApprovedBefore() && !model.isCompositeSites() && !model.isBroadcasted();
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
                        checkShow: function (action, model) {
                            var info = model.getInfo(),
                                hasPermission = (info.isPaper ? employeeService.hasPermissionTo("EDIT_OUTGOING_PAPER") : employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));

                            return hasPermission;
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
                        permissionKey: "EDIT_OUTGOING_PROPERTIES",
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
                        callback: self.editInDesktop,
                        class: "action-green",
                        showInView: false,
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            var hasPermission = false;
                            if (info.documentClass === 'outgoing') {
                                hasPermission = (info.isPaper ? employeeService.hasPermissionTo("EDIT_OUTGOING_PAPER") : employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
                            } else if (info.documentClass === 'incoming') {
                                hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT");
                            } else if (info.documentClass === 'internal') {
                                hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT");
                            }
                            return !info.isPaper
                                && (info.documentClass !== 'incoming')
                                && model.needApprove()
                                && hasPermission;
                        }
                    },
                ]
            },
            // e-Signature
            {
                type: 'action',
                icon: 'check-decagram',
                text: 'grid_action_electronic_approve',
                callback: self.docActionApprove,
                class: "action-green",
                permissionKey: 'ELECTRONIC_SIGNATURE',
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return !info.isPaper;
                }
            },
            // View Tracking Sheet
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view_tracking_sheet',
                shortcut: false,
                permissionKey: ["VIEW_DOCUMENT'S_TRACKING_SHEET"],
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
                        //hide: true,
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
            // Manage Security
            {
                type: 'action',
                icon: 'security',
                text: 'grid_action_security',
                shortcut: false,
                callback: self.manageSecurity,
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
                hide: false,
                permissionKey: 'BROADCAST_DOCUMENT',
                callback: self.broadcast,
                checkShow: function (action, model) {
                    return (!!model.addMethod || (model.hasOwnProperty('approvers') && model.approvers !== null)) && (model.getSecurityLevelLookup().lookupKey !== 4)
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
                    "DUPLICATE_BOOK_CURRENT",
                    "DUPLICATE_BOOK_FROM_VERSION"
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
                    }]
            }

        ];

        self.shortcutActions = gridService.getShortcutActions(self.gridActions);
        self.contextMenuActions = gridService.getContextMenuActions(self.gridActions);
    });
};
