module.exports = function (app) {
    app.controller('proxyMailInboxCtrl', function (lookupService,
                                                   proxyMailInboxService,
                                                   //userInboxes,
                                                   counterService,
                                                   $q,
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
                                                   correspondenceService) {
        'ngInject';
        var self = this;

        self.controllerName = 'proxyMailInboxCtrl';

        self.progress = null;
        self.proxyUsers = proxyUsers;
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
                    self.proxyMailInboxes = result;
                    self.selectedProxyMailInboxes = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Terminate proxy Mail Inboxes Bulk
         * @param $event
         */
        self.terminateProxyMailInboxBulk = function ($event) {
            proxyMailInboxService.controllerMethod
                .proxyMailInboxTerminateBulk(self.selectedProxyMailInboxes, $event)
                .then(function (result) {
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
         * @param proxyMailInbox
         * @param $event
         */
        self.changeProxyMailInboxStar = function (proxyMailInbox, $event) {
            self.starServices[proxyMailInbox.generalStepElm.starred](proxyMailInbox)
                .then(function (result) {
                    if (result) {
                        self.reloadProxyMailInboxes(self.grid.page)
                            .then(function () {
                                if (!proxyMailInbox.generalStepElm.starred)
                                    toast.success(langService.get("star_specific_success").change({name: proxyMailInbox.generalStepElm.docSubject}));
                                else
                                    toast.success(langService.get("unstar_specific_success").change({name: proxyMailInbox.generalStepElm.docSubject}));
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
         * @param proxyMailInbox
         * @param $event
         * @param defer
         */
        self.terminateProxyMailInbox = function (proxyMailInbox, $event, defer) {
            proxyMailInboxService.controllerMethod
                .proxyMailInboxTerminate(proxyMailInbox, $event)
                .then(function (result) {
                    self.reloadProxyMailInboxes(self.grid.page)
                        .then(function () {
                            toast.success(langService.get("terminate_specific_success").change({name: proxyMailInbox.generalStepElm.docSubject}));
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Add To Folder
         * @param proxyMailInbox
         * @param $event
         */
        self.addToFolderProxyMailInbox = function (proxyMailInbox, $event) {
            userFolderService
                .controllerMethod
                .addToUserFolder(proxyMailInbox.generalStepElm.workObjectNumber, proxyMailInbox.generalStepElm["folderId"], proxyMailInbox, $event)
                .then(function (result) {
                    if (result === -1) {
                        toast.error(langService.get("inbox_failed_add_to_folder_selected"));
                    }
                    else {
                        self.reloadProxyMailInboxes(self.grid.page)
                            .then(function () {
                                var currentFolder = _.find(userFolderService.allUserFolders, ['id', result]);
                                toast.success(langService.get("inbox_add_to_folder_specific_success").change({
                                    name: proxyMailInbox.getTranslatedName(),
                                    folder: currentFolder.getTranslatedName()
                                }));
                            });
                    }
                });
        };

        /**
         * @description Create Reply
         * @param proxyMailInbox
         * @param $event
         */
        self.createReplyProxyMailInboxIncoming = function (proxyMailInbox, $event) {
            var info = proxyMailInbox.getInfo();
            $state.go('app.outgoing.add', {workItem: info.wobNumber, action: 'reply'});
        };

        /**
         * @description Forward
         * @param proxyMailInbox
         * @param $event
         * @param defer
         */
        self.forwardProxyMailInbox = function (proxyMailInbox, $event, defer) {
            distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSend(proxyMailInbox.generalStepElm, true, false, null, proxyMailInbox.generalStepElm.workFlowName, $event)
                .then(function (result) {
                    dialog.hide();
                    self.reloadProxyMailInboxes(self.grid.page).then(function () {
                        new ResolveDefer(defer);
                    });
                })
                .catch(function (result) {
                    self.reloadProxyMailInboxes(self.grid.page);
                });

        };

        /**
         * @description Reply proxy Mail inbox
         * @param proxyMailInbox
         * @param $event
         * @param defer
         */
        self.replyProxyMailInbox = function (proxyMailInbox, $event, defer) {
            distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSend(proxyMailInbox.generalStepElm, false, true, proxyMailInbox.senderInfo, proxyMailInbox.generalStepElm.workFlowName, $event)
                .then(function (result) {
                    dialog.hide();
                    self.reloadProxyMailInboxes(self.grid.page).then(function () {
                        new ResolveDefer(defer);
                    });
                })
                .catch(function (result) {
                    self.reloadProxyMailInboxes(self.grid.page);
                });
        };

        /**
         * @description Get the link of proxy Mail inbox
         * @param proxyMailInbox
         * @param $event
         */
        self.getProxyMailInboxLink = function (proxyMailInbox, $event) {
            console.log('getProxyMailInboxLink', proxyMailInbox);
        };

        /**
         * @description Subscribe
         * @param proxyMailInbox
         * @param $event
         */
        self.subscribeProxyMailInbox = function (proxyMailInbox, $event) {
            console.log('subscribeProxyMailInbox', proxyMailInbox);
        };

        /**
         * @description Export proxy Mail inbox
         * @param proxyMailInbox
         * @param $event
         * @param defer
         */
        self.exportProxyMailInbox = function (proxyMailInbox, $event, defer) {
            //console.log('exportProxyMailInbox', proxyMailInbox);
            proxyMailInboxService
                .exportProxyMailInbox(proxyMailInbox, $event)
                .then(function (result) {
                    self.reloadProxyMailInboxes(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('export_success'));
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description View Tracking Sheet
         * @param proxyMailInbox
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (proxyMailInbox, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(proxyMailInbox, params, $event).then(function (result) {

            });
        };

        /**
         * @description Manage Tags
         * @param proxyMailInbox
         * @param $event
         */
        self.manageTags = function (proxyMailInbox, $event) {
            var vsId = proxyMailInbox.hasOwnProperty('generalStepElm')
                ? (proxyMailInbox.generalStepElm.hasOwnProperty('vsId') ? proxyMailInbox.generalStepElm.vsId : proxyMailInbox.generalStepElm)
                : (proxyMailInbox.hasOwnProperty('vsId') ? proxyMailInbox.vsId : proxyMailInbox);
            var wfName = proxyMailInbox.hasOwnProperty('generalStepElm')
                ? (proxyMailInbox.generalStepElm.hasOwnProperty('workFlowName') ? proxyMailInbox.generalStepElm.workFlowName : proxyMailInbox.generalStepElm)
                : (proxyMailInbox.hasOwnProperty('workFlowName') ? proxyMailInbox.workFlowName : proxyMailInbox);
            //var wfName = 'outgoing';
            managerService.manageDocumentTags(vsId, wfName.toLowerCase(), proxyMailInbox.getTranslatedName(), $event);
        };

        /**
         * @description Manage Comments
         * @param proxyMailInbox
         * @param $event
         */
        self.manageComments = function (proxyMailInbox, $event) {
            var vsId = proxyMailInbox.hasOwnProperty('generalStepElm')
                ? (proxyMailInbox.generalStepElm.hasOwnProperty('vsId') ? proxyMailInbox.generalStepElm.vsId : proxyMailInbox.generalStepElm)
                : (proxyMailInbox.hasOwnProperty('vsId') ? proxyMailInbox.vsId : proxyMailInbox);
            var wfName = proxyMailInbox.hasOwnProperty('generalStepElm')
                ? (proxyMailInbox.generalStepElm.hasOwnProperty('workFlowName') ? proxyMailInbox.generalStepElm.workFlowName : proxyMailInbox.generalStepElm)
                : (proxyMailInbox.hasOwnProperty('workFlowName') ? proxyMailInbox.workFlowName : proxyMailInbox);

            //var wfName = 'outgoing';
            managerService.manageDocumentComments(vsId, wfName.toLowerCase(), $event);
        };

        /**
         * @description Manage Tasks
         * @param proxyMailInbox
         * @param $event
         */
        self.manageTasks = function (proxyMailInbox, $event) {
            console.log('manageProxyMailInboxTasks : ', proxyMailInbox);
        };

        /**
         * @description Manage Attachments
         * @param proxyMailInbox
         * @param $event
         */
        self.manageAttachments = function (proxyMailInbox, $event) {
            var vsId = proxyMailInbox.hasOwnProperty('generalStepElm')
                ? (proxyMailInbox.generalStepElm.hasOwnProperty('vsId') ? proxyMailInbox.generalStepElm.vsId : proxyMailInbox.generalStepElm)
                : (proxyMailInbox.hasOwnProperty('vsId') ? proxyMailInbox.vsId : proxyMailInbox);
            var wfName = proxyMailInbox.hasOwnProperty('generalStepElm')
                ? (proxyMailInbox.generalStepElm.hasOwnProperty('workFlowName') ? proxyMailInbox.generalStepElm.workFlowName : proxyMailInbox.generalStepElm)
                : (proxyMailInbox.hasOwnProperty('workFlowName') ? proxyMailInbox.workFlowName : proxyMailInbox);
            //var wfName = 'outgoing';
            managerService.manageDocumentAttachments(vsId, wfName.toLowerCase(), proxyMailInbox.getTranslatedName(), $event);
        };


        /**
         * @description Manage Linked Documents
         * @param proxyMailInbox
         * @param $event
         */
        self.manageLinkedDocuments = function (proxyMailInbox, $event) {
            console.log('manageProxyMailInboxLinkedDocuments : ', proxyMailInbox);
        };

        /**
         * @description Manage Linked Entities
         * @param proxyMailInbox
         * @param $event
         */
        self.manageLinkedEntities = function (proxyMailInbox, $event) {
            //var wfName = 'outgoing';
            var wfName = proxyMailInbox.hasOwnProperty('generalStepElm')
                ? (proxyMailInbox.generalStepElm.hasOwnProperty('workFlowName') ? proxyMailInbox.generalStepElm.workFlowName : proxyMailInbox.generalStepElm)
                : (proxyMailInbox.hasOwnProperty('workFlowName') ? proxyMailInbox.workFlowName : proxyMailInbox);
            managerService
                .manageDocumentEntities(proxyMailInbox.generalStepElm.vsId, wfName.toLowerCase(), proxyMailInbox.generalStepElm.docSubject, $event);
        };

        /**
         * @description View Direct Linked Documents
         * @param proxyMailInbox
         * @param $event
         */
        self.viewProxyMailInboxDirectLinkedDocuments = function (proxyMailInbox, $event) {
            console.log('viewProxyMailInboxDirectLinkedDocuments : ', proxyMailInbox);
        };

        /**
         * @description View Complete Linked Documents
         * @param proxyMailInbox
         * @param $event
         */
        self.viewProxyMailInboxCompleteLinkedDocuments = function (proxyMailInbox, $event) {
            console.log('viewProxyMailInboxCompleteLinkedDocuments : ', proxyMailInbox);
        };

        /**
         * @description Download Main Document
         * @param proxyMailInbox
         * @param $event
         */
        self.downloadMainDocument = function (proxyMailInbox, $event) {
            downloadService.controllerMethod
                .mainDocumentDownload(proxyMailInbox.generalStepElm.vsId);
        };

        /**
         * @description Download Composite Document
         * @param proxyMailInbox
         * @param $event
         */
        self.downloadCompositeDocument = function (proxyMailInbox, $event) {
            downloadService.controllerMethod
                .compositeDocumentDownload(proxyMailInbox.generalStepElm.vsId);
        };

        /**
         * @description Send Link To Document By Email
         * @param proxyMailInbox
         * @param $event
         */
        self.sendProxyMailInboxLinkToDocumentByEmail = function (proxyMailInbox, $event) {
            console.log('sendProxyMailInboxLinkToDocumentByEmail : ', proxyMailInbox);
        };

        /**
         * @description Send Composite Document As Attachment
         * @param proxyMailInbox
         * @param $event
         */
        self.sendProxyMailInboxCompositeDocumentAsAttachment = function (proxyMailInbox, $event) {
            console.log('sendProxyMailInboxCompositeDocumentAsAttachment : ', proxyMailInbox);
        };

        /**
         * @description Send Composite Document As Attachment By Email
         * @param proxyMailInbox
         * @param $event
         */
        self.sendProxyMailInboxCompositeDocumentAsAttachmentByEmail = function (proxyMailInbox, $event) {
            console.log('sendProxyMailInboxCompositeDocumentAsAttachmentByEmail : ', proxyMailInbox);
        };

        /**
         * @description Send Main Document Fax
         * @param proxyMailInbox
         * @param $event
         */
        self.sendProxyMailInboxMainDocumentFax = function (proxyMailInbox, $event) {
            console.log('sendProxyMailInboxMainDocumentFax : ', proxyMailInbox);
        };

        /**
         * @description Send SMS
         * @param proxyMailInbox
         * @param $event
         */
        self.sendProxyMailInboxSMS = function (proxyMailInbox, $event) {
            console.log('sendProxyMailInboxSMS : ', proxyMailInbox);
        };

        /**
         * @description Send Main Document As Attachment
         * @param proxyMailInbox
         * @param $event
         */
        self.sendProxyMailInboxMainDocumentAsAttachment = function (proxyMailInbox, $event) {
            console.log('sendProxyMailInboxMainDocumentAsAttachment : ', proxyMailInbox);
        };

        /**
         * @description Send Link
         * @param proxyMailInbox
         * @param $event
         */
        self.sendProxyMailInboxLink = function (proxyMailInbox, $event) {
            console.log('sendProxyMailInboxLink : ', proxyMailInbox);
        };

        /**
         * @description Sign Internal e-Signature
         * @param proxyMailInbox
         * @param $event
         */
        self.signProxyMailInboxESignature = function (proxyMailInbox, $event, defer) {
            proxyMailInboxService
                .controllerMethod
                .proxyMailInboxSignaturePopup(proxyMailInbox, $event)
                .then(function (result) {
                    if (result)
                        self.reloadProxyMailInboxes(self.grid.page)
                            .then(function () {
                                toast.success(langService.get('sign_specific_success').change({name: proxyMailInbox.getTranslatedName()}));
                                new ResolveDefer(defer);
                            });
                });
        };

        /**
         * @description Sign Digital Signature
         * @param proxyMailInbox
         * @param $event
         * @param defer
         */
        self.signProxyMailInboxDigitalSignature = function (proxyMailInbox, $event, defer) {
            console.log('signProxyMailInboxDigitalSignature : ', proxyMailInbox);
        };

        /**
         * @description Edit Content
         * @param proxyMailInbox
         * @param $event
         */
        self.editContent = function (proxyMailInbox, $event) {
            var info = proxyMailInbox.getInfo();
            managerService.manageDocumentContent(info.vsId, info.documentClass, info.title, $event);
        };



        /**
         * @description Edit Properties
         * @param proxyMailInbox
         * @param $event
         */
        self.editProperties = function (proxyMailInbox, $event) {
            //console.log('editProxyMailInboxProperties : ', proxyMailInbox);
            var info = proxyMailInbox.getInfo();
            managerService
                .manageDocumentProperties(info.vsId, info.documentClass, info.title, $event)
                .finally(function () {
                    self.reloadProxyMailInboxes(self.grid.page)
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
            return hasPermission;
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
         * @param proxyMailInbox
         * @param $event
         */
        self.viewDocument = function (proxyMailInbox, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(proxyMailInbox, self.gridActions, checkIfEditPropertiesAllowed(proxyMailInbox, true), checkIfEditCorrespondenceSiteAllowed(proxyMailInbox, true))
                .then(function () {
                    return self.reloadProxyMailInboxes(self.grid.page);
                })
                .catch(function () {
                    return self.reloadProxyMailInboxes(self.grid.page);
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
                callback: self.terminateProxyMailInbox,
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
                callback: self.forwardProxyMailInbox,
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            // Reply
            {
                type: 'action',
                icon: 'reply',
                text: 'grid_action_reply',
                shortcut: true,
                callback: self.replyProxyMailInbox,
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            // Get Link
            {
                type: 'action',
                icon: 'link',
                text: 'grid_action_get_link',
                shortcut: false,
                callback: self.getProxyMailInboxLink,
                class: "action-red",
                hide: true,
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
            // Export
            {
                type: 'action',
                icon: 'export',
                text: 'grid_action_export',
                shortcut: true,
                callback: self.exportProxyMailInbox,
                class: "action-yellow",
                showInView: false,
                checkShow: function (action, model) {
                    //addMethod = 0 (Electronic/Digital) - show the export button
                    //addMethod = 1 (Paper) - show the export button
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && info.isPaper && info.documentClass === "outgoing";
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
                        hide: true,
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
                        class: "action-red",
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
                submenu: [
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
                submenu: [
                    // Main Document
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_main_document',
                        shortcut: false,
                        callback: self.downloadMainDocument,
                        class: "action-yellow",
                        checkShow: self.checkToShowAction
                    },
                    // Composite Document
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_composite_document',
                        shortcut: false,
                        callback: self.downloadCompositeDocument,
                        class: "action-yellow",
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
                submenu: [
                    // Link To Document By Email
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_link_to_document_by_email',
                        shortcut: false,
                        callback: self.sendProxyMailInboxLinkToDocumentByEmail,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // Composite Document As Attachment By Email
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_composite_document_as_attachment_by_email',
                        shortcut: false,
                        callback: self.sendProxyMailInboxCompositeDocumentAsAttachmentByEmail,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // Composite Document
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_composite_document_as_attachment',
                        shortcut: false,
                        callback: self.sendProxyMailInboxCompositeDocumentAsAttachment,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // SMS
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'grid_action_send_sms',
                        shortcut: false,
                        callback: self.sendProxyMailInboxSMS,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // Main Document As Attachment
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_main_document_as_attachment',
                        shortcut: false,
                        callback: self.sendProxyMailInboxMainDocumentAsAttachment,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // Link
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_send_link',
                        shortcut: false,
                        callback: self.sendProxyMailInboxLink,
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
                    //addMethod = 0 (Electronic/Digital) - hide the button
                    //addMethod = 1 (Paper) - show the button

                    // If outgoing or internal, show the button

                    /*If document is unapproved or partially approved, show the button. If fully approved, hide the button.
                    24 is approved
                    */
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model)
                        && !info.isPaper
                        && (info.documentClass === "outgoing" || info.documentClass === 'internal')
                        && (model.generalStepElm.docStatus < 24);
                },
                submenu: [
                    // e-Signature
                    {
                        type: 'action',
                        //icon: 'link-variant',
                        text: 'grid_action_electronic',//e_signature
                        shortcut: false,
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
                        hasPermission = (employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES") || employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT"));
                    else if (info.documentClass === "incoming")
                        hasPermission = (employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES") || employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT"));
                    else if (info.documentClass === "outgoing")
                        hasPermission = (employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES") || employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
                    return self.checkToShowAction(action, model) && hasPermission;
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
                            return self.checkToShowAction(action, model) && hasPermission;
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
    });
};