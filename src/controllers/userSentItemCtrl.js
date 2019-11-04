module.exports = function (app) {
    app.controller('userSentItemCtrl', function (lookupService,
                                                 userSentItemService,
                                                 userSentItems,
                                                 $q,
                                                 $filter,
                                                 $state,
                                                 viewDocumentService,
                                                 langService,
                                                 rootEntity,
                                                 contextHelpService,
                                                 correspondenceService,
                                                 managerService,
                                                 viewTrackingSheetService,
                                                 downloadService,
                                                 employeeService,
                                                 favoriteDocumentsService,
                                                 toast,
                                                 mailNotificationService,
                                                 counterService,
                                                 gridService,
                                                 WorkItem,
                                                 ResolveDefer,
                                                 generator,
                                                 dialog,
                                                 EventHistoryCriteria,
                                                 printService,
                                                 moment,
                                                 EventHistory) {
        'ngInject';
        var self = this;

        self.controllerName = 'userSentItemCtrl';

        contextHelpService.setHelpTo('user-sent-items');
        /**
         * @description All user sent items
         * @type {*}
         */
        self.userSentItems = userSentItems;
        self.userSentItemsCopy = angular.copy(userSentItems);
        self.totalRecords = userSentItemService.totalCount;
        self.userSentItemService = userSentItemService;

        /**
         * @description Contains the selected user sent items
         * @type {Array}
         */
        self.selectedUserSentItems = [];
        self.globalSetting = rootEntity.returnRootEntity().settings;

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
            self.userSentItems = $filter('orderBy')(self.userSentItems, self.grid.order);
        };

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.inbox.sentItem) || 5, //self.globalSetting.searchAmount, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.inbox.sentItem, self.totalRecords), //[5, 10, 20, 100, 200]
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.inbox.sentItem, limit);
                self.reloadUserSentItems(page);
            },
            searchColumns: {
                securityLevel: function () {
                    return self.getSortingKey('securityLevelIndicator.value', 'Lookup')
                },
                docFullSerial: 'docFullSerial',
                docSubject: 'docSubject',
                actionDate: 'actionDate',
                action: function () {
                    return self.getSortingKey('action', 'WorkflowAction');
                },
                receiverInfo: function () {
                    return self.getSortingKey('receiverInfo', 'Information');
                },
                comments: 'comments',
                dueDate: 'dueDate',
                mainSiteSubSiteString: function () {
                    return self.getSortingKey('mainSiteSubSiteString', 'Information');
                }
            },
            searchText: '',
            searchCallback: function (grid, serverSide) {
                if (!!serverSide) {
                    gridService.searchGridData(self.grid, self.userSentItemsCopy, userSentItemService.filterUserSentItems)
                        .then(function (result) {
                            self.userSentItems = self.grid.searchText ? result.records : result;
                            self.totalRecords = self.grid.searchText ? result.count : userSentItemService.totalCount;
                        });
                } else {
                    self.userSentItems = gridService.searchGridData(self.grid, self.userSentItemsCopy);
                    self.totalRecords = self.grid.searchText ? self.userSentItems.length : userSentItemService.totalCount;
                }
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.inbox.sentItem),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.inbox.sentItem, self.grid.truncateSubject);
            }
        };

        var _initEventHistoryCriteria = function (skipDates) {
            if (skipDates) {
                self.searchCriteria = new EventHistoryCriteria();
            } else {
                self.searchCriteria = new EventHistoryCriteria({
                    fromActionTime: moment().subtract(3, 'months').toDate(),
                    toActionTime: moment().endOf("day").toDate()
                })
            }
        };

        _initEventHistoryCriteria();
        self.searchCriteriaUsed = false;

        /**
         * @description Reload the grid of user sent item
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadUserSentItems = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            if (self.searchCriteriaUsed) {
                return userSentItemService.filterUserSentItems(null, self.searchCriteria, self.grid.page)
                    .then(function (result) {
                        self.userSentItems = result.records;
                        self.totalRecords = result.count;
                        defer.resolve(true);
                        return result;
                    });
            }

            return userSentItemService
                .loadUserSentItems(self.grid.page, self.grid.limit)
                .then(function (result) {
                    self.userSentItems = result;
                    self.userSentItemsCopy = angular.copy(self.userSentItems);
                    self.totalRecords = userSentItemService.totalCount;

                    self.selectedUserSentItems = [];
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    self.grid.searchCallback();
                    return result;
                });
        };

        /**
         * @description Opens the search dialog for user sent items search
         */
        self.openFilterDialog = function ($event) {
            if (self.grid.searchText) {
                self.searchCriteria.docSubject = self.grid.searchText;
            }
            userSentItemService
                .controllerMethod.openFilterDialog(self.grid, self.searchCriteria)
                .then(function (result) {
                    self.grid.page = 1;
                    self.grid.searchText = '';
                    self.userSentItems = result.result.records;
                    // if criteria is returned in result, means filter is used. otherwise, filter is reset
                    if (result.criteria) {
                        // when filter is used, the total count is number of items returned.
                        self.totalRecords = result.result.count;
                        self.searchCriteriaUsed = true;
                        self.searchCriteria = result.criteria;
                    } else {
                        // when filter is reset, use the total count from service as total records
                        self.totalRecords = userSentItemService.totalCount;
                        self.searchCriteriaUsed = false;
                        _initEventHistoryCriteria();
                    }
                })
                .catch(function (error) {
                    if (error && error.hasOwnProperty('error') && error.error === 'serverError') {
                        self.grid.page = 1;
                        self.grid.searchText = '';
                        self.searchCriteriaUsed = true;
                        self.searchCriteria = error.criteria;
                        self.userSentItems = [];
                        self.totalRecords = 0;
                    }
                });
        };

        self.resetFilter = function ($event) {
            self.grid.page = 1;
            self.grid.searchText = '';
            _initEventHistoryCriteria();
            self.searchCriteriaUsed = false;

            self.userSentItems = userSentItems;
            self.totalRecords = userSentItemService.totalCount;
        };

        /**
         * @description Recall Bulk User Sent Items
         * @param $event
         */
        self.recallBulkSentItems = function ($event) {
            console.log('recall bulk sent items : ', self.selectedUserSentItems);
        };

        /**
         * @description Reassign Bulk User Sent Items
         * @param $event
         */
        self.reassignBulkSentItems = function ($event) {
            //console.log('reassign bulk sent items : ', self.selectedUserSentItems);
            /*var selectedUserSentItems = generator.generateCollection(self.selectedUserSentItems,WorkItem);
            correspondenceService
                .openTransferDialog(selectedUserSentItems, $event)
                .then(function () {
                    self.reloadUserSentItems(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('transfer_mail_success'))
                        });
                });*/
        };

        /**
         * @description Recall Single User Sent Items
         * @param userSentItem
         * @param $event
         */
        self.recallSingle = function (userSentItem, $event) {
            userSentItem = self.userSentItemCopy ? self.userSentItemCopy : userSentItem;
            userSentItemService.recallSentItem(userSentItem, $event, null, self.userSentItemCopy)
                .then(function (result) {
                    if (result) {
                        self.reloadUserSentItems(self.grid.page)
                            .then(function () {
                                toast.success(langService.get('recall_success').change({name: userSentItem.getTranslatedName()}));
                            });
                    }
                });
        };

        /**
         * @description Reassign Single User Sent Items
         * @param userSentItem
         * @param $event
         */
        self.reassignSingle = function (userSentItem, $event) {
            //console.log('reassign single : ', userSentItem);
            /*correspondenceService
                .openTransferDialog(new WorkItem(userSentItem), $event)
                .then(function () {
                    self.reloadUserSentItems(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('reassign_success'));
                            new ResolveDefer(defer);
                        });
                })*/
        };

        /**
         * @description add an item to the favorite documents
         * @param userSentItem
         * @param $event
         */
        self.addToFavorite = function (userSentItem, $event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAdd(userSentItem.getInfo().vsId, $event)
                .then(function (result) {
                    if (result.status) {
                        self.reloadUserSentItems(self.grid.page)
                            .then(function () {
                                toast.success(langService.get("add_to_favorite_specific_success").change({
                                    name: userSentItem.getTranslatedName()
                                }));
                            });
                    } else {
                        dialog.alertMessage(langService.get(result.message));
                    }
                });
        };

        /**
         * @description View Tracking Sheet
         * @param userSentItem
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (userSentItem, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(userSentItem, params, $event).then(function (result) {

            });
        };

        /**
         * @description Manage document tags for sent item
         * @param userSentItem
         * @param $event
         */
        self.manageTags = function (userSentItem, $event) {
            var info = userSentItem.getInfo();
            managerService.manageDocumentTags(info.vsId, info.documentClass, info.title, $event)
                .then(function (tags) {
                    userSentItem.tags = tags;
                })
                .catch(function (tags) {
                    userSentItem.tags = tags;
                });
        };

        /**
         * @description Manage document comments for sent item
         * @param userSentItem
         * @param $event
         */
        self.manageComments = function (userSentItem, $event) {
            var info = userSentItem.getInfo();
            managerService.manageDocumentComments(info.vsId, info.title, $event)
                .then(function (documentComments) {
                    //userSentItem.comments = documentComments;
                })
                .catch(function (documentComments) {
                    //userSentItem.comments = documentComments;
                });
        };

        /**
         * @description Manage document attachments for sent item
         * @param userSentItem
         * @param $event
         */
        self.manageAttachments = function (userSentItem, $event) {
            userSentItem.manageDocumentAttachments($event);
        };

        /**
         * @description Manage Linked Entities
         * @param userSentItem
         * @param $event
         */
        self.manageLinkedEntities = function (userSentItem, $event) {
            var info = userSentItem.getInfo();
            managerService
                .manageDocumentEntities(info.vsId, info.documentClass, info.title, $event);
        };

        /**
         * @description Manage linked documents for sent item
         * @param userSentItem
         * @param $event
         */
        self.manageLinkedDocuments = function (userSentItem, $event) {
            var info = userSentItem.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description Download Main Document
         * @param userSentItem
         * @param $event
         */
        self.downloadSentItemMainDocument = function (userSentItem, $event) {
            downloadService.controllerMethod
                .mainDocumentDownload(userSentItem);
        };

        /**
         * @description Download Composite Document
         * @param userSentItem
         * @param $event
         */
        self.downloadSentItemCompositeDocument = function (userSentItem, $event) {
            downloadService.controllerMethod
                .compositeDocumentDownload(userSentItem);
        };

        /**
         * @description download selected document
         * @param userSentItem
         * @param $event
         */
        self.downloadSelected = function (userSentItem, $event) {
            downloadService.openSelectedDownloadDialog(userSentItem, $event);
        };

        /**
         * @description Send Link To Document By Email
         * @param userSentItem
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (userSentItem, $event) {
            downloadService.getMainDocumentEmailContent(userSentItem.getInfo().vsId);
        };

        /**
         * @description Send Composite Document As Attachment By Email
         * @param userSentItem
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (userSentItem, $event) {
            downloadService.getCompositeDocumentEmailContent(userSentItem.getInfo().vsId);
        };

        /**
         * @description Send SMS
         * @param userSentItem
         * @param $event
         */
        self.sendSMS = function (userSentItem, $event) {
            console.log('sendSMS : ', userSentItem);
        };

        /**
         * @description Send Main Document Fax
         * @param userSentItem
         * @param $event
         */
        self.sendMainDocumentFax = function (userSentItem, $event) {
            userSentItem.openSendFaxDialog($event);
        };


        /**
         * @description Get Link
         * @param userSentItem
         * @param $event
         */
        self.getLink = function (userSentItem, $event) {
            viewDocumentService.loadDocumentViewUrlWithOutEdit(userSentItem.documentVSID).then(function (result) {
                //var docLink = "<a target='_blank' href='" + result + "'>" + result + "</a>";
                dialog.successMessage(langService.get('link_message').change({result: result}), null, null, null, null, true);
                return true;
            });
        };


        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var hasPermission = false;
            if (checkForViewPopup) {
                return !hasPermission;
            }
        };

        /**
         * @description Preview document
         * @param userSentItem
         * @param $event
         */
        self.previewDocument = function (userSentItem, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            var info = userSentItem.getInfo();
            info.wobNumber = null;
            self.userSentItemCopy = angular.copy(userSentItem);
            correspondenceService.viewCorrespondence({
                vsId: info.vsId,
                docClassName: info.documentClass
            }, self.gridActions, checkIfEditPropertiesAllowed(userSentItem, true), true)
                .then(function () {
                    self.userSentItemCopy = null;
                    self.reloadUserSentItems(self.grid.page);
                })
                .catch(function () {
                    self.userSentItemCopy = null;
                    self.reloadUserSentItems(self.grid.page);
                });
        };

        /**
         * @description View document
         * @param userSentItem
         * @param $event
         */
        self.viewDocument = function (userSentItem, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            self.userSentItemCopy = angular.copy(userSentItem);
            userSentItem.viewUserSentItem(self.gridActions, 'sentItem', $event)
                .then(function () {
                    self.userSentItemCopy = null;
                    return self.reloadUserSentItems(self.grid.page);
                })
                .catch(function () {
                    self.userSentItemCopy = null;
                    return self.reloadUserSentItems(self.grid.page);
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

        self.printResult = function ($event) {
            var printTitle = langService.get('menu_item_sent_items'),
                table = {
                    headers:
                        [
                            'sent_items_serial_number',
                            'label_document_class',
                            'sent_items_document_subject',
                            'action_date',
                            'sent_items_action',
                            'sent_items_receiver',
                            'comment'
                        ],
                    columns: [
                        'docFullSerial',
                        'docClassName',
                        'docSubject',
                        'actionDate',
                        'workflowActionInfo',
                        'userToInfo',
                        'comments'
                    ]
                };
            printService
                .printData(self.userSentItems, table, printTitle, (self.searchCriteriaUsed ? self.searchCriteria : new EventHistoryCriteria()));

        };


        /**
         * @description viewCorrespondenceSites
         * @param userSentItem
         * @param $event
         */
        self.viewCorrespondenceSites = function (userSentItem, $event) {
            correspondenceService.viewCorrespondenceSites(userSentItem, null, $event);
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
                        gridName: 'user-sent-items'
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
                        shortcut: true,
                        showInView: false,
                        callback: self.previewDocument,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        checkShow: function (action, model) {
                            //If no content, hide the button
                            return true;// && model.hasContent();
                        }
                    },
                    // Open
                    {
                        type: 'action',
                        icon: 'book-open-page-variant',
                        text: 'grid_action_open',
                        shortcut: true,
                        showInView: false,
                        callback: self.viewDocument,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        checkShow: function (action, model) {
                            //If no content, hide the button
                            return true;// && model.hasContent();
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
            // Recall
            {
                type: 'action',
                icon: 'tag',
                text: 'grid_action_recall',
                shortcut: true,
                callback: self.recallSingle,
                class: "action-green",
                hide: false,
                checkShow: function (action, model) {
                    /*workflowActionId == 9(terminated) or (actionType == 3 == broadcast)*/
                    if (!(model instanceof EventHistory)) {
                        model = angular.copy(self.userSentItemCopy);
                    }
                    return (model.workflowActionId !== 9 && model.actionType !== 3 && model.wfId !== null);
                }
            },
            // Reassign
            {
                type: 'action',
                icon: 'tag',
                text: 'grid_action_reassign',
                shortcut: true,
                callback: self.reassignSingle,
                class: "action-red",
                hide: true,
                checkShow: function (action, model) {
                    return true;
                }
            },
            // view Correspondence Sites
            {
                type: 'action',
                icon: 'arrange-send-backward',
                text: 'grid_action_correspondence_sites',
                callback: self.viewCorrespondenceSites,
                class: "action-green",
                showInView: false,
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return info.documentClass !== "internal";
                }
            },
            // Add To Favorite
            {
                type: 'action',
                icon: 'star',
                text: 'grid_action_add_to_favorite',
                permissionKey: "MANAGE_FAVORITE",
                shortcut: false,
                callback: self.addToFavorite,
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
                    }
                ]
            },
            // Download
            {
                type: 'action',
                icon: 'download',
                text: 'grid_action_download',
                shortcut: false,
                checkShow: function (action, model) {
                    return true;
                },
                permissionKey: [
                    "DOWNLOAD_MAIN_DOCUMENT",
                    "DOWNLOAD_COMPOSITE_BOOK"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // Main Document
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_main_document',
                        shortcut: false,
                        permissionKey: "DOWNLOAD_MAIN_DOCUMENT",
                        callback: self.downloadSentItemMainDocument,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Composite Document
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_composite_document',
                        permissionKey: 'DOWNLOAD_COMPOSITE_BOOK',
                        shortcut: false,
                        callback: self.downloadSentItemCompositeDocument,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // download selected
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'selective_document',
                        permissionKey: 'DOWNLOAD_COMPOSITE_BOOK',
                        callback: self.downloadSelected,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Send
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_send',
                shortcut: false,
                checkShow: function (action, model) {
                    return true;
                },
                permissionKey: [
                    "SEND_LINK_TO_THE_DOCUMENT_BY_EMAIL",
                    "SEND_COMPOSITE_DOCUMENT_BY_EMAIL",
                    "SEND_DOCUMENT_BY_FAX",
                    "SEND_SMS"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // Link To Document By Email
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_link_to_document_by_email',
                        shortcut: false,
                        permissionKey: 'SEND_LINK_TO_THE_DOCUMENT_BY_EMAIL',
                        callback: self.sendLinkToDocumentByEmail,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Composite Document As Attachment By Email
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_composite_document_as_attachment_by_email',
                        shortcut: false,
                        permissionKey: 'SEND_COMPOSITE_DOCUMENT_BY_EMAIL',
                        callback: self.sendCompositeDocumentAsAttachmentByEmail,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Main Document Fax
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_send_document_by_fax',
                        shortcut: false,
                        permissionKey: "SEND_DOCUMENT_BY_FAX",
                        callback: self.sendMainDocumentFax,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return model.canSendByFax();
                        }
                    },
                    // SMS
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'grid_action_send_sms',
                        shortcut: false,
                        hide: true,
                        permissionKey: "SEND_SMS",
                        callback: self.sendSMS,
                        class: "action-red",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Get Link
            {
                type: 'action',
                icon: 'link',
                text: 'grid_action_get_link',
                shortcut: false,
                permissionKey: 'GET_A_LINK_TO_THE_DOCUMENT',
                callback: self.getLink,
                class: "action-green",
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
