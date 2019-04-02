module.exports = function (app) {
    app.controller('favoriteDocumentsCtrl', function (lookupService,
                                                      favoriteDocumentsService,
                                                      favoriteDocuments,
                                                      $q,
                                                      $filter,
                                                      langService,
                                                      toast,
                                                      $state,
                                                      dialog,
                                                      gridService,
                                                      contextHelpService,
                                                      employeeService,
                                                      viewDocumentService,
                                                      viewTrackingSheetService,
                                                      managerService,
                                                      counterService,
                                                      ResolveDefer,
                                                      correspondenceService,
                                                      generator,
                                                      mailNotificationService) {
        'ngInject';
        var self = this;

        self.controllerName = 'favoriteDocumentsCtrl';
        contextHelpService.setHelpTo('favorite-documents');
        self.progress = null;

        /**
         * @description All favorite documents
         * @type {*}
         */
        self.favoriteDocuments = favoriteDocuments;
        self.favoriteDocumentsService = favoriteDocumentsService;

        /**
         * @description Contains the selected favorite documents
         * @type {Array}
         */
        self.selectedFavoriteDocuments = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.inbox.favorite) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.inbox.favorite, favoriteDocumentsService.totalCount), //[5, 10, 20, 100, 200]
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.inbox.favorite, limit);
                self.reloadFavoriteDocuments(page);
            }
            /*limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (favoriteDocumentsService.totalCount + 21);
                    }
                }
            ]*/
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
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.favoriteDocuments = $filter('orderBy')(self.favoriteDocuments, self.grid.order);
        };

        /**
         * @description Reload the grid of favorite document
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadFavoriteDocuments = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return favoriteDocumentsService
                .loadFavoriteDocuments(self.grid.page, self.grid.limit)
                .then(function (result) {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.favoriteDocuments = result;

                    self.selectedFavoriteDocuments = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Remove the document from favorite documents
         * @param favoriteDocument
         * @param $event
         * @param defer
         */
        self.removeFavoriteDocument = function (favoriteDocument, $event, defer) {
            favoriteDocument.removeFromFavorite().then(function () {
                self.reloadFavoriteDocuments(self.grid.page);
                new ResolveDefer(defer);
            });
        };

        /**
         * @description Remove bulk documents from favorite documents
         * @param $event
         */
        self.removeBulkFavoriteDocuments = function ($event) {
            correspondenceService
                .deleteBulkCorrespondenceFromFavorite(self.selectedFavoriteDocuments)
                .then(function () {
                    self.reloadFavoriteDocuments(self.grid.page);
                });
        };

        /**
         * @description Edit Content
         * @param favoriteDocument
         * @param $event
         */
        self.editContent = function (favoriteDocument, $event) {
            var info = favoriteDocument.getInfo();
            managerService.manageDocumentContent(info.vsId, info.documentClass, info.title, $event);
        };

        /**
         * @description Edit Properties
         * @param favoriteDocument
         * @param $event
         */
        self.editProperties = function (favoriteDocument, $event) {
            var info = favoriteDocument.getInfo();
            managerService
                .manageDocumentProperties(info.vsId, info.documentClass, info.title, $event)
                .finally(function () {
                    self.reloadFavoriteDocuments(self.grid.page)
                });
        };

        /**
         * @description Launch distribution workflow for favorite document
         * @param favoriteDocument
         * @param $event
         * @param defer
         */
        self.launchDistributionWorkflow = function (favoriteDocument, $event, defer) {
            if (!favoriteDocument.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            favoriteDocument.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadFavoriteDocuments(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                });

        };

        /**
         * @description View Tracking Sheet
         * @param favoriteDocument
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (favoriteDocument, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(favoriteDocument, params, $event).then(function (result) {
            });
        };

        /**
         * @description Manage document tags for favorite document
         * @param favoriteDocument
         * @param $event
         */
        self.manageTags = function (favoriteDocument, $event) {
            managerService.manageDocumentTags(favoriteDocument.vsId, favoriteDocument.classDescription, favoriteDocument.docSubject, $event)
                .then(function (tags) {
                    favoriteDocument.tags = tags;
                })
                .catch(function (tags) {
                    favoriteDocument.tags = tags;
                });
        };

        /**
         * @description Manage document comments for favorite document
         * @param favoriteDocument
         * @param $event
         */
        self.manageComments = function (favoriteDocument, $event) {
            managerService.manageDocumentComments(favoriteDocument.vsId, favoriteDocument.docSubject, $event)
                .then(function (documentComments) {
                    favoriteDocument.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    favoriteDocument.documentComments = documentComments;
                });
        };

        /**
         * @description Manage document attachments for favorite document
         * @param favoriteDocument
         * @param $event
         */
        self.manageAttachments = function (favoriteDocument, $event) {
            favoriteDocument.manageDocumentAttachments($event);
        };

        /**
         * @description Manage Linked Entities
         * @param favoriteDocument
         * @param $event
         */
        self.manageLinkedEntities = function (favoriteDocument, $event) {
            managerService
                .manageDocumentEntities(favoriteDocument.vsId, favoriteDocument.classDescription, favoriteDocument.docSubject, $event);
        };

        /**
         * @description Manage linked documents for favorite document
         * @param favoriteDocument
         * @param $event
         */
        self.manageLinkedDocuments = function (favoriteDocument, $event) {
            var info = favoriteDocument.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description Destinations
         * @param favoriteDocument
         * @param $event
         */
        self.manageDestinations = function (favoriteDocument, $event) {
            favoriteDocument.manageDocumentCorrespondence($event)
                .then(function () {
                    self.reloadFavoriteDocuments(self.grid.page);
                });
        };


        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var info = model.getInfo();
            var hasPermission = false;
            if (info.documentClass === "internal") {
                //If approved internal electronic, don't allow to edit
                if (info.docStatus >= 24 && !info.isPaper)
                    hasPermission = false;
                else
                    hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES");
            }
            else if (info.documentClass === "incoming")
                hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES");
            else if (info.documentClass === "outgoing") {
                //If approved outgoing electronic, don't allow to edit
                if (info.docStatus >= 24 && !info.isPaper)
                    hasPermission = false;
                else
                    hasPermission = employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES");
            }
            if (checkForViewPopup)
                return !hasPermission;
            return hasPermission;
        };

        var checkIfEditCorrespondenceSiteAllowed = function (model, checkForViewPopup) {
            var info = model.getInfo();
            var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
            var allowed = (hasPermission && info.documentClass !== "internal");
            if (checkForViewPopup)
                return !(allowed);
            return allowed;
        };

        /**
         * @description Preview document
         * @param favoriteDocument
         * @param $event
         */
        self.previewDocument = function (favoriteDocument, $event) {
            if (!favoriteDocument.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(favoriteDocument, self.gridActions, checkIfEditPropertiesAllowed(favoriteDocument, true), true)
                .then(function () {
                    return self.reloadFavoriteDocuments(self.grid.page);
                })
                .catch(function () {
                    return self.reloadFavoriteDocuments(self.grid.page);
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
            correspondence.viewFavoriteDocument(self.gridActions, 'favoriteDocument', $event)
                .then(function () {
                    return self.reloadFavoriteDocuments(self.grid.page);
                })
                .catch(function () {
                    return self.reloadFavoriteDocuments(self.grid.page);
                });
        };

        /**
         * @description edit word doucment in desktop
         * @return {Promise}
         * @param correspondence
         */
        self.editInDesktop = function (correspondence) {
            return correspondenceService.editWordInDesktop(correspondence);
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
                    $state.go('app.' + info.documentClass.toLowerCase() + '.add', {
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
                    $state.go('app.' + info.documentClass.toLowerCase() + '.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        workItem: info.wobNum
                    });
                });
        };

        self.viewInDeskTop = function (workItem) {
            return correspondenceService.viewWordInDesktop(workItem);
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
                        gridName: 'favorite-documents'
                    }
                ],
                class: "action-green",
                checkShow: function (action, model) {
                            return true;
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
                            return true;
                        },
                subMenu: [
                    // Preview
                    {
                        type: 'action',
                        icon: 'book-open-variant',
                        text: 'grid_action_preview_document',
                        shortcut: false,
                        callback: self.previewDocument,
                        class: "action-green",
                        showInView: false,
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
                        class: "action-green",
                        showInView: false,
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
                ]},
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
                text: 'grid_action_remove_from_favorite',
                shortcut: true,
                callback: self.removeFavoriteDocument,
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
                    var info = model.getInfo();
                    var hasPermission = false;
                    if (info.documentClass === "internal")
                        hasPermission = (employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES") || employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT"));
                    else if (info.documentClass === "incoming")
                        hasPermission = (employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES") || employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT"));
                    else if (info.documentClass === "outgoing")
                        hasPermission = (employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES") || employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
                    return hasPermission && info.docStatus < 24;
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
                            var info = model.getInfo();
                            var hasPermission = false;
                            if (info.documentClass === "internal")
                                hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT");
                            else if (info.documentClass === "incoming")
                                hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT");
                            else if (info.documentClass === "outgoing")
                                hasPermission = employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT");
                            return hasPermission;
                        }
                    },
                    // Properties
                    {
                        type: 'action',
                        icon: 'pencil',
                        text: function () {
                            return {
                                contextText: 'grid_action_properties',
                                shortcutText: 'grid_action_edit_properties'
                            };
                        },
                        shortcut: false,
                        callback: self.editProperties,
                        class: "action-green",
                        checkShow: function (action, model) {
                            /*var info = model.getInfo();
                             var hasPermission = false;
                             if (info.documentClass === "internal")
                             hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES");
                             else if (info.documentClass === "incoming")
                             hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES");
                             else if (info.documentClass === "outgoing")
                             hasPermission = employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES");
                             return hasPermission;*/
                            return checkIfEditPropertiesAllowed(model);
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
                            return !model.isBroadcasted()
                                && !info.isPaper
                                && (info.documentClass !== 'incoming')
                                && model.needApprove()
                                && hasPermission;
                        }
                    }
                ]
            },
            // Send To Review
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_send_to_review',
                shortcut: true,
                hide: true,
                callback: self.sendFavoriteDocumentToReview,
                class: "action-red",
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
                class: "action-red",
                hide: true, /* Launch Distribution is not clear, so need to be discussed with Mr. Abu Al Nassr*/
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
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
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: function (action, model) {
                            return true;
                        },
                callback: self.viewTrackingSheet,
                params: ['view_tracking_sheet', 'tabs']
            },
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                shortcut: false,
                showInView: false,
                checkShow: function (action, model) {
                            return true;
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
                        callback: self.manageDestinations,
                        permissionKey: "MANAGE_DESTINATIONS",
                        class: "action-green",
                        checkShow: function (action, model) {
                            return checkIfEditCorrespondenceSiteAllowed(model, false);
                        }
                    }
                ]
            },
            // Duplicate
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_duplicate',
                shortcut: false,
                showInView: false,
                checkShow: function (action, model) {
                            return true;
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
                        hide: false,
                        callback: self.duplicateCurrentVersion,
                        class: "action-green",
                        permissionKey: 'DUPLICATE_BOOK_CURRENT',
                        showInView: true,
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            return (info.documentClass === 'outgoing' || info.documentClass === 'internal') && !info.isPaper
                        }
                    },
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
