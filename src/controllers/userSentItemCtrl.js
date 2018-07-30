module.exports = function (app) {
    app.controller('userSentItemCtrl', function (lookupService,
                                                 userSentItemService,
                                                 userSentItems,
                                                 $q,
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
                                                 correspondenceSiteService,
                                                 WorkItem,
                                                 ResolveDefer,
                                                 generator,
                                                 dialog) {
        'ngInject';
        var self = this;

        self.controllerName = 'userSentItemCtrl';

        self.progress = null;
        contextHelpService.setHelpTo('user-sent-items');
        /**
         * @description All user sent items
         * @type {*}
         */
        self.userSentItems = userSentItems;

        self.userSentItemService = userSentItemService;


        /**
         * @description Contains the selected user sent items
         * @type {Array}
         */
        self.selectedUserSentItems = [];
        self.globalSetting = rootEntity.returnRootEntity().settings;

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, //self.globalSetting.searchAmount, //5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, 100, 200]
            /*limitOptions: [5, 10, 20, // limit options
                {
                    /!*label: self.globalSetting.searchAmountLimit.toString(),
                    value: function () {
                        return self.globalSetting.searchAmountLimit
                    }*!/
                    label: langService.get('all'),
                    value: function () {
                        return (userSentItemService.totalCount + 21);
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
         * @description Reload the grid of user sent item
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadUserSentItems = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return userSentItemService
                .loadUserSentItems(self.grid.page, self.grid.limit)
                .then(function (result) {
                    self.userSentItems = result;
                    self.selectedUserSentItems = [];
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
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
            userSentItemService.recallSentItem(userSentItem, $event)
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
                .favoriteDocumentAdd(userSentItem.documentVSID, $event)
                .then(function (result) {
                    if (result.status) {
                        self.reloadUserSentItems(self.grid.page)
                            .then(function () {
                                toast.success(langService.get("add_to_favorite_specific_success").change({
                                    name: userSentItem.getTranslatedName()
                                }));
                            });
                    }
                    else {
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
                    userSentItem.comments = documentComments;
                })
                .catch(function (documentComments) {
                    userSentItem.comments = documentComments;
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
         * @description Send Link To Document By Email
         * @param userSentItem
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (userSentItem, $event) {
            downloadService.getMainDocumentEmailContent(userSentItem.documentVSID).then(function (result) {
                dialog.successMessage(langService.get('right_click_and_save_link_as') + langService.get('download_message_file').change({
                    result: result,
                    filename: 'Tawasol.msg'
                }));
                return true;
            });
        };

        /**
         * @description Send Composite Document As Attachment By Email
         * @param userSentItem
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (userSentItem, $event) {
            downloadService.getCompositeDocumentEmailContent(userSentItem.documentVSID).then(function (result) {
                dialog.successMessage(langService.get('right_click_and_save_link_as') + langService.get('download_message_file').change({
                    result: result,
                    filename: 'Tawasol.msg'
                }));
                return true;
            });
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
            console.log('sendMainDocumentFax : ', userSentItem);
        };


        /**
         * @description Get Link
         * @param userSentItem
         * @param $event
         */
        self.getLink = function (userSentItem, $event) {
            viewDocumentService.loadDocumentViewUrlWithOutEdit(userSentItem.documentVSID).then(function (result) {
                //var docLink = "<a target='_blank' href='" + result + "'>" + result + "</a>";
                dialog.successMessage(langService.get('link_message').change({result: result}));
                return true;
            });
        };


        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            /*var info = model.getInfo();
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
            return hasPermission;*/
            return true;
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
            correspondenceService.viewCorrespondence({
                vsId: info.vsId,
                docClassName: info.documentClass
            }, self.gridActions, checkIfEditPropertiesAllowed(userSentItem, true), true)
                .then(function () {
                    self.reloadUserSentItems(self.grid.page);
                })
                .catch(function () {
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
            userSentItem.viewUserSentItem(self.gridActions, 'sentItem', $event)
                .then(function () {
                    return self.reloadUserSentItems(self.grid.page);
                })
                .catch(function () {
                    return self.reloadUserSentItems(self.grid.page);
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
                }
                else if (angular.isArray(action.permissionKey) && action.permissionKey.length) {
                    if (action.hasOwnProperty('checkAnyPermission')) {
                        hasPermission = employeeService.getEmployee().hasAnyPermissions(action.permissionKey);
                    }
                    else {
                        hasPermission = employeeService.getEmployee().hasThesePermissions(action.permissionKey);
                    }
                }
            }
            return (!action.hide) && hasPermission;
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
                        gridName: 'user-sent-items'
                    }
                ],
                class: "action-green",
                checkShow: self.checkToShowAction
            },
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
                    //If no content or no view document permission, hide the button
                    return self.checkToShowAction(action, model);// && model.hasContent();
                }
            },
            // Separator
            {
                type: 'separator',
                checkShow: self.checkToShowAction,
                showInView: false
            },
            // Recall
            {
                type: 'action',
                icon: 'tag',
                text: 'grid_action_recall',
                shortcut: true,
                showInView: false,
                callback: self.recallSingle,
                class: "action-green",
                hide: false, /*In Phase 2*/
                checkShow: function (action, model) {
                    /*workflowActionId == 9(terminated) or (actionType == 3 == broadcast) can't Recall terminated Document and broadcasted*/
                    return self.checkToShowAction(action, model) && (model.workflowActionId !== 9 && model.actionType !== 3);
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
            // View Tracking Sheet (Quick Action Only)
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view_tracking_sheet',
                shortcut: true,
                onlyShortcut: true,
                showInView: false,
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: self.checkToShowAction,
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
                checkShow: self.checkToShowAction,
                permissionKey: [
                    "MANAGE_DOCUMENT’S_TAGS",
                    "MANAGE_DOCUMENT’S_COMMENTS",
                    "MANAGE_ATTACHMENTS",
                    "", // Linked Entities permission not available in database
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
                    // Linked Entities
                    {
                        type: 'action',
                        icon: 'pencil-box-outline',
                        text: 'grid_action_linked_entities',
                        shortcut: false,
                        callback: self.manageLinkedEntities,
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
                        //hide: true,
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
                    "" //Composite Documents permission not available in database
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
                        checkShow: self.checkToShowAction
                    },
                    // Composite Document
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_composite_document',
                        shortcut: false,
                        callback: self.downloadSentItemCompositeDocument,
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
            // Open
            {
                type: 'action',
                icon: 'book-open-variant',
                text: 'grid_action_open',
                shortcut: true,
                showInView: false,
                callback: self.viewDocument,
                class: "action-green",
                permissionKey: 'VIEW_DOCUMENT',
                checkShow: function (action, model) {
                    //If no content or no view document permission, hide the button
                    return self.checkToShowAction(action, model);// && model.hasContent();
                }
            }
        ];

    });
};