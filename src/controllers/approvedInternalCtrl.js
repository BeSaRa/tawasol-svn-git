module.exports = function (app) {
    app.controller(
        'approvedInternalCtrl', function (lookupService,
                                          approvedInternalService,
                                          approvedInternals,
                                          counterService,
                                          correspondenceStorageService,
                                          $q,
                                          $filter,
                                          langService,
                                          toast,
                                          dialog,
                                          rootEntity,
                                          _,
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
                                          $state,
                                          mailNotificationService,
                                          gridService) {
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
             * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
             */
            self.grid = {
                limit: gridService.getGridPagingLimitByGridName(gridService.grids.internal.approved) || 5, // default limit
                page: 1, // first page
                order: '', // default sorting order
                limitOptions: gridService.getGridLimitOptions(gridService.grids.internal.approved, self.approvedInternals),
                pagingCallback: function (page, limit) {
                    gridService.setGridPagingLimitByGridName(gridService.grids.internal.approved, limit);
                }
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
             * @description Gets the grid records by sorting
             */
            self.getSortedData = function () {
                self.approvedInternals = $filter('orderBy')(self.approvedInternals, self.grid.order);
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
                        self.getSortedData();
                        return result;
                    });
            };

            /**
             * @description Terminate approved internals Bulk
             * @param $event
             */
            self.terminateBulk = function ($event) {
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
            self.terminate = function (approvedInternal, $event, defer) {
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
                approvedInternal
                    .launchWorkFlow($event, 'forward')
                    .then(function () {
                        self.reloadApprovedInternals(self.grid.page)
                            .then(function () {
                                mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                                new ResolveDefer(defer);
                            });
                    });
            };

            /**
             * @description Launch distribution workflow for selected approved internal items
             * @param $event
             */
            self.launchDistributionWorkflowBulk = function ($event) {
                var contentNotExist = _.filter(self.selectedApprovedInternals, function (approvedInternal) {
                    return !approvedInternal.hasContent();
                });
                if (contentNotExist.length > 0) {
                    dialog.alertMessage(langService.get("content_not_found_bulk"));
                    return;
                }
                correspondenceService
                    .launchCorrespondenceWorkflow(self.selectedApprovedInternals, $event)
                    .then(function () {
                        self.reloadApprovedInternals(self.grid.page)
                            .then(function () {
                                mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            });
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
             * @description Preview document
             * @param approvedInternal
             * @param $event
             */
            self.previewDocument = function (approvedInternal, $event) {
                if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                    dialog.infoMessage(langService.get('no_view_permission'));
                    return;
                }
                return correspondenceService.viewCorrespondence(approvedInternal, self.gridActions, checkIfEditPropertiesAllowed(approvedInternal, true), true, false, false, true)
                    .then(function () {
                        return self.reloadApprovedInternals(self.grid.page);
                    })
                    .catch(function (error) {
                        if (error !== 'itemLocked')
                            return self.reloadApprovedInternals(self.grid.page);
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
                workItem.viewNewApprovedInternalWorkItemDocument(self.gridActions, 'approvedInternal', $event)
                    .then(function () {
                        self.reloadApprovedInternals(self.grid.page);
                    })
                    .catch(function (error) {
                        if (error !== 'itemLocked')
                            self.reloadApprovedInternals(self.grid.page);
                    });
            };

            /**
             * @description get document versions
             * @param workItem
             * @param $event
             * @return {*}
             */
            self.getDocumentVersions = function (workItem, $event) {
                return workItem
                    .viewSpecificVersion(self.gridActions, $event);
            };
            /**
             * @description duplicate current version
             * @param workItem
             * @param $event
             */
            self.duplicateCurrentVersion = function (workItem, $event) {
                var info = workItem.getInfo();
                return workItem
                    .duplicateVersion($event)
                    .then(function () {
                        $state.go('app.internal.add', {
                            vsId: info.vsId,
                            action: 'duplicateVersion',
                            workItem: info.wobNum
                        });
                    });
            };
            /**
             * @description duplicate specific version
             * @param workItem
             * @param $event
             * @return {*}
             */
            self.duplicateVersion = function (workItem, $event) {
                var info = workItem.getInfo();
                return workItem
                    .duplicateSpecificVersion($event)
                    .then(function () {
                        $state.go('app.internal.add', {
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
             * @description do broadcast for workItem.
             */
            self.broadcast = function (workItem, $event, defer) {
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
             * @description Unlocks the workItem
             * @param workItem
             * @param $event
             * @returns {*}
             */
            self.unlockWorkItem = function (workItem, $event) {
                return workItem.unlockWorkItem($event)
                    .then(function (result) {
                        if (result)
                            self.reloadApprovedInternals(self.grid.page);
                    });
            };

            self.checkIfUnlockBulkAvailable = function () {
                self.itemsWithoutUnlock = [];
                _.map(self.selectedApprovedInternals, function (workItem) {
                    if (!workItem.isLocked())
                        self.itemsWithoutUnlock.push(workItem.generalStepElm.vsId);
                });
                return !(self.itemsWithoutUnlock && self.itemsWithoutUnlock.length);
            };

            /**
             * @description Unlocks the selected workItems
             * @param $event
             * @returns {*}
             */
            self.unlockWorkItemsBulk = function ($event) {
                var selectedItems = angular.copy(self.selectedApprovedInternals);
                if (!self.checkIfUnlockBulkAvailable()) {
                    if (self.itemsWithoutUnlock.length === selectedItems.length) {
                        dialog.alertMessage(langService.get('selected_items_can_not_be_unlocked'));
                        return false;
                    }
                    dialog.confirmMessage(langService.get('some_items_cannot_be_unlocked_skip_and_unlock'), null, null, $event).then(function () {
                        self.selectedApprovedInternals = selectedItems = _.filter(self.selectedApprovedInternals, function (workItem) {
                            return self.itemsWithoutUnlock.indexOf(workItem.generalStepElm.vsId) === -1;
                        });
                        if (self.selectedApprovedInternals.length)
                            _unlockBulk(selectedItems, $event);
                    })
                }
                else {
                    _unlockBulk(selectedItems, $event);
                }
            };

            var _unlockBulk = function (selectedItems, $event) {
                correspondenceService
                    .unlockBulkWorkItems(selectedItems, $event)
                    .then(function () {
                        self.reloadApprovedInternals(self.grid.page);
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
                    subMenu: [
                        {
                            type: 'info',
                            checkShow: self.checkToShowAction,
                            gridName: 'internal-approved'
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
                    showInView: false,
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
                    text: 'grid_action_view_tracking_sheet',
                    shortcut: false,
                    permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                    checkShow: self.checkToShowAction,
                    subMenu: viewTrackingSheetService.getViewTrackingSheetOptions(self.checkToShowAction, self.viewTrackingSheet, 'grid')
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
                        return self.checkToShowAction(action, model) && !model.isBroadcasted() && (model.getSecurityLevelLookup().lookupKey !== 4);
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
                    permissionKey: "EDIT_INTERNAL_CONTENT", //TODO: Apply correct permission when added to database.
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
                    permissionKey: [
                        "SEND_LINK_TO_THE_DOCUMENT_BY_EMAIL",
                        "SEND_COMPOSITE_DOCUMENT_BY_EMAIL",
                        "",
                        "SEND_SMS",
                        "",
                        ""
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
                            permissionKey: 'SEND_COMPOSITE_DOCUMENT_BY_EMAIL',
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
                },
                // Unlock
                {
                    type: 'action',
                    icon: 'lock-open',
                    text: 'grid_action_unlock',
                    shortcut: false,
                    callback: self.unlockWorkItem,
                    class: "action-green",
                    showInView: true,
                    permissionKey: '',
                    checkShow: function (action, model) {
                        return self.checkToShowAction(action, model) && model.isLocked();
                    }
                }
            ];

        });
};