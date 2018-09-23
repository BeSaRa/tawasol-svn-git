module.exports = function (app) {
    app.controller('proxyMailInboxCtrl', function (lookupService,
                                                   proxyMailInboxService,
                                                   //userInboxes,
                                                   counterService,
                                                   $q,
                                                   $filter,
                                                   langService,
                                                   toast,
                                                   dialog,
                                                   rootEntity,
                                                   viewDocumentService,
                                                   managerService,
                                                   distributionWorkflowService,
                                                   userFolders,
                                                   $window,
                                                   tokenService,
                                                   contextHelpService,
                                                   proxyUsers,
                                                   userFolderService,
                                                   viewTrackingSheetService,
                                                   downloadService,
                                                   employeeService,
                                                   ResolveDefer,
                                                   generator,
                                                   mailNotificationService,
                                                   correspondenceService,
                                                   $state) {
        'ngInject';
        var self = this;

        self.controllerName = 'proxyMailInboxCtrl';

        self.progress = null;
        self.proxyUsers = angular.copy(proxyUsers);
        contextHelpService.setHelpTo('proxy-mail-inbox');

        /**
         * @description All proxy Mail inboxes
         * @type {*}
         */
        self.proxyMailInboxes = [];
        self.userFolders = userFolders;

        /**
         * @description Contains methods for Star operations for proxy Mail inbox items
         */
        self.starServices = {
            'false': proxyMailInboxService.controllerMethod.proxyMailInboxStar,
            'true': proxyMailInboxService.controllerMethod.proxyMailInboxUnStar,
            'starBulk': proxyMailInboxService.controllerMethod.proxyMailInboxStarBulk,
            'unStarBulk': proxyMailInboxService.controllerMethod.proxyMailInboxUnStarBulk
        };

        /**
         * @description Contains the selected proxy Mail inboxes
         * @type {Array}
         */
        self.selectedProxyMailInboxes = [];
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
                        return (self.proxyMailInboxes.length + 21);
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
         * @description get all proxy mail on change of user
         */
        self.getProxyMailForUser = function () {
            self.reloadProxyMailInboxes(self.grid.page);
        };

        /**
         * @description Replaces the record in grid after update
         * @param record
         */
        self.replaceRecord = function (record) {
            var index = _.findIndex(self.proxyMailInboxes, {'id': record.id});
            if (index > -1)
                self.proxyMailInboxes.splice(index, 1, record);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.proxyMailInboxes = $filter('orderBy')(self.proxyMailInboxes, self.grid.order);
        };

        /**
         * @description Reload the grid of proxy Mail inboxes
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadProxyMailInboxes = function (pageNumber) {
            if (!self.selectUser)
                return [];

            //var userId = self.selectUser.hasOwnProperty('id') ? self.selectUser.id : self.selectUser;
            var userId = self.selectUser.hasOwnProperty('proxyUser') ? self.selectUser.proxyUser : null;
            var ouId = self.selectUser.hasOwnProperty('proxyUserOU') ? self.selectUser.proxyUserOU : null;

            var defer = $q.defer();
            self.progress = defer.promise;
            return proxyMailInboxService
                .loadProxyMailInboxes(userId, ouId)
                .then(function (result) {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.proxyMailInboxes = result;
                    self.selectedProxyMailInboxes = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Terminate proxy Mail Inboxes Bulk
         * @param $event
         */
        self.terminateBulk = function ($event) {
            correspondenceService
                .terminateBulkWorkItem(self.selectedProxyMailInboxes, $event)
                .then(function () {
                    self.reloadProxyMailInboxes(self.grid.page);
                });
        };

        /**
         * @description Add To Folder proxy Mail inboxes Bulk
         * @param $event
         */
        self.addToFolderProxyMailInboxBulk = function ($event) {
            var itemsToAdd = _.map(self.selectedProxyMailInboxes, 'generalStepElm.workObjectNumber');
            userFolderService
                .controllerMethod
                .addToUserFolderBulk(itemsToAdd, self.selectedProxyMailInboxes, $event)
                .then(function (result) {
                    self.reloadProxyMailInboxes(self.grid.page);
                });
        };

        /**
         * @description Change the starred for proxy Mail inbox
         * @param workItem
         * @param $event
         */
        self.changeProxyMailInboxStar = function (workItem, $event) {
            self.starServices[workItem.generalStepElm.starred](workItem)
                .then(function (result) {
                    if (result) {
                        self.reloadProxyMailInboxes(self.grid.page)
                            .then(function () {
                                if (!workItem.generalStepElm.starred)
                                    toast.success(langService.get("star_specific_success").change({name: workItem.generalStepElm.docSubject}));
                                else
                                    toast.success(langService.get("unstar_specific_success").change({name: workItem.generalStepElm.docSubject}));
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
         * @description Change the starred for proxy Mail Inboxes Bulk
         * @param starUnStar
         * @param $event
         */
        self.changeProxyMailInboxStarBulk = function (starUnStar, $event) {
            self.starServices[starUnStar](self.selectedProxyMailInboxes)
                .then(function (result) {
                    self.reloadProxyMailInboxes(self.grid.page);
                });
        };

        /**
         * @description Terminate proxy Mail Inbox Item
         * @param workItem
         * @param $event
         * @param defer
         */
        self.terminate = function (workItem, $event, defer) {
            workItem
                .terminate($event)
                .then(function () {
                    new ResolveDefer(defer);
                    self.reloadProxyMailInboxes(self.grid.page);
                });
        };

        /**
         * @description Add To Folder
         * @param workItem
         * @param $event
         */
        self.addToFolderProxyMailInbox = function (workItem, $event) {
            userFolderService
                .controllerMethod
                .addToUserFolder(workItem.generalStepElm.workObjectNumber, workItem.generalStepElm["folderId"], workItem, $event)
                .then(function (result) {
                    if (result === -1) {
                        toast.error(langService.get("inbox_failed_add_to_folder_selected"));
                    }
                    else {
                        self.reloadProxyMailInboxes(self.grid.page)
                            .then(function () {
                                var currentFolder = _.find(userFolderService.allUserFolders, ['id', result]);
                                toast.success(langService.get("inbox_add_to_folder_specific_success").change({
                                    name: workItem.getTranslatedName(),
                                    folder: currentFolder.getTranslatedName()
                                }));
                            });
                    }
                });
        };

        /**
         * @description Create Reply
         * @param workItem
         * @param $event
         */
        self.createReplyProxyMailInboxIncoming = function (workItem, $event) {
            var info = workItem.getInfo();
            $state.go('app.outgoing.add', {workItem: info.wobNumber, action: 'reply'});
        };

        /**
         * @description Forward
         * @param workItem
         * @param $event
         * @param defer
         */
        self.forward = function (workItem, $event, defer) {
            /*distributionWorkflowService
             .controllerMethod
             .distributionWorkflowSend(workItem.generalStepElm, true, false, null, workItem.generalStepElm.workFlowName, $event)
             .then(function (result) {
             dialog.hide();
             self.reloadProxyMailInboxes(self.grid.page).then(function () {
             new ResolveDefer(defer);
             });
             })
             .catch(function (result) {
             self.reloadProxyMailInboxes(self.grid.page);
             });*/
            workItem.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadProxyMailInboxes(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                });

        };

        /**
         * @description Reply proxy Mail inbox
         * @param workItem
         * @param $event
         * @param defer
         */
        self.reply = function (workItem, $event, defer) {
            /*distributionWorkflowService
             .controllerMethod
             .distributionWorkflowSend(workItem.generalStepElm, false, true, workItem.senderInfo, workItem.generalStepElm.workFlowName, $event)
             .then(function (result) {
             dialog.hide();
             self.reloadProxyMailInboxes(self.grid.page).then(function () {
             new ResolveDefer(defer);
             });
             })
             .catch(function (result) {
             self.reloadProxyMailInboxes(self.grid.page);
             });*/
            workItem.launchWorkFlow($event, 'reply')
                .then(function () {
                    self.reloadProxyMailInboxes(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Get the link of proxy Mail inbox
         * @param workItem
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
         * @description Subscribe
         * @param workItem
         * @param $event
         */
        self.subscribeProxyMailInbox = function (workItem, $event) {
            console.log('subscribeProxyMailInbox', workItem);
        };

        /* /!**
          * @description Export proxy Mail inbox
          * @param workItem
          * @param $event
          * @param defer
          *!/
         self.exportProxyMailInbox = function (workItem, $event, defer) {
             proxyMailInboxService
                 .exportProxyMailInbox(workItem, $event)
                 .then(function (result) {
                     self.reloadProxyMailInboxes(self.grid.page)
                         .then(function () {
                             toast.success(langService.get('export_success'));
                             new ResolveDefer(defer);
                         });
                 });
         };*/
        /**
         * @description Export proxy workItem (export to ready to export)
         * @param workItem
         * @param $event
         * @param defer
         */
        self.sendWorkItemToReadyToExport = function (workItem, $event, defer) {
            if (workItem.exportViaArchive()) {
                return workItem.exportWorkItem($event, true).then(function () {
                    self.reloadProxyMailInboxes(self.grid.page);
                    new ResolveDefer(defer);
                });
            }
            workItem.sendToReadyToExport().then(function () {
                self.reloadProxyMailInboxes(self.grid.page)
                    .then(function () {
                        toast.success(langService.get('export_success'));
                        new ResolveDefer(defer);
                    });
            })
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
                .viewTrackingSheetPopup(workItem, params, $event).then(function (result) {

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
                    self.reloadProxyMailInboxes(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadProxyMailInboxes(self.grid.page);
                });
        };

        /**
         * @description Manage Comments
         * @param workItem
         * @param $event
         */
        self.manageComments = function (workItem, $event) {
            /*var vsId = workItem.hasOwnProperty('generalStepElm')
                ? (workItem.generalStepElm.hasOwnProperty('vsId') ? workItem.generalStepElm.vsId : workItem.generalStepElm)
                : (workItem.hasOwnProperty('vsId') ? workItem.vsId : workItem);
            var wfName = workItem.hasOwnProperty('generalStepElm')
                ? (workItem.generalStepElm.hasOwnProperty('workFlowName') ? workItem.generalStepElm.workFlowName : workItem.generalStepElm)
                : (workItem.hasOwnProperty('workFlowName') ? workItem.workFlowName : workItem);

            //var wfName = 'outgoing';
            managerService.manageDocumentComments(vsId, wfName.toLowerCase(), $event);*/


            workItem.manageDocumentComments($event)
                .then(function () {
                    self.reloadProxyMailInboxes(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadProxyMailInboxes(self.grid.page);
                });
        };

        /**
         * @description Manage Tasks
         * @param workItem
         * @param $event
         */
        self.manageTasks = function (workItem, $event) {
            console.log('manageProxyMailInboxTasks : ', workItem);
        };

        /**
         * @description Manage Attachments
         * @param workItem
         * @param $event
         */
        self.manageAttachments = function (workItem, $event) {
            workItem.manageDocumentAttachments($event)
                .then(function () {
                    self.reloadProxyMailInboxes(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadProxyMailInboxes(self.grid.page);
                });
        };


        /**
         * @description Manage Linked Documents
         * @param workItem
         * @param $event
         */
        self.manageLinkedDocuments = function (workItem, $event) {
            workItem.manageDocumentLinkedDocuments($event)
                .then(function () {
                    self.reloadProxyMailInboxes(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadProxyMailInboxes(self.grid.page);
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
            workItem.manageDocumentCorrespondence($event)
                .then(function () {
                    self.reloadProxyMailInboxes(self.grid.page);
                });
        };

        /**
         * @description View Direct Linked Documents
         * @param workItem
         * @param $event
         */
        self.viewProxyMailInboxDirectLinkedDocuments = function (workItem, $event) {
            console.log('viewProxyMailInboxDirectLinkedDocuments : ', workItem);
        };

        /**
         * @description View Complete Linked Documents
         * @param workItem
         * @param $event
         */
        self.viewProxyMailInboxCompleteLinkedDocuments = function (workItem, $event) {
            console.log('viewProxyMailInboxCompleteLinkedDocuments : ', workItem);
        };

        /**
         * @description Download Main Document
         * @param workItem
         * @param $event
         */
        self.downloadMainDocument = function (workItem, $event) {
            downloadService.controllerMethod
                .mainDocumentDownload(workItem.generalStepElm.vsId);
        };

        /**
         * @description Download Composite Document
         * @param workItem
         * @param $event
         */
        self.downloadCompositeDocument = function (workItem, $event) {
            downloadService.controllerMethod
                .compositeDocumentDownload(workItem.generalStepElm.vsId);
        };

        /**
         * @description Send Link To Document By Email
         * @param workItem
         * @param $event
         */
        self.sendProxyMailInboxLinkToDocumentByEmail = function (workItem, $event) {
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
         * @description Send Composite Document As Attachment
         * @param workItem
         * @param $event
         */
        self.sendProxyMailInboxCompositeDocumentAsAttachment = function (workItem, $event) {
            console.log('sendProxyMailInboxCompositeDocumentAsAttachment : ', workItem);
        };

        /**
         * @description Send Composite Document As Attachment By Email
         * @param workItem
         * @param $event
         */
        self.sendProxyMailInboxCompositeDocumentAsAttachmentByEmail = function (workItem, $event) {
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
         * @description Send Main Document Fax
         * @param workItem
         * @param $event
         */
        self.sendProxyMailInboxMainDocumentFax = function (workItem, $event) {
            console.log('sendProxyMailInboxMainDocumentFax : ', workItem);
        };

        /**
         * @description Send SMS
         * @param workItem
         * @param $event
         */
        self.sendProxyMailInboxSMS = function (workItem, $event) {
            console.log('sendProxyMailInboxSMS : ', workItem);
        };

        /**
         * @description Send Main Document As Attachment
         * @param workItem
         * @param $event
         */
        self.sendProxyMailInboxMainDocumentAsAttachment = function (workItem, $event) {
            console.log('sendProxyMailInboxMainDocumentAsAttachment : ', workItem);
        };

        /**
         * @description Send Link
         * @param workItem
         * @param $event
         */
        self.sendProxyMailInboxLink = function (workItem, $event) {
            console.log('sendProxyMailInboxLink : ', workItem);
        };

        /**
         * @description Sign Internal e-Signature
         * @param workItem
         * @param $event
         * @param defer
         */
        self.signProxyMailInboxESignature = function (workItem, $event, defer) {
            proxyMailInboxService
                .controllerMethod
                .proxyMailInboxSignaturePopup(workItem, $event)
                .then(function (result) {
                    if (result)
                        self.reloadProxyMailInboxes(self.grid.page)
                            .then(function () {
                                toast.success(langService.get('sign_specific_success').change({name: workItem.getTranslatedName()}));
                                new ResolveDefer(defer);
                            });
                });
        };

        /**
         * @description Sign Digital Signature
         * @param workItem
         * @param $event
         * @param defer
         */
        self.signProxyMailInboxDigitalSignature = function (workItem, $event, defer) {
            console.log('signProxyMailInboxDigitalSignature : ', workItem);
        };

        /**
         * @description Edit Content
         * @param workItem
         * @param $event
         */
        self.editContent = function (workItem, $event) {
            var info = workItem.getInfo();
            managerService.manageDocumentContent(info.vsId, info.documentClass, info.title, $event);
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
                    self.reloadProxyMailInboxes(self.grid.page)
                });
        };

        /**
         * @description Checks if edit properties is allowed
         * @param model
         * @param checkForViewPopup
         * @returns {boolean}
         */
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
            return hasPermission;
        };

        /**
         * @description Checks if edit correspondence sites(destinations) is allowed
         * @param model
         * @param checkForViewPopup
         * @returns {*}
         */
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
            workItem.viewProxyInboxWorkItem(self.gridActions, checkIfEditPropertiesAllowed(workItem, true), checkIfEditCorrespondenceSiteAllowed(workItem, true))
                .then(function () {
                    return self.reloadProxyMailInboxes(self.grid.page);
                })
                .catch(function () {
                    return self.reloadProxyMailInboxes(self.grid.page);
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
            workItem.viewNewProxyDocument(self.gridActions, 'proxyMail', $event)
                .then(function () {
                    return self.reloadProxyMailInboxes(self.grid.page);
                })
                .catch(function () {
                    return self.reloadProxyMailInboxes(self.grid.page);
                });
        };

        /**
         * @description edit word doucment in desktop
         * @param workItem
         * @return {Promise}
         */
        self.editInDesktop = function (workItem) {
            return correspondenceService.editWordInDesktop(workItem);
        };


        /**
         * @description Check if action will be shown on grid or not
         * @param action
         * @param model
         * @param inViewOnly
         * @returns {boolean}
         */
        self.checkToShowAction = function (action, model, inViewOnly) {
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
            return !inViewOnly ? ((!action.hide) && hasPermission) : hasPermission;
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
                        gridName: 'proxy-mail'
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
                shortcut: true,
                callback: self.addToFolderProxyMailInbox,
                class: "action-green",
                hide: true,
                checkShow: self.checkToShowAction
            },
            // Create Reply (Incoming Only)
            {
                type: 'action',
                icon: 'pen',
                text: 'grid_action_create_reply',
                shortcut: false,
                callback: self.createReplyProxyMailInboxIncoming,
                class: "action-green",
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
            // Reply
            {
                type: 'action',
                icon: 'reply',
                text: 'grid_action_reply',
                shortcut: true,
                callback: self.reply,
                class: "action-green",
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
                callback: self.subscribeProxyMailInbox,
                class: "action-red",
                hide: true,
                checkShow: self.checkToShowAction
            },
            /*// Export
            {
                type: 'action',
                icon: 'export',
                text: 'grid_action_export',
                shortcut: true,
                callback: self.exportProxyMailInbox,
                class: "action-green",
                showInView: false,
                checkShow: function (action, model) {
                    //addMethod = 0 (Electronic/Digital) - show the export button
                    //addMethod = 1 (Paper) - show the export button
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && info.isPaper && info.documentClass === "outgoing";
                }
            },*/
            // Export (Send to ready to export)
            {
                type: 'action',
                icon: 'export',
                text: 'grid_action_send_to_ready_to_export',
                textCallback: function (model) {
                    return model.exportViaArchive() ? 'grid_action_send_to_central_archive' : 'grid_action_send_to_ready_to_export';
                },
                shortcut: true,
                callback: self.sendWorkItemToReadyToExport,
                class: "action-green",
                checkShow: function (action, model) {
                    //addMethod = 0 (Electronic/Digital) - hide the export button
                    //addMethod = 1 (Paper) - show the export button
                    var info = model.getInfo();
                    // If internal book, no export is allowed
                    // If incoming book, no addMethod will be available. So check workFlowName(if incoming) and show export button
                    return self.checkToShowAction(action, model) && info.isPaper && info.documentClass === 'outgoing' && !model.isBroadcasted() && (info.docStatus <= 22);
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
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                shortcut: false,
                showInViewOnly: true,
                hide: true,
                checkShow: self.checkToShowAction,
                permissionKey: [
                    "MANAGE_DOCUMENT’S_TAGS",
                    "MANAGE_DOCUMENT’S_COMMENTS",
                    "MANAGE_TASKS",
                    "MANAGE_ATTACHMENTS",
                    "MANAGE_LINKED_DOCUMENTS",
                    "", // Linked Entities permission not available in database
                    "MANAGE_DESTINATIONS"
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
                        hide: true,
                        permissionKey: "MANAGE_TASKS",
                        callback: self.manageTasks,
                        class: "action-red",
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
                        text: 'linked_entities',
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
                checkShow: self.checkToShowAction,
                hide: true,
                subMenu: [
                    // Direct Linked Documents
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_direct_linked_documents',
                        shortcut: false,
                        callback: self.viewProxyMailInboxDirectLinkedDocuments,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // Complete Linked Documents
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_complete_linked_documents',
                        shortcut: false,
                        callback: self.viewProxyMailInboxCompleteLinkedDocuments,
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
                        callback: self.sendProxyMailInboxLinkToDocumentByEmail,
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
                        callback: self.sendProxyMailInboxCompositeDocumentAsAttachmentByEmail,
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    },
                    // Send Document by Fax
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_main_document_fax',
                        shortcut: false,
                        hide: true,
                        permissionKey: "SEND_DOCUMENT_BY_FAX",
                        callback: self.sendProxyMailInboxMainDocumentFax,
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
                        callback: self.sendProxyMailInboxSMS,
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
                //docClass: "Outgoing",
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
                        permissionKey: "ELECTRONIC_SIGNATURE",
                        callback: self.signProxyMailInboxESignature,
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    },
                    // Digital Signature
                    {
                        type: 'action',
                        //icon: 'attachment',
                        text: 'grid_action_digital',//digital_signature
                        shortcut: false,
                        permissionKey: "DIGITAL_SIGNATURE",
                        callback: self.signProxyMailInboxDigitalSignature,
                        class: "action-red",
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
                            /*If partially or fully approved, don't show edit content*/
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
            {
                type: 'action',
                icon: 'desktop-classic',
                text: 'grid_action_edit_in_desktop',
                shortcut: true,
                hide: false,
                callback: self.editInDesktop,
                class: "action-green",
                showInView: false,
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    var hasPermission = false;
                    if (info.documentClass === 'outgoing') {
                        hasPermission = employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT");
                    } else if (info.documentClass === 'incoming') {
                        hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT");
                    }
                    else if (info.documentClass === 'internal') {
                        hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT");
                    }
                    return self.checkToShowAction(action, model) && !model.isBroadcasted()
                        && !info.isPaper
                        && (info.documentClass !== 'incoming')
                        && model.needApprove()
                        && hasPermission;
                }
            }
        ];
    });
};