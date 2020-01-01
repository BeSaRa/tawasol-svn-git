module.exports = function (app) {
    app.controller('rejectedInternalCtrl', function (lookupService,
                                                     rejectedInternalService,
                                                     rejectedInternals,
                                                     $q,
                                                     _,
                                                     $filter,
                                                     counterService,
                                                     $state,
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
                                                     correspondenceService,
                                                     ResolveDefer,
                                                     mailNotificationService,
                                                     gridService) {
        'ngInject';
        var self = this;

        self.controllerName = 'rejectedInternalCtrl';

        // employee service to check the permission in html
        self.employeeService = employeeService;

        contextHelpService.setHelpTo('internal-rejected');
        /**
         * @description All rejected internal mails
         * @type {*}
         */
        self.rejectedInternals = rejectedInternals;
        self.rejectedInternalsCopy = angular.copy(self.rejectedInternals);

        /**
         * @description Contains the selected rejected internal mails
         * @type {Array}
         */
        self.selectedRejectedInternals = [];

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
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.internal.rejected) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.internal.rejected, self.rejectedInternals),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.internal.rejected, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.internal.rejected),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.internal.rejected, self.grid.truncateSubject);
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
                self.rejectedInternals = gridService.searchGridData(self.grid, self.rejectedInternalsCopy);
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
            var index = _.findIndex(self.rejectedInternals, {'id': record.id});
            if (index > -1)
                self.rejectedInternals.splice(index, 1, record);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.rejectedInternals = $filter('orderBy')(self.rejectedInternals, self.grid.order);
        };

        /**
         * @description Reload the grid of rejected internal mail
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadRejectedInternals = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return rejectedInternalService
                .loadRejectedInternals()
                .then(function (result) {
                    counterService.loadCounters();
                    self.rejectedInternals = result;
                    self.rejectedInternalsCopy = angular.copy(self.rejectedInternals);
                    self.selectedRejectedInternals = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };


        /**
         * @description Remove single rejected internal mail
         * @param rejectedInternal
         * @param $event
         * @param defer
         */
        self.removeRejectedInternal = function (rejectedInternal, $event, defer) {
            rejectedInternalService
                .controllerMethod
                .rejectedInternalRemove(rejectedInternal, $event)
                .then(function () {
                    self.reloadRejectedInternals(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Remove multiple selected rejected internal mails
         * @param $event
         */
        self.removeBulkRejectedInternals = function ($event) {
            console.log('remove rejected internal mails bulk : ', self.selectedRejectedInternals);
            rejectedInternalService
                .controllerMethod
                .rejectedInternalRemoveBulk(self.selectedRejectedInternals, $event)
                .then(function () {
                    self.reloadRejectedInternals(self.grid.page);
                });
        };

        /**
         * @description Launch distribution workflow for selected rejected internal mails
         * @param $event
         */
        self.launchDistributionWorkflowBulk = function ($event) {

            var contentNotExist = _.filter(self.selectedRejectedInternals, function (rejectedInternal) {
                return !rejectedInternal.hasContent();
            });
            if (contentNotExist.length > 0) {
                dialog.alertMessage(langService.get("content_not_found_bulk"));
                return;
            }
            return correspondenceService
                .launchCorrespondenceWorkflow(self.selectedRejectedInternals, $event, 'forward', 'favorites')
                .then(function () {
                    self.reloadRejectedInternals(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });
        };

        /**
         * @description Archive for selected rejected internal mails
         * @param $event
         */
        self.archiveBulk = function ($event) {
            correspondenceService
                .archiveBulkCorrespondences(self.selectedRejectedInternals, $event)
                .then(function () {
                    self.reloadRejectedInternals(self.grid.page);
                });
        };

        /**
         * @description Send to review for selected rejected internal mails
         * @param $event
         */
        self.sendToReviewBulk = function ($event) {
            console.log('send to review rejected internal mails bulk : ', self.selectedRejectedInternals);
            rejectedInternalService
                .controllerMethod
                .rejectedInternalSendToReviewBulk(self.selectedRejectedInternals, $event)
                .then(function () {
                    self.reloadRejectedInternals(self.grid.page);
                });
        };


        self.editProperties = function (rejectedInternal, $event) {
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
                .manageDocumentProperties(rejectedInternal.vsId, rejectedInternal.docClassName, rejectedInternal.docSubject, $event)
                .then(function (document) {
                    rejectedInternal = generator.preserveProperties(properties, rejectedInternal, document);
                    self.reloadRejectedInternals(self.grid.page);
                })
                .catch(function (document) {
                    rejectedInternal = generator.preserveProperties(properties, rejectedInternal, document);
                    self.reloadRejectedInternals(self.grid.page);
                });
        };

        /**
         * @description Edit the internal content
         * @param rejectedInternal
         * @param $event
         */
        self.editContent = function (rejectedInternal, $event) {
            managerService.manageDocumentContent(rejectedInternal.vsId, rejectedInternal.docClassName, rejectedInternal.docSubject, $event)
        };

        /**
         * @description Launch Distribution Workflow for the rejected internal item
         * @param rejectedInternal
         * @param $event
         * @param defer
         */
        self.launchDistributionWorkflow = function (rejectedInternal, $event, defer) {

            if (!rejectedInternal.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            rejectedInternal.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadRejectedInternals(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                });
        };
        /**
         * @description Archive the rejected internal item
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.archive = function (correspondence, $event, defer) {
            correspondence.archiveDocument($event)
                .then(function () {
                    self.reloadRejectedInternals(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Send the rejected internal to review
         * @param rejectedInternal
         * @param $event
         * @param defer
         */
        self.sendToReview = function (rejectedInternal, $event, defer) {
            rejectedInternalService.controllerMethod
                .rejectedInternalSendToReview(rejectedInternal, $event)
                .then(function (result) {
                    self.reloadRejectedInternals(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description View Tracking Sheet
         * @param rejectedInternal
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (rejectedInternal, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(rejectedInternal, params, $event).then(function (result) {

            });
        };

        /**
         * @description Manage Tags
         * @param rejectedInternal
         * @param $event
         */
        self.manageTags = function (rejectedInternal, $event) {
            managerService.manageDocumentTags(rejectedInternal.vsId, rejectedInternal.docClassName, rejectedInternal.docSubject, $event)
                .then(function (tags) {
                    rejectedInternal.tags = tags;
                })
                .catch(function (tags) {
                    rejectedInternal.tags = tags;
                });
        };

        /**
         * @description Manage Comments
         * @param rejectedInternal
         * @param $event
         */
        self.manageComments = function (rejectedInternal, $event) {
            managerService.manageDocumentComments(rejectedInternal.vsId, rejectedInternal.docSubject, $event)
                .then(function (documentComments) {
                    rejectedInternal.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    rejectedInternal.documentComments = documentComments;
                });
        };

        /**
         * @description Manage Attachments
         * @param rejectedInternal
         * @param $event
         */
        self.manageAttachments = function (rejectedInternal, $event) {
            rejectedInternal.manageDocumentAttachments($event);
        };

        /**
         * @description Manage Linked Entities
         * @param rejectedInternal
         * @param $event
         */
        self.manageLinkedEntities = function (rejectedInternal, $event) {
            var info = rejectedInternal.getInfo();
            managerService
                .manageDocumentEntities(info.vsId, info.documentClass, info.title, $event);
        };

        /**
         * @description Manage Linked Documents
         * @param rejectedInternal
         * @param $event
         * @returns {*}
         */
        self.manageLinkedDocuments = function (rejectedInternal, $event) {
            var info = rejectedInternal.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description Security
         * @param rejectedInternal
         * @param $event
         */
        self.security = function (rejectedInternal, $event) {
            console.log('security : ', rejectedInternal);
        };


        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var isEditAllowed = employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES");
            if (checkForViewPopup)
                return !isEditAllowed;
            return isEditAllowed;
        };


        /**
         * @description Preview document
         * @param rejectedInternal
         * @param $event
         */
        self.previewDocument = function (rejectedInternal, $event) {
            if (!rejectedInternal.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(rejectedInternal, self.gridActions, checkIfEditPropertiesAllowed(rejectedInternal, true), true)
                .then(function () {
                    return self.reloadRejectedInternals(self.grid.page);
                })
                .catch(function () {
                    return self.reloadRejectedInternals(self.grid.page);
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
            correspondence.viewFromQueue(self.gridActions, 'rejectedInternal', $event)
                .then(function () {
                    return self.reloadRejectedInternals(self.grid.page);
                })
                .catch(function (error) {
                    return self.reloadRejectedInternals(self.grid.page);
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
                        workItem: info.wobNum
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
                        workItem: info.wobNum
                    });
                });
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
                        gridName: 'internal-rejected'
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
            // Remove
            {
                type: 'action',
                icon: 'delete',
                text: 'grid_action_remove',
                shortcut: true,
                permissionKey: 'DELETE_INTERNAL',
                callback: self.removeRejectedInternal,
                class: "action-green",
                checkShow: function (action, model) {
                            return true;
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
            // Send To Review
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_send_to_review',
                shortcut: true,
                callback: self.sendToReview,
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
                    "EDIT_INTERNAL_CONTENT",
                    "EDIT_INTERNAL_PROPERTIES"
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
                        shortcut: true,
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
                        shortcut: true,
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
                            }
                            else if (info.documentClass === 'internal') {
                                hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT");
                            }
                            return !info.isPaper
                                && (info.documentClass !== 'incoming')
                                && model.needApprove()
                                && hasPermission;
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
                    }
                ]
            }
        ];

        self.shortcutActions = gridService.getShortcutActions(self.gridActions);
        self.contextMenuActions = gridService.getContextMenuActions(self.gridActions);
    });
};
