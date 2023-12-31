module.exports = function (app) {
    app.controller('followupEmployeeInboxCtrl', function (lookupService,
                                                          followupEmployeeInboxService,
                                                          counterService,
                                                          correspondenceService,
                                                          userInboxService,
                                                          $q,
                                                          _,
                                                          $state,
                                                          $filter,
                                                          langService,
                                                          toast,
                                                          dialog,
                                                          rootEntity,
                                                          viewDocumentService,
                                                          managerService,
                                                          $window,
                                                          tokenService,
                                                          contextHelpService,
                                                          /*userFolders,
                                                          userFolderService,*/
                                                          viewTrackingSheetService,
                                                          downloadService,
                                                          employeeService,
                                                          ResolveDefer,
                                                          mailNotificationService,
                                                          $timeout,
                                                          favoriteDocumentsService,
                                                          generator,
                                                          gridService,
                                                          sequentialWorkflowService) {
        'ngInject';
        var self = this;

        self.controllerName = 'followupEmployeeInboxCtrl';
        self.psPDFViewerEnabled = rootEntity.hasPSPDFViewer();

        self.progress = null;
        contextHelpService.setHelpTo('followup-employee-inbox');
        var gridSearchColumns = {
            serial: 'generalStepElm.docFullSerial',
            subject: 'generalStepElm.docSubject',
            receivedDate: 'generalStepElm.receivedDate',
            action: function (record) {
                return self.getSortingKey('action', 'WorkflowAction');
            },
            sender: function (record) {
                return self.getSortingKey('senderInfo', 'SenderInfo');
            },
            dueDate: 'generalStepElm.dueDate',
            corrSite: function (record) {
                return self.getSortingKey('mainSiteSubSiteString', 'Information');
            },
            numberOfDays: 'generalStepElm.numberOfDays',

        };

        /**
         * @description All followup employee inbox
         * @type {*}
         */

        self.followupEmployeeInboxes = [];
        self.followupEmployeeInboxesCopy = [];

        self.langService = langService;

        /**
         * @description Contains methods for Star operations for followup employee inbox items
         */
        self.starServices = {
            'false': followupEmployeeInboxService.controllerMethod.followupEmployeeInboxStar,
            'true': followupEmployeeInboxService.controllerMethod.followupEmployeeInboxUnStar,
            'starBulk': followupEmployeeInboxService.controllerMethod.followupEmployeeInboxStarBulk,
            'unStarBulk': followupEmployeeInboxService.controllerMethod.followupEmployeeInboxUnStarBulk
        };

        /**
         * @description Contains the selected followup employee inbox
         * @type {Array}
         */
        self.selectedFollowupEmployeeInboxes = [];
        self.globalSetting = rootEntity.returnRootEntity().settings;

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.inbox.followupEmp) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.inbox.followupEmp, self.followupEmployeeInboxes),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.inbox.followupEmp, limit);
            },
            searchColumns: gridSearchColumns,
            searchText: '',
            searchCallback: function (grid) {
                self.followupEmployeeInboxes = gridService.searchGridData(self.grid, self.followupEmployeeInboxesCopy);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.inbox.followupEmp),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.inbox.followupEmp, self.grid.truncateSubject);
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
         * @description Replaces the record in grid after update
         * @param record
         */
        self.replaceRecord = function (record) {
            var index = _.findIndex(self.followupEmployeeInboxes, {'id': record.id});
            if (index > -1)
                self.followupEmployeeInboxes.splice(index, 1, record);
            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.followupEmployeeInboxes = $filter('orderBy')(self.followupEmployeeInboxes, self.grid.order);
        };

        /**
         * @description Reload the grid of followup employee inbox
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadFollowupEmployeeInboxes = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return followupEmployeeInboxService
                .loadFollowupEmployeeInboxes(self.selectedUserForFollowUpEmployeeInbox, self.selectedOrganizationForFollowUpEmployeeInbox, self.selectedSecurityLevels)
                .then(function (result) {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.followupEmployeeInboxes = result;

                    self.followupEmployeeInboxesCopy = angular.copy(self.followupEmployeeInboxes);
                    self.selectedFollowupEmployeeInboxes = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        self.selectedOrganizationForFollowUpEmployeeInbox = null;
        self.selectedUserForFollowUpEmployeeInbox = null;
        self.selectedSecurityLevels = null;

        self.getEmployeeForFollowupEmployeeInbox = function ($event) {
            followupEmployeeInboxService
                .controllerMethod
                .openOrganizationAndUserDialog(self.selectedOrganizationForFollowUpEmployeeInbox, self.selectedUserForFollowUpEmployeeInbox, self.selectedSecurityLevels, false, $event)
                .then(function (result) {
                    self.selectedOrganizationForFollowUpEmployeeInbox = result.organization;
                    self.selectedUserForFollowUpEmployeeInbox = result.applicationUser;
                    self.currentSelectedUser = result.applicationUser;
                    self.selectedSecurityLevels = result.securityLevels;
                    self.reloadFollowupEmployeeInboxes(self.grid.page);
                });
        };

        self.getEmployeeForFollowupEmployeeInbox();

        /**
         * @description Move To Folder Followup Employee inboxes Bulk
         * @param $event
         */
        /*self.moveToFolderFollowupEmployeeInboxBulk = function ($event) {
            var itemsToAdd = _.map(self.selectedFollowupEmployeeInboxes, 'generalStepElm.workObjectNumber');
            userFolderService
                .controllerMethod
                .addToUserFolderBulk(itemsToAdd, self.selectedFollowupEmployeeInboxes, $event)
                .then(function (result) {
                    self.reloadFollowupEmployeeInboxes(self.grid.page);
                });
        };*/

        /* /!**
         * @description Terminate followup employee inbox Bulk
         * @param $event
         *!/
         self.terminateBulk = function ($event) {
         var numberOfRecordsToTerminate = angular.copy(self.selectedFollowupEmployeeInboxes.length);
         followupEmployeeInboxService
         .controllerMethod
         .followupEmployeeInboxTerminateBulk(self.selectedFollowupEmployeeInboxes, $event)
         .then(function () {
         $timeout(function () {
         self.reloadFollowupEmployeeInboxes(self.grid.page)
         .then(function () {
         if (numberOfRecordsToTerminate === 1)
         toast.success(langService.get("selected_terminate_success"));
         });
         }, 100);
         });
         };*/

        /**
         * @description Change the starred for followup employee inbox
         * @param followupEmployeeInbox
         * @param $event
         */
        self.changeFollowupEmployeeInboxStar = function (followupEmployeeInbox, $event) {
            self.starServices[followupEmployeeInbox.generalStepElm.starred](followupEmployeeInbox)
                .then(function (result) {
                    if (result) {
                        self.reloadFollowupEmployeeInboxes(self.grid.page)
                            .then(function () {
                                if (!followupEmployeeInbox.generalStepElm.starred)
                                    toast.success(langService.get("star_specific_success").change({name: followupEmployeeInbox.generalStepElm.docSubject}));
                                else
                                    toast.success(langService.get("unstar_specific_success").change({name: followupEmployeeInbox.generalStepElm.docSubject}));
                            });
                    } else {
                        dialog.errorMessage(langService.get('something_happened_when_update_starred'));
                    }
                })
                .catch(function () {
                    dialog.errorMessage(langService.get('something_happened_when_update_starred'));
                });
        };

        /**
         * @description Change the starred for followup employee inbox Bulk
         * @param starUnStar
         * @param $event
         */
        self.changeFollowupEmployeeInboxStarBulk = function (starUnStar, $event) {
            self.starServices[starUnStar](self.selectedFollowupEmployeeInboxes)
                .then(function (result) {
                    self.reloadFollowupEmployeeInboxes(self.grid.page);
                });
        };


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
                        self.reloadFollowupEmployeeInboxes(self.grid.page)
                            .then(function () {
                                toast.success(langService.get("add_to_favorite_specific_success").change({
                                    name: followupEmployeeInbox.getTranslatedName()
                                }));
                            });
                    } else {
                        dialog.alertMessage(langService.get(result.message));
                    }
                });
        };

        /**
         * @description Archive the document to icn
         * @param workItem
         * @param $event
         * @param defer
         */
        self.addToIcnArchive = function (workItem, $event, defer) {
            workItem.addToIcnArchiveDialog($event)
                .then(function () {
                    self.reloadFollowupEmployeeInboxes(self.grid.page);
                    new ResolveDefer(defer);
                });
        };

        /* /!**
         * @description Terminate followup employee Item
         * @param followupEmployeeInbox
         * @param $event
         * @param defer
         *!/
         self.terminate = function (followupEmployeeInbox, $event, defer) {
         followupEmployeeInboxService
         .controllerMethod
         .followupEmployeeInboxTerminate(followupEmployeeInbox, $event)
         .then(function () {
         self.reloadFollowupEmployeeInboxes(self.grid.page)
         .then(function () {
         toast.success(langService.get("terminate_specific_success").change({name: followupEmployeeInbox.getTranslatedName()}));
         new ResolveDefer(defer);
         });
         });
         };*/

        /**
         * @description Get the link of followup employee inbox
         * @param followupEmployeeInbox
         * @param $event
         */
        self.getLink = function (followupEmployeeInbox, $event) {
            var info = followupEmployeeInbox.getInfo();
            viewDocumentService.loadDocumentViewUrlWithOutEdit(info.vsId).then(function (result) {
                //var docLink = "<a target='_blank' href='" + result + "'>" + result + "</a>";
                dialog.successMessage(langService.get('link_message').change({result: result}), null, null, null, null, true);
                return true;
            });
        };

        /**
         *@description reset workflow
         * @param followupEmployeeInbox
         * @param $event
         */
        self.resetWorkflow = function (followupEmployeeInbox, $event) {
            sequentialWorkflowService.resetSeqWF(followupEmployeeInbox, $event)
                .then(function (result) {
                    toast.success(langService.get('success_reset_seq_wf'));
                    self.reloadFollowupEmployeeInboxes(self.grid.page);
                    dialog.cancel();
                })
        };

        /**
         * @description View Tracking Sheet
         * @param followupEmployeeInbox
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (followupEmployeeInbox, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(followupEmployeeInbox, params, $event).then(function (result) {
            });
        };

        /**
         * @description Manage Tags
         * @param followupEmployeeInbox
         * @param $event
         */
        self.manageTags = function (followupEmployeeInbox, $event) {
            var info = followupEmployeeInbox.getInfo();
            var wfName = 'outgoing';
            managerService.manageDocumentTags(info.vsId, wfName, followupEmployeeInbox.getTranslatedName(), $event)
                .then(function () {
                    self.reloadFollowupEmployeeInboxes(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadFollowupEmployeeInboxes(self.grid.page);
                });
        };

        /**
         * @description Manage Comments
         * @param followupEmployeeInbox
         * @param $event
         */
        self.manageComments = function (followupEmployeeInbox, $event) {
            var info = followupEmployeeInbox.getInfo();
            var wfName = 'outgoing';
            followupEmployeeInbox.manageDocumentComments($event)
                .then(function () {
                    self.reloadFollowupEmployeeInboxes(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadFollowupEmployeeInboxes(self.grid.page);
                });
        };

        /**
         * @description Manage Tasks
         * @param followupEmployeeInbox
         * @param $event
         */
        self.manageTasks = function (followupEmployeeInbox, $event) {
            console.log('manageFollowupEmployeeInboxTasks : ', followupEmployeeInbox);
        };

        /**
         * @description Manage Attachments
         * @param followupEmployeeInbox
         * @param $event
         */
        self.manageAttachments = function (followupEmployeeInbox, $event) {
            followupEmployeeInbox.manageDocumentAttachments($event);
        };


        /**
         * @description Manage Linked Documents
         * @param followupEmployeeInbox
         * @param $event
         */
        self.manageDocuments = function (followupEmployeeInbox, $event) {
            var info = followupEmployeeInbox.getInfo();
            managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass, "welcome")
                .then(function () {
                    self.reloadFollowupEmployeeInboxes();
                })
                .catch(function () {
                    self.reloadFollowupEmployeeInboxes();
                });

        };

        /**
         * @description Manage Linked Entities
         * @param followupEmployeeInbox
         * @param $event
         */
        self.manageLinkedEntities = function (followupEmployeeInbox, $event) {
            var wfName = 'outgoing';
            managerService
                .manageDocumentEntities(followupEmployeeInbox.generalStepElm.vsId, wfName.toLowerCase(), followupEmployeeInbox.generalStepElm.docSubject, $event);
        };

        /**
         * @description Download Main Document
         * @param workItem
         * @param $event
         */
        self.downloadMainDocument = function (workItem, $event) {
            workItem
                .mainDocumentDownload($event);
        };

        /**
         * @description Download Composite Document
         * @param workItem
         * @param $event
         */
        self.downloadCompositeDocument = function (workItem, $event) {
            workItem
                .compositeDocumentDownload($event);
        };

        /**
         * @description download selected document
         * @param followupEmployeeInbox
         * @param $event
         */
        self.downloadSelected = function (followupEmployeeInbox, $event) {
            downloadService.openSelectedDownloadDialog(followupEmployeeInbox, $event);
        };

        /**
         * @description merge and download
         * @param followupEmployeeInbox
         */
        self.mergeAndDownloadFullDocument = function (followupEmployeeInbox) {
            downloadService.mergeAndDownload(followupEmployeeInbox);
        };

        /**
         * @description Send Link To Document By Email
         * @param followupEmployeeInbox
         * @param $event
         */
        self.sendFollowupEmployeeInboxLinkToDocumentByEmail = function (followupEmployeeInbox, $event) {
            followupEmployeeInbox
                .getMainDocumentEmailContent($event);
        };

        /**
         * @description Send Composite Document As Attachment By Email
         * @param followupEmployeeInbox
         * @param $event
         */
        self.sendFollowupEmployeeInboxCompositeDocumentAsAttachmentByEmail = function (followupEmployeeInbox, $event) {
            followupEmployeeInbox
                .getCompositeDocumentEmailContent($event);
        };

        /**
         * @description Send Main Document Fax
         * @param followupEmployeeInbox
         * @param $event
         */
        self.sendFollowupEmployeeInboxMainDocumentFax = function (followupEmployeeInbox, $event) {
            console.log('sendFollowupEmployeeInboxMainDocumentFax : ', followupEmployeeInbox);
        };

        /**
         * @description Send Composite Document By Fax
         * @param followupEmployeeInbox
         * @param $event
         */
        self.sendFollowupEmployeeInboxCompositeDocumentByFax = function (followupEmployeeInbox, $event) {
            console.log('sendFollowupEmployeeInboxCompositeDocumentByFax : ', followupEmployeeInbox);
        };

        /**
         * @description Send SMS
         * @param followupEmployeeInbox
         * @param $event
         */
        self.sendSMS = function (followupEmployeeInbox, $event) {
            console.log('sendFollowupEmployeeInboxSMS : ', followupEmployeeInbox);
        };

        /**
         * @description Move To Folder
         * @param followupEmployeeInbox
         * @param $event
         */
        /*self.moveToFolderFollowupEmployeeInbox = function (followupEmployeeInbox, $event) {
            userFolderService
                .controllerMethod
                .addToUserFolder(followupEmployeeInbox.generalStepElm.workObjectNumber, followupEmployeeInbox.generalStepElm.folderId, followupEmployeeInbox, $event)
                .then(function (result) {
                    if (result === -1) {
                        toast.error(langService.get("inbox_failed_add_to_folder_selected"));
                    }
                    else {
                        self.reloadFollowupEmployeeInboxes(self.grid.page)
                            .then(function () {
                                var currentFolder = _.find(userFolderService.allUserFolders, ['id', result]);
                                toast.success(langService.get("inbox_add_to_folder_specific_success").change({
                                    name: followupEmployeeInbox.getTranslatedName(),
                                    folder: currentFolder.getTranslatedName()
                                }));
                            });
                    }
                });
        };*/

        /**
         * @description Checks if edit properties is allowed
         * @param model
         * @param checkForViewPopup
         * @returns {boolean}
         */
        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var info = model.getInfo();
            var hasPermission = false;
            if (info.documentClass === "internal") {
                //If approved internal electronic, don't allow to edit
                if (info.docStatus >= 24 && !info.isPaper)
                    hasPermission = false;
                else
                    hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES");
            } else if (info.documentClass === "incoming")
                hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES");
            else if (info.documentClass === "outgoing") {
                //If approved outgoing electronic, don't allow to edit
                if (info.docStatus >= 24 && !info.isPaper)
                    hasPermission = false;
                else
                    hasPermission = employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES");
            }
            if (checkForViewPopup)
                return !hasPermission || model.isBroadcasted();
            return hasPermission && !model.isBroadcasted();
        };

        /**
         * @description Checks if edit correspondence sites(destinations) is allowed
         * @param model
         * @param checkForViewPopup
         * @returns {*}
         */
        var checkIfEditCorrespondenceSiteAllowed = function (model, checkForViewPopup) {
            var info = model.getInfo();
            var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
            var allowed = (hasPermission && info.documentClass !== "internal");
            if (checkForViewPopup)
                return !(allowed);
            return allowed;
        };

        /**
         * @description Preview document
         * @param workItem
         * @param $event
         */
        self.previewDocument = function (workItem, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            workItem.viewProxyInboxWorkItem(self.gridActions, checkIfEditPropertiesAllowed(workItem, true), checkIfEditCorrespondenceSiteAllowed(workItem, true))
                .then(function () {
                    return self.reloadFollowupEmployeeInboxes(self.grid.page);
                })
                .catch(function () {
                    return self.reloadFollowupEmployeeInboxes(self.grid.page);
                });
        };

        /**
         * @description View document
         * @param workItem
         * @param $event
         */
        self.viewDocument = function (workItem, $event) {
            var info = workItem.getInfo();
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            workItem
                .viewNewProxyDocument(self.gridActions, 'proxyMail', $event)
                .then(function () {
                    return self.reloadFollowupEmployeeInboxes(self.grid.page);
                })
                .catch(function () {
                    return self.reloadFollowupEmployeeInboxes(self.grid.page);
                });
        };

        /**
         * @description Print Barcode
         * @param workItem
         * @param $event
         */
        self.printBarcode = function (workItem, $event) {
            workItem.barcodePrint($event);
        };

        self.checkIfBulkTransferAllowed = function () {
            return _.every(self.selectedFollowupEmployeeInboxes, function (item) {
                return !item.hasActiveSeqWF();
            });
        };

        /**
         * @description Transfer to another employee
         * @param workItem
         * @param $event
         * @param defer
         */
        self.transferToAnotherEmployee = function (workItem, $event, defer) {
            correspondenceService
                .openTransferDialog(workItem, self.selectedOrganizationForFollowUpEmployeeInbox, self.currentSelectedUser, $event)
                .then(function () {
                    self.reloadFollowupEmployeeInboxes(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('transfer_mail_success'));
                            new ResolveDefer(defer)
                        });
                })
        };

        self.transferToAnotherEmployeeBulk = function ($event) {
            correspondenceService
                .openTransferDialog(self.selectedFollowupEmployeeInboxes, self.selectedOrganizationForFollowUpEmployeeInbox, self.currentSelectedUser, $event)
                .then(function () {
                    self.reloadFollowupEmployeeInboxes(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('transfer_mail_success'))
                        });
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
                        wobNum: info.wobNumber
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
                        wobNum: info.wobNumber
                    });
                });
        };

        self.viewInDeskTop = function (workItem) {
            return correspondenceService.viewWordInDesktop(workItem);
        };

        self.getTrackingSheetCallback = function (record, $event) {
            var action = self.gridActions.find(action => {
                return action.text === "grid_action_view_tracking_sheet" && action.onlyShortcut;
            });

            return action.callback(record, action.params, $event);
        }

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
                        checkShow: function (action, model) {
                            return true;
                        },
                        gridName: 'follow-up-employee-inbox'
                    }
                ],
                class: "action-green",
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                }
            },
            // view
            {
                type: 'action',
                icon: 'book-open-variant',
                text: 'grid_action_view',
                shortcut: false,
                callback: self.previewDocument,
                class: "action-green",
                showInView: false,
                permissionKey: [
                    'VIEW_DOCUMENT',
                    'VIEW_DOCUMENT_VERSION'
                ],
                checkAnyPermission: true,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                subMenu: [
                    // Preview
                    {
                        type: 'action',
                        icon: 'book-open-variant',
                        text: 'grid_action_preview_document',
                        shortcut: true,
                        callback: self.previewDocument,
                        class: "action-green",
                        showInView: false,
                        permissionKey: 'VIEW_DOCUMENT',
                        checkShow: function (action, model) {
                            //If no content, hide the button
                            return model.hasContent();
                        }
                    },
                    // Open
                    {
                        type: 'action',
                        icon: 'book-open-page-variant',
                        text: 'grid_action_open',
                        shortcut: true,
                        callback: self.viewDocument,
                        class: "action-green",
                        showInView: false,
                        permissionKey: 'VIEW_DOCUMENT',
                        checkShow: function (action, model) {
                            //If no content, hide the button
                            return model.hasContent();
                        }
                    },
                    // show versions
                    {
                        type: 'action',
                        icon: 'animation',
                        text: 'grid_action_view_specific_version',
                        shortcut: false,
                        hide: false,
                        callback: self.getDocumentVersions,
                        permissionKey: "VIEW_DOCUMENT_VERSION",
                        class: "action-green",
                        showInView: true,
                        showInViewOnly: true,
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // viewInDeskTop
                    {
                        type: 'action',
                        icon: 'monitor',
                        text: 'grid_action_view_in_desktop',
                        shortcut: false,
                        hide: false,
                        callback: self.viewInDeskTop,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        showInView: false,
                        checkShow: function (action, model) {
                            var info = model.getInfo(), isAllowed = true;
                            if (model.hasActiveSeqWF()) {
                                return false;
                            }
                            if (model.isCorrespondenceApprovedBefore()) {
                                isAllowed = rootEntity.getGlobalSettings().isAllowEditAfterFirstApprove();
                            }
                            if (!isAllowed) {
                                return false;
                            }
                            return info.needToApprove();
                        }
                    }
                ]
            },
            // Separator
            {
                type: 'separator',
                checkShow: function (action, model) {
                    return true;
                },
                showInView: false
            },
            // Add To
            {
                type: 'action',
                icon: 'plus',
                text: 'grid_action_add_to',
                class: "action-green",
                permissionKey: [
                    'MANAGE_FAVORITE',
                    'ICN_ENTRY_TEMPLATE'
                ],
                checkAnyPermission: true,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                subMenu: [
                    // Add To Favorite
                    {
                        type: 'action',
                        icon: 'star',
                        text: 'grid_action_to_favorite',
                        permissionKey: "MANAGE_FAVORITE",
                        callback: self.addToFavorite,
                        class: "action-green",
                        shortcut: false,
                        showInViewOnly: true,
                        checkShow: function (action, model, showInViewOnly) {
                            return !model.isBroadcasted();
                        }
                    },
                    // Add To ICN Archive
                    {
                        type: 'action',
                        icon: 'archive',
                        text: 'grid_action_icn_archive',
                        callback: self.addToIcnArchive,
                        class: "action-green",
                        permissionKey: 'ICN_ENTRY_TEMPLATE',
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                shortcut: false,
                showInView: false,
                showInViewOnly: true,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "MANAGE_DOCUMENT’S_TAGS",
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
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Comments
                    {
                        type: 'action',
                        icon: 'comment',
                        text: 'grid_action_comments',
                        shortcut: false,
                        callback: self.manageComments,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
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
                        checkShow: function (action, model) {
                            return true;
                        }
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
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Linked Documents
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_linked_documents',
                        shortcut: false,
                        permissionKey: "MANAGE_LINKED_DOCUMENTS",
                        callback: self.manageDocuments,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
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
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Download
            {
                type: 'action',
                icon: 'download',
                text: 'grid_action_download',
                shortcut: false,
                showInViewOnly: true,
                checkShow: function (action, model) {
                    var isAllowed = true;
                    if (model.isCorrespondenceApprovedBefore() && model.getInfo().authorizeByAnnotation) {
                        isAllowed = rootEntity.getGlobalSettings().isAllowEditAfterFirstApprove();
                    }

                    return isAllowed && gridService.checkToShowMainMenuBySubMenu(action, model) && !correspondenceService.isLimitedCentralUnitAccess(model);
                },
                permissionKey: [
                    "DOWNLOAD_MAIN_DOCUMENT",
                    "DOWNLOAD_COMPOSITE_BOOK"
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
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Composite Document
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_composite_document',
                        permissionKey: 'DOWNLOAD_COMPOSITE_BOOK',
                        shortcut: false,
                        callback: self.downloadCompositeDocument,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // download selected
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'selective_document',
                        permissionKey: 'DOWNLOAD_COMPOSITE_BOOK',
                        callback: self.downloadSelected,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // merge and download
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'merge_and_download',
                        permissionKey: 'DOWNLOAD_COMPOSITE_BOOK',
                        callback: self.mergeAndDownloadFullDocument,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Send
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_send',
                shortcut: false,
                showInViewOnly: true,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model) && !correspondenceService.isLimitedCentralUnitAccess(model);
                },
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
                        permissionKey: 'SEND_COMPOSITE_DOCUMENT_BY_EMAIL',
                        callback: self.sendFollowupEmployeeInboxLinkToDocumentByEmail,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Composite Document As Attachment By Email
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_composite_document_as_attachment_by_email',
                        shortcut: false,
                        permissionKey: 'SEND_COMPOSITE_DOCUMENT_BY_EMAIL',
                        callback: self.sendFollowupEmployeeInboxCompositeDocumentAsAttachmentByEmail,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Main Document Fax
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_send_document_by_fax',
                        shortcut: false,
                        hide: true,
                        permissionKey: "SEND_DOCUMENT_BY_FAX",
                        callback: self.sendFollowupEmployeeInboxMainDocumentFax,
                        class: "action-red",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // SMS
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'grid_action_send_sms',
                        shortcut: false,
                        hide: false,
                        permissionKey: "SEND_SMS",
                        callback: self.sendSMS,
                        class: "action-red",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            /* Not Required as per discussion with Mr. Abu Al Nassr */
            /* // Terminate
             {
             type: 'action',
             icon: 'stop',
             text: 'grid_action_terminate',
             shortcut: true,
             callback: self.terminate,
             class: "action-green",
             checkShow: function (action, model) {
                            return true;
                        }
             },*/
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
                    return (info.documentClass === "incoming" || ((info.documentClass === "outgoing" || info.documentClass === 'internal') && (!model.needApprove() || info.isPaper)));
                }
            },
            // Transfer To Another Employee
            {
                type: 'action',
                icon: 'transfer',
                text: 'transfer_mail',
                shortcut: true,
                callback: self.transferToAnotherEmployee,
                class: "action-green",
                showInView: true,
                checkShow: function (action, model) {
                    return !model.hasActiveSeqWF();
                }
            },
            /* // Move To Folder
             {
                 type: 'action',
                 icon: 'folder-plus',
                 text: 'grid_action_move_to_folder',
                 hide: true,
                 shortcut: true,
                 callback: self.moveToFolderFollowupEmployeeInbox,
                 class: "action-green",
                 checkShow: function (action, model) {
                            return true;
                        }
             },*/
            // Get Link
            {
                type: 'action',
                icon: 'link',
                text: 'grid_action_get_link',
                shortcut: false,
                permissionKey: 'GET_A_LINK_TO_THE_DOCUMENT',
                callback: self.getLink,
                class: "action-green",
                hide: true,
                showInView: true,
                showInViewOnly: true,
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Reset Workflow
            {
                type: 'action',
                icon: 'playlist-remove',
                text: 'reset_seq_wf',
                permissionKey: "MULTI_SIGNATURE_RESET",
                callback: self.resetWorkflow,
                class: "action-green",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    if (info.documentClass === 'incoming') {
                        return false;
                    }

                    return model.hasActiveSeqWF() ||
                        (!info.isPaper && info.docStatus === 23);
                }
            },
            // View Tracking Sheet
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view_tracking_sheet',
                shortcut: false,
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: function (action, model) {
                    return true;
                },
                subMenu: viewTrackingSheetService.getViewTrackingSheetOptions('grid')
            },
            // View Tracking Sheet (Shortcut Only)
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view_tracking_sheet',
                shortcut: true,
                onlyShortcut: true,
                showInView: false,
                hide: true,
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: function (action, model) {
                    return true;
                },
                callback: self.viewTrackingSheet,
                params: ['view_tracking_sheet', 'tabs']
            },
            // Duplicate
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_duplicate',
                shortcut: false,
                showInView: false,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "DUPLICATE_BOOK_CURRENT",
                    "DUPLICATE_BOOK_FROM_VERSION"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // duplicate current version
                    {
                        type: 'action',
                        icon: 'content-copy',
                        text: 'grid_action_duplication_current_version',
                        shortcut: false,
                        hide: false,
                        callback: self.duplicateCurrentVersion,
                        class: "action-green",
                        permissionKey: 'DUPLICATE_BOOK_CURRENT',
                        showInView: true,
                        showInViewOnly: true,
                        checkShow: function (action, model, showInViewOnly) {
                            var info = model.getInfo();
                            return (info.documentClass === 'outgoing' || info.documentClass === 'internal') && !info.isPaper
                        }
                    },
                    // duplicate specific version
                    {
                        type: 'action',
                        icon: 'content-duplicate',
                        text: 'grid_action_duplication_specific_version',
                        shortcut: false,
                        hide: false,
                        callback: self.duplicateVersion,
                        class: "action-green",
                        showInView: true,
                        showInViewOnly: true,
                        permissionKey: 'DUPLICATE_BOOK_FROM_VERSION',
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            }
        ];

        self.shortcutActions = gridService.getShortcutActions(self.gridActions);
        self.contextMenuActions = gridService.getContextMenuActions(self.gridActions);

        /**
         * @description Mark item as read/unread
         * @param workItem
         * @param $event
         */
        self.markAsReadUnread = function (workItem, $event) {
            return workItem.markAsReadUnread($event)
                .then(function (result) {
                    self.replaceRecord(result);
                    counterService.loadCounters();
                })
        }
    });
};
