module.exports = function (app) {
    app.controller('folderCtrl', function (langService,
                                           folders,
                                           $q,
                                           mailNotificationService,
                                           counterService,
                                           userFolderService,
                                           employeeService,
                                           UserFolder,
                                           ResolveDefer,
                                           viewTrackingSheetService,
                                           correspondenceService) {
        'ngInject';
        var self = this;
        self.controllerName = 'folderCtrl';
        self.workItems = [];
        self.selectedWorkItems = [];
        self.folders = folders;
        self.progress = null;
        self.sidebarStatus = false;
        // to display the user Inbox folder
        self.inboxFolders = [new UserFolder({
            arName: langService.getKey('menu_item_user_inbox', 'ar'),
            enName: langService.getKey('menu_item_user_inbox', 'en'),
            id: 0
        }).setChildren(self.folders)];


        self.grid = {
            limit: 5, //self.globalSetting.searchAmount, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.workItems.length + 21);
                    }
                }
            ]
        };

        /**
         * @description toggle sidebar folders.
         */
        self.toggleSidebarFolder = function () {
            self.sidebarStatus = !self.sidebarStatus;
        };
        /**
         * @description get clicked folder content.
         * @param folder
         * @param $event
         * @returns {*}
         */
        self.getFolderContent = function (folder, $event) {
            if (folder.id === 0)
                return;
            self.selectedFolder = folder;
            return self.reloadFolders(self.grid.page);
        };
        /**
         * @description reload current folder
         * @param pageNumber
         */
        self.reloadFolders = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return correspondenceService
                .loadUserInboxByFolder(self.selectedFolder)
                .then(function (workItems) {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(5);
                    self.workItems = workItems;
                    self.selectedWorkItems = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return self.workItems;
                });
        };

        self.moveToFolder = function (workItem, $event, defer) {
            workItem
                .addToFolder(self.folders, $event, true)
                .then(function () {
                    self.reloadFolders(self.grid.page);
                });
        };
        /**
         * @description move bulk to folder
         * @param $event
         */
        self.moveToFolderUserInboxBulk = function ($event) {
            return correspondenceService
                .showAddBulkWorkItemsToFolder(self.selectedWorkItems, self.folders, $event, true)
                .then(function () {
                    self.reloadFolders(self.grid.page);
                });
        };


        /**
         * @description Terminate User inboxes Bulk
         * @param $event
         */
        self.terminateUserInboxBulk = function ($event) {
            correspondenceService
                .terminateBulkWorkItem(self.selectedWorkItems, $event)
                .then(function () {
                    self.reloadFolders(self.grid.page);
                });
        };


        /**
         * @description Launch distribution workflow for selected review outgoing mails
         * @param $event
         */
        self.forwardBulk = function ($event) {
            var itemsAlreadyBroadCasted = [];
            _.filter(self.selectedWorkItems, function (workItem) {
                if (workItem.isBroadcasted())
                    itemsAlreadyBroadCasted.push(workItem.generalStepElm.vsId);
            });
            var selectedItems = angular.copy(self.selectedWorkItems);
            if (itemsAlreadyBroadCasted && itemsAlreadyBroadCasted.length) {
                dialog.confirmMessage(langService.get('some_items_are_broadcasted_skip_and_forward'), null, null, $event).then(function () {
                    self.selectedWorkItems = selectedItems = _.filter(self.selectedWorkItems, function (workItem) {
                        return itemsAlreadyBroadCasted.indexOf(workItem.generalStepElm.vsId) === -1;
                    });
                    if (self.selectedWorkItems.length)
                        forwardBulk(selectedItems, $event);
                })
            }
            else {
                forwardBulk(selectedItems, $event);
            }
        };

        function forwardBulk(selectedItems, $event) {
            return correspondenceService
                .launchCorrespondenceWorkflow(selectedItems, $event, 'forward', 'favorites')
                .then(function () {
                    self.reloadFolders(self.grid.page);
                });
        }


        /**
         * @description Add To Folder User inboxes Bulk
         * @param $event
         */
        self.addToFolderUserInboxBulk = function ($event) {
            return correspondenceService
                .showAddBulkWorkItemsToFolder(self.selectedWorkItems, self.userFolders, $event, false)
                .then(function () {
                    self.reloadFolders(self.grid.page);
                });
        };

        /**
         * @description Change the starred for user inbox
         * @param userInbox
         * @param $event
         */
        self.changeUserInboxStar = function (userInbox, $event) {
            userInbox.toggleStar().then(function () {
                self.reloadFolders(self.grid.page);
            });
        };

        /**
         * @description Change the starred for user inboxes Bulk
         * @param starUnStar
         * @param $event
         */
        self.changeUserInboxStarBulk = function (starUnStar, $event) {
            self.starServices[starUnStar](self.selectedWorkItems)
                .then(function () {
                    self.reloadFolders(self.grid.page);
                });
        };

        /**
         * @description Terminate User Inbox Item
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.terminate = function (userInbox, $event, defer) {
            userInbox
                .terminate($event)
                .then(function () {
                    new ResolveDefer(defer);
                    self.reloadFolders(self.grid.page);
                });
        };

        /**
         * @description add an item to the favorite documents
         * @param userInbox
         * @param $event
         */
        self.addToFavorite = function (userInbox, $event) {
            userInbox.addToFavorite().then(function () {
                self.reloadFolders(self.grid.page)
            });
        };

        /**
         * @description Create Reply
         * @param userInbox
         * @param $event
         */
        self.createReplyIncoming = function (userInbox, $event) {
            //console.log("createReplyIncoming" , userInbox);
            var info = userInbox.getInfo();
            dialog.hide();
            $state.go('app.outgoing.add', {workItem: info.wobNumber, action: 'reply'});
        };

        /**
         * @description Forward
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.forward = function (userInbox, $event, defer) {
            userInbox.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadFolders(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Reply user inbox
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.reply = function (userInbox, $event, defer) {
            userInbox.launchWorkFlow($event, 'reply')
                .then(function () {
                    self.reloadFolders(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Get the link of user inbox
         * @param userInbox
         * @param $event
         */
        self.getLink = function (userInbox, $event) {
            console.log('getUserInboxLink', userInbox);
        };

        /**
         * @description Subscribe
         * @param userInbox
         * @param $event
         */
        self.subscribe = function (userInbox, $event) {
            console.log('subscribeUserInbox', userInbox);
        };

        /**
         * @description Export user inbox (export to ready to export)
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.sendWorkItemToReadyToExport = function (userInbox, $event, defer) {
            userInbox.sendToReadyToExport().then(function () {
                self.reloadFolders(self.grid.page)
                    .then(function () {
                        toast.success(langService.get('export_success'));
                        new ResolveDefer(defer);
                    });
            })
        };

        /**
         * @description View Tracking Sheet
         * @param userInbox
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (userInbox, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(userInbox, params, $event).then(function (result) {

            });
        };

        /**
         * @description Manage Tags
         * @param userInbox
         * @param $event
         */
        self.manageTags = function (userInbox, $event) {
            var info = userInbox.getInfo();
            managerService.manageDocumentTags(info.vsId, info.documentClass, userInbox.getTranslatedName(), $event)
                .then(function () {
                    self.reloadFolders(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadFolders(self.grid.page);
                });
        };

        /**
         * @description Manage Comments
         * @param userInbox
         * @param $event
         */
        self.manageComments = function (userInbox, $event) {
            var info = userInbox.getInfo();
            userInbox.manageDocumentComments($event)
                .then(function () {
                    self.reloadFolders(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadFolders(self.grid.page);
                });
        };

        /**
         * @description Manage Tasks
         * @param userInbox
         * @param $event
         */
        self.manageTasks = function (userInbox, $event) {
            console.log('manageUserInboxTasks : ', userInbox);
        };

        /**
         * @description Manage Attachments
         * @param userInbox
         * @param $event
         */
        self.manageAttachments = function (userInbox, $event) {
            userInbox.manageDocumentAttachments($event);
        };


        /**
         * @description Manage Linked Documents
         * @param userInbox
         * @param $event
         */
        self.manageLinkedDocuments = function (userInbox, $event) {
            userInbox.manageDocumentLinkedDocuments($event)
                .then(function () {
                    self.reloadFolders(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadFolders(self.grid.page);
                });
        };

        /**
         * @description Manage Linked Entities
         * @param userInbox
         * @param $event
         */
        self.manageLinkedEntities = function (userInbox, $event) {
            userInbox
                .manageDocumentEntities($event);
        };

        /**
         * @description Destinations
         * @param userInbox
         * @param $event
         */
        self.manageDestinations = function (userInbox, $event) {
            userInbox.manageDocumentCorrespondence($event)
        };

        /**
         * @description View Direct Linked Documents
         * @param userInbox
         * @param $event
         */
        self.viewDirectLinkedDocuments = function (userInbox, $event) {
            console.log('viewUserInboxDirectLinkedDocuments : ', userInbox);
        };

        /**
         * @description View Complete Linked Documents
         * @param userInbox
         * @param $event
         */
        self.viewCompleteLinkedDocuments = function (userInbox, $event) {
            console.log('viewUserInboxCompleteLinkedDocuments : ', userInbox);
        };

        /**
         * @description Download Main Document
         * @param userInbox
         * @param $event
         */
        self.downloadMainDocument = function (userInbox, $event) {
            userInbox
                .mainDocumentDownload($event);
        };

        /**
         * @description Download Composite Document
         * @param userInbox
         * @param $event
         */
        self.downloadCompositeDocument = function (userInbox, $event) {
            userInbox
                .compositeDocumentDownload($event);
        };

        /**
         * @description Send Link To Document By Email
         * @param userInbox
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (userInbox, $event) {
            console.log('sendUserInboxLinkToDocumentByEmail : ', userInbox);
        };

        /**
         * @description Send Composite Document As Attachment
         * @param userInbox
         * @param $event
         */
        self.sendCompositeDocumentAsAttachment = function (userInbox, $event) {
            console.log('sendUserInboxCompositeDocumentAsAttachment : ', userInbox);
        };

        /**
         * @description Send Composite Document As Attachment By Email
         * @param userInbox
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (userInbox, $event) {
            console.log('sendUserInboxCompositeDocumentAsAttachmentByEmail : ', userInbox);
        };

        /**
         * @description Send Main Document Fax
         * @param userInbox
         * @param $event
         */
        self.sendMainDocumentFax = function (userInbox, $event) {
            console.log('sendUserInboxMainDocumentFax : ', userInbox);
        };

        /**
         * @description Send SMS
         * @param userInbox
         * @param $event
         */
        self.sendSMS = function (userInbox, $event) {
            console.log('sendUserInboxSMS : ', userInbox);
        };

        /**
         * @description Send Main Document As Attachment
         * @param userInbox
         * @param $event
         */
        self.sendMainDocumentAsAttachment = function (userInbox, $event) {
            console.log('sendUserInboxMainDocumentAsAttachment : ', userInbox);
        };

        /**
         * @description Send Link
         * @param userInbox
         * @param $event
         */
        self.sendLink = function (userInbox, $event) {
            console.log('sendUserInboxLink : ', userInbox);
        };

        /**
         * @description Sign e-Signature
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.signESignature = function (userInbox, $event, defer) {
            userInboxService
                .controllerMethod
                .userInboxSignaturePopup(userInbox, false, $event)
                .then(function (result) {
                    if (result)
                        self.reloadFolders(self.grid.page)
                            .then(function () {
                                toast.success(langService.get('sign_specific_success').change({name: userInbox.getTranslatedName()}));
                                new ResolveDefer(defer);
                            });
                })
                .catch(function (error) {
                    errorCode.checkIf(error, 'AUTHORIZE_FAILED', function () {
                        dialog.errorMessage(langService.get('authorize_failed'))
                    })
                });
        };

        /**
         * @description Sign Digital Signature
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.signDigitalSignature = function (userInbox, $event, defer) {
            console.log('signUserInboxDigitalSignature : ', userInbox);
        };

        /**
         * @description Edit Content
         * @param userInbox
         * @param $event
         */
        self.editContent = function (userInbox, $event) {
            userInbox.manageDocumentContent($event);
        };

        /**
         * @description Edit Properties
         * @param userInbox
         * @param $event
         */
        self.editProperties = function (userInbox, $event) {
            var info = userInbox.getInfo();
            managerService
                .manageDocumentProperties(info.vsId, info.documentClass, info.title, $event)
                .finally(function () {
                    self.reloadFolders(self.grid.page)
                });
        };


        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var info = model.getInfo();
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
            return hasPermission && !model.isBroadcasted();
        };


        var checkIfEditCorrespondenceSiteAllowed = function (model, checkForViewPopup) {
            var info = model.getInfo();
            var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
            var allowed = (hasPermission && info.documentClass !== "internal");
            if (checkForViewPopup)
                return !(allowed);
            return allowed;
        };

        /**
         * @description View document
         * @param userInbox
         * @param $event
         */
        self.viewDocument = function (userInbox, $event) {
            //console.log('userInbox', userInbox);

            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            userInbox.view(userInbox, self.gridActions, checkIfEditPropertiesAllowed(userInbox, true), checkIfEditCorrespondenceSiteAllowed(userInbox, true))
                .then(function () {
                    return self.reloadFolders(self.grid.page);
                })
                .catch(function () {
                    return self.reloadFolders(self.grid.page);
                });
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
         * @description do broadcast for workItem.
         */
        self.doBroadcast = function (userInbox, $event, defer) {
            userInbox
                .correspondenceBroadcast()
                .then(function () {
                    self.reloadFolders(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        })
                })
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
            // Terminate
            {
                type: 'action',
                icon: 'stop',
                text: 'grid_action_terminate',
                shortcut: true,
                callback: self.terminate,
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            // Add To Folder
            {
                type: 'action',
                icon: 'folder-move',
                text: 'grid_action_move_to_folder',
                shortcut: false,
                callback: self.moveToFolder,
                class: "action-green",
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && !model.isBroadcasted();
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
                    return self.checkToShowAction(action, model) && !model.isBroadcasted();
                }
            },
            // Create Reply
            {
                type: 'action',
                icon: 'pen',
                text: 'grid_action_create_reply',
                shortcut: false,
                callback: self.createReplyIncoming,
                class: "action-green",
                //hide: true,
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && info.documentClass === "incoming" && !model.isBroadcasted();
                }
            },
            // Forward
            {
                type: 'action',
                icon: 'share',
                text: 'grid_action_forward',
                shortcut: true,
                callback: self.forward,
                class: "action-green",
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && !model.isBroadcasted();
                }
            },
            // Broadcast
            {
                type: 'action',
                icon: 'bullhorn',
                text: 'grid_action_broadcast',
                shortcut: false,
                hide: false,
                callback: self.doBroadcast,
                checkShow: function (action, model) {
                    return self.checkToShowAction && (!model.needApprove() || model.hasDocumentClass('incoming')) && !model.isBroadcasted();
                }
            },
            // Reply
            {
                type: 'action',
                icon: 'reply',
                text: 'grid_action_reply',
                shortcut: false,
                callback: self.reply,
                class: "action-green",
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && !model.isBroadcasted();
                }
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
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && !model.isBroadcasted();
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
                    return self.checkToShowAction(action, model) && !model.isBroadcasted();
                }
            },
            // Export (Send to ready to export)
            {
                type: 'action',
                icon: 'export',
                text: 'grid_action_send_to_ready_to_export',
                shortcut: true,
                callback: self.sendWorkItemToReadyToExport,
                class: "action-green",
                checkShow: function (action, model) {
                    //addMethod = 0 (Electronic/Digital) - hide the export button
                    //addMethod = 1 (Paper) - show the export button
                    var info = model.getInfo();
                    // If internal book, no export is allowed
                    // If incoming book, no addMethod will be available. So check workFlowName(if incoming) and show export button
                    return self.checkToShowAction(action, model) && info.isPaper && info.documentClass === 'outgoing' && !model.isBroadcasted();
                    // (model.generalStepElm.addMethod && model.generalStepElm.workFlowName.toLowerCase() !== 'internal')
                    // || model.generalStepElm.workFlowName.toLowerCase() === 'incoming';

                }
            },
            // Open
            {
                type: 'action',
                icon: 'book-open-variant',
                text: 'grid_action_open',
                shortcut: true,
                callback: self.viewDocument,
                class: "action-green",
                permissionKey: 'VIEW_DOCUMENT',
                showInView: false,
                checkShow: function (action, model) {
                    //If no content or no view document permission, hide the button
                    return self.checkToShowAction(action, model) && model.hasContent();
                }
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
                checkShow: self.checkToShowAction,
                showInView: false,
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
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    },
                    // Destinations
                    {
                        type: 'action',
                        icon: 'stop',
                        text: 'grid_action_destinations',
                        shortcut: false,
                        callback: self.manageDestinations,
                        permissionKey: "MANAGE_DESTINATIONS",
                        hide: false,
                        class: "action-yellow",
                        checkShow: function (action, model) {
                            return self.checkToShowAction(action, model) && checkIfEditCorrespondenceSiteAllowed(model, false);
                        }
                    }
                ]
            },
            // View
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view',
                shortcut: false,
                hide: true,
                checkShow: self.checkToShowAction,
                submenu: [
                    // Direct Linked Documents
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_direct_linked_documents',
                        shortcut: false,
                        callback: self.viewDirectLinkedDocuments,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // Complete Linked Documents
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_complete_linked_documents',
                        shortcut: false,
                        callback: self.viewCompleteLinkedDocuments,
                        class: "action-red",
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
                        callback: self.downloadMainDocument,
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    },
                    // Composite Document
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_composite_document',
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
                hide: true,
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && !model.isBroadcasted();
                },
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
                    // Composite Document
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_composite_document_as_attachment',
                        shortcut: false,
                        callback: self.sendCompositeDocumentAsAttachment,
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
                    // Main Document As Attachment
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_main_document_as_attachment',
                        shortcut: false,
                        callback: self.sendMainDocumentAsAttachment,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // Link
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_send_link',
                        shortcut: false,
                        callback: self.sendLink,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    }
                ]
            },
            // Sign(Approve)
            {
                type: 'action',
                icon: 'approval',
                text: 'grid_action_approve',//signature
                shortcut: false,
                checkShow: function (action, model) {
                    //addMethod = 0 (Electronic/Digital) - show the button
                    //addMethod = 1 (Paper) - hide the button

                    // If outgoing or internal, show the button

                    /*If document is unapproved or partially approved, show the button. If fully approved, hide the button.
                     docStatus = 24 is approved
                     */
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && !model.isBroadcasted()
                        && !info.isPaper
                        && (info.documentClass !== 'incoming')
                        && model.needApprove()
                        && (employeeService.hasPermissionTo("ELECTRONIC_SIGNATURE") || employeeService.hasPermissionTo("DIGITAL_SIGNATURE"));
                },
                submenu: [
                    // e-Signature
                    {
                        type: 'action',
                        //icon: 'link-variant',
                        text: 'grid_action_electronic',//e_signature
                        shortcut: false,
                        callback: self.signESignature,
                        class: "action-green",
                        permissionKey: "ELECTRONIC_SIGNATURE",
                        checkShow: self.checkToShowAction
                    },
                    // Digital Signature
                    {
                        type: 'action',
                        //icon: 'attachment',
                        text: 'grid_action_digital',//digital_signature
                        shortcut: false,
                        callback: self.signDigitalSignature,
                        class: "action-red",
                        permissionKey: "DIGITAL_SIGNATURE",
                        hide: true,
                        checkShow: self.checkToShowAction
                    }
                ]
            },
            // Edit
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit',
                shortcut: false,
                showInView: false,
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    var hasPermission = false;
                    if (info.documentClass === "internal")
                        hasPermission = (employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES") || employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT"));
                    else if (info.documentClass === "incoming")
                        hasPermission = (employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES") || employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT"));
                    else if (info.documentClass === "outgoing")
                        hasPermission = (employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES") || employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
                    return self.checkToShowAction(action, model) && hasPermission && !model.isBroadcasted();
                },
                submenu: [
                    // Content
                    {
                        type: 'action',
                        icon: 'pencil-box',
                        //text: 'grid_action_content',
                        text: function () {
                            return {
                                contextText: 'grid_action_content',
                                shortcutText: 'grid_action_edit_content'
                            };
                        },
                        shortcut: false,
                        callback: self.editContent,
                        class: "action-green",
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            var hasPermission = false;
                            if (info.documentClass === "internal")
                                hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT");
                            else if (info.documentClass === "incoming")
                                hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT");
                            else if (info.documentClass === "outgoing")
                                hasPermission = employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT");
                            return self.checkToShowAction(action, model) && hasPermission && info.docStatus < 24;
                        }
                    },
                    // Properties
                    {
                        type: 'action',
                        icon: 'pencil',
                        //text: 'grid_action_properties',
                        text: function () {
                            return {
                                contextText: 'grid_action_properties',
                                shortcutText: 'grid_action_edit_properties'
                            };
                        },
                        shortcut: false,
                        callback: self.editProperties,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return self.checkToShowAction(action, model) && checkIfEditPropertiesAllowed(model);
                        }
                    }
                ]
            }
        ];

        /**
         * @description Mark item as read/unread
         * @param userInbox
         * @param $event
         */
        self.markAsReadUnread = function (userInbox, $event) {
            return userInboxService.controllerMethod
                .userInboxMarkAsReadUnread(userInbox, $event)
                .then(function (result) {
                    if (!result.generalStepElm.isOpen)
                        toast.success(langService.get('mark_as_unread_success').change({name: userInbox.getTranslatedName()}));
                    else
                        toast.success(langService.get('mark_as_read_success').change({name: userInbox.getTranslatedName()}));
                    self.replaceRecord(result);
                })
        };

        /**
         * @description Replaces the record in grid after update
         * @param record
         */
        self.replaceRecord = function (record) {
            var index = _.findIndex(self.workItems, function (userInbox) {
                return userInbox.generalStepElm.vsId === record.generalStepElm.vsId;
            });
            if (index > -1)
                self.workItems.splice(index, 1, record);
            mailNotificationService.loadMailNotifications(5);
        };

        // self.refreshInbox = function (time) {
        //     $timeout(function () {
        //         $state.is('app.inbox.user-inbox') && self.reloadFolders(self.grid.page);
        //     }, time)
        //         .then(function () {
        //             $state.is('app.inbox.user-inbox') && self.refreshInbox(time);
        //         });
        // };
        //
        // if (self.globalSetting.inboxRefreshInterval) {
        //     var timer = (self.globalSetting.inboxRefreshInterval * 60 * 100 * 10);
        //     self.refreshInbox(timer);
        // }


    });
};