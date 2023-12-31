module.exports = function (app) {
    app.controller('centralArchiveSentItemCtrl', function (lookupService,
                                                           sentItemDepartmentInboxService,
                                                           SentItemCentralArchive,
                                                           SentItemDepartmentInbox,
                                                           $q,
                                                           $filter,
                                                           $state,
                                                           listGeneratorService,
                                                           langService,
                                                           toast,
                                                           dialog,
                                                           viewDocumentService,
                                                           viewTrackingSheetService,
                                                           managerService,
                                                           rootEntity,
                                                           counterService,
                                                           downloadService,
                                                           contextHelpService,
                                                           employeeService,
                                                           correspondenceService,
                                                           ResolveDefer,
                                                           favoriteDocumentsService,
                                                           generator,
                                                           printService,
                                                           EventHistoryCriteria,
                                                           mailNotificationService,
                                                           _,
                                                           gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'centralArchiveSentItemCtrl';

        contextHelpService.setHelpTo('sent-items-central-archive');

        self.docClassName = 'outgoing';
        /**
         * @description All sent items
         * @type {*}
         */
        self.sentItemCentralArchives = [];
        self.sentItemCentralArchivesCopy = angular.copy(self.sentItemCentralArchives);

        /**
         * @description Contains the selected sent items
         * @type {Array}
         */
        self.selectedSentItemCentralArchives = [];
        self.globalSetting = rootEntity.returnRootEntity().settings;
        self.employee = employeeService.getEmployee();

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            name: gridService.grids.centralArchive.sentItem,
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.centralArchive.sentItem) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.centralArchive.sentItem, self.sentItemCentralArchives),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.centralArchive.sentItem, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.centralArchive.sentItem),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.centralArchive.sentItem, self.grid.truncateSubject);
            },
            searchColumns: {
                serial: 'docFullSerial',
                subject: 'docSubject',
                type: 'typeOriginalCopy',
                sender: function (record) {
                    return self.getSortingKey('sentByIdInfo', 'SenderInfo');
                },
                mainSiteFrom: function (record) {
                    return self.getSortingKey('mainSiteFromIdInfo', 'CorrespondenceSite')
                },
                mainSiteTo: function (record) {
                    return self.getSortingKey('mainSiteToIdInfo', 'CorrespondenceSite')
                },
                subSiteFrom: function (record) {
                    return self.getSortingKey('subSiteFromIdInfo', 'CorrespondenceSite')
                },
                subSiteTo: function (record) {
                    return self.getSortingKey('subSiteToIdInfo', 'CorrespondenceSite')
                },
                receivedDate: 'deliveryDate',
                status: function (record) {
                    return self.getSortingKey('messageStatus', 'Information');
                }
            },
            searchText: '',
            searchCallback: function (grid) {
                self.sentItemCentralArchives = gridService.searchGridData(self.grid, self.sentItemCentralArchivesCopy);
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
            self.sentItemCentralArchives = $filter('orderBy')(self.sentItemCentralArchives, self.grid.order);
        };

        /**
         * @description Reload the grid of sent item
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadSentItemCentralArchives = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return sentItemDepartmentInboxService
                .loadSentItemDepartmentInboxes(self.selectedMonth, self.selectedYear, true)
                .then(function (result) {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.sentItemCentralArchives = result;
                    self.sentItemCentralArchivesCopy = angular.copy(self.sentItemCentralArchives);
                    self.selectedSentItemCentralArchives = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Opens the popup to get the month and year for sent items
         * @type {Date}
         */
        var today = new Date();
        self.selectedYear = today.getFullYear();
        self.selectedMonth = today.getMonth() + 1;
        self.getMonthYearForSentItems = function ($event) {
            sentItemDepartmentInboxService
                .controllerMethod
                .openDateAndYearDialog(self.selectedMonth, self.selectedYear, $event)
                .then(function (result) {
                    self.selectedMonth = result.month;
                    self.selectedYear = result.year;
                    self.selectedMonthText = angular.copy(result.monthText);
                    self.reloadSentItemCentralArchives(self.grid.page);
                });
        };
        self.selectedMonthText = generator.months[self.selectedMonth - 1].text;
        self.reloadSentItemCentralArchives(self.grid.page); // he called it hear

        /**
         * @description Terminate central archive sent Items
         * @param centralArchiveItem
         * @param $event
         * @param defer
         */
        self.terminate = function (centralArchiveItem, $event, defer) {
            /*sentItemDepartmentInboxService.controllerMethod
             .sentItemDepartmentInboxTerminate(centralArchiveItem, $event)
             .then(function (result) {
             self.reloadSentItemCentralArchives(self.grid.page)
             .then(function () {
             toast.success(langService.get("terminate_specific_success").change({name: centralArchiveItem.generalStepElm.docSubject}));
             new ResolveDefer(defer);
             })
             ;
             });*/
        };


        /**
         * @description Launch New Distribution workflow for central archive Sent Item
         * @param centralArchiveItem
         * @param $event
         * @param defer
         */
        self.launchNewDistributionWorkflow = function (centralArchiveItem, $event, defer) {
            centralArchiveItem.recordGridName = gridService.grids.centralArchive.sentItem;
            centralArchiveItem.launchWorkFlow($event, 'forward', self.employee.isDefaultTabFavoriteAtLaunch() ? 'favorites' : 'users')
                .then(function () {
                    self.reloadSentItemCentralArchives(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                });

        };

        /**
         * @description Launch New distribution workflow with quick send
         * @param record
         * @param $event
         * @param defer
         */
        self.quickSend = function (record, $event, defer) {
            record.recordGridName = gridService.grids.centralArchive.sentItem;
            record.quickSendLaunchWorkflow($event, self.employee.isDefaultTabFavoriteAtLaunch() ? 'favorites' : 'users')
                .then(function () {
                    self.reloadSentItemCentralArchives(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description add an item to the favorite documents
         * @param centralArchiveItem
         * @param $event
         */
        self.addToFavorite = function (centralArchiveItem, $event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAdd(centralArchiveItem.vsId, $event)
                .then(function (result) {
                        if (result.status) {
                            self.reloadSentItemCentralArchives(self.grid.page)
                                .then(function () {
                                    toast.success(langService.get("add_to_favorite_specific_success").change({
                                        name: centralArchiveItem.getTranslatedName()
                                    }));
                                });
                        } else {
                            dialog.alertMessage(langService.get(result.message));
                        }
                    }
                );
        };

        /**
         * @description View Tracking Sheet
         * @param centralArchiveItem
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (centralArchiveItem, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(centralArchiveItem, params, $event).then(function (result) {

            });
        };

        /**
         * @description Manage Tags
         * @param centralArchiveItem
         * @param $event
         */
        self.manageTags = function (centralArchiveItem, $event) {
            managerService.manageDocumentTags(centralArchiveItem.vsId, self.docClassName, centralArchiveItem.docSubject, $event)
                .then(function (tags) {
                    centralArchiveItem.tags = tags;
                })
                .catch(function (tags) {
                    centralArchiveItem.tags = tags;
                });
        };

        /**
         * @description Manage Comments
         * @param centralArchiveItem
         * @param $event
         */
        self.manageComments = function (centralArchiveItem, $event) {
            centralArchiveItem.manageDocumentComments($event)
                .then(function (documentComments) {
                    centralArchiveItem.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    centralArchiveItem.documentComments = documentComments;
                });
        };

        /**
         * @description Manage Tasks
         * @param centralArchiveItem
         * @param $event
         */
        self.manageTasks = function (centralArchiveItem, $event) {
            //  console.log('manage tasks : ', centralArchiveItem)
        };

        /**
         * @description Manage Attachments
         * @param centralArchiveItem
         * @param $event
         */
        self.manageAttachments = function (centralArchiveItem, $event) {
            centralArchiveItem.manageDocumentAttachments($event);
        };

        /**
         * @description Manage Linked Documents
         * @param centralArchiveItem
         * @param $event
         */
        self.manageLinkedDocuments = function (centralArchiveItem, $event) {
            managerService.manageDocumentLinkedDocuments(centralArchiveItem.vsId, self.docClassName, "welcome");
        };

        /**
         * @description Manage Linked Entities
         * @param centralArchiveItem
         * @param $event
         */
        self.manageLinkedEntities = function (centralArchiveItem, $event) {
            managerService
                .manageDocumentEntities(centralArchiveItem.vsId, self.docClassName, centralArchiveItem.docSubject, $event);
        };


        /**
         * @description Download Main Document
         * @param centralArchiveItem
         * @param $event
         */
        self.downloadMainDocument = function (centralArchiveItem, $event) {
            centralArchiveItem
                .mainDocumentDownload($event);
        };

        /**
         * @description Manage Composite Document
         * @param centralArchiveItem
         * @param $event
         */
        self.downloadCompositeDocument = function (centralArchiveItem, $event) {
            /*downloadService.controllerMethod
                .compositeDocumentDownload(centralArchiveItem.vsId, $event);*/
            centralArchiveItem
                .compositeDocumentDownload($event);
        };

        /**
         * @description download selected document
         * @param centralArchiveItem
         * @param $event
         */
        self.downloadSelected = function (centralArchiveItem, $event) {
            downloadService.openSelectedDownloadDialog(centralArchiveItem, $event);
        };

        /**
         * @description merge and download
         * @param centralArchiveItem
         */
        self.mergeAndDownloadFullDocument = function (centralArchiveItem) {
            downloadService.mergeAndDownload(centralArchiveItem);
        };

        /**
         * @description Send link to document by email
         * @param centralArchiveItem
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (centralArchiveItem, $event) {
            centralArchiveItem
                .getMainDocumentEmailContent($event);
        };

        /**
         * @description Send composite document as attachment by email
         * @param centralArchiveItem
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (centralArchiveItem, $event) {
            centralArchiveItem
                .getCompositeDocumentEmailContent($event);
        };

        /**
         * @description Send sms
         * @param centralArchiveItem
         * @param $event
         */
        self.sendSMS = function (centralArchiveItem, $event) {
            // console.log('Send sms : ', centralArchiveItem);
        };

        /**
         * @description Send main document fax
         * @param centralArchiveItem
         * @param $event
         */
        self.sendMainDocumentFax = function (centralArchiveItem, $event) {
            //  console.log('send main document fax : ', centralArchiveItem);
        };

        /**
         * @description Get Link
         * @param centralArchiveItem
         * @param $event
         */
        self.getLink = function (centralArchiveItem, $event) {
            viewDocumentService.loadDocumentViewUrlWithOutEdit(centralArchiveItem.vsId).then(function (result) {
                //var docLink = "<a target='_blank' href='" + result + "'>" + result + "</a>";
                dialog.successMessage(langService.get('link_message').change({result: result}), null, null, null, null, true);
                return true;
            });
        };

        /**
         * @description Subscribe
         * @param centralArchiveItem
         * @param $event
         */
        self.subscribe = function (centralArchiveItem, $event) {
            console.log('subscribe : ', centralArchiveItem);
        };

        /**
         * @description Preview document
         * @param centralArchiveItem
         * @param $event
         */
        self.previewDocument = function (centralArchiveItem, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence({
                vsId: centralArchiveItem.vsId,
                docClassName: self.docClassName
            }, self.gridActions, true, true, true)
                .then(function () {
                    self.reloadSentItemCentralArchives(self.grid.page);
                })
                .catch(function () {
                    self.reloadSentItemCentralArchives(self.grid.page);
                });
        };

        /**
         * @description View document
         * @param centralArchiveItem
         * @param $event
         */
        self.viewDocument = function (centralArchiveItem, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            centralArchiveItem.viewNewDepartmentSentItem(self.gridActions, 'centralArchiveSentItem', $event)
                .then(function () {
                    self.reloadSentItemCentralArchives(self.grid.page);
                })
                .catch(function () {
                    self.reloadSentItemCentralArchives(self.grid.page);
                });
        };

        /**
         * @description get document versions
         * @param centralArchiveItem
         * @param $event
         * @return {*}
         */
        self.getDocumentVersions = function (centralArchiveItem, $event) {
            return centralArchiveItem
                .viewSpecificVersion(self.gridActions, $event);
        };
        /**
         * @description duplicate current version
         * @param centralArchiveItem
         * @param $event
         */
        self.duplicateCurrentVersion = function (centralArchiveItem, $event) {
            var info = centralArchiveItem.getInfo();
            return centralArchiveItem
                .duplicateVersion($event)
                .then(function () {
                    $state.go('app.' + info.documentClass.toLowerCase() + '.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        wobNum: info.wobNumber
                    });
                });
        };
        /**
         * @description duplicate specific version
         * @param centralArchiveItem
         * @param $event
         * @return {*}
         */
        self.duplicateVersion = function (centralArchiveItem, $event) {
            var info = centralArchiveItem.getInfo();
            return centralArchiveItem
                .duplicateSpecificVersion($event)
                .then(function () {
                    $state.go('app.' + info.documentClass.toLowerCase() + '.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        wobNum: info.wobNumber
                    });
                });
        };

        /**
         * @description Edit After Approve
         * @param model
         * @param $event
         */
        self.editAfterExport = function (model, $event) {
            var info = model.getInfo(), list = listGeneratorService.createUnOrderList(),
                langKeys = ['signature_serial_will_removed', 'the_book_will_go_to_audit', 'serial_retained'];
            _.map(langKeys, function (item) {
                list.addItemToList(langService.get(item));
            });
            dialog.confirmMessage(list.getList(), null, null, $event)
                .then(function () {
                    $state.go('app.outgoing.add', {
                        wobNum: info.wobNumber,
                        vsId: info.vsId,
                        action: 'editAfterExport'
                    });
                });
        };

        self.printResult = function ($event) {
            var searchCriteria = {
                month: self.selectedMonth,
                year: self.selectedYear,
                isCentral: true
            };

            var printTitle = langService.get('menu_item_sent_items'),
                table = [
                    {header: 'sent_items_serial_number', column: 'docFullSerial'},
                    // {header:'label_document_class',column:'docClassName'},
                    {header: 'sent_items_document_subject', column: 'docSubject'},
                    {header: 'main_site_to', column: 'mainSiteToIdInfo'},
                    {header: 'sub_site_to', column: 'subSiteToIdInfo'},
                    {header: 'action_by', column: 'sentByIdInfo'},
                    {header: 'export_date', column: 'sentDate'},
                    {header: 'sent_items_receive_date', column: 'deliveryDate'},
                    {header: 'status', column: 'messageStatus'}
                ]

            printService
                .printData(self.sentItemDepartmentInboxes, table, printTitle, searchCriteria);

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
                        gridName: gridService.grids.centralArchive.sentItem
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
                        shortcut: true,
                        callback: self.previewDocument,
                        class: "action-green",
                        showInView: false,
                        permissionKey: 'VIEW_DOCUMENT',
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
                        showInView: false,
                        permissionKey: 'VIEW_DOCUMENT',
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
                        hide: true,
                        callback: self.getDocumentVersions,
                        permissionKey: "VIEW_DOCUMENT_VERSION",
                        class: "action-green",
                        showInView: true,
                        checkShow: function (action, model) {
                            return true;
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
            // Terminate
            {
                type: 'action',
                icon: 'stop',
                text: 'grid_action_terminate',
                shortcut: true,
                callback: self.terminate,
                class: "action-red",
                hide: true, /*THERE IS NO WORK OBJECT NUMBER IN SENT ITEMS*/
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Edit After Export
            {
                type: 'action',
                icon: 'eraser-variant',
                text: 'grid_action_edit_after_export',
                shortcut: true,
                callback: self.editAfterExport,
                class: "action-green",
                showInView: false,
                hide: true,
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    var hasPermission = (employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES")
                        || (info.isPaper ? employeeService.hasPermissionTo("EDIT_OUTGOING_PAPER") : employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT")));

                    return hasPermission;
                }
            },
            // Launch New Distribution Workflow
            {
                type: 'action',
                icon: 'sitemap',
                text: 'grid_action_launch_new_distribution_workflow',
                shortcut: true,
                callback: self.launchNewDistributionWorkflow,
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
                    return true;
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
                    "MANAGE_TASKS",
                    "MANAGE_ATTACHMENTS",
                    "MANAGE_LINKED_DOCUMENTS",
                    "MANAGE_LINKED_ENTITIES"
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
                    // Tasks
                    {
                        type: 'action',
                        icon: 'note-multiple',
                        text: 'grid_action_tasks',
                        shortcut: false,
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
                        shortcut: false,
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
                        shortcut: false,
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
                        shortcut: false,
                        callback: self.manageLinkedEntities,
                        permissionKey: "MANAGE_LINKED_ENTITIES",
                        class: "action-green",
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
                showInView: true,
                showInViewOnly: true,
                checkShow: function (action, model) {
                    var isAllowed = true;
                    if (model.isCorrespondenceApprovedBefore() && model.getInfo().authorizeByAnnotation) {
                        isAllowed = rootEntity.getGlobalSettings().isAllowEditAfterFirstApprove();
                    }

                    return isAllowed && gridService.checkToShowMainMenuBySubMenu(action, model) && !correspondenceService.isLimitedCentralUnitAccess(model);
                },
                permissionKey: [
                    "DOWNLOAD_MAIN_DOCUMENT",
                    "DOWNLOAD_COMPOSITE_BOOK" //Composite Document
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
                        callback: self.downloadMainDocument,
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
                        callback: self.downloadCompositeDocument,
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
                    },
                    // merge and download
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'merge_and_download',
                        permissionKey: 'DOWNLOAD_COMPOSITE_BOOK',
                        callback: self.mergeAndDownloadFullDocument,
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
                    return gridService.checkToShowMainMenuBySubMenu(action, model) && !correspondenceService.isLimitedCentralUnitAccess(model);
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
                        permissionKey: 'SEND_COMPOSITE_DOCUMENT_BY_EMAIL',
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
                        hide: true,
                        permissionKey: "SEND_DOCUMENT_BY_FAX",
                        callback: self.sendMainDocumentFax,
                        class: "action-red",
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
                        hide: false,
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
            // Subscribe
            {
                type: 'action',
                icon: 'bell-plus',
                text: 'grid_action_subscribe',
                shortcut: false,
                callback: self.subscribe,
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
                        hide: true,
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
                        hide: true,
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
