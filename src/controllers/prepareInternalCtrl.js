module.exports = function (app) {
    app.controller('prepareInternalCtrl', function (lookupService,
                                                    prepareInternalService,
                                                    prepareInternals,
                                                    generator,
                                                    $q,
                                                    _,
                                                    $state,
                                                    $filter,
                                                    langService,
                                                    toast,
                                                    dialog,
                                                    employeeService,
                                                    viewTrackingSheetService,
                                                    managerService,
                                                    broadcastService,
                                                    counterService,
                                                    contextHelpService,
                                                    ResolveDefer,
                                                    gridService) {
        'ngInject';
        var self = this;

        self.controllerName = 'prepareInternalCtrl';

        // employee service to check the permission in html
        self.employeeService = employeeService;
        contextHelpService.setHelpTo('internal-prepare');

        /**
         * @description All prepare internal items
         * @type {*}
         */
        self.prepareInternals = prepareInternals;
        self.prepareInternalsCopy = angular.copy(self.prepareInternals);

        /**
         * @description Contains the selected prepare internal items
         * @type {Array}
         */
        self.selectedPrepareInternals = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.internal.prepare) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.internal.prepare, self.prepareInternals),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.internal.prepare, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.internal.prepare),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.internal.prepare, self.grid.truncateSubject);
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
                self.prepareInternals = gridService.searchGridData(self.grid, self.prepareInternalsCopy);
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
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.prepareInternals = $filter('orderBy')(self.prepareInternals, self.grid.order);
        };

        /**
         * @description Reload the grid of prepare internal item
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadPrepareInternals = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return prepareInternalService
                .loadPrepareInternals()
                .then(function (result) {
                    counterService.loadCounters();
                    self.prepareInternals = result;
                    self.prepareInternalsCopy = angular.copy(self.prepareInternals);
                    self.selectedPrepareInternals = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Remove single prepare internal mail
         * @param prepareInternal
         * @param $event
         * @param defer
         */
        self.removePrepareInternal = function (prepareInternal, $event, defer) {
            prepareInternalService
                .controllerMethod
                .prepareInternalRemove(prepareInternal, $event)
                .then(function () {
                    self.reloadPrepareInternals(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        })
                    ;
                });
        };

        /**
         * @description Remove multiple selected prepare internal mails
         * @param $event
         */
        self.removeBulk = function ($event) {
            prepareInternalService
                .controllerMethod
                .prepareInternalRemoveBulk(self.selectedPrepareInternals, $event)
                .then(function () {
                    self.reloadPrepareInternals(self.grid.page);
                });
        };

        self.editProperties = function (prepareInternal, $event) {
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
                .manageDocumentProperties(prepareInternal.vsId, prepareInternal.docClassName, prepareInternal.docSubject, $event)
                .then(function (document) {
                    prepareInternal = generator.preserveProperties(properties, prepareInternal, document);
                    self.reloadPrepareInternals(self.grid.page);
                })
                .catch(function (document) {
                    prepareInternal = generator.preserveProperties(properties, prepareInternal, document);
                    self.reloadPrepareInternals(self.grid.page);
                });
        };

        /**
         * @description Send prepare internal to draft
         * @param prepareInternal
         * @param $event
         * @param defer
         */
        /*self.sendToDraft = function (prepareInternal, $event, defer) {
            prepareInternalService
                .sendToDraftPrepareInternal(prepareInternal)
                .then(function (result) {
                    self.reloadPrepareInternals(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('sent_to_draft_success').change({name: prepareInternal.documentTitle}));
                            new ResolveDefer(defer);
                        });
                })
        };*/


        /**
         * @description View Tracking Sheet
         * @param prepareInternal
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (prepareInternal, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(prepareInternal, params, $event).then(function (result) {

            });
        };

        /**
         * @description Manage document tags for prepare internal
         * @param prepareInternal
         * @param $event
         */
        self.manageTags = function (prepareInternal, $event) {
            managerService.manageDocumentTags(prepareInternal.vsId, prepareInternal.docClassName, prepareInternal.docSubject, $event)
                .then(function (tags) {
                    prepareInternal.tags = tags;
                })
                .catch(function (tags) {
                    prepareInternal.tags = tags;
                });
        };

        /**
         * @description Manage document comments for prepare internal
         * @param prepareInternal
         * @param $event
         */
        self.manageComments = function (prepareInternal, $event) {
            managerService.manageDocumentComments(prepareInternal.vsId, prepareInternal.docSubject, $event)
                .then(function (documentComments) {
                    prepareInternal.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    prepareInternal.documentComments = documentComments;
                });
        };

        /**
         * @description Manage document attachments for prepare internal
         * @param prepareInternal
         * @param $event
         */
        self.manageAttachments = function (prepareInternal, $event) {
            prepareInternal.manageDocumentAttachments($event);
        };

        /**
         * @description Manage Linked Entities
         * @param prepareInternal
         * @param $event
         */
        self.manageLinkedEntities = function (prepareInternal, $event) {
            var info = prepareInternal.getInfo();
            managerService
                .manageDocumentEntities(info.vsId, info.documentClass, info.title, $event);
        };

        /**
         * @description Manage Linked Documents
         * @param prepareInternal
         * @param $event
         * @returns {*}
         */
        self.manageLinkedDocuments = function (prepareInternal, $event) {
            var info = prepareInternal.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description Manage Security
         * @param prepareInternal
         * @param $event
         */
        self.security = function (prepareInternal, $event) {
            console.log('security : ', prepareInternal);
        };

        /**
         * @description Add content to the prepare internal document
         * @param prepareInternal
         * @param $event
         * @param defer
         */
        self.createContent = function (prepareInternal, $event, defer) {
            managerService.manageDocumentContent(prepareInternal.vsId, prepareInternal.docClassName, prepareInternal.docSubject, $event)
                .then(function () {
                    self.reloadPrepareInternals(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description broadcast selected organizations and workflow groups
         * @param prepareInternal
         * @param $event
         */
        self.broadcast = function (prepareInternal, $event) {
            broadcastService
                .controllerMethod
                .broadcastSend(prepareInternal, $event)
                .then(function () {
                    self.reloadPrepareInternals(self.grid.page);
                })
                .catch(function () {
                    self.reloadPrepareInternals(self.grid.page);
                });
        };


        /**
         * @description Print Barcode
         * @param prepareInternal
         * @param $event
         */
        self.printBarcode = function (prepareInternal, $event) {
            prepareInternal.barcodePrint($event);
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
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                subMenu: [
                    {
                        type: 'info',
                        checkShow: function (action, model) {
                            return true;
                        },
                        gridName: 'internal-prepare'

                    }],
                class: "action-green"
            },
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
                callback: self.removePrepareInternal,
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Edit Internal properties
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit_internal_properties',
                shortcut: true,
                showInView: false,
                permissionKey: "EDIT_INTERNAL_PROPERTIES",
                callback: self.editProperties,
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Send to draft (Send to draft without content is not allowed and if you add content, document will automatically go to review queue)
            /*{
                type: 'action',
                icon: 'send',
                text: 'grid_action_send_to_draft',
                shortcut: true,
                callback: self.sendToDraft,
                class: "action-green",
                hide: true
                checkShow: function (action, model) {
                            return true;
                        }
            },*/
            {
                type: 'separator',
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
                        shortcut: true,
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
            // Create Content
            {
                type: 'action',
                icon: 'plus',
                text: 'grid_action_create_content',
                shortcut: true,
                showInView: false,
                callback: self.createContent,
                class: "action-green",
                checkShow: function (action, model) {
                    return !model.hasContent();
                }
            },
            // Broadcast
            {
                type: 'action',
                icon: 'bullhorn',
                text: 'grid_action_broadcast',
                shortcut: false,
                hide: true,
                permissionKey: 'BROADCAST_DOCUMENT',
                callback: self.broadcast,
                class: 'action-green',
                checkShow: function (action, model) {
                    return (model.addMethod || model.approvers !== null) && (model.getSecurityLevelLookup().lookupKey !== 4);
                }
            },
            // Print Barcode
            {
                type: 'action',
                icon: 'barcode-scan',
                text: 'grid_action_print_barcode',
                shortcut: false,
                callback: self.printBarcode,
                class: "action-green",
                permissionKey: 'PRINT_BARCODE',
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return info.isPaper;
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
        ];

        self.shortcutActions = gridService.getShortcutActions(self.gridActions);
        self.contextMenuActions = gridService.getContextMenuActions(self.gridActions);
    });
};
