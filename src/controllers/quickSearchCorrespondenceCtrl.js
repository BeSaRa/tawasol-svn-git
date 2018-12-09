module.exports = function (app) {
    app.controller('quickSearchCorrespondenceCtrl', function (lookupService,
                                                              quickSearchCorrespondenceService,
                                                              quickSearchCorrespondence,
                                                              ResolveDefer,
                                                              $q,
                                                              _,
                                                              $state,
                                                              $filter,
                                                              dialog,
                                                              langService,
                                                              viewDocumentService,
                                                              toast,
                                                              managerService,
                                                              $stateParams,
                                                              viewTrackingSheetService,
                                                              downloadService,
                                                              employeeService,
                                                              correspondenceService,
                                                              favoriteDocumentsService,
                                                              mailNotificationService,
                                                              generator,
                                                              gridService) {
        'ngInject';
        var self = this;

        self.controllerName = 'quickSearchCorrespondenceCtrl';

        self.progress = null;

        /**
         * @description All Correspondence
         * @type {*}
         */
        self.quickSearchCorrespondence = _mapResultToAvoidCorrespondenceCheck(quickSearchCorrespondence);

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
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.search.quick) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.search.quick, self.quickSearchCorrespondence),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.search.quick, limit);
            }
        };

        function _mapResultToAvoidCorrespondenceCheck(result) {
            return _.map(result, function (item) {
                switch (item.classDescription.toLowerCase()) {
                    case 'outgoing' :
                        item.sitesInfoTo = [true];
                        break;
                    case 'incoming':
                        item.mainSiteId = true;
                        break;
                }
                return item;
            });
        }

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
            self.quickSearchCorrespondence = $filter('orderBy')(self.quickSearchCorrespondence, self.grid.order);
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
                    self.quickSearchCorrespondence = _mapResultToAvoidCorrespondenceCheck(result);
                    self.selectedQuickSearchCorrespondence = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };


        /**
         * @description add an item to the favorite documents
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.addToFavorite = function (searchedCorrespondenceDocument, $event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAdd(searchedCorrespondenceDocument.getInfo().vsId, $event)
                .then(function (result) {
                    if (result.status) {
                        toast.success(langService.get("add_to_favorite_specific_success").change({
                            name: searchedCorrespondenceDocument.getTranslatedName()
                        }));
                    }
                    else {
                        dialog.alertMessage(langService.get(result.message));
                    }
                });
        };

        /* /!**
          * @description Export quick searched Correspondence document
          * @param searchedCorrespondenceDocument
          * @param $event
          * @type {[*]}
          *!/
         self.exportQuickSearchCorrespondence = function (searchedCorrespondenceDocument, $event) {
             quickSearchCorrespondenceService
                 .exportQuickSearchCorrespondence(searchedCorrespondenceDocument, $event)
                 .then(function (result) {
                     self.reloadQuickSearchCorrespondence(self.grid.page)
                         .then(function () {
                             toast.success(langService.get('export_success'));
                         });
                 });
         };*/

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
         * @description Print Barcode
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.printBarcode = function (searchedCorrespondenceDocument, $event) {
            searchedCorrespondenceDocument.barcodePrint($event);
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
            searchedCorrespondenceDocument.manageDocumentAttachments($event);
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
         * @description Manage Linked Entities
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
            downloadService.getMainDocumentEmailContent(searchedCorrespondenceDocument.getInfo().vsId);
        };

        /**
         * @description send composite document as attachment for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (searchedCorrespondenceDocument, $event) {
            downloadService.getCompositeDocumentEmailContent(searchedCorrespondenceDocument.getInfo().vsId);
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
            viewDocumentService.loadDocumentViewUrlWithOutEdit(searchedCorrespondenceDocument.vsId).then(function (result) {
                //var docLink = "<a target='_blank' href='" + result + "'>" + result + "</a>";
                dialog.successMessage(langService.get('link_message').change({result: result}));
                return true;
            });
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
         * @description Preview document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.previewDocument = function (searchedCorrespondenceDocument, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            correspondenceService.viewCorrespondence(searchedCorrespondenceDocument, self.gridActions, true, true)
                .then(function () {
                    return self.reloadQuickSearchCorrespondence(self.grid.page);
                })
                .catch(function () {
                    return self.reloadQuickSearchCorrespondence(self.grid.page);
                });
        };

        /**
         * @description View document
         * @param correspondence
         * @param $event
         */
        self.viewDocument = function (correspondence, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondence.viewFromQueue(self.gridActions, 'quickSearch', $event)
                .then(function () {
                    return self.reloadQuickSearchCorrespondence(self.grid.page);
                })
                .catch(function (error) {
                    return self.reloadQuickSearchCorrespondence(self.grid.page);
                });
        };

        /**
         * @description get document versions
         * @param correspondence
         * @param $event
         * @return {*}
         */
        self.getDocumentVersions = function (correspondence, $event) {
            return correspondence
                .viewSpecificVersion(self.gridActions, $event);
        };
        /**
         * @description duplicate current version
         * @param correspondence
         * @param $event
         */
        self.duplicateCurrentVersion = function (correspondence, $event) {
            var info = correspondence.getInfo();
            return correspondence
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
         * @param correspondence
         * @param $event
         * @return {*}
         */
        self.duplicateVersion = function (correspondence, $event) {
            var info = correspondence.getInfo();
            return correspondence
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

        /**
         * @description do broadcast for correspondence.
         */
        self.broadcast = function (correspondence, $event, defer) {
            correspondence
                .correspondenceBroadcast()
                .then(function () {
                    self.reloadQuickSearchCorrespondence(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        })
                })
        };

        /**
         * @description Create Reply
         * @param correspondence
         * @param $event
         */
        self.createReplyIncoming = function (correspondence, $event) {
            var info = correspondence.getInfo();
            dialog.hide();
            $state.go('app.outgoing.add', {vsId: info.vsId, action: 'reply'});
        };


        self.launchDistributionWorkflow = function (correspondence, $event, defer) {
            if (!correspondence.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }

            correspondence.launchWorkFlowAndCheckExists($event, null, 'favorites')
                .then(function () {
                    self.reloadQuickSearchCorrespondence(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                });
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
                        gridName: 'search-quick'
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
                showInView: false,
                shortcut: true,
                callback: self.previewDocument,
                class: "action-green",
                permissionKey: 'VIEW_DOCUMENT',
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
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && info.docStatus >= 22;
                }
            },
            // Export /*NOT NEEDED AS DISCUSSED WITH HUSSAM*/
            /* {
                 type: 'action',
                 icon: 'export',
                 text: 'grid_action_export',
                 shortcut: true,
                 callback: self.exportQuickSearchCorrespondence,
                 class: "action-green",
                 checkShow: function (action, model) {
                     //If document is paper outgoing and unapproved/partially approved, show the button.
                     var info = model.getInfo();
                     return self.checkToShowAction(action, model) && model.docStatus < 24 && info.isPaper && info.documentClass === "outgoing";
                 }
             },*/
            // Launch Distribution Workflow
            {
                type: 'action',
                icon: 'sitemap',
                text: 'grid_action_launch_distribution_workflow',
                shortcut: true,
                callback: self.launchDistributionWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model)
                        && (info.isPaper || (!info.isPaper && info.docStatus >= 24));
                }
            },
            // Open
            {
                type: 'action',
                icon: 'book-open-page-variant',
                text: 'grid_action_open',
                showInView: false,
                shortcut: true,
                callback: self.viewDocument,
                class: "action-green",
                permissionKey: 'VIEW_DOCUMENT',
                checkShow: function (action, model) {
                    //If no content or no view document permission, hide the button
                    return self.checkToShowAction(action, model) && model.hasContent();
                }
            },
            // Create Reply
            {
                type: 'action',
                icon: 'pen',
                text: 'grid_action_create_reply',
                callback: self.createReplyIncoming,
                class: "action-green",
                permissionKey: 'CREATE_REPLY',
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && info.documentClass === "incoming" && !model.isBroadcasted();
                }
            },
            // Broadcast
            {
                type: 'action',
                icon: 'bullhorn',
                text: 'grid_action_broadcast',
                shortcut: false,
                hide: false,
                permissionKey: 'BROADCAST_DOCUMENT',
                callback: self.broadcast,
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && (!model.needApprove() || model.hasDocumentClass('incoming')) && (model.getSecurityLevelLookup().lookupKey !== 4);
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
            // Print Barcode
            {
                type: 'action',
                icon: 'barcode-scan',
                text: 'grid_action_print_barcode',
                callback: self.printBarcode,
                class: "action-green",
                permissionKey: 'PRINT_BARCODE',
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model)
                        && (info.documentClass === "incoming" || ((info.documentClass === "outgoing" || info.documentClass === 'internal') && (!model.needApprove() || info.isPaper)));
                }
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
                    ""// Composite Document
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
                    // Main Document Fax
                    {
                        type: 'action',
                        icon: 'fax',
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
            },
            // show versions
            {
                type: 'action',
                icon: 'animation',
                text: 'grid_action_view_specific_version',
                shortcut: false,
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
                callback: self.duplicateCurrentVersion,
                class: "action-green",
                permissionKey: 'DUPLICATE_BOOK_CURRENT',
                showInView: true,
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && (info.documentClass === 'outgoing' || info.documentClass === 'internal') && !info.isPaper;
                }
            },
            // duplicate specific version
            {
                type: 'action',
                icon: 'content-duplicate',
                text: 'grid_action_duplication_specific_version',
                shortcut: false,
                callback: self.duplicateVersion,
                class: "action-green",
                showInView: true,
                permissionKey: 'DUPLICATE_BOOK_FROM_VERSION',
                checkShow: self.checkToShowAction
            }
        ];
    });
};