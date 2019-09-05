module.exports = function (app) {
    app.controller('g2gReturnedCtrl', function (lookupService,
                                                g2gReturnedService,
                                                g2gItems,
                                                $q,
                                                $filter,
                                                langService,
                                                toast,
                                                listGeneratorService,
                                                $state,
                                                dialog,
                                                ResolveDefer,
                                                correspondenceStorageService,
                                                contextHelpService,
                                                counterService,
                                                employeeService,
                                                generator,
                                                correspondenceService,
                                                viewDeliveryReportService,
                                                gridService,
                                                _,
                                                managerService) {
        var self = this;

        self.controllerName = 'g2gReturnedCtrl';
        contextHelpService.setHelpTo('returned-g2g');
        counterService.loadG2GCounters();

        /**
         * @description All g2g inbox items
         * @type {*}
         */
        self.g2gItems = g2gItems;
        self.g2gItemsCopy = angular.copy(self.g2gItems);

        /**
         * @description Contains the selected g2g inbox items
         * @type {Array}
         */
        self.selectedG2gItems = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.g2g.returned) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.g2g.returned, self.g2gItems),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.g2g.returned, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.g2g.returned),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.g2g.returned, self.grid.truncateSubject);
            },
            searchColumns: {
                subject: 'subject',
                docType: function (record) {
                    return self.getSortingKey('typeInfo', 'Information');
                },
                documentNumber: 'outgoingSerial',
                g2gBookNumber: 'g2GRefNo',
                date: 'updateDate',
                mainSiteSubSiteString: function (record) {
                    return self.getSortingKey('mainSiteSubSiteString', 'Information');
                }
            },
            searchText: '',
            searchCallback: function (grid) {
                self.g2gItems = gridService.searchGridData(self.grid, self.g2gItemsCopy);
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
            self.g2gItems = $filter('orderBy')(self.g2gItems, self.grid.order);
        };

        /**
         * @description Reload the grid of g2g inbox item
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadG2gItems = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return g2gReturnedService
                .loadG2gItems()
                .then(function (result) {
                    self.g2gItems = result;
                    self.g2gItemsCopy = angular.copy(self.g2gItems);
                    self.selectedG2gItems = [];
                    defer.resolve(true);
                    counterService.loadG2GCounters();
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Preview document
         * @param g2gItem
         * @param $event
         */
        self.previewDocument = function (g2gItem, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            return correspondenceService.viewCorrespondenceG2G(g2gItem, self.gridActions, 'G2GMessagingHistory', $event)
                .then(function (result) {
                    self.reloadG2gItems(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadG2gItems(self.grid.page);
                })
        };

        /**
         * @description View document
         * @param g2gItem
         * @param $event
         */
        self.viewDocument = function (g2gItem, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            g2gItem.viewDocument(self.gridActions, 'g2gReturned', $event)
                .then(function (result) {
                    self.reloadG2gItems(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadG2gItems(self.grid.page);
                })
        };

        /**
         * @description Resend the document
         * @param g2gItem
         * @param $event
         * @param defer
         * @returns {*}
         */
        self.resend = function (g2gItem, $event, defer) {
            return g2gItem
                .resendG2GItem($event)
                .then(function (result) {
                    if (result) {
                        new ResolveDefer(defer);
                        self.reloadG2gItems(self.grid.page)
                            .then(function () {
                                toast.success(langService.get('resend_specific_success').change({name: g2gItem.getTranslatedName()}));
                            });
                    }
                })
        };

        /**
         * @description Terminate the document
         * @param g2gItem
         * @param $event
         * @param defer
         * @returns {*}
         */
        self.terminate = function (g2gItem, $event, defer) {
            return g2gReturnedService.terminateG2G(g2gItem)
                .then(function (result) {
                    new ResolveDefer(defer);
                    self.reloadG2gItems(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('terminate_success'));
                        });
                })
        };

        /**
         * @description View Delivery Report
         * @param g2gItem
         * @param $event
         * @returns {*}
         */
        self.viewDeliveryReport = function (g2gItem, $event) {
            return viewDeliveryReportService.viewDeliveryReport(g2gItem, $event);
        };
        /**
         * @description edit after return from g2g
         * @param g2gMessagingHistory
         * @param $event
         * @param defer
         */
        self.g2gEditAfterReturn = function (g2gMessagingHistory, $event, defer) {
            var action = 'editAfterReturnG2G';
            var list = listGeneratorService.createUnOrderList(),
                langKeys = ['signature_serial_will_removed', 'the_book_will_go_to_audit', 'serial_retained', 'exported_not_received_documents_will_be_recalled'];
            _.map(langKeys, function (item) {
                list.addItemToList(langService.get(item));
            });
            dialog.confirmMessage(list.getList(), null, null, $event)
                .then(function () {
                    correspondenceService
                        .editAfterReturnFromG2G(g2gMessagingHistory)
                        .then(function (correspondence) {
                            new ResolveDefer(defer);
                            correspondenceStorageService.storeCorrespondence(action, correspondence);
                            $state.go('app.outgoing.add', {
                                vsId: g2gMessagingHistory.refDocId,
                                action: action
                            });
                        });
                });
        };


        /**
         * @description Manage Tags
         * @param g2gItem
         * @param $event
         */
        self.manageTags = function (g2gItem, $event) {
            managerService.manageDocumentTags(g2gItem.refDocId, 'outgoing', g2gItem.getTranslatedName(), $event)
                .then(function () {
                    self.reloadG2gItems(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadG2gItems(self.grid.page);
                });
        };

        /**
         * @description Manage Comments
         * @param g2gItem
         * @param $event
         */
        self.manageComments = function (g2gItem, $event) {
            //var info = g2gItem.getInfo();
            g2gItem.manageDocumentComments($event)
                .then(function () {
                    self.reloadG2gItems(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadG2gItems(self.grid.page);
                });
        };

        /**
         * @description Manage Tasks
         * @param g2gItem
         * @param $event
         */
        self.manageTasks = function (g2gItem, $event) {
            console.log('manageG2GTasks : ', g2gItem);
        };

        /**
         * @description Manage Attachments
         * @param g2gItem
         * @param $event
         */
        self.manageAttachments = function (g2gItem, $event) {
            g2gItem.manageDocumentAttachments($event)
                .then(function () {
                    self.reloadG2gItems(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadG2gItems(self.grid.page);
                });
        };


        /**
         * @description Manage Linked Documents
         * @param g2gItem
         * @param $event
         */
        self.manageLinkedDocuments = function (g2gItem, $event) {
            g2gItem.manageDocumentLinkedDocuments($event)
                .then(function () {
                    self.reloadG2gItems(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadG2gItems(self.grid.page);
                });
        };

        /**
         * @description Manage Linked Entities
         * @param g2gItem
         * @param $event
         */
        self.manageLinkedEntities = function (g2gItem, $event) {
            g2gItem
                .manageDocumentEntities($event);
        };

        /**
         * @description Destinations
         * @param g2gItem
         * @param $event
         */
        self.manageDestinations = function (g2gItem, $event) {
            g2gItem.manageDocumentCorrespondence($event)
                .then(function () {
                    self.reloadG2gItems(self.grid.page);
                });
        };

        /**
         * @description Edit Properties
         * @param g2gItem
         * @param $event
         */
        self.editProperties = function (g2gItem, $event) {
            var info = g2gItem.getInfo();
            managerService
                .manageDocumentProperties(g2gItem.refDocId, 'outgoing', info.title, $event)
                .finally(function (e) {
                    self.reloadG2gItems(self.grid.page);
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
                showInView: false,
                subMenu: [
                    {
                        type: 'info',
                        checkShow: function (action, model) {
                            return true;
                        },
                        gridName: 'g2g-returned'
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
                    'VIEW_DOCUMENT'
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
                        shortcut: true,
                        callback: self.previewDocument,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        showInView: false,
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Open
                    {
                        type: 'action',
                        icon: 'book-open-page-variant',
                        text: 'grid_action_open',
                        shortcut: true,
                        callback: self.viewDocument,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        showInView: false,
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
            // Resend
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_resend',
                shortcut: true,
                callback: self.resend,
                class: "action-green",
                //permissionKey: 'VIEW_DOCUMENT',
                showInView: true,
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Terminate
            {
                type: 'action',
                icon: 'stop',
                text: 'grid_action_terminate',
                shortcut: true,
                callback: self.terminate,
                class: "action-green",
                //permissionKey: 'VIEW_DOCUMENT',
                showInView: true,
                checkShow: function (action, model) {
                    return true;
                }
            },
            // View Delivery Report
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view_delivery_report',
                shortcut: true,
                callback: self.viewDeliveryReport,
                class: "action-green",
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: function (action, model) {
                    return true;
                },
                showInView: true
            },
            // Edit After Return
            {
                type: 'action',
                icon: 'circle-edit-outline',
                text: 'grid_action_edit_after_return_g2g',
                callback: self.g2gEditAfterReturn,
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                permissionKey: [
                    //"MANAGE_DOCUMENT’S_TAGS",
                    //"MANAGE_DOCUMENT’S_COMMENTS",
                    //"MANAGE_TASKS",
                    "MANAGE_ATTACHMENTS",
                    "MANAGE_LINKED_DOCUMENTS",
                    "MANAGE_LINKED_ENTITIES",
                    "MANAGE_DESTINATIONS"
                ],
                checkAnyPermission: true,
                checkShow: function (action, model) {
                    return true;
                },
                showInView: false,
                subMenu: [
                    // Tags
                    {
                        type: 'action',
                        icon: 'tag',
                        text: 'grid_action_tags',
                        permissionKey: "MANAGE_DOCUMENT’S_TAGS",
                        callback: self.manageTags,
                        class: "action-green",
                        hide: true,
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Comments
                    {
                        type: 'action',
                        icon: 'comment',
                        text: 'grid_action_comments',
                        permissionKey: "MANAGE_DOCUMENT’S_COMMENTS",
                        callback: self.manageComments,
                        class: "action-green",
                        hide: true,
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Tasks
                    {
                        type: 'action',
                        icon: 'note-multiple',
                        text: 'grid_action_tasks',
                        permissionKey: "MANAGE_TASKS",
                        callback: self.manageTasks,
                        class: "action-red",
                        hide: true,
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Attachments
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_attachments',
                        permissionKey: "MANAGE_ATTACHMENTS",
                        callback: self.manageAttachments,
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
                        permissionKey: "MANAGE_LINKED_DOCUMENTS",
                        callback: self.manageLinkedDocuments,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Linked Entities
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_linked_entities',
                        callback: self.manageLinkedEntities,
                        class: "action-green",
                        permissionKey: "MANAGE_LINKED_ENTITIES",
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
                        hide: true,
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Edit Properties
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit_properties',
                showInView: false,
                class: "action-green",
                checkAnyPermission: true,
                permissionKey: 'EDIT_OUTGOING_PROPERTIES',
                callback: self.editProperties,
                checkShow: function (action, model) {
                    return true;
                }
            }
        ];

        self.shortcutActions = gridService.getShortcutActions(self.gridActions);
        self.contextMenuActions = gridService.getContextMenuActions(self.gridActions);
    });
};
