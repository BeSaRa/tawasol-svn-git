module.exports = function (app) {
    app.controller(
        'approvedInternalCtrl', function (lookupService,
                                          approvedInternalService,
                                          approvedInternals,
                                          counterService,
                                          correspondenceStorageService,
                                          $q,
                                          langService,
                                          toast,
                                          dialog,
                                          rootEntity,
                                          viewDocumentService,
                                          //managerService,
                                          distributionWorkflowService,
                                          userFolders,
                                          $window,
                                          tokenService,
                                          contextHelpService,
                                          userFolderService,
                                          readyToExportService,
                                          viewTrackingSheetService,
                                          employeeService,
                                          favoriteDocumentsService,
                                          ResolveDefer,
                                          correspondenceService,
                                          listGeneratorService,
                                          $state) {
            'ngInject';

            var self = this;

            self.controllerName = 'approvedInternalCtrl';

            self.progress = null;
            contextHelpService.setHelpTo('approved-internal');
            // employee service to check the permission in html
            self.employeeService = employeeService;

            /**
             * @description All approved internals
             * @type {*}
             */
            self.approvedInternals = approvedInternals;
            self.userFolders = userFolders;

            /**
             * @description Contains methods for Star operations for approved internal items
             */
            self.starServices = {
                'false': approvedInternalService.controllerMethod.approvedInternalStar,
                'true': approvedInternalService.controllerMethod.approvedInternalUnStar,
                'starBulk': approvedInternalService.controllerMethod.approvedInternalStarBulk,
                'unStarBulk': approvedInternalService.controllerMethod.approvedInternalUnStarBulk
            };

            /**
             * @description Contains the selected approved internals
             * @type {Array}
             */
            self.selectedApprovedInternals = [];
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
                            return (self.approvedInternals.length + 21);
                        }
                    }
                ]
            };

            /**
             * @description Replaces the record in grid after update
             * @param record
             */
            self.replaceRecord = function (record) {
                var index = _.findIndex(self.approvedInternals, function (approvedInternal) {
                    return approvedInternal.generalStepElm.vsId === record.generalStepElm.vsId;
                });
                if (index > -1)
                    self.approvedInternals.splice(index, 1, record);
            };

            /**
             * @description Reload the grid of approved internals
             * @param pageNumber
             * @return {*|Promise<U>}
             */
            self.reloadApprovedInternals = function (pageNumber) {
                var defer = $q.defer();
                self.progress = defer.promise;
                return approvedInternalService
                    .loadApprovedInternals()
                    .then(function (result) {
                        counterService.loadCounters();
                        self.approvedInternals = result;
                        self.selectedApprovedInternals = [];
                        defer.resolve(true);
                        if (pageNumber)
                            self.grid.page = pageNumber;
                        return result;
                    });
            };

            /**
             * @description Terminate approved internals Bulk
             * @param $event
             */
            self.terminateApprovedInternalBulk = function ($event) {
                var numberOfRecordsToTerminate = angular.copy(self.selectedApprovedInternals.length);
                approvedInternalService.controllerMethod
                    .approvedInternalTerminateBulk(self.selectedApprovedInternals, $event)
                    .then(function (result) {
                        self.reloadApprovedInternals(self.grid.page)
                            .then(function () {
                                if (numberOfRecordsToTerminate === 1)
                                    toast.success(langService.get("selected_terminate_success"));
                            });
                    });
            };

            /**
             * @description Change the starred for approved internal
             * @param approvedInternal
             * @param $event
             */
            self.changeApprovedInternalStar = function (approvedInternal, $event) {
                self.starServices[approvedInternal.generalStepElm.starred](approvedInternal)
                    .then(function (result) {
                        if (result) {
                            self.reloadApprovedInternals(self.grid.page)
                                .then(function () {
                                    if (!approvedInternal.generalStepElm.starred)
                                        toast.success(langService.get("star_specific_success").change({name: approvedInternal.generalStepElm.docSubject}));
                                    else
                                        toast.success(langService.get("unstar_specific_success").change({name: approvedInternal.generalStepElm.docSubject}));
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
             * @description Terminate approved internal Item
             * @param approvedInternal
             * @param $event
             * @param defer
             */
            self.terminateApprovedInternal = function (approvedInternal, $event, defer) {
                approvedInternalService.controllerMethod
                    .approvedInternalTerminate(approvedInternal, $event)
                    .then(function (result) {
                        self.reloadApprovedInternals(self.grid.page)
                            .then(function () {
                                toast.success(langService.get("terminate_specific_success").change({name: approvedInternal.generalStepElm.docSubject}));
                                new ResolveDefer(defer);
                            });
                    });
            };

            /**
             * @description add an item to the favorite documents
             * @param approvedInternal
             * @param $event
             */
            self.addToFavorite = function (approvedInternal, $event) {
                favoriteDocumentsService.controllerMethod
                    .favoriteDocumentAdd(approvedInternal.generalStepElm.vsId, $event)
                    .then(function (result) {
                        if (result.status) {
                            self.reloadApprovedInternals(self.grid.page)
                                .then(function () {
                                    toast.success(langService.get("add_to_favorite_specific_success").change({
                                        name: approvedInternal.getTranslatedName()
                                    }));
                                });
                        }
                        else {
                            dialog.alertMessage(langService.get(result.message));
                        }
                    });
            };
            /**
             * @description Get the link of approved internal
             * @param approvedInternal
             * @param $event
             */
            self.getApprovedInternalLink = function (approvedInternal, $event) {
                console.log('getApprovedInternalLink', approvedInternal);
            };

            /**
             * @description View Tracking Sheet
             * @param approvedInternal
             * @param params
             * @param $event
             */
            self.viewTrackingSheet = function (approvedInternal, params, $event) {
                viewTrackingSheetService
                    .controllerMethod
                    .viewTrackingSheetPopup(approvedInternal, params, $event).then(function (result) {

                });
            };

            /**
             * @description Launch distribution workflow for approved internal item
             * @param approvedInternal
             * @param $event
             * @param defer
             */
            self.launchDistributionWorkflow = function (approvedInternal, $event, defer) {
                if (!approvedInternal.hasContent()) {
                    dialog.alertMessage(langService.get("content_not_found"));
                    return;
                }
                distributionWorkflowService.controllerMethod
                    .distributionWorkflowSend(approvedInternal.generalStepElm, false, false, null, "internal", $event)
                    .then(function () {
                        self.reloadApprovedInternals(self.grid.page)
                            .then(function () {
                                new ResolveDefer(defer);
                            });
                    })
                    .catch(function () {
                        self.reloadApprovedInternals(self.grid.page);
                    });
            };

            /**
             * @description Launch distribution workflow for selected approved internal items
             * @param $event
             */
            self.launchDistributionWorkflowBulk = function ($event) {
                var contentNotExist = _.filter(self.selectedApprovedInternals, function (draftOutgoing) {
                    return !draftOutgoing.hasContent();
                });
                if (contentNotExist.length > 0) {
                    dialog.alertMessage(langService.get("content_not_found_bulk"));
                    return;
                }

                distributionWorkflowService
                    .controllerMethod
                    .distributionWorkflowSendBulk(self.selectedApprovedInternals, "internal", $event)
                    .then(function () {
                        self.reloadApprovedInternals(self.grid.page);
                    })
                    .catch(function () {
                        self.reloadApprovedInternals(self.grid.page);
                    });
            };

            /**
             * @description View Direct Linked Documents
             * @param approvedInternal
             * @param $event
             */
            self.viewApprovedInternalDirectLinkedDocuments = function (approvedInternal, $event) {
                if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                    dialog.infoMessage(langService.get('no_view_permission'));
                    return;
                }
                console.log('viewApprovedInternalDirectLinkedDocuments : ', approvedInternal);
            };

            /**
             * @description View Complete Linked Documents
             * @param approvedInternal
             * @param $event
             */
            self.viewApprovedInternalCompleteLinkedDocuments = function (approvedInternal, $event) {
                if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                    dialog.infoMessage(langService.get('no_view_permission'));
                    return;
                }
                console.log('viewApprovedInternalCompleteLinkedDocuments : ', approvedInternal);
            };

            /**
             * @description Send Link To Document By Email
             * @param approvedInternal
             * @param $event
             */
            self.sendApprovedInternalLinkToDocumentByEmail = function (approvedInternal, $event) {
                console.log('sendApprovedInternalLinkToDocumentByEmail : ', approvedInternal);
            };

            /**
             * @description Send Composite Document As Attachment
             * @param approvedInternal
             * @param $event
             */
            self.sendApprovedInternalCompositeDocumentAsAttachment = function (approvedInternal, $event) {
                console.log('sendApprovedInternalCompositeDocumentAsAttachment : ', approvedInternal);
            };

            /**
             * @description Send Composite Document As Attachment By Email
             * @param approvedInternal
             * @param $event
             */
            self.sendApprovedInternalCompositeDocumentAsAttachmentByEmail = function (approvedInternal, $event) {
                console.log('sendApprovedInternalCompositeDocumentAsAttachmentByEmail : ', approvedInternal);
            };

            /**
             * @description Send Main Document Fax
             * @param approvedInternal
             * @param $event
             */
            self.sendApprovedInternalMainDocumentFax = function (approvedInternal, $event) {
                console.log('sendApprovedInternalMainDocumentFax : ', approvedInternal);
            };

            /**
             * @description Send SMS
             * @param approvedInternal
             * @param $event
             */
            self.sendApprovedInternalSMS = function (approvedInternal, $event) {
                console.log('sendApprovedInternalSMS : ', approvedInternal);
            };

            /**
             * @description Send Main Document As Attachment
             * @param approvedInternal
             * @param $event
             */
            self.sendApprovedInternalMainDocumentAsAttachment = function (approvedInternal, $event) {
                console.log('sendApprovedInternalMainDocumentAsAttachment : ', approvedInternal);
            };

            /**
             * @description Send Link
             * @param approvedInternal
             * @param $event
             */
            self.sendApprovedInternalLink = function (approvedInternal, $event) {
                console.log('sendApprovedInternalLink : ', approvedInternal);
            };
            var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
                /*var isEditAllowed = employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES");
                 if (checkForViewPopup)
                 return !isEditAllowed;
                 return isEditAllowed;*/
                return true;
            };

            /**
             * @description View document
             * @param approvedInternal
             * @param $event
             */
            self.viewDocument = function (approvedInternal, $event) {
                if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                    dialog.infoMessage(langService.get('no_view_permission'));
                    return;
                }
                return correspondenceService.viewCorrespondence(approvedInternal, self.gridActions, checkIfEditPropertiesAllowed(approvedInternal, true), true, false, false, true);
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
             * @description do broadcast for workItem.
             */
            self.doBroadcast = function (workItem, $event, defer) {
                workItem
                    .correspondenceBroadcast()
                    .then(function () {
                        self.reloadApprovedInternals(self.grid.page)
                            .then(function () {
                                new ResolveDefer(defer);
                            })
                    })
            };

            /**
             * @description Edit After Approve
             * @param model
             * @param $event
             */
            self.editAfterApprove = function (model, $event) {
                var info = model.getInfo(), list = listGeneratorService.createUnOrderList(),
                    langKeys = ['signature_serial_will_removed', 'the_book_will_go_to_audit', 'serial_retained'];
                _.map(langKeys, function (item) {
                    list.addItemToList(langService.get(item));
                });

                dialog.confirmMessage(list.getList(), null, null, $event)
                    .then(function () {
                        correspondenceStorageService
                            .runEditAfter('Approved', model)
                            .then(function () {
                                $state.go('app.internal.add', {
                                    workItem: info.wobNumber,
                                    vsId: info.vsId,
                                    action: 'editAfterApproved'
                                });
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
                            checkShow: self.checkToShowAction,
                            gridName: 'internal-approved'
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
                    callback: self.terminateApprovedInternal,
                    class: "action-green",
                    checkShow: self.checkToShowAction
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
                    checkShow: self.checkToShowAction
                },
                // Open
                {
                    type: 'action',
                    icon: 'book-open-variant',
                    text: 'grid_action_open',
                    shortcut: false,
                    showInView: false,
                    callback: self.viewDocument,
                    class: "action-green",
                    permissionKey: 'VIEW_DOCUMENT',
                    checkShow: function (action, model) {
                        //If no content or no view document permission, hide the button
                        return self.checkToShowAction(action, model) && model.hasContent();
                    }
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
                // Broadcast
                {
                    type: 'action',
                    icon: 'bullhorn',
                    text: 'grid_action_broadcast',
                    shortcut: false,
                    hide: false,
                    callback: self.doBroadcast,
                    checkShow: function (action, model) {
                        return self.checkToShowAction(action, model) && !model.isBroadcasted();
                    }
                },
                // Edit After Approve (Only electronic)
                {
                    type: 'action',
                    icon: 'eraser-variant',
                    text: 'grid_action_edit_after_approved',
                    shortcut: true,
                    callback: self.editAfterApprove,
                    class: "action-green",
                    showInView: false,
                    permissionKey: "EDIT_OUTGOING_CONTENT", //TODO: Apply correct permission when added to database.
                    checkShow: function (action, model) {
                        var info = model.getInfo();
                        return self.checkToShowAction(action, model) && !info.isPaper;
                    }
                },
                // Send
                {
                    type: 'action',
                    icon: 'send',
                    text: 'send',
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
                            callback: self.sendApprovedInternalLinkToDocumentByEmail,
                            class: "action-red",
                            checkShow: self.checkToShowAction
                        },
                        // Composite Document As Attachment By Email
                        {
                            type: 'action',
                            icon: 'attachment',
                            text: 'grid_action_composite_document_as_attachment_by_email',
                            shortcut: false,
                            callback: self.sendApprovedInternalCompositeDocumentAsAttachmentByEmail,
                            class: "action-red",
                            checkShow: self.checkToShowAction
                        },
                        // Composite Document
                        {
                            type: 'action',
                            icon: 'attachment',
                            text: 'composite_document_as_attachment',
                            shortcut: false,
                            callback: self.sendApprovedInternalCompositeDocumentAsAttachment,
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
                            callback: self.sendApprovedInternalSMS,
                            class: "action-red",
                            checkShow: self.checkToShowAction
                        },
                        // Main Document As Attachment
                        {
                            type: 'action',
                            icon: 'attachment',
                            text: 'main_document_as_attachment',
                            shortcut: false,
                            callback: self.sendApprovedInternalMainDocumentAsAttachment,
                            class: "action-red",
                            checkShow: self.checkToShowAction
                        },
                        // Link
                        {
                            type: 'action',
                            icon: 'link-variant',
                            text: 'grid_action_send_link',
                            shortcut: false,
                            callback: self.sendApprovedInternalLink,
                            class: "action-red",
                            checkShow: self.checkToShowAction
                        }
                    ]
                }
            ];

        });
};