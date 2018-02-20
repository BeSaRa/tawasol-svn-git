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
                                                 correspondenceSiteService,
                                                 WorkItem,
                                                 ResolveDefer,
                                                 generator) {
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
            limitOptions: [5, 10, 20, // limit options
                {
                    /*label: self.globalSetting.searchAmountLimit.toString(),
                    value: function () {
                        return self.globalSetting.searchAmountLimit
                    }*/
                    label: langService.get('all'),
                    value: function () {
                        return (self.userSentItems.length + 21);
                    }
                }
            ]
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
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };


        /**
         * @description this method to display the main correspondenceSites for given record
         * @param correspondenceSites
         * @param $event
         */
        self.openMainSiteDialog = function (correspondenceSites, $event) {

        };

        /**
         * @description this method to display the sub correspondenceSites for given correspondenceSite
         * @param subCorrespondenceSites
         * @param $event
         */
        self.openSubSiteDialog = function (subCorrespondenceSites, $event) {

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
            console.log('recall single : ', userSentItem);
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
            var info = userSentItem.getInfo();
            managerService.manageDocumentAttachments(info.vsId, info.documentClass, info.title, $event)
                .then(function (attachments) {
                    userSentItem = attachments;
                })
                .catch(function (attachments) {
                    userSentItem = attachments;
                });
        };

        /**
         * @description Manage entities for sent item
         * @param userSentItem
         * @param $event
         */
        self.manageEntities = function (userSentItem, $event) {
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
            console.log('sendLinkToDocumentByEmail : ', userSentItem);
        };

        /**
         * @description Send Composite Document As Attachment By Email
         * @param userSentItem
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (userSentItem, $event) {
            console.log('sendCompositeDocumentAsAttachmentByEmail : ', userSentItem);
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
         * @description Send Composite Document by Fax
         * @param userSentItem
         * @param $event
         */
        self.sendCompositeDocumentByFax = function (userSentItem, $event) {
            console.log('sendCompositeDocumentByFax : ', userSentItem);
        };

        /**
         * @description Get Link
         * @param userSentItem
         * @param $event
         */
        self.getLink = function (userSentItem, $event) {
            console.log('get link : ', userSentItem);
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


        self.viewDocument = function (userSentItem, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            // viewDocumentService.openDocumentPopup(userSentItem, false, [], $event, true);

            var info = userSentItem.getInfo();
            info.wobNumber = null;
            correspondenceService.viewCorrespondence({
                vsId: info.vsId,
                docClassName: info.documentClass
            }, self.gridActions, checkIfEditPropertiesAllowed(userSentItem, true), true);
        };

        /**
         * @description Check if action will be shown on grid or not
         * @param action
         * @param model
         * @returns {boolean}
         */
        self.checkToShowAction = function (action, model) {
            /*if (action.hasOwnProperty('permissionKey'))
                return !action.hide && employeeService.hasPermissionTo(action.permissionKey);
            return (!action.hide);*/

            if (action.hasOwnProperty('permissionKey')) {
                if (typeof action.permissionKey === 'string') {
                    return (!action.hide) && employeeService.hasPermissionTo(action.permissionKey);
                }
                else if (angular.isArray(action.permissionKey)) {
                    if (!action.permissionKey.length) {
                        return (!action.hide);
                    }
                    else {
                        var hasPermissions = _.map(action.permissionKey, function (key) {
                            return employeeService.hasPermissionTo(key);
                        });
                        return (!action.hide) && !(_.some(hasPermissions, function (isPermission) {
                            return isPermission !== true;
                        }));
                    }
                }
            }
            return (!action.hide);
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
                submenu: [
                    {
                        type: 'info',
                        checkShow: self.checkToShowAction
                    }
                ],
                class: "action-green",
                checkShow: self.checkToShowAction
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
                callback: self.recallSingle,
                class: "action-red",
                hide: true, /*In Phase 2*/
                checkShow: self.checkToShowAction
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
                text: 'view_tracking_sheet',
                shortcut: false,
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: self.checkToShowAction,
                submenu: viewTrackingSheetService.getViewTrackingSheetOptions(self.checkToShowAction, self.viewTrackingSheet, 'grid')
            },
            // View Tracking Sheet (Quick Action Only)
            {
                type: 'action',
                icon: 'eye',
                text: 'view_tracking_sheet',
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
                submenu: [
                    // Tags
                    {
                        type: 'action',
                        icon: 'tag',
                        text: 'grid_action_tags',
                        shortcut: false,
                        callback: self.manageTags,
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    },
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
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_attachments',
                        shortcut: false,
                        callback: self.manageAttachments,
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    },
                    {
                        type: 'action',
                        icon: 'pencil-box-outline',
                        text: 'grid_action_entities',
                        shortcut: false,
                        callback: self.manageEntities,
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    },
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_linked_documents',
                        shortcut: false,
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
                submenu: [
                    // Main Document
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_main_document',
                        shortcut: false,
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
                hide: true,
                checkShow: self.checkToShowAction,
                submenu: [
                    // Link To Document By Email
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_link_to_document_by_email',
                        shortcut: false,
                        callback: self.sendLinkToDocumentByEmail,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // Composite Document As Attachment By Email
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_composite_document_as_attachment_by_email',
                        shortcut: false,
                        callback: self.sendCompositeDocumentAsAttachmentByEmail,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // SMS
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'grid_action_send_sms',
                        shortcut: false,
                        permissionKey: "SEND_SMS",
                        callback: self.sendSMS,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // Main Document Fax
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_main_document_fax',
                        shortcut: false,
                        callback: self.sendMainDocumentFax,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // Composite Document Fax
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_send_composite_doc_by_fax',
                        shortcut: false,
                        callback: self.sendCompositeDocumentByFax,
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
                callback: self.getLink,
                class: "action-red",
                hide: true,
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