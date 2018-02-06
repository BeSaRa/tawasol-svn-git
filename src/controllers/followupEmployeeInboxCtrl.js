module.exports = function (app) {
    app.controller('followupEmployeeInboxCtrl', function (lookupService,
                                                          followupEmployeeInboxService,
                                                          counterService,
                                                          correspondenceService,
                                                          userInboxService,
                                                          $q,
                                                          langService,
                                                          toast,
                                                          dialog,
                                                          rootEntity,
                                                          viewDocumentService,
                                                          managerService,
                                                          distributionWorkflowService,
                                                          $window,
                                                          tokenService,
                                                          contextHelpService,
                                                          userFolders,
                                                          userFolderService,
                                                          viewTrackingSheetService,
                                                          downloadService,
                                                          employeeService,
                                                          ResolveDefer,
                                                          mailNotificationService,
                                                          $timeout) {
        'ngInject';
        var self = this;

        self.controllerName = 'followupEmployeeInboxCtrl';

        self.progress = null;
        contextHelpService.setHelpTo('followup-employee-inbox');

        /**
         * @description All followup employee inbox
         * @type {*}
         */
        // self.followupEmployeeInboxes = followupEmployeeInboxes;
        self.followupEmployeeInboxes = [];
        self.userFolders = userFolders;
        self.langService = langService;

        /**
         * @description Contains methods for Star operations for followup employee inbox items
         */
        self.starServices = {
            'false': followupEmployeeInboxService.controllerMethod.followupEmployeeInboxStar,
            'true': followupEmployeeInboxService.controllerMethod.followupEmployeeInboxUnStar,
            'starBulk': followupEmployeeInboxService.controllerMethod.followupEmployeeInboxStarBulk,
            'unStarBulk': followupEmployeeInboxService.controllerMethod.followupEmployeeInboxUnStarBulk
        };

        /**
         * @description Contains the selected followup employee inbox
         * @type {Array}
         */
        self.selectedFollowupEmployeeInboxes = [];
        self.globalSetting = rootEntity.returnRootEntity().settings;

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, //self.globalSetting.searchAmount, // default limit
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
                        return (self.followupEmployeeInboxes.length + 21);
                    }
                }
            ]
        };

        /**
         * @description Replaces the record in grid after update
         * @param record
         */
        self.replaceRecord = function (record) {
            var index = _.findIndex(self.followupEmployeeInboxes, {'id': record.id});
            if (index > -1)
                self.followupEmployeeInboxes.splice(index, 1, record);
            mailNotificationService.loadMailNotifications(5);
        };

        /**
         * @description Reload the grid of followup employee inbox
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadFollowupEmployeeInboxes = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return followupEmployeeInboxService
                .loadFollowupEmployeeInboxes(self.selectedEmployeeForFollowUpEmployeeInbox, self.selectedOrganizationForFollowUpEmployeeInbox)
                .then(function (result) {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(5);
                    self.followupEmployeeInboxes = result;
                    self.selectedFollowupEmployeeInboxes = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        self.selectedOrganizationForFollowUpEmployeeInbox = null;
        self.selectedEmployeeForFollowUpEmployeeInbox = null;
        self.getEmployeeForFollowupEmployeeInbox = function ($event) {
            followupEmployeeInboxService
                .controllerMethod
                .openOrganizationAndUserDialog(self.selectedOrganizationForFollowUpEmployeeInbox, self.selectedEmployeeForFollowUpEmployeeInbox, $event)
                .then(function (result) {
                    self.selectedOrganizationForFollowUpEmployeeInbox = result.organization;
                    self.selectedEmployeeForFollowUpEmployeeInbox = result.applicationUser.domainName;
                    self.currentSelectedUser = result.applicationUser;
                    self.reloadFollowupEmployeeInboxes(self.grid.page);
                });
        };

        self.getEmployeeForFollowupEmployeeInbox();

        /**
         * @description View document
         * @param followupEmployeeInbox
         * @param $event
         */
        self.viewDocument = function (followupEmployeeInbox, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(followupEmployeeInbox, self.gridActions)
                .then(function () {
                    return self.reloadFollowupEmployeeInboxes(self.grid.page);
                })
                .catch(function(){
                    return self.reloadFollowupEmployeeInboxes(self.grid.page);
                });
        };


        /**
         * @description Move To Folder Followup Employee inboxes Bulk
         * @param $event
         */
        self.moveToFolderFollowupEmployeeInboxBulk = function ($event) {
            var itemsToAdd = _.map(self.selectedFollowupEmployeeInboxes, 'generalStepElm.workObjectNumber');
            userFolderService
                .controllerMethod
                .addToUserFolderBulk(itemsToAdd, self.selectedFollowupEmployeeInboxes, $event)
                .then(function (result) {
                    self.reloadFollowupEmployeeInboxes(self.grid.page);
                });
        };

        /**
         * @description Terminate followup employee inbox Bulk
         * @param $event
         */
        self.terminateFollowupEmployeeInboxBulk = function ($event) {
            var numberOfRecordsToTerminate = angular.copy(self.selectedFollowupEmployeeInboxes.length);
            followupEmployeeInboxService
                .controllerMethod
                .followupEmployeeInboxTerminateBulk(self.selectedFollowupEmployeeInboxes, $event)
                .then(function () {
                    $timeout(function () {
                        self.reloadFollowupEmployeeInboxes(self.grid.page)
                            .then(function () {
                                if (numberOfRecordsToTerminate === 1)
                                    toast.success(langService.get("selected_terminate_success"));
                            });
                    }, 100);
                });
        };

        /**
         * @description Change the starred for followup employee inbox
         * @param followupEmployeeInbox
         * @param $event
         */
        self.changeFollowupEmployeeInboxStar = function (followupEmployeeInbox, $event) {
            self.starServices[followupEmployeeInbox.generalStepElm.starred](followupEmployeeInbox)
                .then(function (result) {
                    if (result) {
                        self.reloadFollowupEmployeeInboxes(self.grid.page)
                            .then(function () {
                                if (!followupEmployeeInbox.generalStepElm.starred)
                                    toast.success(langService.get("star_specific_success").change({name: followupEmployeeInbox.generalStepElm.docSubject}));
                                else
                                    toast.success(langService.get("unstar_specific_success").change({name: followupEmployeeInbox.generalStepElm.docSubject}));
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

        /**
         * @description Change the starred for followup employee inbox Bulk
         * @param starUnStar
         * @param $event
         */
        self.changeFollowupEmployeeInboxStarBulk = function (starUnStar, $event) {
            self.starServices[starUnStar](self.selectedFollowupEmployeeInboxes)
                .then(function (result) {
                    self.reloadFollowupEmployeeInboxes(self.grid.page);
                });
        };

           /**
            * @description Terminate followup employee Item
            * @param followupEmployeeInbox
            * @param $event
            * @param defer
            */
           self.terminateFollowupEmployeeInbox = function (followupEmployeeInbox, $event, defer) {
               followupEmployeeInboxService
                   .controllerMethod
                   .followupEmployeeInboxTerminate(followupEmployeeInbox, $event)
                   .then(function () {
                       self.reloadFollowupEmployeeInboxes(self.grid.page)
                           .then(function () {
                               toast.success(langService.get("terminate_specific_success").change({name: followupEmployeeInbox.getTranslatedName()}));
                               new ResolveDefer(defer);
                           });
                   });
           };

        /**
         * @description Get the link of followup employee inbox
         * @param followupEmployeeInbox
         * @param $event
         */
        self.getFollowupEmployeeInboxLink = function (followupEmployeeInbox, $event) {
            console.log('getFollowupEmployeeInboxLink', followupEmployeeInbox);
        };

        /**
         * @description View Tracking Sheet
         * @param followupEmployeeInbox
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (followupEmployeeInbox, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(followupEmployeeInbox, params, $event).then(function (result) {
            });
        };

        /**
         * @description Open followup employee inbox
         * @param followupEmployeeInbox
         * @param $event
         */
        self.openFollowupEmployeeInbox = function (followupEmployeeInbox, $event) {
            //console.log('openFollowupEmployeeInbox : ', followupEmployeeInbox);
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            correspondenceService.viewCorrespondence(followupEmployeeInbox, self.gridActions)
                .then(function () {
                    return self.reloadFollowupEmployeeInboxes(self.grid.page);
                })
                .catch(function () {
                    return self.reloadFollowupEmployeeInboxes(self.grid.page);
                });
        };

        /**
         * @description Manage Tags
         * @param followupEmployeeInbox
         * @param $event
         */
        self.manageTags = function (followupEmployeeInbox, $event) {
            var info = followupEmployeeInbox.getInfo();
            var wfName = 'outgoing';
            managerService.manageDocumentTags(info.vsId, wfName, followupEmployeeInbox.getTranslatedName(), $event)
                .then(function () {
                    self.reloadFollowupEmployeeInboxes(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadFollowupEmployeeInboxes(self.grid.page);
                });
        };

        /**
         * @description Manage Comments
         * @param followupEmployeeInbox
         * @param $event
         */
        self.manageComments = function (followupEmployeeInbox, $event) {
            var info = followupEmployeeInbox.getInfo();
            var wfName = 'outgoing';
            managerService.manageDocumentComments(info.vsId, wfName, $event)
                .then(function () {
                    self.reloadFollowupEmployeeInboxes(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadFollowupEmployeeInboxes(self.grid.page);
                });
        };

        /**
         * @description Manage Tasks
         * @param followupEmployeeInbox
         * @param $event
         */
        self.manageTasks = function (followupEmployeeInbox, $event) {
            console.log('manageFollowupEmployeeInboxTasks : ', followupEmployeeInbox);
        };

        /**
         * @description Manage Attachments
         * @param followupEmployeeInbox
         * @param $event
         */
        self.manageAttachments = function (followupEmployeeInbox, $event) {
            var info = followupEmployeeInbox.getInfo();
            var wfName = 'outgoing';
            managerService.manageDocumentAttachments(info.vsId, wfName.toLowerCase(), info.title, $event);
        };


        /**
         * @description Manage Linked Documents
         * @param followupEmployeeInbox
         * @param $event
         */
        self.manageDocuments = function (followupEmployeeInbox, $event) {
            var info = followupEmployeeInbox.getInfo();
            managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass, "welcome");
        };

        /**
         * @description Manage Linked Entities
         * @param followupEmployeeInbox
         * @param $event
         */
        self.manageEntities = function (followupEmployeeInbox, $event) {
            var wfName = 'outgoing';
            managerService
                .manageDocumentEntities(followupEmployeeInbox.generalStepElm.vsId, wfName.toLowerCase(), followupEmployeeInbox.generalStepElm.docSubject, $event);
        };

        /**
         * @description Download Main Document
         * @param followupEmployeeInbox
         * @param $event
         */
        self.downloadMainDocument = function (followupEmployeeInbox, $event) {
            //console.log('downloadFollowupEmployeeInboxMainDocument : ', followupEmployeeInbox);

            downloadService.controllerMethod
                .mainDocumentDownload(followupEmployeeInbox.generalStepElm.vsId);
        };

        /**
         * @description Download Composite Document
         * @param followupEmployeeInbox
         * @param $event
         */
        self.downloadCompositeDocument = function (followupEmployeeInbox, $event) {
            //console.log('downloadFollowupEmployeeInboxCompositeDocument : ', followupEmployeeInbox);

            downloadService.controllerMethod
                .compositeDocumentDownload(followupEmployeeInbox.generalStepElm.vsId);
        };

        /**
         * @description Send Link To Document By Email
         * @param followupEmployeeInbox
         * @param $event
         */
        self.sendFollowupEmployeeInboxLinkToDocumentByEmail = function (followupEmployeeInbox, $event) {
            console.log('sendFollowupEmployeeInboxLinkToDocumentByEmail : ', followupEmployeeInbox);
        };

        /**
         * @description Send Composite Document As Attachment By Email
         * @param followupEmployeeInbox
         * @param $event
         */
        self.sendFollowupEmployeeInboxCompositeDocumentAsAttachmentByEmail = function (followupEmployeeInbox, $event) {
            console.log('sendFollowupEmployeeInboxCompositeDocumentAsAttachmentByEmail : ', followupEmployeeInbox);
        };

        /**
         * @description Send Main Document Fax
         * @param followupEmployeeInbox
         * @param $event
         */
        self.sendFollowupEmployeeInboxMainDocumentFax = function (followupEmployeeInbox, $event) {
            console.log('sendFollowupEmployeeInboxMainDocumentFax : ', followupEmployeeInbox);
        };

        /**
         * @description Send Composite Document By Fax
         * @param followupEmployeeInbox
         * @param $event
         */
        self.sendFollowupEmployeeInboxCompositeDocumentByFax = function (followupEmployeeInbox, $event) {
            console.log('sendFollowupEmployeeInboxCompositeDocumentByFax : ', followupEmployeeInbox);
        };

        /**
         * @description Send SMS
         * @param followupEmployeeInbox
         * @param $event
         */
        self.sendFollowupEmployeeInboxSMS = function (followupEmployeeInbox, $event) {
            console.log('sendFollowupEmployeeInboxSMS : ', followupEmployeeInbox);
        };

        /**
         * @description Move To Folder
         * @param followupEmployeeInbox
         * @param $event
         */
        self.moveToFolderFollowupEmployeeInbox = function (followupEmployeeInbox, $event) {
            userFolderService
                .controllerMethod
                .addToUserFolder(followupEmployeeInbox.generalStepElm.workObjectNumber, followupEmployeeInbox.generalStepElm.folderId, followupEmployeeInbox, $event)
                .then(function (result) {
                    if (result === -1) {
                        toast.error(langService.get("inbox_failed_add_to_folder_selected"));
                    }
                    else {
                        self.reloadFollowupEmployeeInboxes(self.grid.page)
                            .then(function () {
                                var currentFolder = _.find(userFolderService.allUserFolders, ['id', result]);
                                toast.success(langService.get("inbox_add_to_folder_specific_success").change({
                                    name: followupEmployeeInbox.getTranslatedName(),
                                    folder: currentFolder.getTranslatedName()
                                }));
                            });
                    }
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
         * @description Transfer to another employee
         * @param workItem
         * @param $event
         * @param defer
         */
        self.transferToAnotherEmployee = function (workItem, $event, defer) {
            correspondenceService
                .openTransferDialog(workItem, $event)
                .then(function () {
                    self.reloadFollowupEmployeeInboxes(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('transfer_mail_success'));
                            new ResolveDefer(defer)
                        });
                })
        };

        self.transferToAnotherEmployeeBulk = function ($event) {
            correspondenceService
                .openTransferDialog(self.selectedFollowupEmployeeInboxes, $event)
                .then(function () {
                    self.reloadFollowupEmployeeInboxes(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('transfer_mail_success'))
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
                        callback: self.manageDocuments,
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    },
                    // Linked Entities
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_linked_entities',
                        shortcut: false,
                        callback: self.manageEntities,
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
                checkShow: self.checkToShowAction,
                submenu: [
                    // Link To Document By Email
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_link_to_document_by_email',
                        shortcut: false,
                        callback: self.sendFollowupEmployeeInboxLinkToDocumentByEmail,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // Composite Document As Attachment By Email
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_composite_document_as_attachment_by_email',
                        shortcut: false,
                        callback: self.sendFollowupEmployeeInboxCompositeDocumentAsAttachmentByEmail,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // Main Document Fax
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_main_document_fax',
                        shortcut: false,
                        callback: self.sendFollowupEmployeeInboxMainDocumentFax,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // Composite Document Fax
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_send_composite_doc_by_fax',
                        shortcut: false,
                        callback: self.sendFollowupEmployeeInboxCompositeDocumentByFax,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // SMS
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'grid_action_send_sms',
                        shortcut: false,
                        callback: self.sendFollowupEmployeeInboxSMS,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    }
                ]
            },
            /* Not Required as per discussion with Mr. Abu Al Nassr */
            /* // Terminate
             {
                 type: 'action',
                 icon: 'stop',
                 text: 'grid_action_terminate',
                 shortcut: true,
                 callback: self.terminateFollowupEmployeeInbox,
                 class: "action-green",
                 checkShow: self.checkToShowAction
             },*/
            // Transfer To Another Employee
            {
                type: 'action',
                icon: 'transfer',
                text: 'transfer_mail',
                shortcut: true,
                callback: self.transferToAnotherEmployee,
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            // Move To Folder
            {
                type: 'action',
                icon: 'folder-plus',
                text: 'grid_action_move_to_folder',
                hide: true,
                shortcut: true,
                callback: self.moveToFolderFollowupEmployeeInbox,
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            // Open
            {
                type: 'action',
                icon: 'book-open-variant',
                text: 'grid_action_open',
                shortcut: true,
                callback: self.openFollowupEmployeeInbox,
                class: "action-green",
                showInView: false,
                permissionKey: 'VIEW_DOCUMENT',
                checkShow: function (action, model) {
                    //If no content or no view document permission, hide the button
                    return self.checkToShowAction(action, model) && model.hasContent();
                }
            },
            // Get Link
            {
                type: 'action',
                icon: 'link',
                text: 'grid_action_get_link',
                shortcut: false,
                callback: self.getFollowupEmployeeInboxLink,
                class: "action-red",
                hide: true,
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
            }
        ];

        /**
         * @description Mark item as read/unread
         * @param followupEmployeeInbox
         * @param $event
         */
        self.markAsReadUnread = function (followupEmployeeInbox, $event) {
            return followupEmployeeInboxService.controllerMethod
                .followupInboxMarkAsReadUnread(followupEmployeeInbox, $event)
                .then(function (result) {
                    if (result.generalStepElm.isOpen)
                        toast.success(langService.get('mark_as_unread_success').change({name: followupEmployeeInbox.generalStepElm.docSubject}));
                    else
                        toast.success(langService.get('mark_as_read_success').change({name: followupEmployeeInbox.generalStepElm.docSubject}));

                    self.replaceRecord(result);
                })
        }
    });
};