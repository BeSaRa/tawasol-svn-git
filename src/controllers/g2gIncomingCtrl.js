module.exports = function (app) {
    app.controller('g2gIncomingCtrl', function (lookupService,
                                                g2gIncomingService,
                                                g2gItems,
                                                G2G,
                                                $q,
                                                $filter,
                                                Incoming,
                                                langService,
                                                counterService,
                                                toast,
                                                dialog,
                                                configurationService,
                                                employeeService,
                                                localStorageService,
                                                generator,
                                                contextHelpService,
                                                correspondenceService,
                                                mailNotificationService,
                                                ResolveDefer,
                                                $state,
                                                gridService) {
        'ngInject';
        var self = this;

        self.controllerName = 'g2gIncomingCtrl';
        contextHelpService.setHelpTo('incoming-g2g');
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
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.g2g.incoming) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.g2g.incoming, self.g2gItems),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.g2g.incoming, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.g2g.incoming),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.g2g.incoming, self.grid.truncateSubject);
            },
            searchColumns: {
                subject: 'correspondence.docSubject',
                docType: function (record) {
                    return self.getSortingKey('typeInfo', 'Information');
                },
                securityLevel: function (record) {
                    return self.getSortingKey('securityLevel', 'Information');
                },
                documentNumber: 'correspondence.refDocNumber',
                g2gBookNumber: 'correspondence.g2gRefNO',
                receivedDate: 'correspondence.lastModifiedString',
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
            return g2gIncomingService
                .loadG2gItems()
                .then(function (result) {
                    self.g2gItems = result;
                    self.g2gItemsCopy = angular.copy(self.g2gItems);
                    self.selectedG2gItems = [];
                    counterService.loadG2GCounters();
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Replaces the record in grid after update
         * @param record
         */
        self.replaceRecord = function (record) {
            var index = _.findIndex(self.g2gItems, function (g2gItem) {
                return g2gItem.correspondence.g2gVSID === record.correspondence.g2gVSID;
            });
            if (index > -1)
                self.g2gItems.splice(index, 1, record);

            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
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
            self.openedRecord = angular.copy(g2gItem);
            return correspondenceService.viewCorrespondenceG2G(g2gItem, self.gridActions, 'G2G', $event)
                .then(function (result) {
                    if (result !== 'receive' && result !== 'return') {
                        if (!g2gItem.getInfo().vsId) {
                            g2gItem.correspondence.vsId = result.vsId;
                            self.replaceRecord(g2gItem);
                        }
                    }
                    localStorageService.remove('vsid');
                    self.openedRecord = null;
                    //self.reloadG2gItems(self.grid.page);
                })
            /*.catch(function (error) {
                self.openedRecord = null;
                if (!g2gItem.getInfo().vsId) {
                    g2gItem.correspondence.vsId = error.metaData.vsId;
                    self.replaceRecord(g2gItem);
                }
                //self.reloadG2gItems(self.grid.page);
            })*/
        };

        /**
         * @description View document
         * @param g2gItem
         * @param $event
         */
        self.openedRecord = null;
        self.viewDocument = function (g2gItem, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            self.openedRecord = angular.copy(g2gItem);
            g2gItem.viewDocument(self.gridActions, 'g2gIncoming', $event)
                .then(function (result) {
                    if (result !== 'receive' && result !== 'return') {
                        if (!g2gItem.getInfo().vsId) {
                            g2gItem.correspondence.vsId = result.vsId;
                            self.replaceRecord(g2gItem);
                        }
                    }
                    localStorageService.remove('vsid');
                    self.openedRecord = null;
                    //self.reloadG2gItems(self.grid.page);
                })
            /*.catch(function (error) {
                self.openedRecord = null;
                if (!g2gItem.getInfo().vsId) {
                    g2gItem.correspondence.vsId = error.metaData.vsId;
                    self.replaceRecord(g2gItem);
                }
                //self.reloadG2gItems(self.grid.page);
            })*/
        };


        /**
         * @description Receive Document(Only from popup)
         * @param g2gItem
         * @param $event
         * @returns {*}
         */
        self.receiveDocument = function (g2gItem, $event) {
            //var info = self.openedRecord.getInfo();
            dialog.hide('receive');
            $state.go('app.incoming.add', {
                action: 'receiveg2g',
                vsId: localStorageService.get('vsid'),
                internalg2g: self.openedRecord.isInternalG2G()
            });
        };

        /**
         * @description Return document
         * @param g2gItem
         * @param $event
         * @param defer
         * @returns {*}
         */
        self.returnDocument = function (g2gItem, $event, defer) {
            return g2gIncomingService.returnG2G(g2gItem)
                .then(function (result) {
                    //new ResolveDefer(defer);
                    dialog.hide('return');
                    self.reloadG2gItems(self.grid.page)
                        .then(function () {
                            toast.success(langService.get("return_specific_success").change({name: g2gItem.getTranslatedName()}));
                        });
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
            g2gItem
                .terminate()
                .then(function () {
                    new ResolveDefer(defer);
                    self.reloadG2gItems(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('terminate_success'));
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
                showInView: false,
                subMenu: [
                    {
                        type: 'info',
                        checkShow: function (action, model) {
                            return true;
                        },
                        gridName: 'g2g-incoming'
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
                    'VIEW_DOCUMENT'
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
                    return !configurationService.G2G_QATAR_SOURCE;
                }
            },
            // Receive
            {
                type: 'action',
                icon: 'check',
                text: 'grid_action_receive',
                shortcut: true,
                callback: self.receiveDocument,
                class: "action-green",
                //permissionKey: '',
                showInView: true,
                showInViewOnly: true,
                checkShow: function (action, model) {
                    var show = model instanceof G2G ? !model.correspondence.isReceived : !model.isReceived;
                    return configurationService.G2G_QATAR_SOURCE ? true : show;
                }
            },
            // Return
            {
                type: 'action',
                icon: 'undo-variant',
                text: 'grid_action_return',
                shortcut: true,
                callback: self.returnDocument,
                class: "action-green",
                //permissionKey: '',
                showInView: true,
                //showInViewOnly: true,
                checkShow: function (action, model, viewExtraOptions) {
                    if (viewExtraOptions) {
                        return !(viewExtraOptions.g2gItem.isInternal && model.priorityLevelInfo.id === -1);
                    } else {
                        return !(model.isInternal && model.priorityLevel.id === -1);
                    }
                }
            }
        ];

        self.shortcutActions = gridService.getShortcutActions(self.gridActions);
        self.contextMenuActions = gridService.getContextMenuActions(self.gridActions);
    });
};
