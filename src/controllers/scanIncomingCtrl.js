module.exports = function (app) {
    app.controller('scanIncomingCtrl', function (lookupService,
                                                 scanIncomingService,
                                                 scanIncomings,
                                                 $q,
                                                 $filter,
                                                 langService,
                                                 toast,
                                                 $state,
                                                 dialog,
                                                 employeeService,
                                                 managerService,
                                                 viewTrackingSheetService,
                                                 broadcastService,
                                                 generator,
                                                 contextHelpService,
                                                 ResolveDefer,
                                                 gridService,
                                                 counterService) {
        'ngInject';
        var self = this;

        self.controllerName = 'scanIncomingCtrl';
        // employee service to check the permission in html
        self.employeeService = employeeService;

        contextHelpService.setHelpTo('incoming-scan');

        /**
         * @description All scan incomings
         * @type {*}
         */
        self.scanIncomings = scanIncomings;
        self.scanIncomingsCopy = angular.copy(self.scanIncomings);

        /**
         * @description Contains the selected scan incomings
         * @type {Array}
         */
        self.selectedScanIncomings = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.incoming.scan) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.incoming.scan, self.scanIncomings),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.incoming.scan, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.incoming.scan),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.incoming.scan, self.grid.truncateSubject);
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
                self.scanIncomings = gridService.searchGridData(self.grid, self.scanIncomingsCopy);
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
            self.scanIncomings = $filter('orderBy')(self.scanIncomings, self.grid.order);
        };

        /**
         * @description Reload the grid of scan incoming
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadScanIncomings = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return scanIncomingService
                .loadScanIncomings()
                .then(function (result) {
                    counterService.loadCounters();
                    self.scanIncomings = result;
                    self.scanIncomingsCopy = angular.copy(self.scanIncomings);
                    self.selectedScanIncomings = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Delete single scan incoming
         * @param scanIncoming
         * @param $event
         * @param defer
         */
        self.removeScanIncoming = function (scanIncoming, $event, defer) {
            scanIncomingService
                .controllerMethod
                .scanIncomingRemove(scanIncoming, $event)
                .then(function () {
                    self.reloadScanIncomings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        })
                    ;
                });
        };

        /**
         * @description Delete multiple selected scan incomings
         * @param $event
         */
        self.removeBulkScanIncomings = function ($event) {
            scanIncomingService
                .controllerMethod
                .scanIncomingRemoveBulk(self.selectedScanIncomings, $event)
                .then(function () {
                    self.reloadScanIncomings(self.grid.page);
                });
        };

        /**
         * @description Change the status of scan incoming
         * @param scanIncoming
         */
        self.changeStatusScanIncoming = function (scanIncoming) {
            self.statusServices[scanIncoming.status](scanIncoming)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    scanIncoming.status = !scanIncoming.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected scan incomings
         * @param status
         */
        self.changeStatusBulkScanIncomings = function (status) {
            self.statusServices[status](self.selectedScanIncomings)
                .then(function () {
                    self.reloadScanIncomings(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('selected_status_updated'));
                        });
                });
        };

        /**
         * @description Edit incoming properties
         * @param scanIncoming
         * @param $event
         */
        self.editProperties = function (scanIncoming, $event) {
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
                .manageDocumentProperties(scanIncoming.vsId, scanIncoming.docClassName, scanIncoming.docSubject, $event)
                .then(function (document) {
                    scanIncoming = generator.preserveProperties(properties, scanIncoming, document);
                    self.reloadScanIncomings(self.grid.page);
                })
                .catch(function (document) {
                    scanIncoming = generator.preserveProperties(properties, scanIncoming, document);
                    self.reloadScanIncomings(self.grid.page);
                });
        };

        /**
         * @description View Tracking Sheet
         * @param scanIncoming
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (scanIncoming, params, $event) {
            //console.log('view tracking sheet', scanIncoming);
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(scanIncoming, params, $event).then(function (result) {

            });
        };

        /**
         * @description Manage document tags for scan incoming
         * @param scanIncoming
         * @param $event
         */
        self.manageTags = function (scanIncoming, $event) {
            managerService.manageDocumentTags(scanIncoming.vsId, scanIncoming.classDescription, scanIncoming.docSubject, $event)
                .then(function (tags) {
                    scanIncoming.tags = tags;
                })
                .catch(function (tags) {
                    scanIncoming.tags = tags;
                });
        };

        /**
         * @description Manage document comments for scan incoming
         * @param scanIncoming
         * @param $event
         */
        self.manageComments = function (scanIncoming, $event) {
            console.log('manage comments', scanIncoming);
            managerService.manageDocumentComments(scanIncoming.vsId, scanIncoming.docSubject, $event)
                .then(function (documentComments) {
                    scanIncoming.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    scanIncoming.documentComments = documentComments;
                });
        };

        /**
         * @description Manage document attachments for scan incoming
         * @param scanIncoming
         * @param $event
         */
        self.manageAttachments = function (scanIncoming, $event) {
            scanIncoming.manageDocumentAttachments($event);
        };

        /**
         * @description Manage Linked Entities
         * @param scanIncoming
         * @param $event
         */
        self.manageLinkedEntities = function (scanIncoming, $event) {
            managerService
                .manageDocumentEntities(scanIncoming.vsId, scanIncoming.classDescription, scanIncoming.docSubject, $event);
        };

        /**
         * @description Manage document's linked documents for scan incoming
         * @param scanIncoming
         * @param $event
         */
        self.manageLinkedDocuments = function (scanIncoming, $event) {
            //console.log('manage linked documents : ', scanIncoming);
            var info = scanIncoming.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description Destinations
         * @param scanIncoming
         * @param $event
         */
        self.manageDestinations = function (scanIncoming, $event) {
            managerService.manageDocumentCorrespondence(scanIncoming.vsId, scanIncoming.docClassName, scanIncoming.docSubject, $event)
        };

        /**
         * @description document security for scan incoming
         * @param scanIncoming
         * @param $event
         */
        self.security = function (scanIncoming, $event) {
            console.log('manage security : ', scanIncoming);
        };

        /**
         * @description Add content to the scan incoming document
         * @param scanIncoming
         * @param $event
         */
        self.createContent = function (scanIncoming, $event, defer) {
            managerService.manageDocumentContent(scanIncoming.vsId, scanIncoming.docClassName, scanIncoming.docSubject, $event)
                .then(function () {
                    self.reloadScanIncomings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description broadcast selected organizations and workflow groups
         * @param scanIncoming
         * @param $event
         */
        self.broadcast = function (scanIncoming, $event) {
            broadcastService
                .controllerMethod
                .broadcastSend(scanIncoming, $event)
                .then(function () {
                    self.reloadScanIncomings(self.grid.page);
                })
                .catch(function () {
                    self.reloadScanIncomings(self.grid.page);
                });
        };

        /**
         * @description Print Barcode
         * @param scanIncoming
         * @param $event
         */
        self.printBarcode = function (scanIncoming, $event) {
            scanIncoming.barcodePrint($event);
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
                        gridName: 'incoming-scan'

                    }
                ],
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
                permissionKey: 'DELETE_INCOMING',
                callback: self.removeScanIncoming,
                class: "action-green",
                checkShow: function (action, model) {
                            return true;
                        }
            },
            // Edit incoming properties
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit_incoming_properties',
                shortcut: true,
                permissionKey: "EDIT_INCOMING’S_PROPERTIES",
                callback: self.editProperties,
                showInView: false,
                class: "action-green",
                checkShow: function (action, model) {
                            return true;
                        }
            },
            {
                type: 'separator',
                checkShow: function (action, model) {
                            return true;
                        },
                showInView: false
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
                            return true;
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
        ];

        self.shortcutActions = gridService.getShortcutActions(self.gridActions);
        self.contextMenuActions = gridService.getContextMenuActions(self.gridActions);
    });
};
