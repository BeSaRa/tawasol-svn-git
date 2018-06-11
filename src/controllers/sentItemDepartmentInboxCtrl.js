module.exports = function (app) {
    app.controller('sentItemDepartmentInboxCtrl', function (lookupService,
                                                            sentItemDepartmentInboxService,
                                                            $q,
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
                                                            distributionWorkflowService,
                                                            downloadService,
                                                            contextHelpService,
                                                            employeeService,
                                                            correspondenceService,
                                                            ResolveDefer,
                                                            favoriteDocumentsService,
                                                            generator,
                                                            mailNotificationService) {
        'ngInject';
        var self = this;

        /*
         * IT WILL ALWAYS GET OUTGOING DOCUMENTS ONLY
         * */

        self.controllerName = 'sentItemDepartmentInboxCtrl';
        contextHelpService.setHelpTo('sent-items-department');

        self.progress = null;

        self.docClassName = 'outgoing';
        /**
         * @description All sent items
         * @type {*}
         */
        self.sentItemDepartmentInboxes = [];

        /**
         * @description Contains the selected sent items
         * @type {Array}
         */
        self.selectedSentItemDepartmentInboxes = [];
        self.globalSetting = rootEntity.returnRootEntity().settings;

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    /*label: self.globalSetting.searchAmountLimit.toString(),
                     value: function () {
                     return self.globalSetting.searchAmountLimit
                     }*/
                    label: langService.get('all'),
                    value: function () {
                        return (self.sentItemDepartmentInboxes.length + 21);
                    }
                }
            ]
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
         * @description Opens the popup to get the month and year for sent items
         * @type {null}
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
                    self.reloadSentItemDepartmentInboxes(self.grid.page);
                });
        };

        self.getMonthYearForSentItems();

        /**
         * @description Reload the grid of sent item
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadSentItemDepartmentInboxes = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return sentItemDepartmentInboxService
                .loadSentItemDepartmentInboxes(self.selectedMonth, self.selectedYear)
                .then(function (result) {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);;
                    self.sentItemDepartmentInboxes = result;
                    self.selectedSentItemDepartmentInboxes = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Recall multiple selected sent items
         * @param $event
         */
        self.recallBulk = function ($event) {
            console.log('recall bulk : ', $event);
        };

        /**
         * @description Terminate department sent Items
         * @param sentItemDepartmentInbox
         * @param $event
         * @param defer
         */
        self.terminate = function (sentItemDepartmentInbox, $event, defer) {
            /*sentItemDepartmentInboxService.controllerMethod
             .sentItemDepartmentInboxTerminate(sentItemDepartmentInbox, $event)
             .then(function (result) {
             self.reloadUserInboxes(self.grid.page)
             .then(function () {
             toast.success(langService.get("terminate_specific_success").change({name: sentItemDepartmentInbox.generalStepElm.docSubject}));
             new ResolveDefer(defer);
             })
             ;
             });*/
        };

        /**
         * @description Recall Department Sent Item
         * @param sentItemDepartmentInbox
         * @param $event
         */
        self.recall = function (sentItemDepartmentInbox,$event) {
           if(sentItemDepartmentInbox.receivedById === null){
                sentItemDepartmentInboxService.fetchDeptSentWorkitemByVsId(sentItemDepartmentInbox.vsId).then(function (result) {
                    var wobNum = 'temp01';
                    angular.forEach(result, function(item){
                        if(item.senderInfo.id === employeeService.getEmployee().id){
                            wobNum = item.generalStepElm.workObjectNumber;
                        }
                    });

                    dialog.showPrompt($event,langService.get('transfer_reason')+'?','','').then(function (reason) {
                        sentItemDepartmentInboxService.recallSingleWorkItem(wobNum, employeeService.getEmployee().domainName, reason).then(function (result) {
                            if(result){
                                toast.success(langService.get('transfer_mail_success'));
                            }
                        }).catch(function (error) {
                            toast.error(langService.get('work_item_not_found').change({wobNumber: wobNum}));
                        });
                    });
                });
            }else{
                toast.error(langService.get('cannot_recall_received_book'));
            }

        };

        /**
         * @description Launch New Distribution workflow for Department Sent Item
         * @param sentItemDepartmentInbox
         * @param $event
         * @param defer
         */
        self.launchNewDistributionWorkflow = function (sentItemDepartmentInbox, $event, defer) {

            //records will always come from outgoing so to Launch, create URL by passing outgoing
            /*distributionWorkflowService
             .controllerMethod
             .distributionWorkflowSend(sentItemDepartmentInbox, false, false, null, "outgoing", $event)
             .then(function (result) {
             self.reloadSentItemDepartmentInboxes(self.grid.page)
             .then(function () {
             new ResolveDefer(defer);
             });
             })
             .catch(function (result) {
             self.reloadSentItemDepartmentInboxes(self.grid.page);
             });*/
            sentItemDepartmentInbox.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadSentItemDepartmentInboxes(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });

        };

        /**
         * @description add an item to the favorite documents
         * @param sentItemDepartmentInbox
         * @param $event
         */
        self.addToFavorite = function (sentItemDepartmentInbox, $event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAdd(sentItemDepartmentInbox.vsId, $event)
                .then(function (result) {
                        if (result.status) {
                            self.reloadSentItemDepartmentInboxes(self.grid.page)
                                .then(function () {
                                    toast.success(langService.get("add_to_favorite_specific_success").change({
                                        name: sentItemDepartmentInbox.getTranslatedName()
                                    }));
                                });
                        }
                        else {
                            dialog.alertMessage(langService.get(result.message));
                        }
                    }
                );
        };

        /**
         * @description View Tracking Sheet
         * @param sentItemDepartmentInbox
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (sentItemDepartmentInbox, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(sentItemDepartmentInbox, params, $event).then(function (result) {

            });
        };

        /**
         * @description Manage Tags
         * @param sentItemDepartmentInbox
         * @param $event
         */
        self.manageTags = function (sentItemDepartmentInbox, $event) {
            managerService.manageDocumentTags(sentItemDepartmentInbox.vsId, self.docClassName, sentItemDepartmentInbox.docSubject, $event)
                .then(function (tags) {
                    sentItemDepartmentInbox.tags = tags;
                })
                .catch(function (tags) {
                    sentItemDepartmentInbox.tags = tags;
                });
        };

        /**
         * @description Manage Comments
         * @param sentItemDepartmentInbox
         * @param $event
         */
        self.manageComments = function (sentItemDepartmentInbox, $event) {
            managerService.manageDocumentComments(sentItemDepartmentInbox.vsId, sentItemDepartmentInbox.docSubject, $event)
                .then(function (documentComments) {
                    sentItemDepartmentInbox.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    sentItemDepartmentInbox.documentComments = documentComments;
                });
        };

        /**
         * @description Manage Tasks
         * @param sentItemDepartmentInbox
         * @param $event
         */
        self.manageTasks = function (sentItemDepartmentInbox, $event) {
            console.log('manage tasks : ', sentItemDepartmentInbox)
        };

        /**
         * @description Manage Attachments
         * @param sentItemDepartmentInbox
         * @param $event
         */
        self.manageAttachments = function (sentItemDepartmentInbox, $event) {
            //console.log('manage attachments : ', sentItemDepartmentInbox);
            var vsId = sentItemDepartmentInbox.hasOwnProperty('vsId') ? sentItemDepartmentInbox.vsId : sentItemDepartmentInbox;

            managerService.manageDocumentAttachments(vsId, self.docClassName, sentItemDepartmentInbox.getTranslatedName(), $event);
        };

        /**
         * @description Manage Linked Documents
         * @param sentItemDepartmentInbox
         * @param $event
         */
        self.manageLinkedDocuments = function (sentItemDepartmentInbox, $event) {
            console.log('manage linked documents', sentItemDepartmentInbox);

            managerService.manageDocumentLinkedDocuments(sentItemDepartmentInbox.vsId, self.docClassName, "welcome");
        };

        /**
         * @description Manage Linked Entities
         * @param sentItemDepartmentInbox
         * @param $event
         */
        self.manageLinkedEntities = function (sentItemDepartmentInbox, $event) {
            managerService
                .manageDocumentEntities(sentItemDepartmentInbox.vsId, self.docClassName, sentItemDepartmentInbox.docSubject, $event);
        };


        /**
         * @description Download Main Document
         * @param sentItemDepartmentInbox
         * @param $event
         */
        self.downloadMainDocument = function (sentItemDepartmentInbox, $event) {
            //console.log('download main document : ', sentItemDepartmentInbox);
            downloadService.controllerMethod
                .mainDocumentDownload(sentItemDepartmentInbox.vsId, $event);
        };

        /**
         * @description Manage Composite Document
         * @param sentItemDepartmentInbox
         * @param $event
         */
        self.downloadCompositeDocument = function (sentItemDepartmentInbox, $event) {
            // console.log('download composite document : ', sentItemDepartmentInbox);
            downloadService.controllerMethod
                .compositeDocumentDownload(sentItemDepartmentInbox.vsId, $event);
        };

        /**
         * @description Send link to document by email
         * @param sentItemDepartmentInbox
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (sentItemDepartmentInbox, $event) {
            downloadService.getMainDocumentEmailContent(sentItemDepartmentInbox.vsId).then(function (result) {
                dialog.successMessage(langService.get('right_click_and_save_link_as') + langService.get('download_message_file').change({
                    result: result,
                    filename: 'Tawasol.msg'
                }));
                return true;
            });
        };

        /**
         * @description Send composite document as attachment by email
         * @param sentItemDepartmentInbox
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (sentItemDepartmentInbox, $event) {
            downloadService.getCompositeDocumentEmailContent(sentItemDepartmentInbox.vsId).then(function (result) {
                dialog.successMessage(langService.get('right_click_and_save_link_as') + langService.get('download_message_file').change({
                    result: result,
                    filename: 'Tawasol.msg'
                }));
                return true;
            });
        };

        /**
         * @description Send sms
         * @param sentItemDepartmentInbox
         * @param $event
         */
        self.sendSMS = function (sentItemDepartmentInbox, $event) {
            console.log('Send sms : ', sentItemDepartmentInbox);
        };

        /**
         * @description Send main document fax
         * @param sentItemDepartmentInbox
         * @param $event
         */
        self.sendMainDocumentFax = function (sentItemDepartmentInbox, $event) {
            console.log('send main document fax : ', sentItemDepartmentInbox);
        };

        /**
         * @description Get Link
         * @param sentItemDepartmentInbox
         * @param $event
         */
        self.getLink = function (sentItemDepartmentInbox, $event) {
            viewDocumentService.loadDocumentViewUrlWithOutEdit(sentItemDepartmentInbox.vsId).then(function (result) {
                //var docLink = "<a target='_blank' href='" + result + "'>" + result + "</a>";
                dialog.successMessage(langService.get('link_message').change({result: result}));
                return true;
            });
        };

        /**
         * @description Subscribe
         * @param sentItemDepartmentInbox
         * @param $event
         */
        self.subscribe = function (sentItemDepartmentInbox, $event) {
            console.log('subscribe : ', sentItemDepartmentInbox);
        };

        /**
         * @description View document
         * @param sentItemDepartmentInbox
         * @param $event
         */
        self.viewDocument = function (sentItemDepartmentInbox, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence({
                vsId: sentItemDepartmentInbox.vsId,
                docClassName: self.docClassName
            }, self.gridActions, true, true, true);
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
                permissionKey: "EDIT_OUTGOING_CONTENT", //TODO: Apply correct permission when added to database.
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && !info.isPaper;
                }
            },
            // Recall
            {
                type: 'action',
                icon: 'tag',
                text: 'grid_action_recall',
                shortcut: true,
                showInView: false,
                callback: self.recall,
                class: "action-green",
                hide: false, /*In Phase 2*/
                checkShow: self.checkToShowAction
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
            // Open
            {
                type: 'action',
                icon: 'book-open-variant',
                text: 'grid_action_open',
                shortcut: true,
                callback: self.viewDocument,
                class: "action-green",
                showInView: false,
                permissionKey: 'VIEW_DOCUMENT',
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
                subMenu: [
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
                subMenu: [
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
                checkShow: self.checkToShowAction,
                subMenu: [
                    // Link To Document By Email
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_link_to_document_by_email',
                        shortcut: false,
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
            }
        ];

    });
};