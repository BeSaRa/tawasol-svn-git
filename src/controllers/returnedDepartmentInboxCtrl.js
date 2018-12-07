module.exports = function (app) {
    app.controller('returnedDepartmentInboxCtrl', function (lookupService,
                                                            returnedDepartmentInboxService,
                                                            returnedDepartmentInboxes,
                                                            listGeneratorService,
                                                            correspondenceStorageService,
                                                            userInboxService,
                                                            $q,
                                                            $filter,
                                                            errorCode,
                                                            $state,
                                                            $timeout,
                                                            langService,
                                                            rootEntity,
                                                            toast,
                                                            _,
                                                            dialog,
                                                            managerService,
                                                            viewDocumentService,
                                                            distributionWorkflowService,
                                                            contextHelpService,
                                                            counterService,
                                                            viewTrackingSheetService,
                                                            downloadService,
                                                            generator,
                                                            employeeService,
                                                            ResolveDefer,
                                                            correspondenceService,
                                                            favoriteDocumentsService,
                                                            mailNotificationService,
                                                            gridService) {
        'ngInject';
        var self = this;
        /*
         IT WILL ALWAYS GET OUTGOING DOCUMENTS ONLY
         */
        self.controllerName = 'returnedDepartmentInboxCtrl';

        self.progress = null;
        contextHelpService.setHelpTo('department-inbox-returned');
        // employee service to check the permission in html
        self.employeeService = employeeService;

        /**
         * @description All returned department inbox items
         * @type {*}
         */
        self.returnedDepartmentInboxes = returnedDepartmentInboxes;

        /**
         * @description Contains the selected returned department inbox items
         * @type {Array}
         */
        self.selectedReturnedDepartmentInboxes = [];
        self.globalSetting = rootEntity.returnRootEntity().settings;

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.department.returned) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.department.returned, self.returnedDepartmentInboxes),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.department.returned, limit);
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
         * @description Contains methods for Star operations for returned department inbox items
         */
        self.starServices = {
            'false': returnedDepartmentInboxService.controllerMethod.returnedDepartmentInboxStar,
            'true': returnedDepartmentInboxService.controllerMethod.returnedDepartmentInboxUnStar,
            'starBulk': returnedDepartmentInboxService.controllerMethod.returnedDepartmentInboxesStarBulk,
            'unStarBulk': returnedDepartmentInboxService.controllerMethod.returnedDepartmentInboxesUnStarBulk
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.returnedDepartmentInboxes = $filter('orderBy')(self.returnedDepartmentInboxes, self.grid.order);
        };

        /**
         * @description Reload the grid of returned department inbox item
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadReturnedDepartmentInboxes = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return returnedDepartmentInboxService
                .loadReturnedDepartmentInboxes()
                .then(function (result) {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.returnedDepartmentInboxes = result;
                    self.selectedReturnedDepartmentInboxes = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Resend returned department inbox item
         * @param $event
         */
        self.resendBulkReturnedDepartmentInbox = function ($event) {
            returnedDepartmentInboxService
                .controllerMethod.returnedDepartmentInboxesResendBulk(self.selectedReturnedDepartmentInboxes, $event)
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                })
        };

        /**
         * @description Change the starred for returned department inbox
         * @param returnedDepartmentInbox
         * @param $event
         */
        /* self.changeStar = function (returnedDepartmentInbox, $event) {
         self.starServices[returnedDepartmentInbox.generalStepElm.starred](returnedDepartmentInbox)
         .then(function (result) {
         if (result) {
         self.reloadReturnedDepartmentInboxes(self.grid.page)
         .then(function () {
         if (!returnedDepartmentInbox.generalStepElm.starred)
         toast.success(langService.get("star_specific_success").change({name: returnedDepartmentInbox.generalStepElm.docSubject}));
         else
         toast.success(langService.get("unstar_specific_success").change({name: returnedDepartmentInbox.generalStepElm.docSubject}));
         });
         }
         else {
         dialog.errorMessage(langService.get('something_happened_when_update_starred'));
         }
         })
         .catch(function () {
         dialog.errorMessage(langService.get('something_happened_when_update_starred'));
         });
         };*/

        /**
         * @description Change the starred for returned department inboxes Bulk
         * @param starUnStar
         * @param $event
         */
        /*self.changeStarBulk = function (starUnStar, $event) {
         self.starServices[starUnStar](self.selectedReturnedDepartmentInboxes)
         .then(function (result) {
         self.reloadReturnedDepartmentInboxes(self.grid.page);
         });
         };*/


        /**
         * @description add an item to the favorite documents
         * @param followupEmployeeInbox
         * @param $event
         */
        self.addToFavorite = function (followupEmployeeInbox, $event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAdd(followupEmployeeInbox.generalStepElm.vsId, $event)
                .then(function (result) {
                    if (result.status) {
                        self.reloadReturnedDepartmentInboxes(self.grid.page)
                            .then(function () {
                                toast.success(langService.get("add_to_favorite_specific_success").change({
                                    name: followupEmployeeInbox.getTranslatedName()
                                }));
                            });
                    }
                    else {
                        dialog.alertMessage(langService.get(result.message));
                    }
                });
        };


        /**
         * @description Terminate returned department inbox item
         * @param returnedDepartmentInbox
         * @param $event
         * @param defer
         */
        self.terminate = function (returnedDepartmentInbox, $event, defer) {
            /*returnedDepartmentInboxService.controllerMethod
             .returnedDepartmentInboxTerminate(returnedDepartmentInbox, $event)
             .then(function (result) {
             self.reloadReturnedDepartmentInboxes(self.grid.page)
             .then(function () {
             toast.success(langService.get("terminate_specific_success").change({name: returnedDepartmentInbox.generalStepElm.docSubject}));
             new ResolveDefer(defer);
             });
             });*/
            returnedDepartmentInboxService
                .controllerMethod
                .returnedDepartmentInboxTerminate(returnedDepartmentInbox, $event)
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page)
                        .then(function () {
                            toast.success(langService.get("terminate_specific_success").change({name: returnedDepartmentInbox.getTranslatedName()}));
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Get Link
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.getLink = function (returnedDepartmentInbox, $event) {
            var info = returnedDepartmentInbox.getInfo();
            viewDocumentService.loadDocumentViewUrlWithOutEdit(info.vsId).then(function (result) {
                //var docLink = "<a target='_blank' href='" + result + "'>" + result + "</a>";
                dialog.successMessage(langService.get('link_message').change({result: result}));
                return true;
            });
        };

        /**
         * @description Subscribe
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.subscribe = function (returnedDepartmentInbox, $event) {
            console.log('subscribe for returned department inbox : ', returnedDepartmentInbox)
        };

        /**
         * @description View Tracking Sheet
         * @param returnedDepartmentInbox
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (returnedDepartmentInbox, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(returnedDepartmentInbox, params, $event).then(function (result) {
            });
        };

        /**
         * @description Resend returned department inbox item
         * @param workItem
         * @param $event
         * @param defer
         */
        self.resend = function (workItem, $event, defer) {
            workItem.resendWorkItem($event)
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page)
                        .then(function (result) {
                            toast.success(langService.get('resend_specific_success').change({name: workItem.getTranslatedName()}));
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description Launch new distribution workflow for returned department inbox item
         * @param returnedDepartmentInbox
         * @param $event
         * @param defer
         */
        self.launchNewDistributionWorkflow = function (returnedDepartmentInbox, $event, defer) {

            //returnedDepartmentInbox.generalStepElm.workFlowName = Export,
            // but it need in DW popup to create URL, records will always come from Outgoing export
            returnedDepartmentInbox.generalStepElm.workFlowName = "Outgoing";

            returnedDepartmentInbox.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Manage Tags for returned department inbox item
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.manageTags = function (returnedDepartmentInbox, $event) {
            var info = returnedDepartmentInbox.getInfo();
            var wfName = "outgoing";
            managerService.manageDocumentTags(info.vsId, wfName.toLowerCase(), info.title, $event)
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                });
        };

        /**
         * @description Manage comments for returned department inbox item
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.manageComments = function (returnedDepartmentInbox, $event) {
            var wfName = 'outgoing';
            managerService.manageDocumentComments(returnedDepartmentInbox.getInfo().vsId, wfName, $event)
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                });
        };

        /**
         * @description Manage tasks for returned department inbox item
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.manageTasks = function (returnedDepartmentInbox, $event) {
            console.log('manageTasksReturnedDepartmentInbox', returnedDepartmentInbox);
        };

        /**
         * @description Manage attachments for returned department inbox item
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.manageAttachments = function (returnedDepartmentInbox, $event) {
            returnedDepartmentInbox.manageDocumentAttachments($event);
            /*var vsId = returnedDepartmentInbox.hasOwnProperty('generalStepElm')
                ? (returnedDepartmentInbox.generalStepElm.hasOwnProperty('vsId') ? returnedDepartmentInbox.generalStepElm.vsId : returnedDepartmentInbox.generalStepElm)
                : (returnedDepartmentInbox.hasOwnProperty('vsId') ? returnedDepartmentInbox.vsId : returnedDepartmentInbox);
            var wfName = 'outgoing';
            managerService.manageDocumentAttachments(returnedDepartmentInbox, vsId, wfName.toLowerCase(), returnedDepartmentInbox.getTranslatedName(), $event);*/
        };

        /**
         * @description Manage linked documents for returned department inbox item
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.manageLinkedDocuments = function (returnedDepartmentInbox, $event) {
            var info = returnedDepartmentInbox.getInfo();
            managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass, "welcome");
        };

        /**
         * @description Manage Linked Entities
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.manageLinkedEntities = function (returnedDepartmentInbox, $event) {
            var wfName = 'outgoing';
            managerService
                .manageDocumentEntities(returnedDepartmentInbox.generalStepElm.vsId, wfName.toLowerCase(), returnedDepartmentInbox.generalStepElm.docSubject, $event);
        };

        /**
         * @description Download Main Document
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.downloadMainDocument = function (returnedDepartmentInbox, $event) {
            downloadService.controllerMethod
                .mainDocumentDownload(returnedDepartmentInbox)
        };

        /**
         * @description Download Composite Document
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.downloadCompositeDocument = function (returnedDepartmentInbox, $event) {
            downloadService.controllerMethod
                .compositeDocumentDownload(returnedDepartmentInbox);
        };

        /**
         * @description Send Link To Document By Email
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (returnedDepartmentInbox, $event) {
            downloadService.getMainDocumentEmailContent(returnedDepartmentInbox.getInfo().vsId);
        };

        /**
         * @description Send composite document as attachment By Email
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (returnedDepartmentInbox, $event) {
            downloadService.getCompositeDocumentEmailContent(returnedDepartmentInbox.getInfo().vsId);
        };

        /**
         * @description Send SMS
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.sendSMS = function (returnedDepartmentInbox, $event) {
            console.log('sendSMS : ', returnedDepartmentInbox);
        };

        /**
         * @description Send Main Document Fax
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.sendMainDocumentFax = function (returnedDepartmentInbox, $event) {
            console.log('sendMainDocumentFax : ', returnedDepartmentInbox);
        };

        /**
         * @description Edit After Export
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.editAfterExport = function (returnedDepartmentInbox, $event) {
            var info = returnedDepartmentInbox.getInfo(), list = listGeneratorService.createUnOrderList(),
                langKeys = ['signature_serial_will_removed', 'the_book_will_go_to_audit', 'serial_retained', 'exported_not_received_documents_will_be_recalled'];
            _.map(langKeys, function (item) {
                list.addItemToList(langService.get(item));
            });
            dialog.confirmMessage(list.getList(), null, null, $event)
                .then(function () {
                    correspondenceStorageService
                        .runEditAfter('Export', returnedDepartmentInbox)
                        .then(function () {
                            dialog.hide();
                            $state.go('app.outgoing.add', {
                                workItem: info.wobNumber,
                                vsId: info.vsId,
                                action: 'editAfterExport'
                            });
                        })
                        .catch(function (error) {
                            //dialog.errorMessage(langService.get('error_messages'));
                            errorCode.checkIf(error, 'CANNOT_EDIT_AFTER_EXPORT_DUE_TO_RECEIVED_G2G_INTERNAL_G2G_OLD_SYSTEM_CORRESPONDENCE_SITES', function () {
                                dialog.errorMessage(langService.get('can_not_edit_after_export_due_to_received_g2g_internal_g2g_old_system_correspondence_sites'));
                            });
                        });

                });
        };

        /**
         * @description Edit Outgoing Content
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.editContent = function (returnedDepartmentInbox, $event) {
            var info = returnedDepartmentInbox.getInfo();
            managerService.manageDocumentContent(info.vsId, 'outgoing', info.title, $event);//info.workFlow
        };

        /**
         * @description Edit Outgoing Properties
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.editProperties = function (returnedDepartmentInbox, $event) {
            var info = returnedDepartmentInbox.getInfo();
            managerService
                .manageDocumentProperties(info.vsId, info.documentClass, info.title, $event)
                .finally(function (document) {
                    self.reloadReturnedDepartmentInboxes(self.grid.page)
                });
        };

        /**
         * @description Launch distribution workflow for selected draft outgoing mails
         * @param $event
         */
        self.launchDistributionWorkflowBulk = function ($event) {
            var contentNotExist = _.filter(self.selectedReturnedDepartmentInboxes, function (returnedDepartmentInbox) {
                return !returnedDepartmentInbox.hasContent();
            });
            if (contentNotExist.length > 0) {
                dialog.alertMessage(langService.get("content_not_found_bulk"));
                return;
            }

            distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSendBulk(self.selectedReturnedDepartmentInboxes, "outgoing", $event)
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                })
                .catch(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                });
        };

        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var info = model.getInfo();
            var hasPermission = (employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES") || employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
            var allowed = hasPermission && info.isPaper;// && info.docStatus < 24
            if (checkForViewPopup)
                return !allowed;
            return allowed;
        };


        /**
         * @description Preview document
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.previewDocument = function (returnedDepartmentInbox, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            var info = returnedDepartmentInbox.getInfo();
            correspondenceService.viewCorrespondenceReturnedWorkItem(info, self.gridActions, checkIfEditPropertiesAllowed(returnedDepartmentInbox, true), true, true)
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                })
                .catch(function (error) {
                    if (error !== 'itemLocked')
                        self.reloadReturnedDepartmentInboxes(self.grid.page);
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
            workItem.viewNewDepartmentReturned(self.gridActions, 'departmentReturned', $event)
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                })
                .catch(function (error) {
                    if (error !== 'itemLocked')
                        self.reloadReturnedDepartmentInboxes(self.grid.page);
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
                    $state.go('app.' + info.documentClass.toLowerCase() + '.add', {
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
         * @description Terminate User inboxes Bulk
         * @param $event
         */
        self.terminateBulk = function ($event) {
            var numberOfRecordsToTerminate = angular.copy(self.selectedReturnedDepartmentInboxes.length);
            userInboxService
                .controllerMethod
                .userInboxTerminateBulk(self.selectedReturnedDepartmentInboxes, $event)
                .then(function () {
                    $timeout(function () {
                        self.reloadReturnedDepartmentInboxes(self.grid.page)
                            .then(function () {
                                if (numberOfRecordsToTerminate === 1)
                                    toast.success(langService.get("selected_terminate_success"));
                            });
                    }, 100);
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
                        self.reloadReturnedDepartmentInboxes(self.grid.page);
                });
        };

        self.checkIfUnlockBulkAvailable = function () {
            self.itemsWithoutUnlock = [];
            _.map(self.selectedReturnedDepartmentInboxes, function (workItem) {
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
            var selectedItems = angular.copy(self.selectedReturnedDepartmentInboxes);
            if (!self.checkIfUnlockBulkAvailable()) {
                if (self.itemsWithoutUnlock.length === selectedItems.length) {
                    dialog.alertMessage(langService.get('selected_items_can_not_be_unlocked'));
                    return false;
                }
                dialog.confirmMessage(langService.get('some_items_cannot_be_unlocked_skip_and_unlock'), null, null, $event).then(function () {
                    self.selectedReturnedDepartmentInboxes = selectedItems = _.filter(self.selectedReturnedDepartmentInboxes, function (workItem) {
                        return self.itemsWithoutUnlock.indexOf(workItem.generalStepElm.vsId) === -1;
                    });
                    if (self.selectedReturnedDepartmentInboxes.length)
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
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
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
                        gridName: 'department-returned'
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
                shortcut: true,
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
            // Open
            {
                type: 'action',
                icon: 'book-open-page-variant',
                text: 'grid_action_open',
                shortcut: true,
                callback: self.viewDocument,
                showInView: false,
                class: "action-green",
                permissionKey: 'VIEW_DOCUMENT',
                checkShow: function (action, model) {
                    //If no content or no view document permission, hide the button
                    return self.checkToShowAction(action, model) && model.hasContent();
                }
            },
            // Resend
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_resend',
                shortcut: true,
                callback: self.resend,
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            // Launch New Distribution Workflow
            {
                type: 'action',
                icon: 'sitemap',
                text: 'grid_action_launch_new_distribution_workflow',
                shortcut: false,
                callback: self.launchNewDistributionWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
                hide: false, /*As discussed with Mr. Ahmed Abu Al Nassr*/
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
                    "" // Composite Document
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
                        icon: 'attachment',
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
            //Edit After Export
            {
                type: 'action',
                icon: 'eraser-variant',
                text: 'grid_action_edit_after_export',
                shortcut: false,
                showInView: true,
                class: 'action-green',
                callback: self.editAfterExport, //TODO: Service is not available yet
                checkShow: function (action, model) {
                    // var info = model.getInfo();
                    var hasPermission = (employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES") || employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
                    // return self.checkToShowAction(action, model) && hasPermission && !info.isPaper;
                    return self.checkToShowAction(action, model) && hasPermission; //TODO: Check with Besara as its enabled for paper by Issawi on 16 Oct, 2018
                }
            },
            // Edit (Paper Only)
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit',
                shortcut: false,
                showInView: false,
                hide: true, //TODO: as mentioned by Issawi on 16 Oct, 2018 as we have edit after export enabled for paper document too. (TFS - 17249)
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    var hasPermission = (employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES") || employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
                    return self.checkToShowAction(action, model) && hasPermission && info.isPaper;
                },
                /*permissionKey: [
                    "EDIT_OUTGOING_CONTENT",
                    "EDIT_OUTGOING_PROPERTIES"
                ],
                checkAnyPermission: true,*/
                subMenu: [
                    // Content
                    {
                        type: 'action',
                        //icon: 'link-variant',
                        text: 'grid_action_content',
                        shortcut: false,
                        callback: self.editContent,
                        permissionKey: "EDIT_OUTGOING_CONTENT",
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    },
                    // Properties
                    {
                        type: 'action',
                        //icon: 'attachment',
                        text: 'grid_action_properties',
                        shortcut: false,
                        callback: self.editProperties,
                        permissionKey: "EDIT_OUTGOING_PROPERTIES",
                        class: "action-green",
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
                hide: true,
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
                hide: true,
                callback: self.duplicateCurrentVersion,
                class: "action-green",
                permissionKey: 'DUPLICATE_BOOK_CURRENT',
                showInView: true,
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && (info.documentClass === 'outgoing' || info.documentClass === 'internal') && !info.isPaper
                }
            },
            // duplicate specific version
            {
                type: 'action',
                icon: 'content-duplicate',
                text: 'grid_action_duplication_specific_version',
                shortcut: false,
                hide: true,
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
                    return self.checkToShowAction(action, model) && model.isLocked() && model.getLockingInfo().domainName !== employeeService.getEmployee().domainName;
                }
            }
        ];


    });
};