module.exports = function (app) {
    app.controller('groupInboxCtrl', function (langService,
                                               $q,
                                               $filter,
                                               $timeout,
                                               userInboxService,
                                               ResolveDefer,
                                               generator,
                                               correspondenceService,
                                               $state,
                                               toast,
                                               errorCode,
                                               dialog,
                                               rootEntity,
                                               counterService,
                                               viewDocumentService,
                                               managerService,
                                               distributionWorkflowService,
                                               $window,
                                               tokenService,
                                               contextHelpService,
                                               userFolderService,
                                               readyToExportService,
                                               viewTrackingSheetService,
                                               downloadService,
                                               employeeService,
                                               favoriteDocumentsService,
                                               Information,
                                               mailNotificationService,
                                               workItems) {
            'ngInject';
            var self = this;
            self.controllerName = 'groupInboxCtrl';
            // selected workItems
            self.selectedWorkItems = [];
            // langService
            self.langService = langService;

            self.workItems = workItems;

            self.progress = null;
            contextHelpService.setHelpTo('group-inbox');
            /**
             * @description Contains options for grid configuration
             * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
             */
            self.grid = {
                limit: 5,
                page: 1,
                order: '',
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
             * @description Contains methods for Star operations for user inbox items
             */
            self.starServices = {
                'false': userInboxService.controllerMethod.userInboxStar,
                'true': userInboxService.controllerMethod.userInboxUnStar,
                'starBulk': userInboxService.controllerMethod.userInboxStarBulk,
                'unStarBulk': userInboxService.controllerMethod.userInboxUnStarBulk
            };

            /**
             * @description Terminate User Inbox Item
             * @param userInbox
             * @param $event
             * @param defer
             */
            self.terminate = function (userInbox, $event, defer) {
                // BeSara:  i used the same service for inbox to terminate till check with Issawi.
                userInboxService
                    .controllerMethod
                    .userInboxTerminate(userInbox, $event)
                    .then(function () {
                        self.reloadGroupInbox(self.grid.page)
                            .then(function () {
                                toast.success(langService.get("terminate_specific_success").change({name: userInbox.getTranslatedName()}));
                                // to resolve the defer com from correspondence view.
                                new ResolveDefer(defer);
                            });
                    });
            };

            /**
             * @description Gets the grid records by sorting
             */
            self.getSortedData = function () {
                self.workItems = $filter('orderBy')(self.workItems, self.grid.order);
            };

            /**
             * @description reload group Inbox grid
             */
            self.reloadGroupInbox = function (pageNumber) {
                var defer = $q.defer();
                self.progress = defer.promise;
                return correspondenceService
                    .loadGroupInbox()
                    .then(function (workItems) {
                        counterService.loadCounters();
                        mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        self.workItems = workItems;
                        self.selectedWorkItems = [];
                        defer.resolve(true);
                        if (pageNumber)
                            self.grid.page = pageNumber;
                        self.getSortedData();
                        return self.workItems;
                    });
            };
            /**
             * @description terminate bulk group inbox
             */
            self.terminateBulk = function ($event) {
                correspondenceService
                    .terminateBulkWorkItem(self.selectedWorkItems, $event)
                    .then(function () {
                        self.reloadGroupInbox(self.grid.page);
                    });
            };

            /**
             * @description Create Reply
             * @param workItem
             * @param $event
             */
            self.createReplyIncoming = function (workItem, $event) {
                //console.log("createReplyIncoming" , userInbox);
                var info = workItem.getInfo();
                dialog.hide();
                $state.go('app.outgoing.add', {workItem: info.wobNumber, action: 'reply'});
            };

            /**
             * @description Forward
             * @param workItem
             * @param $event
             * @param defer
             */
            self.forward = function (workItem, $event, defer) {
                workItem.launchWorkFlow($event, 'forward', 'favorites')
                    .then(function () {
                        self.reloadGroupInbox(self.grid.page)
                            .then(function () {
                                mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                                new ResolveDefer(defer);
                            });
                    });
            };

            /**
             * @description Forward
             * @param workItem
             * @param $event
             * @param defer
             */
            self.reply = function (workItem, $event, defer) {
                workItem.launchWorkFlow($event, 'reply', 'favorites')
                    .then(function () {
                        self.reloadGroupInbox(self.grid.page)
                            .then(function () {
                                mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                                new ResolveDefer(defer);
                            });
                    });
            };

            /**
             * @description do broadcast for workItem.
             */
            self.broadcast = function (workItem, $event, defer) {
                workItem
                    .correspondenceBroadcast()
                    .then(function () {
                        self.reloadGroupInbox(self.grid.page)
                            .then(function () {
                                new ResolveDefer(defer);
                            })
                    })
            };

            /**
             * @description Change the starred for user inbox
             * @param workItem
             * @param $event
             */
            self.changeStar = function (workItem, $event) {
                /*workItem.toggleStar().then(function () {
                    self.reloadGroupInbox(self.grid.page);
                });*/
                self.starServices[workItem.generalStepElm.starred](workItem)
                    .then(function (result) {
                        if (result) {
                            self.reloadGroupInbox(self.grid.page)
                                .then(function () {
                                    if (!workItem.generalStepElm.starred)
                                        toast.success(langService.get("star_specific_success").change({name: workItem.getTranslatedName()}));
                                    else
                                        toast.success(langService.get("unstar_specific_success").change({name: workItem.getTranslatedName()}));
                                });
                        }
                        else {
                            dialog.errorMessage(langService.get('something_happened_when_update_starred'));
                        }
                    })
                    .catch(function () {
                        dialog.errorMessage(langService.get('something_happened_when_update_starred'));
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
                    return !hasPermission || model.isBroadcasted();
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
             * @description Preview document
             * @param workItem
             * @param $event
             */
            self.previewDocument = function (workItem, $event) {
                if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                    dialog.infoMessage(langService.get('no_view_permission'));
                    return;
                }

                correspondenceService.viewCorrespondenceGroupMail(workItem, self.gridActions, checkIfEditPropertiesAllowed(workItem, true), checkIfEditCorrespondenceSiteAllowed(workItem, true))
                    .then(function () {
                        return self.reloadGroupInbox(self.grid.page);
                    })
                    .catch(function () {
                        return self.reloadGroupInbox(self.grid.page);
                    });
            };

            /**
             * @description View document
             * @param workItem
             * @param $event
             */
            self.viewDocument = function (workItem, $event) {
                if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                    dialog.infoMessage(langService.get('no_view_permission'));
                    return;
                }
                workItem.viewNewGroupMailDocument(self.gridActions, 'groupMail', $event)
                    .then(function () {
                        return self.reloadGroupInbox(self.grid.page);
                    })
                    .catch(function () {
                        return self.reloadGroupInbox(self.grid.page);
                    });
            };

            /**
             * @description View Tracking Sheet
             * @param workItem
             * @param params
             * @param $event
             */
            self.viewTrackingSheet = function (workItem, params, $event) {
                viewTrackingSheetService
                    .controllerMethod
                    .viewTrackingSheetPopup(workItem, params, $event)
                    .then(function (result) {
                    });
            };

            /**
             * @description Manage Tags
             * @param workItem
             * @param $event
             */
            self.manageTags = function (workItem, $event) {
                var info = workItem.getInfo();
                managerService.manageDocumentTags(info.vsId, info.documentClass, workItem.getTranslatedName(), $event)
                    .then(function () {
                        self.reloadGroupInbox(self.grid.page);
                    })
                    .catch(function (error) {
                        self.reloadGroupInbox(self.grid.page);
                    });
            };

            /**
             * @description Manage Comments
             * @param workItem
             * @param $event
             */
            self.manageComments = function (workItem, $event) {
                var info = workItem.getInfo();
                managerService.manageDocumentComments(info.vsId, info.documentClass, $event)
                    .then(function () {
                        self.reloadGroupInbox(self.grid.page);
                    })
                    .catch(function (error) {
                        self.reloadGroupInbox(self.grid.page);
                    });
            };

            /**
             * @description Manage Tasks
             * @param workItem
             * @param $event
             */
            self.manageTasks = function (workItem, $event) {
                console.log('manageUserInboxTasks : ', workItem);
            };

            /**
             * @description Manage Attachments
             * @param workItem
             * @param $event
             */
            self.manageAttachments = function (workItem, $event) {
                workItem.manageDocumentAttachments($event);
            };


            /**
             * @description Manage Linked Documents
             * @param workItem
             * @param $event
             */
            self.manageLinkedDocuments = function (workItem, $event) {
                var info = workItem.getInfo();
                managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass, "welcome")
                    .then(function () {
                        self.reloadGroupInbox(self.grid.page);
                    })
                    .catch(function (error) {
                        self.reloadGroupInbox(self.grid.page);
                    });
            };

            /**
             * @description Manage Linked Entities
             * @param workItem
             * @param $event
             */
            self.manageLinkedEntities = function (workItem, $event) {
                var info = workItem.getInfo();
                managerService
                    .manageDocumentEntities(info.vsId, info.documentClass, info.title, $event);
            };

            /**
             * @description Destinations
             * @param workItem
             * @param $event
             */
            self.manageDestinations = function (workItem, $event) {
                var info = workItem.getInfo();
                managerService.manageDocumentCorrespondence(info.vsId, info.documentClass, info.title, $event)
            };

            /**
             * @description Export user inbox (export to ready to export)
             * @param workItem
             * @param $event
             * @param defer
             */
            self.sendWorkItemToReadyToExport = function (workItem, $event, defer) {
                workItem.sendToReadyToExport($event).then(function () {
                    self.reloadGroupInbox(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('export_success'));
                            new ResolveDefer(defer);
                        });
                })
            };

            /**
             * @description Download Main Document
             * @param workItem
             * @param $event
             */
            self.downloadMainDocument = function (workItem, $event) {
                workItem
                    .mainDocumentDownload($event);
            };

            /**
             * @description Download Composite Document
             * @param workItem
             * @param $event
             */
            self.downloadCompositeDocument = function (workItem, $event) {
                workItem
                    .compositeDocumentDownload($event);
            };


            /**
             * @description Send Link To Document By Email
             * @param userSentItem
             * @param $event
             */
            self.sendLinkToDocumentByEmail = function (workItem, $event) {
                var info = workItem.getInfo();
                downloadService.getMainDocumentEmailContent(info.vsId).then(function (result) {
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
            self.sendCompositeDocumentAsAttachmentByEmail = function (workItem, $event) {
                var info = workItem.getInfo();
                downloadService.getCompositeDocumentEmailContent(info.vsId).then(function (result) {
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
            self.sendSMS = function (workItem, $event) {
                console.log('sendSMS : ', workItem);
            };

            /**
             * @description Send Main Document Fax
             * @param userSentItem
             * @param $event
             */
            self.sendMainDocumentFax = function (workItem, $event) {
                console.log('sendMainDocumentFax : ', workItem);
            };


            /**
             * @description Get Link
             * @param userSentItem
             * @param $event
             */
            self.getLink = function (workItem, $event) {
                var info = workItem.getInfo();
                viewDocumentService.loadDocumentViewUrlWithOutEdit(info.vsId).then(function (result) {
                    //var docLink = "<a target='_blank' href='" + result + "'>" + result + "</a>";
                    dialog.successMessage(langService.get('link_message').change({result: result}));
                    return true;
                });
            };

            /**
             * @description Sign e-Signature
             * @param workItem
             * @param $event
             * @param defer
             */
            self.signESignature = function (workItem, $event, defer) {
                userInboxService
                    .controllerMethod
                    .userInboxSignaturePopup(workItem, false, $event)
                    .then(function (result) {
                        if (result)
                            self.reloadGroupInbox(self.grid.page)
                                .then(function () {
                                    toast.success(langService.get('sign_specific_success').change({name: workItem.getTranslatedName()}));
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
             * @param workItem
             * @param $event
             * @param defer
             */
            self.signDigitalSignature = function (workItem, $event, defer) {
                console.log('signDigitalSignature : ', workItem);
            };

            /**
             * @description Edit Content
             * @param workItem
             * @param $event
             */
            self.editContent = function (workItem, $event) {
                workItem.manageDocumentContent($event);
            };

            /**
             * @description Edit Properties
             * @param workItem
             * @param $event
             */
            self.editProperties = function (workItem, $event) {
                var info = workItem.getInfo();
                managerService
                    .manageDocumentProperties(info.vsId, info.documentClass, info.title, $event)
                    .finally(function () {
                        self.reloadGroupInbox(self.grid.page)
                    });
            };

            /**
             * @description Replaces the record in grid after update
             * @param record
             */
            self.replaceRecord = function (record) {
                var index = _.findIndex(self.workItems, function (workItem) {
                    return workItem.generalStepElm.vsId === record.generalStepElm.vsId;
                });
                if (index > -1)
                    self.workItems.splice(index, 1, record);
                mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
            };
            /**
             * @description Mark item as read/unread
             * @param workItem
             * @param $event
             */
            self.markAsReadUnread = function (workItem, $event) {
                return workItem.markAsReadUnread($event, true)
                    .then(function (result) {
                        self.replaceRecord(result);
                    })
            };

            /**
             * @description get document versions
             * @param workItem
             * @param $event
             * @return {*}
             */
            self.getDocumentVersions = function (workItem, $event) {
                return workItem
                    .viewSpecificVersion(self.gridActions, $event);
            };
            /**
             * @description duplicate current version
             * @param workItem
             * @param $event
             */
            self.duplicateCurrentVersion = function (workItem, $event) {
                var info = workItem.getInfo();
                return workItem
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
             * @param workItem
             * @param $event
             * @return {*}
             */
            self.duplicateVersion = function (workItem, $event) {
                var info = workItem.getInfo();
                return workItem
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
                            gridName: 'group-inbox'
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
                    callback: self.previewDocument,
                    class: "action-green",
                    permissionKey: 'VIEW_DOCUMENT',
                    showInView: false,
                    checkShow: function (action, model) {
                        //If no content or no view document permission, hide the button
                        return self.checkToShowAction(action, model) && model.hasContent();
                    }
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
                    icon: 'folder-plus',
                    text: 'grid_action_add_to_folder',
                    shortcut: false,
                    callback: self.addToFolder,
                    class: "action-green",
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
                    hide: true,
                    class: "action-green",
                    checkShow: self.checkToShowAction
                },
                // Create Reply
                {
                    type: 'action',
                    icon: 'pen',
                    text: 'grid_action_create_reply',
                    shortcut: false,
                    callback: self.createReplyIncoming,
                    class: "action-green",
                    permissionKey: 'CREATE_REPLY',
                    //hide: true,
                    checkShow: function (action, model) {
                        var info = model.getInfo();
                        return self.checkToShowAction(action, model) && info.documentClass === "incoming";
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
                    checkShow: self.checkToShowAction
                },
                {
                    type: 'action',
                    icon: 'bullhorn',
                    text: 'grid_action_broadcast',
                    shortcut: false,
                    hide: false,
                    permissionKey: 'BROADCAST_DOCUMENT',
                    callback: self.broadcast,
                    checkShow: function (action, model) {
                        return self.checkToShowAction(action, model) && (!model.needApprove() || model.hasDocumentClass('incoming')) && !model.isBroadcasted() && (model.getSecurityLevelLookup().lookupKey !== 4);
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
                    hide: true,
                    checkShow: self.checkToShowAction
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
                // Export (Send to ready to export)
                {
                    type: 'action',
                    icon: 'export',
                    text: 'grid_action_send_to_ready_to_export',
                    shortcut: true,
                    callback: self.sendWorkItemToReadyToExport,
                    class: "action-green",
                    permissionKey: 'SEND_TO_READY_TO_EXPORT_QUEUE',
                    checkShow: function (action, model) {
                        //addMethod = 0 (Electronic/Digital) - hide the export button
                        //addMethod = 1 (Paper) - show the export button
                        var info = model.getInfo();
                        // If internal book, no export is allowed
                        // If incoming book, no addMethod will be available. So check workFlowName(if incoming) and show export button
                        return self.checkToShowAction(action, model) && info.isPaper && info.documentClass === 'outgoing' && (info.docStatus <= 22);
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
                    permissionKey: [
                        "MANAGE_DOCUMENT’S_TAGS",
                        "MANAGE_DOCUMENT’S_COMMENTS",
                        "MANAGE_TASKS",
                        "MANAGE_ATTACHMENTS",
                        "MANAGE_LINKED_DOCUMENTS",
                        "MANAGE_LINKED_ENTITIES",
                        "MANAGE_DESTINATIONS"
                    ],
                    checkAnyPermission: true,
                    checkShow: self.checkToShowAction,
                    showInView: false,
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
                            class: "action-green",
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
                    subMenu: [
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
                    permissionKey: [
                        "DOWNLOAD_MAIN_DOCUMENT",
                        "" //Composite Document permission not available in database
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
                        // send Document by Fax
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
                // Sign(Approve)
                {
                    type: 'action',
                    icon: 'pencil-lock',
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
                        return self.checkToShowAction(action, model)
                            && !info.isPaper
                            && (info.documentClass !== 'incoming')
                            && model.needApprove();
                    },
                    permissionKey: [
                        "ELECTRONIC_SIGNATURE",
                        "DIGITAL_SIGNATURE"
                    ],
                    checkAnyPermission: true,
                    subMenu: [
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
                            hasPermission = ((employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES") && checkIfEditPropertiesAllowed(model))
                                || (employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT") && info.docStatus < 23));
                        else if (info.documentClass === "incoming")
                            hasPermission = ((employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES") && checkIfEditPropertiesAllowed(model))
                                || (employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT") && info.docStatus < 23));
                        else if (info.documentClass === "outgoing")
                            hasPermission = ((employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES") && checkIfEditPropertiesAllowed(model))
                                || (employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT") && info.docStatus < 23));
                        return self.checkToShowAction(action, model) && hasPermission && !model.isBroadcasted();
                    },
                    subMenu: [
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
                                /*If partially approved, don't show edit content*/
                                if (info.docStatus === 23)
                                    return false;
                                var hasPermission = false;
                                if (info.documentClass === "internal")
                                    hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT");
                                else if (info.documentClass === "incoming")
                                    hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT");
                                else if (info.documentClass === "outgoing")
                                    hasPermission = employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT");
                                return self.checkToShowAction(action, model) && hasPermission && info.docStatus < 23;
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
                    checkShow: self.checkToShowAction
                },
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
                        return self.checkToShowAction(action, model) && (info.documentClass === 'outgoing' || info.documentClass === 'internal') && !info.isPaper
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
                    checkShow: self.checkToShowAction
                }
            ];
        }
    );
};