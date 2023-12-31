module.exports = function (app) {
    app.controller('prepareOutgoingCtrl', function (lookupService,
                                                    prepareOutgoingService,
                                                    prepareOutgoings,
                                                    $q,
                                                    _,
                                                    $filter,
                                                    langService,
                                                    toast,
                                                    dialog,
                                                    $scope,
                                                    generator,
                                                    counterService,
                                                    managerService,
                                                    validationService,
                                                    employeeService,
                                                    contextHelpService,
                                                    viewTrackingSheetService,
                                                    broadcastService,
                                                    ResolveDefer,
                                                    $state,
                                                    rootEntity,
                                                    gridService) {
        'ngInject';
        var self = this;

        self.controllerName = 'prepareOutgoingCtrl';

        // employee service to check the permission in html
        self.employeeService = employeeService;
        self.isInternalOutgoingEnabled = rootEntity.isInternalOutgoingEnabled();

        contextHelpService.setHelpTo('outgoing-prepare');
        /**
         * @description All prepare outgoing mails
         * @type {*}
         */
        self.prepareOutgoings = prepareOutgoings;
        self.prepareOutgoingsCopy = angular.copy(self.prepareOutgoings);

        /**
         * @description Contains the selected prepare outgoing mails
         * @type {Array}
         */
        self.selectedPrepareOutgoings = [];

        // $scope.$watchCollection(self.selectedPrepareOutgoings)

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.outgoing.prepare) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.outgoing.prepare, self.prepareOutgoings),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.outgoing.prepare, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.outgoing.prepare),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.outgoing.prepare, self.grid.truncateSubject);
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
                self.prepareOutgoings = gridService.searchGridData(self.grid, self.prepareOutgoingsCopy);
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
            var index = _.findIndex(self.prepareOutgoings, {'id': record.id});
            if (index > -1)
                self.prepareOutgoings.splice(index, 1, record);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.prepareOutgoings = $filter('orderBy')(self.prepareOutgoings, self.grid.order);
        };

        /**
         * @description Reload the grid of prepare outgoing mail
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadPrepareOutgoings = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return prepareOutgoingService
                .loadPrepareOutgoings()
                .then(function (result) {
                    counterService.loadCounters();
                    self.prepareOutgoings = result;
                    self.prepareOutgoingsCopy = angular.copy(self.prepareOutgoings);
                    self.selectedPrepareOutgoings = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Remove single prepare outgoing mail
         * @param prepareOutgoing
         * @param $event
         * @param defer
         */
        self.removePrepareOutgoing = function (prepareOutgoing, $event, defer) {
            //console.log('remove prepare outgoing mail : ', prepareOutgoing);
            prepareOutgoingService
                .controllerMethod
                .prepareOutgoingRemove(prepareOutgoing, $event)
                .then(function () {
                    self.reloadPrepareOutgoings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer)
                        });
                });
        };

        /**
         * @description Remove multiple selected prepare outgoing mails
         * @param $event
         */
        self.removeBulkPrepareOutgoings = function ($event) {
            //console.log('remove prepare outgoing mails bulk : ', self.selectedPrepareOutgoings);
            prepareOutgoingService
                .controllerMethod
                .prepareOutgoingRemoveBulk(self.selectedPrepareOutgoings, $event)
                .then(function () {
                    self.reloadPrepareOutgoings(self.grid.page);
                });
        };

        self.editProperties = function (prepareOutgoing, $event) {
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
                .manageDocumentProperties(prepareOutgoing.vsId, prepareOutgoing.docClassName, prepareOutgoing.docSubject, $event)
                .then(function (document) {
                    prepareOutgoing = generator.preserveProperties(properties, prepareOutgoing, document);
                    self.reloadPrepareOutgoings(self.grid.page);
                })
                .catch(function (document) {
                    prepareOutgoing = generator.preserveProperties(properties, prepareOutgoing, document);
                    self.reloadPrepareOutgoings(self.grid.page);
                });
        };

        /**
         * @description Send prepare outgoing to draft
         * @param prepareOutgoing
         * @param $event
         * @param defer
         */
        /*self.sendToDraft = function (prepareOutgoing, $event, defer) {
            prepareOutgoingService
                .sendToDraftPrepareOutgoing(prepareOutgoing)
                .then(function (result) {
                    self.reloadPrepareOutgoings(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('sent_to_draft_success').change({name: prepareOutgoing.documentTitle}));
                            new ResolveDefer(defer);
                        });
                })
        };*/

        /**
         * @description View Tracking Sheet
         * @param prepareOutgoing
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (prepareOutgoing, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(prepareOutgoing, params, $event).then(function (result) {

            });
        };

        /**
         * @description Manage document tags for prepare outgoing
         * @param prepareOutgoing
         * @param $event
         */
        self.manageTags = function (prepareOutgoing, $event) {
            managerService.manageDocumentTags(prepareOutgoing.vsId, prepareOutgoing.docClassName, prepareOutgoing.docSubject, $event)
                .then(function (tags) {
                    prepareOutgoing.tags = tags;
                })
                .catch(function (tags) {
                    prepareOutgoing.tags = tags;
                });
        };

        /**
         * @description Manage document comments for prepare outgoing
         * @param prepareOutgoing
         * @param $event
         */
        self.manageComments = function (prepareOutgoing, $event) {
            prepareOutgoing.manageDocumentComments($event)
                .then(function (documentComments) {
                    prepareOutgoing.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    prepareOutgoing.documentComments = documentComments;
                });
        };

        /**
         * @description Manage document attachments for prepare outgoing
         * @param prepareOutgoing
         * @param $event
         */
        self.manageAttachments = function (prepareOutgoing, $event) {
            prepareOutgoing.manageDocumentAttachments($event);
        };

        /**
         * @description Manage Linked Entities
         * @param prepareOutgoing
         * @param $event
         */
        self.manageLinkedEntities = function (prepareOutgoing, $event) {
            managerService
                .manageDocumentEntities(prepareOutgoing.vsId, prepareOutgoing.docClassName, prepareOutgoing.docSubject, $event);
        };

        self.manageLinkedDocuments = function (prepareOutgoing, $event) {
            var info = prepareOutgoing.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };
        self.security = function (prepareOutgoing, $event) {
            console.log('security : ', prepareOutgoing);
        };

        /**
         * @description Add content to the prepare outgoing document
         * @param prepareOutgoing
         * @param $event
         * @param defer
         */
        self.createContent = function (prepareOutgoing, $event, defer) {
            managerService.manageDocumentContent(prepareOutgoing.vsId, prepareOutgoing.docClassName, prepareOutgoing.docSubject, $event)
                .then(function () {
                    self.reloadPrepareOutgoings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description Manage destinations for prepare outgoing
         * @param prepareOutgoing
         * @param $event
         */
        self.manageDestinations = function (prepareOutgoing, $event) {
            managerService.manageDocumentCorrespondence(prepareOutgoing.vsId, prepareOutgoing.docClassName, prepareOutgoing.docSubject, $event);
        };

        /**
         * @description broadcast selected organizations and workflow groups
         * @param prepareOutgoing
         * @param $event
         */
        self.broadcast = function (prepareOutgoing, $event) {
            broadcastService
                .controllerMethod
                .broadcastSend(prepareOutgoing, $event)
                .then(function () {
                    self.reloadPrepareOutgoings(self.grid.page);
                })
                .catch(function () {
                    self.reloadPrepareOutgoings(self.grid.page);
                });
        };

        /**
         * @description Print Barcode
         * @param prepareOutgoing
         * @param $event
         */
        self.printBarcode = function (prepareOutgoing, $event) {
            prepareOutgoing.barcodePrint($event);
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
            var page = (self.isInternalOutgoingEnabled && correspondence.isInternalOutgoing()) ? 'app.outgoing.add-internal' : 'app.outgoing.add';
            return correspondence
                .duplicateVersion($event)
                .then(function () {
                    $state.go(page, {
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
            var page = (self.isInternalOutgoingEnabled && correspondence.isInternalOutgoing()) ? 'app.outgoing.add-internal' : 'app.outgoing.add';
            return correspondence
                .duplicateSpecificVersion($event)
                .then(function () {
                    $state.go(page, {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        wobNum: info.wobNumber
                    });
                });
        };

        /**
         * @description export book
         */
        self.exportBook = function (model, $event) {
            console.log(model);
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
                        gridName: 'outgoing-prepare'

                    }],
                class: "action-green"
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
                permissionKey: "DELETE_OUTGOING",
                callback: self.removePrepareOutgoing,
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Edit outgoing properties
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit_outgoing_properties',
                shortcut: true,
                showInView: false,
                permissionKey: "EDIT_OUTGOING_PROPERTIES",
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
                hide: true,
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
            // Export
            {
                type: 'action',
                icon: 'export',
                text: 'grid_action_export',
                shortcut: true,
                callback: self.exportBook,
                class: "action-red",
                hide: true,
                checkShow: function (action, model) {
                    return !model.hasActiveSeqWF();
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
                callback: self.createContent,
                class: "action-green",
                showInView: false,
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
                    return (model.addMethod || model.approvers !== null) && (model.getSecurityLevelLookup().lookupKey !== 4)
                        && !model.hasActiveSeqWF();
                }
            },
            // Print Barcode
            {
                type: 'action',
                icon: 'barcode-scan',
                text: 'grid_action_print_barcode',
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
