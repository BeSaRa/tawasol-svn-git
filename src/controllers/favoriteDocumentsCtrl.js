module.exports = function (app) {
    app.controller('favoriteDocumentsCtrl', function (lookupService,
                                                      favoriteDocumentsService,
                                                      favoriteDocuments,
                                                      $q,
                                                      langService,
                                                      toast,
                                                      dialog,
                                                      contextHelpService,
                                                      employeeService,
                                                      viewDocumentService,
                                                      viewTrackingSheetService,
                                                      managerService,
                                                      distributionWorkflowService,
                                                      counterService,
                                                      ResolveDefer,
                                                      correspondenceService,
                                                      generator,
                                                      mailNotificationService) {
        'ngInject';
        var self = this;

        self.controllerName = 'favoriteDocumentsCtrl';
        contextHelpService.setHelpTo('favorite-documents');
        self.progress = null;

        /**
         * @description All favorite documents
         * @type {*}
         */
        self.favoriteDocuments = favoriteDocuments;
        self.favoriteDocumentsService = favoriteDocumentsService;

        /**
         * @description Contains the selected favorite documents
         * @type {Array}
         */
        self.selectedFavoriteDocuments = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (favoriteDocumentsService.totalCount + 21);
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
        self.getSortingKey = function(property, modelType){
            return generator.getColumnSortingKey(property, modelType);
        };

        /**
         * @description Reload the grid of favorite document
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadFavoriteDocuments = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return favoriteDocumentsService
                .loadFavoriteDocuments(self.grid.page, self.grid.limit)
                .then(function (result) {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.favoriteDocuments = result;

                    self.selectedFavoriteDocuments = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Remove the document from favorite documents
         * @param favoriteDocument
         * @param $event
         * @param defer
         */
        self.removeFavoriteDocument = function (favoriteDocument, $event, defer) {
            favoriteDocument.removeFromFavorite().then(function () {
                self.reloadFavoriteDocuments(self.grid.page);
                new ResolveDefer(defer);
            });
        };

        /**
         * @description Remove bulk documents from favorite documents
         * @param $event
         */
        self.removeBulkFavoriteDocuments = function ($event) {
            correspondenceService
                .deleteBulkCorrespondenceFromFavorite(self.selectedFavoriteDocuments)
                .then(function () {
                    self.reloadFavoriteDocuments(self.grid.page);
                });
        };

        /**
         * @description Edit Content
         * @param favoriteDocument
         * @param $event
         */
        self.editContent = function (favoriteDocument, $event) {
            var info = favoriteDocument.getInfo();
            managerService.manageDocumentContent(info.vsId, info.documentClass, info.title, $event);
        };

        /**
         * @description Edit Properties
         * @param favoriteDocument
         * @param $event
         */
        self.editProperties = function (favoriteDocument, $event) {
            var info = favoriteDocument.getInfo();
            managerService
                .manageDocumentProperties(info.vsId, info.documentClass, info.title, $event)
                .finally(function () {
                    self.reloadFavoriteDocuments(self.grid.page)
                });
        };

        /**
         * @description Launch distribution workflow for favorite document
         * @param favoriteDocument
         * @param $event
         * @param defer
         */
        self.launchDistributionWorkflow = function (favoriteDocument, $event, defer) {
            if (!favoriteDocument.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }

            /*distributionWorkflowService
             .controllerMethod
             .distributionWorkflowSend(favoriteDocument, false, false, null, favoriteDocument.classDescription.toLowerCase(), $event)
             .then(function (result) {
             self.reloadFavoriteDocuments(self.grid.page)
             .then(function () {
             new ResolveDefer(defer);
             });
             //self.replaceRecord(result);
             })
             .catch(function (result) {
             self.reloadFavoriteDocuments(self.grid.page);
             //self.replaceRecord(result);
             });*/
            favoriteDocument.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadFavoriteDocuments(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                });

        };

        /**
         * @description View Tracking Sheet
         * @param favoriteDocument
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (favoriteDocument, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(favoriteDocument, params, $event).then(function (result) {
            });
        };

        /**
         * @description Manage document tags for favorite document
         * @param favoriteDocument
         * @param $event
         */
        self.manageTags = function (favoriteDocument, $event) {
            managerService.manageDocumentTags(favoriteDocument.vsId, favoriteDocument.classDescription, favoriteDocument.docSubject, $event)
                .then(function (tags) {
                    favoriteDocument.tags = tags;
                })
                .catch(function (tags) {
                    favoriteDocument.tags = tags;
                });
        };

        /**
         * @description Manage document comments for favorite document
         * @param favoriteDocument
         * @param $event
         */
        self.manageComments = function (favoriteDocument, $event) {
            managerService.manageDocumentComments(favoriteDocument.vsId, favoriteDocument.docSubject, $event)
                .then(function (documentComments) {
                    favoriteDocument.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    favoriteDocument.documentComments = documentComments;
                });
        };

        /**
         * @description Manage document attachments for favorite document
         * @param favoriteDocument
         * @param $event
         */
        self.manageAttachments = function (favoriteDocument, $event) {
            favoriteDocument.manageDocumentAttachments($event);
        };

        /**
         * @description Manage Linked Entities
         * @param favoriteDocument
         * @param $event
         */
        self.manageLinkedEntities = function (favoriteDocument, $event) {
            managerService
                .manageDocumentEntities(favoriteDocument.vsId, favoriteDocument.classDescription, favoriteDocument.docSubject, $event);
        };

        /**
         * @description Manage linked documents for favorite document
         * @param favoriteDocument
         * @param $event
         */
        self.manageLinkedDocuments = function (favoriteDocument, $event) {
            var info = favoriteDocument.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
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

        /**
         * @description Preview document
         * @param favoriteDocument
         * @param $event
         */
        self.previewDocument = function (favoriteDocument, $event) {
            if (!favoriteDocument.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(favoriteDocument, self.gridActions, checkIfEditPropertiesAllowed(favoriteDocument, true), true)
                .then(function () {
                    return self.reloadFavoriteDocuments(self.grid.page);
                })
                .catch(function () {
                    return self.reloadFavoriteDocuments(self.grid.page);
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
            correspondence.viewFavoriteDocument(self.gridActions, 'favoriteDocument', $event)
                .then(function () {
                    return self.reloadFavoriteDocuments(self.grid.page);
                })
                .catch(function () {
                    return self.reloadFavoriteDocuments(self.grid.page);
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
                        gridName: 'favorite-documents'
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
                shortcut: false,
                callback: self.previewDocument,
                class: "action-green",
                showInView: false,
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
            // Remove
            {
                type: 'action',
                icon: 'delete',
                text: 'grid_action_remove_from_favorite',
                shortcut: true,
                callback: self.removeFavoriteDocument,
                class: "action-green",
                checkShow: self.checkToShowAction
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
                    return self.checkToShowAction(action, model) && hasPermission && info.docStatus < 24;
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
                            /*var info = model.getInfo();
                             var hasPermission = false;
                             if (info.documentClass === "internal")
                             hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES");
                             else if (info.documentClass === "incoming")
                             hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES");
                             else if (info.documentClass === "outgoing")
                             hasPermission = employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES");
                             return self.checkToShowAction(action, model) && hasPermission;*/
                            return self.checkToShowAction(action, model) && checkIfEditPropertiesAllowed(model);
                        }
                    }
                ]
            },
            // Send To Review
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_send_to_review',
                shortcut: true,
                hide: true,
                callback: self.sendFavoriteDocumentToReview,
                class: "action-red",
                checkShow: self.checkToShowAction
            },
            // Launch Distribution Workflow
            {
                type: 'action',
                icon: 'sitemap',
                text: 'grid_action_launch_distribution_workflow',
                shortcut: true,
                callback: self.launchDistributionWorkflow,
                class: "action-red",
                hide: true, /* Launch Distribution is not clear, so need to be discussed with Mr. Abu Al Nassr*/
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
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
                permissionKey : [
                    "MANAGE_DOCUMENT’S_TAGS",
                    "MANAGE_DOCUMENT’S_COMMENTS",
                    "MANAGE_ATTACHMENTS",
                    "", // Linked Entities permission not available in database
                    "MANAGE_LINKED_DOCUMENTS"
                ],
                checkAnyPermission:true,
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
                        permissionKey:"MANAGE_LINKED_DOCUMENTS",
                        callback: self.manageLinkedDocuments,
                        class: "action-green",
                        //hide: true,
                        checkShow: self.checkToShowAction
                    },
                    /*{
                     type: 'action',
                     icon: 'stop',
                     text: 'grid_action_destinations',
                     shortcut: false,
                     callback: self.manageDestinations,
                     permissionKey: "MANAGE_DESTINATIONS",
                     class: "action-red",
                     hide: true,
                     checkShow: self.checkToShowAction
                     }*/
                ]
            },
            // Open
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
            }
        ];


    });
};