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
                                                           mailNotificationService,
                                                           gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'centralArchiveSentItemCtrl';

        contextHelpService.setHelpTo('sent-items-central-archive');

        self.progress = null;

        self.docClassName = 'outgoing';
        /**
         * @description All sent items
         * @type {*}
         */
        self.sentItemCentralArchives = [];

        /**
         * @description Contains the selected sent items
         * @type {Array}
         */
        self.selectedSentItemCentralArchives = [];
        self.globalSetting = rootEntity.returnRootEntity().settings;

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.centralArchive.sentItem) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.centralArchive.sentItem, self.sentItemCentralArchives),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.centralArchive.sentItem, limit);
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
            self.progress = defer.promise;
            return sentItemDepartmentInboxService
                .loadSentItemDepartmentInboxes(self.selectedMonth, self.selectedYear, true)
                .then(function (result) {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.sentItemCentralArchives = result;
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
             self.reloadUserInboxes(self.grid.page)
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
            centralArchiveItem.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadSentItemCentralArchives(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                });

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
            managerService.manageDocumentComments(centralArchiveItem.vsId, centralArchiveItem.docSubject, $event)
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
            console.log('manage tasks : ', centralArchiveItem)
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
            console.log('manage linked documents', centralArchiveItem);

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
            //console.log('download main document : ', centralArchiveItem);
            downloadService.controllerMethod
                .mainDocumentDownload(centralArchiveItem.vsId, $event);
        };

        /**
         * @description Manage Composite Document
         * @param centralArchiveItem
         * @param $event
         */
        self.downloadCompositeDocument = function (centralArchiveItem, $event) {
            // console.log('download composite document : ', centralArchiveItem);
            downloadService.controllerMethod
                .compositeDocumentDownload(centralArchiveItem.vsId, $event);
        };

        /**
         * @description Send link to document by email
         * @param centralArchiveItem
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (centralArchiveItem, $event) {
            downloadService.getMainDocumentEmailContent(centralArchiveItem.getInfo().vsId);
        };

        /**
         * @description Send composite document as attachment by email
         * @param centralArchiveItem
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (centralArchiveItem, $event) {
            downloadService.getCompositeDocumentEmailContent(centralArchiveItem.getInfo().vsId);
        };

        /**
         * @description Send sms
         * @param centralArchiveItem
         * @param $event
         */
        self.sendSMS = function (centralArchiveItem, $event) {
            console.log('Send sms : ', centralArchiveItem);
        };

        /**
         * @description Send main document fax
         * @param centralArchiveItem
         * @param $event
         */
        self.sendMainDocumentFax = function (centralArchiveItem, $event) {
            console.log('send main document fax : ', centralArchiveItem);
        };

        /**
         * @description Get Link
         * @param centralArchiveItem
         * @param $event
         */
        self.getLink = function (centralArchiveItem, $event) {
            viewDocumentService.loadDocumentViewUrlWithOutEdit(centralArchiveItem.vsId).then(function (result) {
                //var docLink = "<a target='_blank' href='" + result + "'>" + result + "</a>";
                dialog.successMessage(langService.get('link_message').change({result: result}),null,null,null,null,true);
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
                        workItem: info.wobNum
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
                        workItem: info.wobNum
                    });
                });
        };


        /**
         * @description Check if action will be shown on grid or not
         * @param action
         * @param model
         * @returns {boolean}
         */
        self.checkToShowAction = function (action, model) {
            var hasPermission = true;
            if (action.hasOwnProperty('permissionKey')) {
                if (typeof action.permissionKey === 'string') {
                    hasPermission = employeeService.hasPermissionTo(action.permissionKey);
                } else if (angular.isArray(action.permissionKey) && action.permissionKey.length) {
                    if (action.hasOwnProperty('checkAnyPermission')) {
                        hasPermission = employeeService.getEmployee().hasAnyPermissions(action.permissionKey);
                    } else {
                        hasPermission = employeeService.getEmployee().hasThesePermissions(action.permissionKey);
                    }
                }
            }
            return (!action.hide) && hasPermission;
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
                        workItem: info.wobNumber,
                        vsId: info.vsId,
                        action: 'editAfterExport'
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
                        checkShow: self.checkToShowAction,
                        gridName: 'department-sent-items'
                    }
                ],
                class: "action-green",
                checkShow: self.checkToShowAction
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
                checkShow: self.checkToShowAction,
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
                        checkShow: self.checkToShowAction
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
                        checkShow: self.checkToShowAction
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
                        checkShow: self.checkToShowAction
                    }
                ]
            },
            // Separator
            {
                type: 'separator',
                checkShow: self.checkToShowAction,
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
                checkShow: self.checkToShowAction
            },
            // Edit After Approve (Only electronic only)
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
                    // var info = model.getInfo();
                    var hasPermission = (employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES") || employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
                    // return self.checkToShowAction(action, model) && !info.isPaper;
                    return self.checkToShowAction(action, model) && hasPermission; //TODO: Check with Besara as its enabled for paper by Issawi on 16 Oct, 2018
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
                checkShow: self.checkToShowAction
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
                checkShow: self.checkToShowAction
            },
            // View Tracking Sheet
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view_tracking_sheet',
                shortcut: false,
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: self.checkToShowAction,
                subMenu: viewTrackingSheetService.getViewTrackingSheetOptions(self.checkToShowAction, self.viewTrackingSheet, 'grid')
            },
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                shortcut: false,
                showInView: false,
                checkShow: self.checkToShowAction,
                permissionKey: [
                    "MANAGE_DOCUMENT’S_TAGS",
                    "MANAGE_DOCUMENT’S_COMMENTS",
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
                        checkShow: self.checkToShowAction
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
                        checkShow: self.checkToShowAction
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
                        checkShow: self.checkToShowAction
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
                        checkShow: self.checkToShowAction
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
                        checkShow: self.checkToShowAction
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
                        checkShow: self.checkToShowAction
                    }
                ]
            },
            // Download
            {
                type: 'action',
                icon: 'download',
                text: 'grid_action_download',
                shortcut: false,
                checkShow: self.checkToShowAction,
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
                        checkShow: self.checkToShowAction
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
                        checkShow: self.checkToShowAction
                    }
                ]
            },
            // Send
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_send',
                shortcut: false,
                checkShow: self.checkToShowAction,
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
                        checkShow: self.checkToShowAction
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
                        checkShow: self.checkToShowAction
                    },
                    // Main Document Fax
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_main_document_fax',
                        shortcut: false,
                        hide: true,
                        permissionKey: "SEND_DOCUMENT_BY_FAX",
                        callback: self.sendMainDocumentFax,
                        class: "action-red",
                        checkShow: self.checkToShowAction
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
                        checkShow: self.checkToShowAction
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
                hide: false,
                checkShow: self.checkToShowAction
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
                checkShow: self.checkToShowAction
            },
            // Duplicate
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_duplicate',
                shortcut: false,
                showInView: false,
                checkShow: self.checkToShowAction,
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
                            return self.checkToShowAction(action, model) && (info.documentClass === 'outgoing' || info.documentClass === 'internal') && !info.isPaper
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
                        checkShow: self.checkToShowAction
                    }
                ]
            }
        ];

    });
};
