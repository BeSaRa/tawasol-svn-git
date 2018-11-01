module.exports = function (app) {
    app.controller('draftOutgoingCtrl', function (lookupService,
                                                  draftOutgoingService,
                                                  draftOutgoings,
                                                  $q,
                                                  $filter,
                                                  langService,
                                                  generator,
                                                  toast,
                                                  counterService,
                                                  dialog,
                                                  viewDocumentService,
                                                  //outgoingService,
                                                  $state,
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
                                                  mailNotificationService,
                                                  gridService) {
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

            self.editInDesktop = function (workItem) {
                correspondenceService.editWordInDesktop(workItem);
            };

            /**
             * @description Contains options for grid configuration
             * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
             */
            self.grid = {
                limit: gridService.getGridPagingLimitByGridName(gridService.grids.outgoing.draft) || 5, // default limit
                page: 1, // first page
                //order: 'arName', // default sorting order
                order: '', // default sorting order
                limitOptions: gridService.getGridLimitOptions(gridService.grids.outgoing.draft, self.draftOutgoings),
                pagingCallback: function (page, limit) {
                    gridService.setGridPagingLimitByGridName(gridService.grids.outgoing.draft, limit);
                }
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
             * @description Gets the grid records by sorting
             */
            self.getSortedData = function () {
                self.draftOutgoings = $filter('orderBy')(self.draftOutgoings, self.grid.order);
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
                        self.getSortedData();
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
                            .then(function () {
                                mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
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
                    .then(function () {
                        self.reloadDraftOutgoings(self.grid.page);
                    })
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
                                mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
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
                draftOutgoing.manageDocumentAttachments($event);
            };

            /**
             * @description Manage Linked Entities
             * @param draftOutgoing
             * @param $event
             */
            self.manageLinkedEntities = function (draftOutgoing, $event) {
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
                                mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
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

            var checkIfEditCorrespondenceSiteAllowed = function (model, checkForViewPopup) {
                var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
                if (checkForViewPopup)
                    return !(hasPermission);
                return hasPermission;
            };

            /**
             * @description Preview document
             * @param draftOutgoing
             * @param $event
             */
            self.previewDocument = function (draftOutgoing, $event) {
                if (!draftOutgoing.hasContent()) {
                    dialog.alertMessage(langService.get('content_not_found'));
                    return;
                }
                if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                    dialog.infoMessage(langService.get('no_view_permission'));
                    return;
                }

                correspondenceService.viewCorrespondence(draftOutgoing, self.gridActions, checkIfEditPropertiesAllowed(draftOutgoing, true), false)
                    .then(function () {
                        return self.reloadDraftOutgoings(self.grid.page);
                    })
                    .catch(function () {
                        return self.reloadDraftOutgoings(self.grid.page);
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

                correspondence.viewFromQueue(self.gridActions, 'draftOutgoing', $event)
                    .then(function () {
                        return self.reloadDraftOutgoings(self.grid.page);
                    })
                    .catch(function (error) {
                        return self.reloadDraftOutgoings(self.grid.page);
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
                        $state.go('app.outgoing.add', {
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
                        $state.go('app.outgoing.add', {
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
                // Preview
                {
                    type: 'action',
                    icon: 'book-open-variant',
                    text: 'grid_action_preview_document',
                    shortcut: false,
                    callback: self.previewDocument,
                    showInView: false,
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
                    permissionKey: [
                        "EDIT_OUTGOING_CONTENT",
                        "EDIT_OUTGOING_PROPERTIES"
                    ],
                    checkAnyPermission: true,
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
                            checkShow: function (action, model) {
                                return self.checkToShowAction(action, model) && checkIfEditPropertiesAllowed(model);
                            }
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
                    permissionKey: [
                        "MANAGE_DOCUMENT’S_TAGS",
                        "MANAGE_DOCUMENT’S_COMMENTS",
                        "MANAGE_ATTACHMENTS",
                        "MANAGE_LINKED_ENTITIES",
                        "MANAGE_LINKED_DOCUMENTS",
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
                            permissionKey: "MANAGE_LINKED_ENTITIES",
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
                        return self.checkToShowAction(action, model) && (model.addMethod || model.approvers !== null) && (model.getSecurityLevelLookup().lookupKey !== 4);
                    }
                },
                // editInDeskTop
                {
                    type: 'action',
                    icon: 'book-open-variant',
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
                        return self.checkToShowAction(action, model)
                            && !info.isPaper
                            && (info.documentClass !== 'incoming')
                            && model.needApprove()
                            && hasPermission;
                    }
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
                        return self.checkToShowAction(action, model) && !info.isPaper;
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
        }
    )
    ;
}
;