module.exports = function (app) {
    app.controller('reviewOutgoingCtrl', function (lookupService,
                                                   reviewOutgoingService,
                                                   reviewOutgoings,
                                                   $q,
                                                   generator,
                                                   readyToExportService,
                                                   correspondenceService,
                                                   counterService,
                                                   langService,
                                                   toast,
                                                   dialog,
                                                   viewDocumentService,
                                                   employeeService,
                                                   managerService,
                                                   validationService,
                                                   $timeout,
                                                   viewTrackingSheetService,
                                                   contextHelpService,
                                                   distributionWFService,
                                                   distributionWorkflowService,
                                                   broadcastService,
                                                   ResolveDefer) {
        'ngInject';
        var self = this;

        self.controllerName = 'reviewOutgoingCtrl';
        self.currentEmployee = employeeService.getEmployee();
        self.progress = null;
        contextHelpService.setHelpTo('outgoing-review');
        // employee service to check the permission in html
        self.employeeService = employeeService;

        /**
         * @description All review outgoing emails
         * @type {*}
         */
        self.reviewOutgoings = reviewOutgoings;
        /**
         * @description Contains the selected review outgoing emails
         * @type {Array}
         */
        self.selectedReviewOutgoings = [];

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
                        return (self.reviewOutgoings.length + 21);
                    }
                }
            ]
        };

        /**
         * @description Contains methods for CRUD operations for review outgoing emails
         */
        self.statusServices = {
            'activate': reviewOutgoingService.activateBulkReviewOutgoings,
            'deactivate': reviewOutgoingService.deactivateBulkReviewOutgoings,
            'true': reviewOutgoingService.activateReviewOutgoing,
            'false': reviewOutgoingService.deactivateReviewOutgoing
        };

        /**
         * @description Replaces the record in grid after update
         * @param record
         */
        self.replaceRecord = function (record) {
            var index = _.findIndex(self.reviewOutgoings, {'id': record.id});
            if (index > -1)
                self.reviewOutgoings.splice(index, 1, record);
        };

        /**
         * @description Reload the grid of review outgoing email
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadReviewOutgoings = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return reviewOutgoingService
                .loadReviewOutgoings()
                .then(function (result) {
                    counterService.loadCounters();
                    self.reviewOutgoings = result;
                    self.selectedReviewOutgoings = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Remove single review outgoing email
         * @param reviewOutgoing
         * @param $event
         * @param defer
         */
        self.removeReviewOutgoing = function (reviewOutgoing, $event, defer) {
            reviewOutgoingService
                .controllerMethod
                .reviewOutgoingRemove(reviewOutgoing, $event)
                .then(function () {
                    self.reloadReviewOutgoings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Remove multiple selected review outgoing emails
         * @param $event
         */
        self.removeBulkReviewOutgoings = function ($event) {
            //console.log('remove review outgoing mails bulk : ', self.selectedReviewOutgoings);
            reviewOutgoingService
                .controllerMethod
                .reviewOutgoingRemoveBulk(self.selectedReviewOutgoings, $event)
                .then(function () {
                    self.reloadReviewOutgoings(self.grid.page);
                });
        };

        /**
         * @description Launch distribution workflow for selected review outgoing mails
         * @param $event
         */
        self.acceptAndLaunchDistributionWorkflowBulk = function ($event) {
            //console.log('accept and launch distribution workflow bulk : ', self.selectedReviewOutgoings);

            var contentNotExist = _.filter(self.selectedReviewOutgoings, function (reviewOutgoing) {
                return !reviewOutgoing.hasContent();
            });
            if (contentNotExist.length > 0) {
                dialog.alertMessage(langService.get("content_not_found_bulk"));
                return;
            }
            return correspondenceService
                .launchCorrespondenceWorkflow(self.selectedReviewOutgoings, $event, 'forward', 'favorites')
                .then(function () {
                    self.reloadReviewOutgoings(self.grid.page);
                });
        };

        /**
         * @description Accept for selected review outgoing mails
         * @param $event
         */
        self.acceptOutgoingBulk = function ($event) {
            console.log('accept review outgoing mails bulk : ', self.selectedReviewOutgoings);
            reviewOutgoingService
                .controllerMethod
                .reviewOutgoingAcceptBulk(self.selectedReviewOutgoings, $event)
                .then(function () {
                    self.reloadReviewOutgoings(self.grid.page);
                });
        };

        /**
         * @description Reject for selected review outgoing mails
         * @param $event
         */
        self.rejectOutgoingBulk = function ($event) {

            /*reviewOutgoingService
             .controllerMethod
             .reviewOutgoingRejectBulk(self.selectedReviewOutgoings, $event)
             .then(function () {
             self.reloadReviewOutgoings(self.grid.page);
             //self.replaceRecord(result);
             })
             .catch(function () {
             self.reloadReviewOutgoings(self.grid.page);
             //self.replaceRecord(result);
             });*/
            correspondenceService
                .returnBulkCorrespondences(self.selectedReviewOutgoings, $event)
                .then(function () {
                    self.reloadReviewOutgoings(self.grid.page);
                });
        };


        self.editProperties = function (reviewOutgoing, $event) {
            // properties to preserve from override.
            var properties = [
                'attachments',
                'linkedEntities',
                'documentComments',
                'linkedDocs',
                'sitesInfoTo',
                'sitesInfoCC'
            ];
            //console.log(reviewOutgoing);
            managerService
                .manageDocumentProperties(reviewOutgoing.vsId, reviewOutgoing.docClassName, reviewOutgoing.docSubject, $event)
                .then(function (document) {
                    reviewOutgoing = generator.preserveProperties(properties, reviewOutgoing, document);
                    self.reloadReviewOutgoings(self.grid.page);
                })
                .catch(function (document) {
                    reviewOutgoing = generator.preserveProperties(properties, reviewOutgoing, document);
                    self.reloadReviewOutgoings(self.grid.page);
                });
        };

        /**
         * @description Edit the outgoing content
         * @param reviewOutgoing
         * @param $event
         */
        self.editContent = function (reviewOutgoing, $event) {
            managerService.manageDocumentContent(reviewOutgoing.vsId, reviewOutgoing.docClassName, reviewOutgoing.docSubject, $event)
        };

        /**
         * @description Accept and launch distribution workflow
         * @param reviewOutgoing
         * @param $event
         * @param defer
         */
        self.acceptAndLaunchDistributionWorkflow = function (reviewOutgoing, $event, defer) {
            if (!reviewOutgoing.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }

            /*distributionWorkflowService
             .controllerMethod
             .distributionWorkflowSend(reviewOutgoing, false, false, null, "outgoing", $event)
             .then(function (result) {
             self.reloadReviewOutgoings(self.grid.page)
             .then(function () {
             new ResolveDefer(defer);
             });
             //self.replaceRecord(result);
             })
             .catch(function (result) {
             self.reloadReviewOutgoings(self.grid.page).then(function () {
             new ResolveDefer(defer);
             });
             //self.replaceRecord(result);
             });*/

            reviewOutgoing.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadReviewOutgoings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };
        /**
         * @description Reject the outgoing mail
         * @param reviewOutgoing
         * @param $event
         * @param defer
         */
        self.rejectOutgoing = function (reviewOutgoing, $event, defer) {
            /*reviewOutgoingService
             .controllerMethod
             .reviewOutgoingReject(reviewOutgoing, $event)
             .then(function (result) {
             self.reloadReviewOutgoings(self.grid.page)
             .then(function () {
             new ResolveDefer(defer);
             });
             })
             .catch(function (result) {
             self.reloadReviewOutgoings(self.grid.page);
             });*/
            reviewOutgoing.rejectDocument($event)
                .then(function () {
                    new ResolveDefer(defer);
                    self.reloadReviewOutgoings(self.grid.page);
                });
        };

        /**
         * @description Accept the review outgoing document
         * @param reviewOutgoing
         * @param $event
         * @param defer
         */
        self.acceptOutgoing = function (reviewOutgoing, $event, defer) {
            //console.log('accept outgoing : ', reviewOutgoing);
            reviewOutgoingService.controllerMethod
                .reviewOutgoingAccept(reviewOutgoing, $event)
                .then(function (result) {
                    self.reloadReviewOutgoings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description View Tracking Sheet
         * @param reviewOutgoing
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (reviewOutgoing, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(reviewOutgoing, params, $event).then(function (result) {

            });
        };

        /**
         * @description Manage Tags
         * @param reviewOutgoing
         * @param $event
         */
        self.manageTags = function (reviewOutgoing, $event) {
            managerService.manageDocumentTags(reviewOutgoing.vsId, reviewOutgoing.docClassName, reviewOutgoing.docSubject, $event)
                .then(function (tags) {
                    reviewOutgoing.tags = tags;
                })
                .catch(function (tags) {
                    reviewOutgoing.tags = tags;
                });
        };

        /**
         * @description Manage Comments
         * @param reviewOutgoing
         * @param $event
         */
        self.manageComments = function (reviewOutgoing, $event) {
            //console.log('manage comments');
            managerService.manageDocumentComments(reviewOutgoing.vsId, reviewOutgoing.docSubject, $event)
                .then(function (documentComments) {
                    reviewOutgoing.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    reviewOutgoing.documentComments = documentComments;
                });
        };

        /**
         * @description Manage Attachments
         * @param reviewOutgoing
         * @param $event
         */
        self.manageAttachments = function (reviewOutgoing, $event) {
            //console.log('manage attachments');
            managerService.manageDocumentAttachments(reviewOutgoing.vsId, reviewOutgoing.docClassName, reviewOutgoing.docSubject, $event)
                .then(function (attachments) {
                    reviewOutgoing.attachments = attachments;
                })
                .catch(function (attachments) {
                    reviewOutgoing.attachments = attachments;
                });
        };

        /**
         * @description Manage Entities
         * @param reviewOutgoing
         * @param $event
         */
        self.manageEntities = function (reviewOutgoing, $event) {
            //console.log('manage entities : ', reviewOutgoing);
            managerService
                .manageDocumentEntities(reviewOutgoing.vsId, reviewOutgoing.docClassName, reviewOutgoing.docSubject, $event);
        };

        /**
         * @description Manage Linked Documents
         * @param reviewOutgoing
         * @param $event
         */
        self.manageLinkedDocuments = function (reviewOutgoing, $event) {
            //console.log('manage linked documents : ', reviewOutgoing);
            var info = reviewOutgoing.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description Security
         * @param reviewOutgoing
         * @param $event
         */
        self.security = function (reviewOutgoing, $event) {
            console.log('manage security : ', reviewOutgoing);
        };

        /**
         * @description Destinations
         * @param reviewOutgoing
         * @param $event
         */
        self.manageDestinations = function (reviewOutgoing, $event) {
            //console.log('manage destinations : ', reviewOutgoing);
            //var info = reviewOutgoing.getInfo();
            managerService.manageDocumentCorrespondence(reviewOutgoing.vsId, reviewOutgoing.docClassName, reviewOutgoing.docSubject, $event);
        };

        /**
         * @description broadcast selected organization and workflow group
         * @param reviewOutgoing
         * @param $event
         * @param defer
         */
        self.broadcast = function (reviewOutgoing, $event, defer) {
            /*broadcastService
             .controllerMethod
             .broadcastSend(reviewOutgoing, $event)
             .then(function () {
             self.reloadReviewOutgoings(self.grid.page);
             })
             .catch(function () {
             self.reloadReviewOutgoings(self.grid.page);
             });*/
            reviewOutgoing
                .correspondenceBroadcast()
                .then(function () {
                    self.reloadReviewOutgoings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        })
                })
        };

        /**
         * @description Send To Ready To Export
         * @param model
         * @param $event
         * @param defer
         */
        self.sendToReadyToExport = function (model, $event, defer) {
            if (model.fromCentralArchive())
                return model.sendToCentralArchive().then(function () {
                    self.reloadReviewOutgoings(self.grid.page);
                    new ResolveDefer(defer);
                });

            model.sendToReadyToExport()
                .then(function () {
                    self.reloadReviewOutgoings(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('export_success'));
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * print Barcode
         * @param model
         * @param $event
         */
        self.printBarcode = function (model, $event) {
            model.barcodePrint(model, $event);
        };


        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var isEditAllowed = employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES");
            if (checkForViewPopup)
                return !isEditAllowed;
            return isEditAllowed;
        };

        /**
         * @description View document
         * @param reviewOutgoing
         * @param $event
         */
        self.viewDocument = function (reviewOutgoing, $event) {
            if (!reviewOutgoing.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(reviewOutgoing, self.gridActions, checkIfEditPropertiesAllowed(reviewOutgoing, true), false);
            return;
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
                subMenu: [
                    {
                        type: 'info',
                        checkShow: self.checkToShowAction,
                        gridName: 'outgoing-review'
                    }
                ],
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            {
                type: 'separator',
                checkShow: self.checkToShowAction,
                showInView: false
            },
            // Send To Ready To Export
            {
                type: 'action',
                icon: 'export',
                text: 'grid_action_send_to_ready_to_export',
                shortcut: true,
                callback: self.sendToReadyToExport,
                textCallback: function (model) {
                    return model.fromCentralArchive() ? 'grid_action_send_to_central_archive' : 'grid_action_send_to_ready_to_export';
                },
                class: "action-green",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && info.documentClass === 'outgoing' && model.hasContent() && info.isPaper;
                }
            },
            // Print Barcode
            {
                type: 'action',
                icon: 'barcode-scan',
                text: 'content_action_print_barcode',
                shortcut: true,
                callback: self.printBarcode,
                class: "action-green",
                permissionKey: "PRINT_BARCODE",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && (info.isPaper);
                }
            },
            // Remove
            {
                type: 'action',
                icon: 'delete',
                text: 'grid_action_remove',
                shortcut: false,
                callback: self.removeReviewOutgoing,
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            //Launch Distribution Workflow
            {
                type: 'action',
                icon: 'sitemap',
                text: 'grid_action_accept_launch_distribution_workflow',
                shortcut: true,
                callback: self.acceptAndLaunchDistributionWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
                checkShow: self.checkToShowAction
            },
            // Reject
            {
                type: 'action',
                icon: 'close',
                text: 'grid_action_reject',
                shortcut: true,
                callback: self.rejectOutgoing,
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            // Accept
            {
                type: 'action',
                icon: 'check',
                text: 'grid_action_accept',
                shortcut: true,
                callback: self.acceptOutgoing,
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
                    var hasPermission = (employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES") || employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
                    return self.checkToShowAction(action, model) && hasPermission;
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
                        permissionKey: "EDIT_OUTGOING_CONTENT",
                        checkShow: self.checkToShowAction
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
                        permissionKey: "EDIT_OUTGOING_PROPERTIES",
                        checkShow: self.checkToShowAction
                    }
                ]
            },
            // View Tracking Sheet
            {
                type: 'action',
                icon: 'eye',
                text: 'view_tracking_sheet',
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
                    // Entities
                    {
                        type: 'action',
                        icon: 'pencil-box-outline',
                        text: 'grid_action_entities',
                        shortcut: false,
                        callback: self.manageEntities,
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
                        //hide: true,
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
                        checkShow: self.checkToShowAction
                    }
                ]
            },
            // Security
            {
                type: 'action',
                icon: 'security',
                text: 'grid_action_security',
                shortcut: false,
                callback: self.security,
                class: "action-red",
                hide: true,
                checkShow: self.checkToShowAction
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
            },
            // Broadcast
            {
                type: 'action',
                icon: 'bullhorn',
                text: 'grid_action_broadcast',
                shortcut: false,
                //hide: true,
                class: 'action-green',
                callback: self.broadcast,
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && (model.addMethod || model.approvers !== null);
                }
            }
        ];
    });
};