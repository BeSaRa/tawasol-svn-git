module.exports = function (app) {
    app.controller('draftOutgoingCtrl', function (lookupService,
                                                  draftOutgoingService,
                                                  draftOutgoings,
                                                  $q,
                                                  langService,
                                                  generator,
                                                  toast,
                                                  counterService,
                                                  dialog,
                                                  viewDocumentService,
                                                  //outgoingService,
                                                  managerService,
                                                  validationService,
                                                  employeeService,
                                                  $timeout,
                                                  viewTrackingSheetService,
                                                  contextHelpService,
                                                  distributionWorkflowService,
                                                  broadcastService,
                                                  ResolveDefer,
                                                  correspondenceService,
                                                  mailNotificationService) {
            'ngInject';
            var self = this;

            self.controllerName = 'draftOutgoingCtrl';
            self.currentEmployee = employeeService.getEmployee();
            self.progress = null;
            contextHelpService.setHelpTo('outgoing-draft');
            // employee service to check the permission in html
            self.employeeService = employeeService;

            /**
             * @description All draft outgoing mails
             * @type {*}
             */
            self.draftOutgoings = draftOutgoings;

            /**
             * @description Contains the selected draft outgoing mails
             * @type {Array}
             */
            self.selectedDraftOutgoings = [];

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
                            return (self.draftOutgoings.length + 21);
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
             * @description Contains methods for CRUD operations for draft outgoing mails
             */
            self.statusServices = {
                'activate': draftOutgoingService.activateBulkDraftOutgoings,
                'deactivate': draftOutgoingService.deactivateBulkDraftOutgoings,
                'true': draftOutgoingService.activateDraftOutgoing,
                'false': draftOutgoingService.deactivateDraftOutgoing
            };

            /**
             * @description Replaces the record in grid after update
             * @param record
             */
            self.replaceRecord = function (record) {
                var index = _.findIndex(self.draftOutgoings, {'id': record.id});
                if (index > -1)
                    self.draftOutgoings.splice(index, 1, record);
            };

            /**
             * @description Reload the grid of draft outgoing mail
             * @param pageNumber
             * @return {*|Promise<U>}
             */
            self.reloadDraftOutgoings = function (pageNumber) {
                var defer = $q.defer();
                self.progress = defer.promise;
                return draftOutgoingService
                    .loadDraftOutgoings()
                    .then(function (result) {
                        counterService.loadCounters();
                        self.draftOutgoings = result;
                        self.selectedDraftOutgoings = [];
                        defer.resolve(true);
                        if (pageNumber)
                            self.grid.page = pageNumber;
                        return result;
                    });
            };

            /**
             * @description Remove single draft outgoing mail
             * @param draftOutgoing
             * @param $event
             * @param defer
             */
            self.removeDraftOutgoing = function (draftOutgoing, $event, defer) {
                draftOutgoingService
                    .controllerMethod
                    .draftOutgoingRemove(draftOutgoing, $event)
                    .then(function () {
                        self.reloadDraftOutgoings(self.grid.page)
                            .then(function () {
                                new ResolveDefer(defer);
                            })
                    });
            };

            /**
             * @description Remove multiple selected draft outgoing mails
             * @param $event
             */
            self.removeBulkDraftOutgoings = function ($event) {
                draftOutgoingService
                    .controllerMethod
                    .draftOutgoingRemoveBulk(self.selectedDraftOutgoings, $event)
                    .then(function () {
                        self.reloadDraftOutgoings(self.grid.page);
                    });
            };

            /*  /!**
               * @description Change the status of draft outgoing mail
               * @param draftOutgoing
               *!/
              self.changeStatusDraftOutgoing = function (draftOutgoing) {
                  self.statusServices[draftOutgoing.status](draftOutgoing)
                      .then(function () {
                          toast.success(langService.get('status_success'));
                      })
                      .catch(function () {
                          draftOutgoing.status = !draftOutgoing.status;
                          dialog.errorMessage(langService.get('something_happened_when_update_status'));
                      })
              };

              /!**
               * @description Change the status of selected draft outgoing mails
               * @param status
               *!/
              self.changeStatusBulkDraftOutgoings = function (status) {
                  self.statusServices[status](self.selectedDraftOutgoings)
                      .then(function () {
                          self.reloadDraftOutgoings(self.grid.page)
                              .then(function () {
                                  toast.success(langService.get('selected_status_updated'));
                              });
                      });
              };*/

            /**
             * @description Launch distribution workflow for selected draft outgoing mails
             * @param $event
             */
            self.launchDistributionWorkflowBulk = function ($event) {
                var contentNotExist = _.filter(self.selectedDraftOutgoings, function (draftOutgoing) {
                    return !draftOutgoing.hasContent();
                });
                if (contentNotExist.length > 0) {
                    dialog.alertMessage(langService.get("content_not_found_bulk"));
                    return;
                }

                /*distributionWorkflowService
                    .controllerMethod
                    .distributionWorkflowSendBulk(self.selectedDraftOutgoings, "outgoing", $event)
                    .then(function () {
                        self.reloadDraftOutgoings(self.grid.page);
                    })
                    .catch(function () {
                        self.reloadDraftOutgoings(self.grid.page);
                    });*/
                return correspondenceService
                    .launchCorrespondenceWorkflow(self.selectedDraftOutgoings, $event, 'forward', 'favorites')
                    .then(function () {
                        self.reloadDraftOutgoings(self.grid.page)
                            .then(function(){
                                mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);;
                            });
                    });
            };

            /**
             * @description Send to review for selected draft outgoing mails
             * @param $event
             */
            self.sendToReviewBulk = function ($event) {
                //console.log('send to review outgoing mails bulk : ', self.selectedDraftOutgoings);
                draftOutgoingService
                    .controllerMethod
                    .draftOutgoingSendToReviewBulk(self.selectedDraftOutgoings, $event)
                    .then(function () {
                        self.reloadDraftOutgoings(self.grid.page);
                    });
            };

            /**
             * @description Edit the outgoing properties
             * @param draftOutgoing
             * @param $event
             */
            self.editProperties = function (draftOutgoing, $event) {

                var properties = [
                    'attachments',
                    'linkedEntities',
                    'documentComments',
                    'linkedDocs',
                    'sitesInfoTo',
                    'sitesInfoCC'
                ];

                managerService
                    .manageDocumentProperties(draftOutgoing.vsId, draftOutgoing.docClassName, draftOutgoing.docSubject, $event)
                    .then(function (document) {
                        draftOutgoing = generator.preserveProperties(properties, draftOutgoing, document);
                        self.reloadDraftOutgoings(self.grid.page);
                    })
                    .catch(function (document) {
                        draftOutgoing = generator.preserveProperties(properties, draftOutgoing, document);
                        self.reloadDraftOutgoings(self.grid.page);
                    });
            };

            /**
             * @description Edit the outgoing content
             * @param draftOutgoing
             * @param $event
             */
            self.editContent = function (draftOutgoing, $event) {
                managerService.manageDocumentContent(draftOutgoing.vsId, draftOutgoing.docClassName, draftOutgoing.docSubject, $event)
            };

            /**
             * @description Send the draft outgoing to review
             * @param draftOutgoing
             * @param $event
             * @param defer
             */
            self.sendToReview = function (draftOutgoing, $event, defer) {
                draftOutgoingService.controllerMethod
                    .draftOutgoingSendToReview(draftOutgoing, $event)
                    .then(function (result) {
                        self.reloadDraftOutgoings(self.grid.page)
                            .then(function () {
                                new ResolveDefer(defer);
                            });
                    })
            };

            /**
             * @description Launch distribution workflow for draft outgoing item
             * @param draftOutgoing
             * @param $event
             * @param defer
             */
            self.launchDistributionWorkflow = function (draftOutgoing, $event, defer) {
                if (!draftOutgoing.hasContent()) {
                    dialog.alertMessage(langService.get("content_not_found"));
                    return;
                }

                /*distributionWorkflowService
                    .controllerMethod
                    .distributionWorkflowSend(draftOutgoing, false, false, null, "outgoing", $event)
                    .then(function (result) {
                        self.reloadDraftOutgoings(self.grid.page)
                            .then(function () {
                                new ResolveDefer(defer);
                            });
                        //self.replaceRecord(result);
                    })
                    .catch(function (result) {
                        self.reloadDraftOutgoings(self.grid.page);
                        //self.replaceRecord(result);
                    });*/

            draftOutgoing.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadDraftOutgoings(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);;
                            new ResolveDefer(defer);
                        });
                });
            };

            /**
             * @description View Tracking Sheet
             * @param draftOutgoing
             * @param params
             * @param $event
             */
            self.viewTrackingSheet = function (draftOutgoing, params, $event) {
                viewTrackingSheetService
                    .controllerMethod
                    .viewTrackingSheetPopup(draftOutgoing, params, $event).then(function (result) {
                });
            };

            /**
             * @description Manage document tags for draft outgoing
             * @param draftOutgoing
             * @param $event
             */
            self.manageTags = function (draftOutgoing, $event) {
                managerService.manageDocumentTags(draftOutgoing.vsId, draftOutgoing.docClassName, draftOutgoing.docSubject, $event)
                    .then(function (tags) {
                        draftOutgoing.tags = tags;
                    })
                    .catch(function (tags) {
                        draftOutgoing.tags = tags;
                    });
            };

            /**
             * @description Manage document comments for draft outgoing
             * @param draftOutgoing
             * @param $event
             */
            self.manageComments = function (draftOutgoing, $event) {
                managerService.manageDocumentComments(draftOutgoing.vsId, draftOutgoing.docSubject, $event)
                    .then(function (documentComments) {
                        draftOutgoing.documentComments = documentComments;
                    })
                    .catch(function (documentComments) {
                        draftOutgoing.documentComments = documentComments;
                    });
            };

            /**
             * @description Manage document attachments for draft outgoing
             * @param draftOutgoing
             * @param $event
             */
            self.manageAttachments = function (draftOutgoing, $event) {
                //console.log('manage attachments : ', draftOutgoing);
                managerService.manageDocumentAttachments(draftOutgoing.vsId, draftOutgoing.docClassName, draftOutgoing.docSubject, $event)
                    .then(function (attachments) {
                        draftOutgoing = attachments;
                    })
                    .catch(function (attachments) {
                        draftOutgoing = attachments;
                    });
            };

            /**
             * @description Manage entities for draft outgoing
             * @param draftOutgoing
             * @param $event
             */
            self.manageEntities = function (draftOutgoing, $event) {
                managerService
                    .manageDocumentEntities(draftOutgoing.vsId, draftOutgoing.docClassName, draftOutgoing.docSubject, $event);
            };

            /**
             * @description Manage linked documents for draft outgoing
             * @param draftOutgoing
             * @param $event
             */
            self.manageLinkedDocuments = function (draftOutgoing, $event) {
                var info = draftOutgoing.getInfo();
                return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
            };

            /**
             * @description Manage security for draft outgoing
             * @param draftOutgoing
             * @param $event
             */
            self.security = function (draftOutgoing, $event) {
                console.log('security : ', draftOutgoing);
            };

            /**
             * @description Manage destinations for draft outgoing
             * @param draftOutgoing
             * @param $event
             */
            self.manageDestinations = function (draftOutgoing, $event) {
                managerService.manageDocumentCorrespondence(draftOutgoing.vsId, draftOutgoing.docClassName, draftOutgoing.docSubject, $event)
            };

        /**
         * @description broadcast selected organizations and workflow groups
         * @param draftOutgoing
         * @param $event
         * @param defer
         */
            self.broadcast = function (draftOutgoing, $event, defer) {
                draftOutgoing
                    .correspondenceBroadcast($event)
                    .then(function () {
                        self.reloadDraftOutgoings(self.grid.page)
                            .then(function () {
                                mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);;
                                new ResolveDefer(defer);
                            })
                    })
            };

            var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
                var isEditAllowed = employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES");
                if (checkForViewPopup)
                    return !isEditAllowed;
                return isEditAllowed;
            };

            /**
             * @description View document
             * @param draftOutgoing
             * @param $event
             */
            self.viewDocument = function (draftOutgoing, $event) {
                //console.log("draftOutgoing", draftOutgoing);
                if (!draftOutgoing.hasContent()) {
                    dialog.alertMessage(langService.get('content_not_found'));
                    return;
                }
                if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                    dialog.infoMessage(langService.get('no_view_permission'));
                    return;
                }

                correspondenceService.viewCorrespondence(draftOutgoing, self.gridActions, checkIfEditPropertiesAllowed(draftOutgoing, true), true);
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
                            gridName: 'outgoing-draft'
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
                // Remove
                {
                    type: 'action',
                    icon: 'delete',
                    text: 'grid_action_remove',
                    shortcut: true,
                    callback: self.removeDraftOutgoing,
                    class: "action-green",
                    checkShow: self.checkToShowAction
                },
                // Send To Review
                {
                    type: 'action',
                    icon: 'send',
                    text: 'grid_action_send_to_review',
                    shortcut: true,
                    callback: self.sendToReview,
                    class: "action-green",
                    checkShow: self.checkToShowAction
                },
                // Launch Distribution Workflow
                {
                    type: 'action',
                    icon: 'sitemap',
                    text: 'grid_action_launch_distribution_workflow',
                    shortcut: true,
                    callback: self.launchDistributionWorkflow,
                    class: "action-green",
                    permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
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
                            shortcut: true,
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
                            shortcut: true,
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
                        {
                            type: 'action',
                            icon: 'stop',
                            text: 'grid_action_destinations',
                            shortcut: false,
                            callback: self.manageDestinations,
                            permissionKey: "MANAGE_DESTINATIONS",
                            class: "action-green",
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
                    showInView: false,
                    class: "action-green",
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
                    hide: true,
                    permissionKey: 'BROADCAST_DOCUMENT',
                    callback: self.broadcast,
                    class: 'action-green',
                    checkShow: function (action, model) {
                        return self.checkToShowAction(action, model) && (model.addMethod || model.approvers !== null);
                    }
                }
            ];
        }
    )
    ;
}
;