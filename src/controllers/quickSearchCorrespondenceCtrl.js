module.exports = function (app) {
    app.controller('quickSearchCorrespondenceCtrl', function (lookupService,
                                                              quickSearchCorrespondenceService,
                                                              quickSearchCorrespondence,
                                                              ResolveDefer,
                                                              $q,
                                                              langService,
                                                              viewDocumentService,
                                                              toast,
                                                              managerService,
                                                              $stateParams,
                                                              viewTrackingSheetService,
                                                              downloadService,
                                                              employeeService,
                                                              correspondenceService) {
        'ngInject';
        var self = this;

        self.controllerName = 'quickSearchCorrespondenceCtrl';

        self.progress = null;

        /**
         * @description All Correspondence
         * @type {*}
         */
        self.quickSearchCorrespondence = quickSearchCorrespondence;

        /**
         * @description Contains the selected Correspondence
         * @type {Array}
         */
        self.selectedQuickSearchCorrespondence = [];

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
                    label: langService.get('all'),
                    value: function () {
                        return (self.quickSearchCorrespondence.length + 21);
                    }
                }
            ]
        };

        /**
         * @description Reload the grid of Correspondence
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadQuickSearchCorrespondence = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;

            var searchJSON = {};
            searchJSON[$stateParams.key] = $stateParams.q;

            return quickSearchCorrespondenceService
                .loadQuickSearchCorrespondence(searchJSON)
                .then(function (result) {
                    self.quickSearchCorrespondence = result;
                    self.selectedQuickSearchCorrespondence = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Export quick searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         * @type {[*]}
         */
        self.exportQuickSearchCorrespondence = function (searchedCorrespondenceDocument, $event) {
            quickSearchCorrespondenceService
                .exportQuickSearchCorrespondence(searchedCorrespondenceDocument, $event)
                .then(function (result) {
                    self.reloadQuickSearchCorrespondence(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('export_success'));
                        });
                });
        };

        /**
         * @description view tracking sheet for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (searchedCorrespondenceDocument, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(searchedCorrespondenceDocument, params, $event).then(function (result) {
            });
        };

        /**
         * @description manage tag for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.manageTags = function (searchedCorrespondenceDocument, $event) {
            managerService.manageDocumentTags(searchedCorrespondenceDocument.vsId, searchedCorrespondenceDocument.classDescription, searchedCorrespondenceDocument.docSubject, $event)
                .then(function (tags) {
                    searchedCorrespondenceDocument.tags = tags;
                })
                .catch(function (tags) {
                    searchedCorrespondenceDocument.tags = tags;
                });
        };

        /**
         * @description manage comments for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.manageComments = function (searchedCorrespondenceDocument, $event) {
            managerService.manageDocumentComments(searchedCorrespondenceDocument.vsId, searchedCorrespondenceDocument.docSubject, $event)
                .then(function (documentComments) {
                    searchedCorrespondenceDocument.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    searchedCorrespondenceDocument.documentComments = documentComments;
                });
        };

        /**
         * @description manage tasks for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.manageTasks = function (searchedCorrespondenceDocument, $event) {
            console.log('manage tasks for searched outgoing document : ', searchedCorrespondenceDocument);
        };

        /**
         * @description manage attachments for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.manageAttachments = function (searchedCorrespondenceDocument, $event) {
            managerService.manageDocumentAttachments(searchedCorrespondenceDocument.vsId, searchedCorrespondenceDocument.classDescription, searchedCorrespondenceDocument.docSubject, $event)
                .then(function (attachments) {
                    searchedCorrespondenceDocument = attachments;
                })
                .catch(function (attachments) {
                    searchedCorrespondenceDocument = attachments;
                });
        };

        /**
         * @description manage linked documents for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.manageLinkedDocuments = function (searchedCorrespondenceDocument, $event) {
            var info = searchedCorrespondenceDocument.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description manage linked entities for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.manageLinkedEntities = function (searchedCorrespondenceDocument, $event) {
            managerService
                .manageDocumentEntities(searchedCorrespondenceDocument.vsId, searchedCorrespondenceDocument.classDescription, searchedCorrespondenceDocument.docSubject, $event);
        };

        /**
         * @description download main document for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.downloadMainDocument = function (searchedCorrespondenceDocument, $event) {
            //console.log('download main document for searched outgoing document : ', searchedCorrespondenceDocument);
            downloadService.controllerMethod
                .mainDocumentDownload(searchedCorrespondenceDocument.vsId);
        };

        /**
         * @description download composite document for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.downloadCompositeDocument = function (searchedCorrespondenceDocument, $event) {
            //console.log('download composite document for searched outgoing document : ', searchedCorrespondenceDocument);
            downloadService.controllerMethod
                .compositeDocumentDownload(searchedCorrespondenceDocument.vsId);
        };

        /**
         * @description send link to document for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (searchedCorrespondenceDocument, $event) {
            console.log('send link to document for searched outgoing document : ', searchedCorrespondenceDocument);
        };

        /**
         * @description send composite document as attachment for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (searchedCorrespondenceDocument, $event) {
            console.log('send composite document as attachment for searched outgoing document : ', searchedCorrespondenceDocument);
        };

        /**
         * @description send composite document as attachment for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (searchedCorrespondenceDocument, $event) {
            console.log('send composite document as attachment for searched Correspondence document : ', searchedCorrespondenceDocument);
        };

        /**
         * @description send main document fax for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.sendMainDocumentFax = function (searchedCorrespondenceDocument, $event) {
            console.log('send main document fax for searched outgoing document : ', searchedCorrespondenceDocument);
        };

        /**
         * @description send sms for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.sendSMS = function (searchedCorrespondenceDocument, $event) {
            console.log('send sms for searched outgoing document : ', searchedCorrespondenceDocument);
        };

        /**
         * @description get link for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.getLink = function (searchedCorrespondenceDocument, $event) {
            console.log('get link for searched outgoing document : ', searchedCorrespondenceDocument);
        };

        /**
         * @description subscribe for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.subscribe = function (searchedCorrespondenceDocument, $event) {
            console.log('subscribe for searched outgoing document : ', searchedCorrespondenceDocument);
        };

        /**
         * @description create copy for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.createCopy = function (searchedCorrespondenceDocument, $event) {
            console.log('create copy for searched outgoing document : ', searchedCorrespondenceDocument);
        };

        /**
         * @description open document viewer
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.viewDocument = function (searchedCorrespondenceDocument, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            correspondenceService.viewCorrespondence(searchedCorrespondenceDocument, [], true, true);
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
         * @description do broadcast for correspondence.
         */
        self.doBroadcast = function (correspondence, $event, defer) {
            correspondence
                .correspondenceBroadcast()
                .then(function () {
                    self.reloadQuickSearchCorrespondence(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        })
                })
        };

        self.gridActions = [
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
            {
                type: 'separator',
                showInView: false,
                checkShow: self.checkToShowAction
            },
            // Export
            {
                type: 'action',
                icon: 'export',
                text: 'grid_action_export',
                shortcut: true,
                callback: self.exportQuickSearchCorrespondence,
                class: "action-yellow",
                checkShow: function (action, model) {
                    //If document is paper outgoing and unapproved/partially approved, show the button.
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && model.docStatus < 24 && info.isPaper && info.documentClass === "outgoing";
                }
            },
            //Open
            {
                type: 'action',
                icon: 'book-open-variant',
                text: 'grid_action_open',
                shortcut: false,
                callback: self.viewDocument,
                class: "action-green",
                showInView: false,
                permissionKey: 'VIEW_DOCUMENT',
                checkShow: function (action, model) {
                    //If no content or no view document permission, hide the button
                    return self.checkToShowAction(action, model) && model.hasContent();
                }
            },
            {
                type: 'action',
                icon: 'bullhorn',
                text: 'grid_action_broadcast',
                shortcut: false,
                hide: false,
                callback: self.doBroadcast,
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && !model.needApprove() || model.hasDocumentClass('incoming');
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
                    // Main Document Fax
                    {
                        type: 'action',
                        icon: 'fax',
                        text: 'grid_action_main_document_fax',
                        shortcut: false,
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
                callback: self.subscribe,
                class: "action-red",
                hide: true,
                checkShow: self.checkToShowAction
            },
            // Create Copy
            {
                type: 'action',
                icon: 'content-copy',
                text: 'grid_action_create_copy',
                shortcut: true,
                callback: self.createCopy,
                class: "action-red",
                hide: true,
                checkShow: self.checkToShowAction
            }
        ];
    });
};