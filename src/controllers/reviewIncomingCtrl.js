module.exports = function (app) {
    app.controller('reviewIncomingCtrl', function (lookupService,
                                                   reviewIncomingService,
                                                   reviewIncomings,
                                                   $q,
                                                   generator,
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
                                                   distributionWorkflowService,
                                                   broadcastService,
                                                   correspondenceService,
                                                   ResolveDefer) {
        'ngInject';
        var self = this;

        self.controllerName = 'reviewIncomingCtrl';
        self.currentEmployee = employeeService.getEmployee();
        self.progress = null;
        contextHelpService.setHelpTo('incoming-review');
        // employee service to check the permission in html
        self.employeeService = employeeService;

        /**
         * @description All review incoming emails
         * @type {*}
         */
        self.reviewIncomings = reviewIncomings;

        /**
         * @description Contains the selected review incoming emails
         * @type {Array}
         */
        self.selectedReviewIncomings = [];

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
                        return (self.reviewIncomings.length + 21);
                    }
                }
            ]
        };

        /**
         * @description Contains methods for CRUD operations for review incoming emails
         */
        self.statusServices = {
            'activate': reviewIncomingService.activateBulkReviewIncomings,
            'deactivate': reviewIncomingService.deactivateBulkReviewIncomings,
            'true': reviewIncomingService.activateReviewIncoming,
            'false': reviewIncomingService.deactivateReviewIncoming
        };

        /* /!**
          * @description Opens dialog for add new review incoming email
          * @param $event
          *!/
         self.openAddReviewIncomingDialog = function ($event) {
             reviewIncomingService
                 .controllerMethod
                 .reviewIncomingAdd($event)
                 .then(function (result) {
                     self.reloadReviewIncomings(self.grid.page)
                         .then(function () {
                             toast.success(langService.get('add_success').change({name: result.getNames()}));
                         });
                 });
         };

         /!**
          * @description Opens dialog for edit review incoming email
          * @param $event
          * @param reviewIncoming
          *!/
         self.openEditReviewIncomingDialog = function (reviewIncoming, $event) {
             reviewIncomingService
                 .controllerMethod
                 .reviewIncomingEdit(reviewIncoming, $event)
                 .then(function (result) {
                     self.reloadReviewIncomings(self.grid.page)
                         .then(function () {
                             toast.success(langService.get('edit_success').change({name: result.getNames()}));
                         });
                 });
         };*/

        /**
         * @description Replaces the record in grid after update
         * @param record
         */
        self.replaceRecord = function (record) {
            var index = _.findIndex(self.reviewIncomings, {'id': record.id});
            if (index > -1)
                self.reviewIncomings.splice(index, 1, record);
        };

        /**
         * @description Reload the grid of review incoming email
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadReviewIncomings = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return reviewIncomingService
                .loadReviewIncomings()
                .then(function (result) {
                    counterService.loadCounters();
                    self.reviewIncomings = result;
                    self.selectedReviewIncomings = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Remove single review incoming email
         * @param reviewIncoming
         * @param $event
         * @param defer
         */
        self.removeReviewIncoming = function (reviewIncoming, $event, defer) {
            //console.log('remove review incoming mail : ', reviewIncoming);
            reviewIncomingService
                .controllerMethod
                .reviewIncomingRemove(reviewIncoming, $event)
                .then(function () {
                    self.reloadReviewIncomings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Remove multiple selected review incoming emails
         * @param $event
         */
        self.removeBulkReviewIncomings = function ($event) {
            //console.log('remove review incoming mails bulk : ', self.selectedReviewIncomings);
            reviewIncomingService
                .controllerMethod
                .reviewIncomingRemoveBulk(self.selectedReviewIncomings, $event)
                .then(function () {
                    self.reloadReviewIncomings(self.grid.page);
                });
        };

        /**
         * @description Change the status of review incoming email
         * @param reviewIncoming
         */
        self.changeStatusReviewIncoming = function (reviewIncoming) {
            self.statusServices[reviewIncoming.status](reviewIncoming)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    reviewIncoming.status = !reviewIncoming.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected review incoming emails
         * @param status
         */
        self.changeStatusBulkReviewIncomings = function (status) {
            self.statusServices[status](self.selectedReviewIncomings)
                .then(function () {
                    self.reloadReviewIncomings(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('selected_status_updated'));
                        });
                });
        };

        /**
         * @description Launch distribution workflow for selected review incoming mails
         * @param $event
         */
        self.acceptAndLaunchDistributionWorkflowBulk = function ($event) {
            console.log('accept and launch distribution workflow bulk : ', self.selectedReviewIncomings);

            var contentNotExist = _.filter(self.selectedReviewIncomings, function (reviewIncoming) {
                return !reviewIncoming.hasContent();
            });
            if (contentNotExist.length > 0) {
                dialog.alertMessage(langService.get("content_not_found_bulk"));
                return;
            }

            distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSendBulk(self.selectedReviewIncomings, "incoming", $event)
                .then(function () {
                    self.reloadReviewIncomings(self.grid.page);
                })
                .catch(function () {
                    self.reloadReviewIncomings(self.grid.page);
                });

        };

        /**
         * @description Accept for selected review incoming mails
         * @param $event
         */
        self.acceptIncomingBulk = function ($event) {
            console.log('accept review incoming mails bulk : ', self.selectedReviewIncomings);
            reviewIncomingService
                .controllerMethod
                .reviewIncomingAcceptBulk(self.selectedReviewIncomings, $event)
                .then(function () {
                    self.reloadReviewIncomings(self.grid.page);
                });
        };

        /**
         * @description Reject for selected review incoming mails
         * @param $event
         */
        self.rejectIncomingBulk = function ($event) {
            console.log('reject review incoming mails bulk : ', self.selectedReviewIncomings);
            reviewIncomingService
                .controllerMethod
                .reviewIncomingRejectBulk(self.selectedReviewIncomings, $event)
                .then(function (result) {
                    self.reloadReviewIncomings(self.grid.page);
                    //self.replaceRecord(result);
                })
                .catch(function (result) {
                    self.reloadReviewIncomings(self.grid.page);
                    //self.replaceRecord(result);
                });
        };


        self.editProperties = function (reviewIncoming, $event) {
            // properties to preserve from override.
            var properties = [
                'attachments',
                'linkedEntities',
                'documentComments',
                'linkedDocs',
                'sitesInfoTo',
                'sitesInfoCC'
            ];

            managerService
                .manageDocumentProperties(reviewIncoming.vsId, reviewIncoming.docClassName, reviewIncoming.docSubject, $event)
                .then(function (document) {
                    reviewIncoming = generator.preserveProperties(properties, reviewIncoming, document);
                    self.reloadReviewIncomings(self.grid.page);
                })
                .catch(function (document) {
                    reviewIncoming = generator.preserveProperties(properties, reviewIncoming, document);
                    self.reloadReviewIncomings(self.grid.page);
                });
        };

        /**
         * @description Edit the outgoing content
         * @param reviewIncoming
         * @param $event
         */
        self.editContent = function (reviewIncoming, $event) {
            managerService.manageDocumentContent(reviewIncoming.vsId, reviewIncoming.docClassName, reviewIncoming.docSubject, $event)
        };

        /**
         * @description Accept and Launch Distribution Workflow
         * @param reviewIncoming
         * @param $event
         * @param defer
         */
        self.acceptAndLaunchDistributionWorkflow = function (reviewIncoming, $event, defer) {
            //console.log('accept and launch distribution workflow');

            if (!reviewIncoming.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }

            distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSend(reviewIncoming, false, false, null, "incoming", $event)
                .then(function (result) {
                    self.reloadReviewIncomings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                    //self.replaceRecord(result);
                })
                .catch(function (result) {
                    self.reloadReviewIncomings(self.grid.page);
                    //self.replaceRecord(result);
                });
        };
        /**
         * @description Reject the incoming mail
         * @param reviewIncoming
         * @param $event
         * @param defer
         */
        self.rejectIncoming = function (reviewIncoming, $event, defer) {
            //console.log('reject incoming');
            reviewIncomingService
                .controllerMethod
                .reviewIncomingReject(reviewIncoming, $event)
                .then(function (result) {
                    self.reloadReviewIncomings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                    //self.replaceRecord(result);
                })
                .catch(function (result) {
                    self.reloadReviewIncomings(self.grid.page);
                    //self.replaceRecord(result);
                });
        };

        /**
         * @description Accept the review incoming document
         * @param reviewIncoming
         * @param $event
         * @param defer
         */
        self.acceptIncoming = function (reviewIncoming, $event, defer) {
            //console.log('accept incoming : ', reviewIncoming);
            reviewIncomingService.controllerMethod
                .reviewIncomingAccept(reviewIncoming, $event)
                .then(function (result) {
                    self.reloadReviewIncomings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description View Tracking Sheet
         * @param reviewIncoming
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (reviewIncoming, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(reviewIncoming, params, $event).then(function (result) {

            });
        };

        /**
         * @description Manage Tags
         * @param reviewIncoming
         * @param $event
         */
        self.manageTags = function (reviewIncoming, $event) {
            managerService.manageDocumentTags(reviewIncoming.vsId, reviewIncoming.docClassName, reviewIncoming.docSubject, $event)
                .then(function (tags) {
                    reviewIncoming.tags = tags;
                })
                .catch(function (tags) {
                    reviewIncoming.tags = tags;
                });
        };

        /**
         * @description Manage Comments
         * @param reviewIncoming
         * @param $event
         */
        self.manageComments = function (reviewIncoming, $event) {
            //console.log('manage comments');
            managerService.manageDocumentComments(reviewIncoming.vsId, reviewIncoming.docSubject, $event)
                .then(function (documentComments) {
                    reviewIncoming.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    reviewIncoming.documentComments = documentComments;
                });
        };

        /**
         * @description Manage Attachments
         * @param reviewIncoming
         * @param $event
         */
        self.manageAttachments = function (reviewIncoming, $event) {
            //console.log('manage attachments');
            managerService.manageDocumentAttachments(reviewIncoming.vsId, reviewIncoming.docClassName, reviewIncoming.docSubject, $event)
                .then(function (attachments) {
                    reviewIncoming.attachments = attachments;
                })
                .catch(function (attachments) {
                    reviewIncoming.attachments = attachments;
                });
        };

        /**
         * @description Manage Entities
         * @param reviewIncoming
         * @param $event
         */
        self.manageEntities = function (reviewIncoming, $event) {
            //console.log('manage entities : ', reviewIncoming);
            managerService
                .manageDocumentEntities(reviewIncoming.vsId, reviewIncoming.docClassName, reviewIncoming.docSubject, $event);
        };

        /**
         * @description Manage Linked Documents
         * @param reviewIncoming
         * @param $event
         */
        self.manageLinkedDocuments = function (reviewIncoming, $event) {
            //console.log('manage linked documents : ', reviewIncoming);
            var info = reviewIncoming.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description Security
         * @param reviewIncoming
         * @param $event
         */
        self.security = function (reviewIncoming, $event) {
            console.log('manage security : ', reviewIncoming);
        };

        /**
         * @description Destinations
         * @param reviewIncoming
         * @param $event
         */
        self.manageDestinations = function (reviewIncoming, $event) {
            //console.log('manage destinations : ', reviewIncoming);
            managerService.manageDocumentCorrespondence(reviewIncoming.vsId, reviewIncoming.docClassName, reviewIncoming.docSubject, $event)
        };

        /**
         * @description Open
         * @param reviewIncoming
         * @param $event
         */
        self.openIncoming = function (reviewIncoming, $event) {
            if (!reviewIncoming.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(reviewIncoming, self.gridActions);
            return;
        };

        /**
         * @description broadcast selected organization and workflow group
         * @param reviewIncoming
         * @param $event
         */
        self.broadcast = function (reviewIncoming, $event) {
            broadcastService
                .controllerMethod
                .broadcastSend(reviewIncoming, $event)
                .then(function () {
                    self.reloadReviewIncomings(self.grid.page);
                })
                .catch(function () {
                    self.reloadReviewIncomings(self.grid.page);
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
                checkShow: self.checkToShowAction,
                showInView: false
            },
            // Remove Incoming
            {
                type: 'action',
                icon: 'delete',
                text: 'grid_action_remove',
                shortcut: false,
                callback: self.removeReviewIncoming,
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            // Accept and Launch Distribution Workflow
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
                callback: self.rejectIncoming,
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            // Accept
            {
                type: 'action',
                icon: 'check',
                text: 'grid_action_accept',
                shortcut: true,
                callback: self.acceptIncoming,
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
                    var hasPermission = (employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES")|| employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT"));
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
                        permissionKey: "EDIT_INCOMING’S_CONTENT",
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
                        permissionKey: "EDIT_INCOMING’S_PROPERTIES",
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
                callback: self.openIncoming,
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
                icon: 'send',
                text: 'grid_action_broadcast',
                shortcut: false,
                hide: true,
                callback: self.broadcast,
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && (model.addMethod || model.approvers !== null);
                }
            }
        ];

        /**
         * @description View document
         * @param reviewIncoming
         * @param $event
         */
        self.viewDocument = function (reviewIncoming, $event) {
            console.log('reviewIncoming', reviewIncoming);
            if (!reviewIncoming.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(reviewIncoming, self.gridActions);
            return;
        };


        /*/!**
         * @description Change the globalization of review incoming email
         * @param reviewIncoming
         *!/
         self.changeGlobalReviewIncoming = function (reviewIncoming) {
         if (reviewIncoming.isGlobal) {
         reviewIncomingService.updateReviewIncoming(reviewIncoming)
         .then(function () {
         toast.success(langService.get('globalization_success'));
         })
         .catch(function () {
         reviewIncoming.global = !reviewIncoming.global;
         dialog.errorMessage(langService.get('something_happened_when_update_global'));
         });
         }
         else {
         console.log("Open the popup to add relation entities");
         }
         };*/
    });
};