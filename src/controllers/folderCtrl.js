module.exports = function (app) {
    app.controller('folderCtrl', function (langService,
                                           folders,
                                           $q,
                                           $filter,
                                           $state,
                                           dialog,
                                           toast,
                                           managerService,
                                           mailNotificationService,
                                           counterService,
                                           userFolderService,
                                           employeeService,
                                           viewDocumentService,
                                           downloadService,
                                           UserFolder,
                                           ResolveDefer,
                                           viewTrackingSheetService,
                                           correspondenceService,
                                           userInboxService,
                                           errorCode,
                                           contextHelpService,
                                           generator,
                                           _,
                                           rootEntity,
                                           gridService,
                                           $scope,
                                           configurationService) {
        'ngInject';
        var self = this;
        self.controllerName = 'folderCtrl';
        contextHelpService.setHelpTo('folders');
        self.employeeService = employeeService;

        self.workItems = [];
        self.workItemsCopy = angular.copy(self.workItems);
        self.selectedWorkItems = [];
        self.folders = folders;
        self.psPDFViewerEnabled = rootEntity.hasPSPDFViewer();

        self.sidebarStatus = false;
        // to display the user Inbox folder
        self.inboxFolders = [new UserFolder({
            arName: langService.getKey('menu_item_user_inbox', 'ar'),
            enName: langService.getKey('menu_item_user_inbox', 'en'),
            id: 0
        }).setChildren(self.folders)];

        /**
         * @description prepare the folders to display it again after reload.
         * @param folders
         * @private
         */
        function __prepareFolders(folders) {
            self.inboxFolders = [new UserFolder({
                arName: langService.getKey('menu_item_user_inbox', 'ar'),
                enName: langService.getKey('menu_item_user_inbox', 'en'),
                id: 0
            }).setChildren(folders)];
        }

        /**
         * @description
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.inbox.folder) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.inbox.folder, self.workItems),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.inbox.folder, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.inbox.folder),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.inbox.folder, self.grid.truncateSubject);
            },
            searchColumns: {
                serial: 'generalStepElm.docFullSerial',
                subject: 'generalStepElm.docSubject',
                receivedDateTime: 'receivedDateTime',
                action: function (record) {
                    return self.getSortingKey('action', 'WorkflowAction');
                },
                sender: function (record) {
                    return self.getSortingKey('senderInfo', 'SenderInfo');
                },
                dueDate: 'generalStepElm.dueDate'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.workItems = gridService.searchGridData(self.grid, self.workItemsCopy);
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
         * @description toggle sidebar folders.
         */
        self.toggleSidebarFolder = function () {
            self.sidebarStatus = !self.sidebarStatus;
        };
        self.toggleSidebarFolder();

        /**
         * @description get clicked folder content.
         * @param folder
         * @param $event
         * @returns {*}
         */
        self.getFolderContent = function (folder, $event) {
            if (folder.id === 0)
                return;
            self.selectedFolder = folder;
            return self.reloadFolders(self.grid.page);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function (order) {
            order = order ? order : '';
            self.workItems = $filter('orderBy')(self.workItems, order);
        };

        /**
         * @description reload current folder
         * @param pageNumber
         */
        self.reloadFolders = function (pageNumber) {
            if (!self.selectedFolder)
                return;
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return correspondenceService
                .loadUserInboxByFolder(self.selectedFolder)
                .then(function (workItems) {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.workItems = workItems;
                    self.workItemsCopy = angular.copy(self.workItems);
                    self.selectedWorkItems = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return self.workItems;
                });
        };

        self.moveToFolder = function (workItem, $event, defer) {
            workItem
                .addToFolder($event, true)
                .then(function () {
                    self.reloadFolders(self.grid.page);
                });
        };
        /**
         * @description move bulk to folder
         * @param $event
         */
        self.moveToFolderBulk = function ($event) {
            return correspondenceService
                .showAddBulkWorkItemsToFolder(self.selectedWorkItems, $event, true)
                .then(function () {
                    self.reloadFolders(self.grid.page);
                });
        };


        /**
         * @description Terminate folder items Bulk
         * @param $event
         */
        self.terminateBulk = function ($event) {
            correspondenceService
                .terminateBulkWorkItem(self.selectedWorkItems, $event)
                .then(function () {
                    self.reloadFolders(self.grid.page);
                });
        };


        /**
         * @description Launch distribution workflow for selected review outgoing mails
         * @param $event
         */
        self.forwardBulk = function ($event) {
            /*var itemsAlreadyBroadCasted = [];
            _.filter(self.selectedWorkItems, function (workItem) {
                if (workItem.isBroadcasted())
                    itemsAlreadyBroadCasted.push(workItem.generalStepElm.vsId);
            });
            var selectedItems = angular.copy(self.selectedWorkItems);
            if (itemsAlreadyBroadCasted && itemsAlreadyBroadCasted.length) {
                if (itemsAlreadyBroadCasted.length === selectedItems.length) {
                    dialog.alertMessage(langService.get('selected_items_are_broadcasted_can_not_forward'));
                    return false;
                }
                dialog.confirmMessage(langService.get('some_items_are_broadcasted_skip_and_forward'), null, null, $event).then(function () {
                    self.selectedWorkItems = selectedItems = _.filter(self.selectedWorkItems, function (workItem) {
                        return itemsAlreadyBroadCasted.indexOf(workItem.generalStepElm.vsId) === -1;
                    });
                    if (self.selectedWorkItems.length)
                        forwardBulk(selectedItems, $event);
                })
            } else {
                forwardBulk(selectedItems, $event);
            }*/
            forwardBulk(self.selectedWorkItems, $event);
        };

        function forwardBulk(selectedItems, $event) {
            return correspondenceService
                .launchCorrespondenceWorkflow(selectedItems, $event, 'forward', 'favorites')
                .then(function () {
                    self.reloadFolders(self.grid.page);
                });
        }

        /**
         * @description Change the starred for user inbox
         * @param workItem
         * @param $event
         */
        self.changeStar = function (workItem, $event) {
            workItem.toggleStar().then(function () {
                self.reloadFolders(self.grid.page);
            });
        };

        /**
         * @description Change the starred for user inboxes Bulk
         * @param starUnStar
         * @param $event
         */
        self.changeStarBulk = function (starUnStar, $event) {
            self.starServices[starUnStar](self.selectedWorkItems)
                .then(function () {
                    self.reloadFolders(self.grid.page);
                });
        };

        /**
         * @description Terminate User Inbox Item
         * @param workItem
         * @param $event
         * @param defer
         */
        self.terminate = function (workItem, $event, defer) {
            workItem
                .terminate($event)
                .then(function () {
                    new ResolveDefer(defer);
                    self.reloadFolders(self.grid.page);
                });
        };

        /**
         * @description annotate document
         * @param workItem
         * @param $event
         * @param defer
         */
        self.annotateDocument = function (workItem, $event, defer) {
            workItem.openForAnnotation()
                .then(function () {
                    self.reloadFolders(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
                .catch(function () {
                    self.reloadFolders(self.grid.page);
                });
        };

        /**
         * @description add an item to the favorite documents
         * @param workItem
         * @param $event
         */
        self.addToFavorite = function (workItem, $event) {
            workItem.addToFavorite().then(function () {
                self.reloadFolders(self.grid.page)
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
                    self.reloadFolders(self.grid.page);
                    new ResolveDefer(defer);
                });
        };

        /**
         * @description Create Reply
         * @param workItem
         * @param $event
         * @param defer
         */
        self.createReply = function (workItem, $event, defer) {
            workItem.createReply($event, false)
                .then(function (result) {
                    new ResolveDefer(defer);
                }).catch(function (error) {
                if (error && errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                    dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: workItem.getInfo().wobNumber}));
                    return false;
                }
            });
        };
        /**
         * @description Create Reply Specific version
         * @param workItem
         * @param $event
         * @param defer
         */
        self.createReplySpecificVersion = function (workItem, $event, defer) {
            workItem.createReply($event, true)
                .then(function (result) {
                    new ResolveDefer(defer);
                }).catch(function (error) {
                if (error && errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                    dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: workItem.getInfo().wobNumber}));
                    return false;
                }
            });
        };

        /**
         * @description Forward
         * @param workItem
         * @param $event
         * @param defer
         */
        self.forward = function (workItem, $event, defer) {
            workItem.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadFolders(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Launch Distribution Workflow with quick send
         * @param record
         * @param $event
         * @param defer
         */
        self.quickSend = function (record, $event, defer) {
            record.quickSendLaunchWorkflow($event, 'favorites')
                .then(function () {
                    self.reloadFolders(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description Reply user inbox
         * @param workItem
         * @param $event
         * @param defer
         */
        self.reply = function (workItem, $event, defer) {
            workItem.replySimple($event, 'reply')
                .then(function () {
                    self.reloadFolders(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Launch distribution workflow with sequential workflow
         * @param workItem
         * @param $event
         * @param defer
         */
        self.launchSequentialWorkflow = function (workItem, $event, defer) {
            workItem.openLaunchSequentialWorkflowDialog($event)
                .then(function () {
                    self.reloadFolders(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description Get the link of user inbox
         * @param workItem
         * @param $event
         */
        self.getLink = function (workItem, $event) {
            viewDocumentService.loadDocumentViewUrlWithOutEdit(workItem.generalStepElm.vsId).then(function (result) {
                //var docLink = "<a target='_blank' href='" + result + "'>" + result + "</a>";
                dialog.successMessage(langService.get('link_message').change({result: result}), null, null, null, null, true);
                return true;
            });
        };

        /**
         * @description Subscribe
         * @param workItem
         * @param $event
         */
        self.subscribe = function (workItem, $event) {
           // console.log('subscribe', workItem);
        };

        /**
         * @description Export user inbox (export to ready to export)
         * @param workItem
         * @param $event
         * @param defer
         */
        self.sendWorkItemToReadyToExport = function (workItem, $event, defer) {
            workItem.sendToReadyToExport($event).then(function () {
                self.reloadFolders(self.grid.page)
                    .then(function () {
                        toast.success(langService.get('export_success'));
                        new ResolveDefer(defer);
                    });
            })
        };

        /**
         * @description View Tracking Sheet
         * @param workItem
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (workItem, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(workItem, params, $event).then(function (result) {

            });
        };

        /**
         * @description Manage Tags
         * @param workItem
         * @param $event
         */
        self.manageTags = function (workItem, $event) {
            var info = workItem.getInfo();
            managerService.manageDocumentTags(info.vsId, info.documentClass, workItem.getTranslatedName(), $event)
                .then(function () {
                    self.reloadFolders(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadFolders(self.grid.page);
                });
        };

        /**
         * @description Manage Comments
         * @param workItem
         * @param $event
         */
        self.manageComments = function (workItem, $event) {
            var info = workItem.getInfo();
            workItem.manageDocumentComments($event)
                .then(function () {
                    self.reloadFolders(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadFolders(self.grid.page);
                });
        };

        /**
         * @description Manage Tasks
         * @param workItem
         * @param $event
         */
        self.manageTasks = function (workItem, $event) {
            // console.log('manageTasks : ', workItem);
        };

        /**
         * @description Manage Attachments
         * @param workItem
         * @param $event
         */
        self.manageAttachments = function (workItem, $event) {
            workItem.manageDocumentAttachments($event);
        };


        /**
         * @description Manage Linked Documents
         * @param workItem
         * @param $event
         */
        self.manageLinkedDocuments = function (workItem, $event) {
            workItem.manageDocumentLinkedDocuments($event)
                .then(function () {
                    self.reloadFolders(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadFolders(self.grid.page);
                });
        };

        /**
         * @description Manage Linked Entities
         * @param workItem
         * @param $event
         */
        self.manageLinkedEntities = function (workItem, $event) {
            workItem
                .manageDocumentEntities($event);
        };

        /**
         * @description Destinations
         * @param workItem
         * @param $event
         */
        self.manageDestinations = function (workItem, $event) {
            workItem.manageDocumentCorrespondence($event)
        };

        /**
         * @description View Direct Linked Documents
         * @param workItem
         * @param $event
         */
        self.viewDirectLinkedDocuments = function (workItem, $event) {
          //  console.log('viewDirectLinkedDocuments : ', workItem);
        };

        /**
         * @description View Complete Linked Documents
         * @param workItem
         * @param $event
         */
        self.viewCompleteLinkedDocuments = function (workItem, $event) {
           // console.log('viewCompleteLinkedDocuments : ', workItem);
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
         * @param workItem
         * @param $event
         */
        self.downloadSelected = function (workItem, $event) {
            downloadService.openSelectedDownloadDialog(workItem, $event);
        };

        /**
         * @description merge and download
         * @param workItem
         */
        self.mergeAndDownloadFullDocument = function (workItem) {
            downloadService.mergeAndDownload(workItem);
        };

        /**
         * @description Send Link To Document By Email
         * @param workItem
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (workItem, $event) {
            workItem
                .getMainDocumentEmailContent($event);
        };

        /**
         * @description Send Composite Document As Attachment By Email
         * @param workItem
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (workItem, $event) {
            workItem
                .getCompositeDocumentEmailContent($event);
        };

        /**
         * @description Send Main Document Fax
         * @param userInbox
         * @param $event
         */
        self.sendMainDocumentFax = function (userInbox, $event) {
            userInbox.openSendFaxDialog($event);
        };

        /**
         * @description Send SMS
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.sendSMS = function (userInbox, $event, defer) {
            userInbox.openSendSMSDialog($event)
                .then(function (result) {
                    new ResolveDefer(defer);
                });
        };

        /**
         * @description Send Document Link
         * @param userInbox
         * @param $event
         */
        self.sendDocumentLink = function (userInbox, $event) {
            userInbox.openSendDocumentURLDialog($event);
        };

        /**
         * @description conditional approve for the document
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.conditionalApprove = function (workItem, $event, defer) {
            workItem.applyConditionalApprove($event, defer)
                .then(function () {
                    new ResolveDefer(defer);
                    self.reloadFolders(self.grid.page);
                })
        };
        /**
         * @description Sign e-Signature
         * @param workItem
         * @param $event
         * @param defer
         * @param additionalData
         * @param sendAfterApprove
         */
        self.signESignature = function (workItem, $event, defer, additionalData, sendAfterApprove) {
            /*workItem
                .approveWorkItem($event, defer, null, null, preActionCallback)
                .then(function (result) {
                    self.reloadFolders(self.grid.page);
                });*/
            return workItem
                .approveWorkItem($event, defer, null, sendAfterApprove, additionalData)
                .then(function (result) {
                    if (sendAfterApprove)
                        return result;

                    workItem
                        .launchWorkFlowCondition($event, 'reply', null, true, function () {
                            return result === correspondenceService.authorizeStatus.INTERNAL_PERSONAL.text;
                        })
                        .then(function () {
                            self.reloadFolders(self.grid.page);
                        })
                        .catch(function () {
                            self.reloadFolders(self.grid.page);
                        });
                });
        };

        /**
         * @description Sign Digital Signature
         * @param workItem
         * @param $event
         * @param defer
         */
        self.signDigitalSignature = function (workItem, $event, defer) {
          //  console.log('signDigitalSignature : ', workItem);
        };

        /**
         * @description Edit Content
         * @param workItem
         * @param $event
         */
        self.editContent = function (workItem, $event) {
            workItem.manageDocumentContent($event);
        };

        /**
         * @description Edit Properties
         * @param workItem
         * @param $event
         */
        self.editProperties = function (workItem, $event) {
            var info = workItem.getInfo();
            managerService
                .manageDocumentProperties(info.vsId, info.documentClass, info.title, $event)
                .finally(function () {
                    self.reloadFolders(self.grid.page)
                });
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

            workItem.viewInboxWorkItem(self.gridActions, checkIfEditPropertiesAllowed(workItem, true), checkIfEditCorrespondenceSiteAllowed(workItem, true))
                .then(function () {
                    return self.reloadFolders(self.grid.page);
                })
                .catch(function () {
                    return self.reloadFolders(self.grid.page);
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

            if (info.hasActiveSeqWF && info.docStatus < 24 && self.psPDFViewerEnabled) {
                return workItem.openSequentialDocument()
                    .then(function () {
                        self.reloadFolders(self.grid.page);
                    })
                    .catch(function () {
                        self.reloadFolders(self.grid.page);
                    });
            }

            workItem.viewNewWorkItemDocument(self.gridActions, 'folder', $event)
                .then(function () {
                    return self.reloadFolders(self.grid.page);
                })
                .catch(function () {
                    return self.reloadFolders(self.grid.page);
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

        /**
         * @description do broadcast for workItem.
         */
        self.broadcast = function (workItem, $event, defer) {
            workItem
                .correspondenceBroadcast()
                .then(function () {
                    self.reloadFolders(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        })
                })
        };

        /**
         * @description edit word doucment in desktop
         * @param workItem
         * @return {Promise}
         */
        self.editInDesktop = function (workItem) {
            return correspondenceService.editWordInDesktop(workItem);
        };

        self.viewInDeskTop = function (workItem) {
            return correspondenceService.viewWordInDesktop(workItem);
        };

        /**
         * @description get child records to delete
         * @param folder
         * @param array
         * @returns {*}
         */
        function getChildIds(folder, array) {
            for (var i = 0; i < folder.children.length; i++) {
                array.push(folder.children[i].id);
                getChildIds(folder.children[i], array);
            }
            return array;
        }

        self.reloadUserFolders = function () {
            userFolderService
                .getUserFoldersForApplicationUser()
                .then(function (folders) {
                    __prepareFolders(folders);
                })
        };

        self.createFolder = function (folder, $event) {
            userFolderService
                .controllerMethod
                .userFolderAdd((folder.id ? folder : null), $event)
                .then(function () {
                    self.reloadUserFolders();
                });
        };

        self.editFolder = function (folder, $event) {
            userFolderService
                .controllerMethod
                .userFolderEdit(folder, $event)
                .then(function () {
                    self.reloadUserFolders();
                });
        };

        self.deleteFolder = function (folder, $event) {
            var array = [folder.id];
            getChildIds(folder, array);
            userFolderService
                .controllerMethod
                .userFolderDeleteBulk(array.reverse(), $event)
                .then(function () {
                    self.reloadUserFolders();
                });
        };

        /**
         * @description add workItem To My FollowUp
         * @param item
         */
        self.addToDirectFollowUp = function (item) {
            item.addToMyDirectFollowUp();
        };

        /**
         * @description add workItem To other user's FollowUp
         * @param item
         */
        self.addToEmployeeFollowUp = function (item) {
            item.addToUserFollowUp();
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
                        checkShow: function (action, model) {
                            return true;
                        }
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
                        permissionKey: 'VIEW_DOCUMENT',
                        showInView: false,
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
                        permissionKey: 'VIEW_DOCUMENT',
                        showInView: false,
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
            // Terminate
            {
                type: 'action',
                icon: 'stop',
                text: 'grid_action_terminate',
                shortcut: true,
                sticky: true,
                callback: self.terminate,
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Annotate Document
            {
                type: 'action',
                icon: 'draw',
                text: 'grid_action_annotate_document',
                shortcut: true,
                callback: self.annotateDocument,
                class: "action-green",
                sticky: true,
                checkShow: function (action, model) {
                    return model.userCanAnnotate() && rootEntity.hasPSPDFViewer() && employeeService.hasPermissionTo(configurationService.ANNOTATE_DOCUMENT_PERMISSION);
                }
            },
            // Move To Folder
            {
                type: 'action',
                icon: 'folder-move',
                text: 'grid_action_move_to_folder',
                shortcut: true,
                showInView: true,
                callback: self.moveToFolder,
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Add To
            {
                type: 'action',
                icon: 'plus',
                text: 'grid_action_add_to',
                class: "action-green",
                /*permissionKey: [
                    'MANAGE_FAVORITE',
                    'ICN_ENTRY_TEMPLATE',
                    'USER_FOLLOWUP_BOOKS',
                    'ADMIN_USER_FOLLOWUP_BOOKS'
                ],*/
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
                        shortcut: false,
                        class: "action-green",
                        checkShow: function (action, model) {
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
                    },
                    // add to my follow up
                    {
                        type: 'action',
                        icon: 'book-search-outline',
                        text: 'grid_action_to_my_followup',
                        shortcut: true,
                        callback: self.addToDirectFollowUp,
                        permissionKey: 'USER_FOLLOWUP_BOOKS',
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // add to employee follow up
                    {
                        type: 'action',
                        icon: 'book-search-outline',
                        text: 'grid_action_to_employee_followup',
                        shortcut: true,
                        callback: self.addToEmployeeFollowUp,
                        permissionKey: 'ADMIN_USER_FOLLOWUP_BOOKS',
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Create Reply
            {
                type: 'action',
                icon: 'pen',
                text: 'grid_action_create_reply',
                shortcut: false,
                callback: self.createReply,
                class: "action-green",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    // if docFullSerial exists, its either paper or electronic approved document
                    return model.checkCreateReplyPermission() && !!info.docFullSerial && !model.isBroadcasted();
                }
            },
            // Create Reply For Specific Version
            {
                type: 'action',
                icon: 'pen',
                text: 'grid_action_create_reply_specific_version',
                callback: self.createReplySpecificVersion,
                class: "action-green",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    // if docFullSerial exists, its either paper or electronic approved document
                    return model.checkCreateReplyPermission(true) && !!info.docFullSerial && !model.isBroadcasted();
                }
            },
            // Forward
            {
                type: 'action',
                icon: 'share',
                text: 'grid_action_forward',
                shortcut: true,
                sticky: true,
                callback: self.forward,
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Quick Send (Quick Launch)
            {
                type: 'action',
                icon: 'sitemap',
                text: 'grid_action_quick_send',
                shortcut: true,
                sticky: true,
                callback: self.quickSend,
                class: "action-green",
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
                checkShow: function (action, model) {
                    return !model.hasActiveSeqWF();
                }
            },
            // Launch Sequential Workflow
            {
                type: 'action',
                icon: gridService.gridIcons.actions.sequentialWF,
                text: 'grid_action_launch_sequential_workflow',
                callback: self.launchSequentialWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_SEQ_WF',
                checkShow: function (action, model) {
                    return rootEntity.hasPSPDFViewer() && !model.hasActiveSeqWF() && !model.isCorrespondenceApprovedBefore() && !model.isComposite();
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
                    return (!model.needApprove() || model.hasDocumentClass('incoming')) && !model.isBroadcasted() && (model.getSecurityLevelLookup().lookupKey !== 4);
                }
            },
            // Reply
            {
                type: 'action',
                icon: 'reply',
                text: 'grid_action_reply',
                shortcut: false,
                sticky: true,
                callback: self.reply,
                class: "action-green",
                checkShow: function (action, model) {
                    return !model.hasActiveSeqWF() && !model.isBroadcasted();
                }
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
                hide: true,
                checkShow: function (action, model) {
                    return !model.isBroadcasted();
                }
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
                checkShow: function (action, model) {
                    return !model.isBroadcasted();
                }
            },
            // Export (Send to ready to export)
            {
                type: 'action',
                icon: 'export',
                text: 'grid_action_send_to_ready_to_export',
                shortcut: true,
                callback: self.sendWorkItemToReadyToExport,
                class: "action-green",
                permissionKey: 'SEND_TO_READY_TO_EXPORT_QUEUE',
                checkShow: function (action, model) {
                    //addMethod = 0 (Electronic/Digital) - hide the export button
                    //addMethod = 1 (Paper) - show the export button
                    var info = model.getInfo();
                    // If internal book, no export is allowed
                    // If incoming book, no addMethod will be available. So check workFlowName(if incoming) and show export button
                    return info.isPaper && info.documentClass === 'outgoing' && !model.isBroadcasted() && (info.docStatus <= 22) && !model.isPrivateSecurityLevel();
                    // (model.generalStepElm.addMethod && model.generalStepElm.workFlowName.toLowerCase() !== 'internal')
                    // || model.generalStepElm.workFlowName.toLowerCase() === 'incoming';

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
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: function (action, model) {
                    return true;
                },
                callback: self.viewTrackingSheet,
                params: ['view_tracking_sheet', 'tabs']
            },
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                shortcut: false,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                showInView: false,
                permissionKey: [
                    "MANAGE_DOCUMENT’S_TAGS",
                    "MANAGE_DOCUMENT’S_COMMENTS",
                    "MANAGE_TASKS",
                    "MANAGE_ATTACHMENTS",
                    "MANAGE_LINKED_DOCUMENTS",
                    "MANAGE_LINKED_ENTITIES",
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
                        permissionKey: "MANAGE_DOCUMENT’S_COMMENTS",
                        callback: self.manageComments,
                        class: "action-green",
                        sticky: true,
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
                        callback: self.manageLinkedDocuments,
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
                        class: "action-green",
                        checkShow: function (action, model) {
                            return checkIfEditCorrespondenceSiteAllowed(model, false);
                        }
                    }
                ]
            },
            // View
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view',
                shortcut: false,
                hide: true,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                subMenu: [
                    // Direct Linked Documents
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_direct_linked_documents',
                        shortcut: false,
                        callback: self.viewDirectLinkedDocuments,
                        class: "action-red",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Complete Linked Documents
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_complete_linked_documents',
                        shortcut: false,
                        callback: self.viewCompleteLinkedDocuments,
                        class: "action-red",
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
                checkShow: function (action, model) {
                    var isAllowed = true;
                    if (model.hasActiveSeqWF()) {
                        return false;
                    }
                    if (model.isCorrespondenceApprovedBefore()) {
                        isAllowed = rootEntity.getGlobalSettings().isAllowEditAfterFirstApprove();
                    }

                    return isAllowed && gridService.checkToShowMainMenuBySubMenu(action, model);
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
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model) && !model.isBroadcasted();
                },
                permissionKey: [
                    "SEND_COMPOSITE_DOCUMENT_BY_EMAIL",
                    "SEND_DOCUMENT_BY_FAX",
                    "SEND_SMS",
                    "SHARE_BOOK_LINK"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // Link To Document By Email
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_link_to_document_by_email',
                        permissionKey: 'SEND_COMPOSITE_DOCUMENT_BY_EMAIL',
                        callback: self.sendLinkToDocumentByEmail,
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
                        permissionKey: 'SEND_COMPOSITE_DOCUMENT_BY_EMAIL',
                        callback: self.sendCompositeDocumentAsAttachmentByEmail,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Send Document by Fax
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_send_document_by_fax',
                        permissionKey: "SEND_DOCUMENT_BY_FAX",
                        callback: self.sendMainDocumentFax,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return model.canSendByFax();
                        }
                    },
                    // SMS
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'grid_action_send_sms',
                        permissionKey: "SEND_SMS",
                        callback: self.sendSMS,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // send document link
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'send_document_link',
                        permissionKey: "SHARE_BOOK_LINK",
                        callback: self.sendDocumentLink,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Sign(Approve)
            {
                type: 'action',
                icon: 'check-decagram',
                text: 'grid_action_approve',//signature
                shortcut: false,
                checkShow: function (action, model) {
                    if (model.hasActiveSeqWF()){
                        return false;
                    }
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "ELECTRONIC_SIGNATURE",
                    "ELECTRONIC_SIGNATURE_MEMO"
                    // "DIGITAL_SIGNATURE"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // e-Signature
                    {
                        type: 'action',
                        icon: 'check-decagram',
                        text: 'grid_action_electronic_approve',//e_signature
                        shortcut: false,
                        sticky: true,
                        callback: self.signESignature,
                        class: "action-green",
                        checkShow: function (action, model) {
                            //addMethod = 0 (Electronic/Digital) - show the button
                            //addMethod = 1 (Paper) - hide the button

                            // If outgoing or internal, show the button

                            /*If document is unapproved or partially approved, show the button. If fully approved, hide the button.
                             docStatus = 24 is approved
                             */
                            var info = model.getInfo();
                            return !model.isBroadcasted()
                                && !info.isPaper
                                && model.checkElectronicSignaturePermission()
                                && model.needApprove();
                        }
                    },
                    // Conditional Approve
                    {
                        type: 'action',
                        icon: 'clock-start',
                        text: 'grid_action_conditional_approve',
                        callback: self.conditionalApprove,
                        class: "action-green",
                        sticky: true,
                        stickyIndex: 8,
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            return info.documentClass === 'outgoing' && !model.isBroadcasted()
                                && !info.isPaper
                                && model.checkElectronicSignaturePermission()
                                && model.needApprove()
                                && model.hasSingleSignature()
                                && !model.isPrivateSecurityLevel();
                        }
                    },
                    // Digital Signature
                    {
                        type: 'action',
                        icon: 'draw',
                        text: 'grid_action_digital',//digital_signature
                        shortcut: false,
                        callback: self.signDigitalSignature,
                        class: "action-red",
                        permissionKey: "DIGITAL_SIGNATURE",
                        hide: true,
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Edit
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit',
                shortcut: false,
                showInView: false,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model) && !model.isBroadcasted();
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
                            var info = model.getInfo(), isAllowed = true;
                            if (model.hasActiveSeqWF()) {
                                return false;
                            }
                            if (model.isCorrespondenceApprovedBefore()) {
                                isAllowed = rootEntity.getGlobalSettings().isAllowEditAfterFirstApprove();
                            }
                            if (!isAllowed || info.docStatus >= 24) {
                                return false;
                            }
                            var hasPermission = false;
                            if (info.documentClass === "internal")
                                hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT");
                            else if (info.documentClass === "incoming")
                                hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT");
                            else if (info.documentClass === "outgoing") {
                                hasPermission = (info.isPaper ? employeeService.hasPermissionTo("EDIT_OUTGOING_PAPER") : employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
                            }
                            return hasPermission;
                        }
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
                        checkShow: function (action, model) {
                            return checkIfEditPropertiesAllowed(model);
                        }
                    },
                    // editInDeskTop
                    {
                        type: 'action',
                        icon: 'desktop-classic',
                        text: 'grid_action_edit_in_desktop',
                        shortcut: true,
                        callback: self.editInDesktop,
                        class: "action-green",
                        showInView: false,
                        checkShow: function (action, model) {
                            var info = model.getInfo(), isAllowed = true;
                            if (model.hasActiveSeqWF()) {
                                return false;
                            }
                            if (model.isCorrespondenceApprovedBefore()) {
                                isAllowed = rootEntity.getGlobalSettings().isAllowEditAfterFirstApprove();
                            }
                            if (!isAllowed || info.docStatus >= 24) {
                                return false;
                            }
                            var hasPermission = false;
                            if (info.documentClass === 'outgoing') {
                                hasPermission = (info.isPaper ? employeeService.hasPermissionTo("EDIT_OUTGOING_PAPER") : employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
                            } else if (info.documentClass === 'incoming') {
                                hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT");
                            } else if (info.documentClass === 'internal') {
                                hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT");
                            }
                            return !model.isBroadcasted()
                                && !info.isPaper
                                && (info.documentClass !== 'incoming')
                                && model.needApprove()
                                && hasPermission;
                        }
                    }
                ]
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
                        checkShow: function (action, model) {
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
        self.stickyActions = gridService.getStickyActions(self.gridActions);

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
        };

        /**
         * @description Replaces the record in grid after update
         * @param record
         */
        self.replaceRecord = function (record) {
            var index = _.findIndex(self.workItems, function (workItem) {
                return workItem.generalStepElm.vsId === record.generalStepElm.vsId;
            });
            if (index > -1)
                self.workItems.splice(index, 1, record);
            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
        };


        /**
         * @description Contains methods for Star operations for user inbox items
         */
        self.starServices = {
            'false': userInboxService.controllerMethod.userInboxStar,
            'true': userInboxService.controllerMethod.userInboxUnStar,
            'starBulk': correspondenceService.starBulkWorkItems,
            'unStarBulk': correspondenceService.unStarBulkWorkItems
        };

        /**
         * @description Change the starred for user inboxes Bulk
         * @param starUnStar
         * @param $event
         */
        self.changeUserInboxStarBulk = function (starUnStar, $event) {
            self.starServices[starUnStar](self.selectedWorkItems)
                .then(function () {
                    self.reloadFolders(self.grid.page);
                });
        };


        self.checkIfForwardBulkAvailable = function () {
            return _.every(self.selectedWorkItems, function (item) {
                return !item.hasActiveSeqWF();
            });
        };


        /**
         * @description Array of shortcut actions that can be performed on magazine view
         * @type {[*]}
         */
        self.magazineQuickActions = [
            // Terminate
            {
                type: 'action',
                icon: 'stop',
                text: 'grid_action_terminate',
                shortcut: true,
                callback: self.terminate,
                class: "",
                checkShow: gridService.checkToShowAction
            },
            // Reply
            {
                type: 'action',
                icon: 'reply',
                text: 'grid_action_reply',
                callback: self.reply,
                class: "",
                checkShow: function (action, model) {
                    return gridService.checkToShowAction(action) && !model.hasActiveSeqWF() && !model.isBroadcasted();
                }
            },
            // Forward
            {
                type: 'action',
                icon: 'share',
                text: 'grid_action_forward',
                shortcut: true,
                callback: self.forward,
                class: "",
                checkShow: function (action, model) {
                    return gridService.checkToShowAction(action);
                }
            },
            // Approve(e-Signature)
            {
                type: 'action',
                icon: 'check-decagram',
                text: 'grid_action_electronic',//e_signature
                shortcut: true,
                callback: self.signESignature,
                class: "",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return gridService.checkToShowAction(action) && !model.isBroadcasted()
                        && !info.isPaper
                        && model.checkElectronicSignaturePermission()
                        && model.needApprove();
                }
            }
        ];

        $scope.$on('$folder_deleted', function (event) {
            if (self.controllerName === 'folderCtrl') {
                self.reloadFolders(self.grid.page);
            }
        });
    });
};
