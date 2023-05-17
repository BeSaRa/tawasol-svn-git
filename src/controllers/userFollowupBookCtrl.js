module.exports = function (app) {
    app.controller('userFollowupBookCtrl', function (folders,
                                                     $q,
                                                     _,
                                                     $filter,
                                                     userSubscriptionService,
                                                     langService,
                                                     FollowUpFolder,
                                                     mailNotificationService,
                                                     followUpUserService,
                                                     gridService,
                                                     employeeService,
                                                     dialog,
                                                     viewTrackingSheetService,
                                                     FollowupBookCriteria,
                                                     moment,
                                                     counterService,
                                                     generator,
                                                     configurationService,
                                                     correspondenceService,
                                                     rootEntity,
                                                     downloadService,
                                                     ResolveDefer,
                                                     FollowupBook,
                                                     contextHelpService,
                                                     toast,
                                                     documentCommentService,
                                                     $stateParams,
                                                     $state,
                                                     $timeout) {
            'ngInject';
            var self = this;
            self.controllerName = 'userFollowupBookCtrl';
            contextHelpService.setHelpTo('my-followup');

            self.sidebarStatus = true;

            self.followupBooks = [];
            self.followupBooksCopy = angular.copy(self.followupBooks);
            self.selectedFollowupBooks = [];

            self.folders = _prepareFollowupFolders(folders);
            self.selectedFolder = self.folders.find(folder => folder.isDefault === true);
            self.openedDocumentCopy = null;

            function _prepareFollowupFolders(folders, showRootFolder) {
                return showRootFolder ? [new FollowUpFolder({
                    arName: langService.getKey('followup_folders', 'ar'),
                    enName: langService.getKey('followup_folders', 'en'),
                    id: 0,
                    status: true
                }).setChildren(folders)] : folders;
            }

            function _getOriginalFollowupBook(record) {
                if (!(record instanceof FollowupBook) && self.openedDocumentCopy) {
                    record = angular.copy(self.openedDocumentCopy);
                }

                return angular.copy(record);
            }

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

            /**
             * @description
             * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
             */
            self.grid = {
                name: gridService.grids.inbox.userFollowupBook,
                progress: null,
                limit: gridService.getGridPagingLimitByGridName(gridService.grids.inbox.userFollowupBook) || 5, // default limit
                page: 1, // first page
                order: '', // default sorting order
                limitOptions: gridService.getGridLimitOptions(gridService.grids.inbox.userFollowupBook, self.workItems),
                pagingCallback: function (page, limit) {
                    gridService.setGridPagingLimitByGridName(gridService.grids.inbox.userFollowupBook, limit);
                },
                truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.inbox.userFollowupBook),
                setTruncateSubject: function ($event) {
                    gridService.setGridSubjectTruncateByGridName(gridService.grids.inbox.userFollowupBook, self.grid.truncateSubject);
                },
                searchColumns: {
                    serial: 'docFullSerial',
                    subject: 'docSubject',
                    createdOn: 'docDateString',
                    actionDate: 'actionDateString',
                    followupDate: 'followupDateString',
                    corrSite: function (record) {
                        return self.getSortingKey('mainSiteSubSiteString', 'Information');
                    },
                    securityLevel: function (record) {
                        return self.getSortingKey('securityLevel', 'Lookup');
                    },
                    numberOfDays: 'numberOfDays',
                    folder: function (record) {
                        return self.getSortingKey('folderInfo', 'Information');
                    }
                },
                searchText: '',
                searchCallback: function (grid) {
                    self.followupBooks = gridService.searchGridData(self.grid, self.followupBooksCopy);
                },
                isDueDatePassed: gridService.getDueDatePassed(gridService.grids.inbox.userFollowupBook),
                setIsDueDatePassed: function ($event) {
                    gridService.setDueDatePassed(gridService.grids.inbox.userFollowupBook, self.grid.isDueDatePassed);
                    self.filterDueDatePassed();
                },
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
             * @description Get the sorting key for information or lookup model
             * @param property
             * @param modelType
             * @returns {*}
             */
            self.getSortingKey = function (property, modelType) {
                return generator.getColumnSortingKey(property, modelType);
            };

            /**
             * @description Gets the grid records by sorting
             */
            self.getSortedData = function () {
                self.followupBooks = $filter('orderBy')(self.followupBooks, self.grid.order);
            };

            /**
             * @description filter books which due date passed
             */
            self.filterDueDatePassed = function () {
                self.followupBooks = self.grid.isDueDatePassed ? $filter('filter')(self.followupBooks, function (item) {
                    return item.isDueDatePassed();
                }) : self.followupBooksCopy;
            }

            /**
             * @description reload followup books
             * @param pageNumber
             */
            self.reloadFollowupBooks = function (pageNumber) {
                var defer = $q.defer();
                self.grid.progress = defer.promise;
                if (self.searchCriteriaUsed) {
                    return followUpUserService.loadUserFollowupBooksByCriteria(null, self.searchCriteria)
                        .then(function (result) {
                            self.followupBooks = result;
                            defer.resolve(true);
                            return result;
                        });
                }

                if (!self.selectedFolder) {
                    defer.resolve(true);
                    return;
                }

                return followUpUserService
                    .loadFollowupFolderContent(self.selectedFolder)
                    .then(function (result) {
                        self.followupBooks = result;
                        self.followupBooksCopy = angular.copy(self.followupBooks);
                        counterService.loadCounters();
                        mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        self.selectedFollowupBooks = [];
                        defer.resolve(true);
                        if (pageNumber)
                            self.grid.page = pageNumber;
                        self.getSortedData();
                        self.filterDueDatePassed();
                        self.followupBooks;
                    });
            };

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
                $state.go('app.inbox.my-followup', {folder: self.selectedFolder.id});
                return self.reloadFollowupBooks(self.grid.page);
            };
            /**
             * @description toggle sidebar folders.
             */
            self.toggleSidebarFolder = function () {
                self.sidebarStatus = !self.sidebarStatus;
            };

            /**
             * @description Reloads the followup folders
             */
            self.reloadFollowupFolders = function () {
                followUpUserService.loadFollowupFolders(true)
                    .then(function (result) {
                        self.folders = _prepareFollowupFolders(result);
                    });
            };

            self.createFolder = function (folder, $event) {
                followUpUserService
                    .controllerMethod
                    .followupFolderAdd((folder.id ? folder : null), $event, self.folders)
                    .then(function () {
                        self.reloadFollowupFolders();
                    });
            };

            self.editFolder = function (folder, $event) {
                followUpUserService
                    .controllerMethod
                    .followupFolderEdit(folder, $event)
                    .then(function () {
                        self.reloadFollowupFolders();
                    });
            };

            self.deleteFolder = function (folder, $event) {
                var array = [folder.id];
                getChildIds(folder, array);
                followUpUserService
                    .controllerMethod
                    .followupFolderDeleteBulk(array.reverse(), $event)
                    .then(function () {
                        self.reloadFollowupFolders();
                    })
                    .catch(function (error) {
                        var code = error.hasOwnProperty('data') && error.data ? error.data.ec : error;
                        if (code === 1005) { // 1005 (FAILED_DUE_TO_LINKED_OBJECT)
                            return dialog.confirmMessage(langService.get('can_not_delete_folder_has_followup_data_confirm_move'))
                                .then(function () {
                                    followUpUserService.openMoveTerminatedBooksDialog(folder.id, array);
                                })
                        }
                        return $q.reject(error);
                    });
            };

            /**
             * @description Terminate record
             * @param record
             * @param $event
             * @param defer
             */
            self.terminate = function (record, $event, defer) {
                record = _getOriginalFollowupBook(record);

                if (record.isTerminated()) {
                    return;
                }
                var deferTerminate = $q.defer();
                if (record.isSharedFollowup() || record.hasUserDynamicFollowup()) {
                    var confirmButtons = {
                        yes: {text: 'yes', id: 1},
                        no: {text: 'only_me', id: 2}
                    };
                    dialog.confirmThreeButtonMessage(langService.get('confirm_terminate_with_shared_followup'), '', langService.get(confirmButtons.yes.text), langService.get(confirmButtons.no.text))
                        .then(function (result) {
                            if (result.button === confirmButtons.yes.id) {
                                deferTerminate.resolve(true); // bulk terminate
                            } else if (result.button === confirmButtons.no.id) {
                                deferTerminate.resolve(false); // current user terminate
                            }
                        });
                } else {
                    deferTerminate.resolve(false);
                }
                deferTerminate.promise.then(function (isBulk) {
                    record.terminate(false, isBulk, $event).then(function () {
                        return self.reloadFollowupBooks(self.grid.page)
                            .then(function (result) {
                                new ResolveDefer(defer);
                            });
                    });
                })
            };

            self.checkIfTerminateBulkAvailable = function () {
                return _.every(self.selectedFollowupBooks, function (item) {
                    return !item.isTerminated();
                });
            };

            /**
             * @description Terminate folder items Bulk
             * @param $event
             */
            self.terminateBulk = function ($event) {
                if (!self.selectedFollowupBooks.length) {
                    return;
                }
                if (!self.checkIfTerminateBulkAvailable()) {
                    return;
                }
                var selectedItems = angular.copy(self.selectedFollowupBooks),
                    sharedFollowupsBooks = [], notSharedFollowupBooks = [];

                _.map(selectedItems, function (item) {
                    if (item.isSharedFollowup()) {
                        sharedFollowupsBooks.push(item);
                    } else {
                        notSharedFollowupBooks.push(item);
                    }
                    return item;
                });
                var terminateDefer = $q.defer();
                if (sharedFollowupsBooks.length === 0) {
                    terminateDefer.resolve(selectedItems);
                } else {
                    var buttonsMap = {
                        terminate: {
                            id: 1,
                            key: 'terminate',
                            langKey: 'terminate'
                        },
                        skipAndTerminate: {
                            id: 2,
                            key: 'skipAndTerminate',
                            langKey: 'skip_and_terminate'
                        }
                    };
                    dialog.confirmThreeButtonMessage(langService.get('confirm_terminate_selected_some_shared_followup'), '', langService.get(buttonsMap.terminate.langKey), langService.get(buttonsMap.skipAndTerminate.langKey), false, null, false)
                        .then(function (result) {
                            if (result.button === buttonsMap.skipAndTerminate.id) {
                                terminateDefer.resolve(notSharedFollowupBooks);
                            } else if (result.button === buttonsMap.terminate.id) {
                                terminateDefer.resolve(selectedItems);
                            }
                        });
                }

                terminateDefer.promise.then(function (itemsToTerminate) {
                    followUpUserService.terminateBulkFollowup(itemsToTerminate).then(function () {
                        return self.reloadFollowupBooks(self.grid.page);
                    });
                })
            };

            /**
             * @description reassign dynamic follow-up documents
             * @param record
             * @param $event
             * @param defer
             */
            self.reassignFollowup = function (record, $event, defer) {
                record = _getOriginalFollowupBook(record);

                followUpUserService
                    .openReassignDialog(record, $event)
                    .then(function () {
                        self.reloadFollowupFolders();
                        self.reloadFollowupBooks(self.grid.page)
                            .then(function () {
                                toast.success(langService.get('reassign_mail_success'));
                                new ResolveDefer(defer);
                            });
                    });
            }

            /**
             * @description Moves the record to other folder
             * @param record
             * @param $event
             * @param defer
             */
            self.moveToFolder = function (record, $event, defer) {
                record = _getOriginalFollowupBook(record);

                record
                    .addToFolder(true, $event)
                    .then(function () {
                        self.reloadFollowupBooks(self.grid.page)
                            .then(function () {
                                new ResolveDefer(defer);
                            });
                    });
            };

            /**
             * @description move bulk to folder
             * @param $event
             */
            self.moveToFolderBulk = function ($event) {
                return followUpUserService
                    .showAddBulkFollowupBooksToFolder(self.selectedFollowupBooks, true, $event)
                    .then(function () {
                        self.reloadFollowupBooks(self.grid.page)
                            .then(function () {
                                new ResolveDefer(defer);
                            });
                    });
            };

            /**
             * @description Preview document
             * @param record
             * @param $event
             */
            self.previewDocument = function (record, $event) {
                if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                    dialog.infoMessage(langService.get('no_view_permission'));
                    return;
                }
                self.openedDocumentCopy = angular.copy(record);
                correspondenceService
                    .viewCorrespondence(record, [], checkIfEditPropertiesAllowed(record, true), false)
                    .then(function () {
                        self.openedDocumentCopy = null;
                        return self.reloadFollowupBooks(self.grid.page);
                    })
                    .catch(function () {
                        self.openedDocumentCopy = null;
                        return self.reloadFollowupBooks(self.grid.page);
                    });

            };

            /**
             * @description View document
             * @param record
             * @param $event
             */
            self.viewDocument = function (record, $event) {
                if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                    dialog.infoMessage(langService.get('no_view_permission'));
                    return;
                }
                self.openedDocumentCopy = angular.copy(record);
                record.viewFromQueue(self.gridActions, 'search' + generator.ucFirst(record.getInfo().documentClass), $event)
                    .then(function () {
                        self.openedDocumentCopy = null;
                        return self.reloadFollowupBooks(self.grid.page);
                    })
                    .catch(function () {
                        self.openedDocumentCopy = null;
                        return self.reloadFollowupBooks(self.grid.page);
                    });
            };

            /**
             * @description View Tracking Sheet
             * @param record
             * @param params
             * @param $event
             */
            self.viewTrackingSheet = function (record, params, $event) {
                viewTrackingSheetService
                    .controllerMethod
                    .viewTrackingSheetPopup(record, params, $event);
            };

            /**
             * @description Manage Comments
             * @param record
             * @param $event
             */
            self.manageComments = function (record, $event) {
                record.manageDocumentComments($event)
                    .then(function () {
                        return self.reloadFollowupBooks(self.grid.page);
                    })
                    .catch(function (e) {
                        return self.reloadFollowupBooks(self.grid.page);
                    });
            };

            /**
             * @description Send SMS
             * @param record
             * @param $event
             * @param defer
             */
            self.sendSMS = function (record, $event, defer) {
                record
                    .openSendSMSDialog($event, null)
                    .then(function () {
                        return self.reloadFollowupBooks(self.grid.page)
                            .then(function (result) {
                                new ResolveDefer(defer);
                            });
                    });
            };

            /**
             * @description Sends the reminder email to specific user
             * @param record
             * @param $event
             * @param defer
             */
            self.sendReminderEmailToUser = function (record, $event, defer) {
                record
                    .sendReminderEmail($event, null)
                    .then(function (result) {
                        if (result) {
                            return self.reloadFollowupBooks(self.grid.page)
                                .then(function (result) {
                                    new ResolveDefer(defer);
                                });
                        }
                    });
            };

            /**
             * @description Subscribe
             * @param record
             * @param $event
             */
            self.subscribe = function (record, $event) {
                userSubscriptionService.controllerMethod.openAddSubscriptionDialog(record, $event);
            };

            /**
             * @description print all or selected records
             * @param printSelectedBulk
             * @param $event
             */
            self.printResult = function (printSelectedBulk, $event) {
                var printCriteria = angular.copy(self.searchCriteriaCopy);
                printCriteria.isDelayed = self.grid.isDueDatePassed;

                if (!self.searchCriteriaUsed) {
                    printCriteria.folderId = self.selectedFolder.id
                }

                if (printSelectedBulk) {
                    printCriteria.idList = _.map(self.selectedFollowupBooks, 'id');
                }

                followUpUserService.setFollowupReportHeading(self.searchCriteriaUsed, printCriteria, (self.selectedFolder ? self.selectedFolder.getTranslatedName() : null))
                    .then(function (heading) {
                        followUpUserService.printUserFollowup(heading, printCriteria);
                    });
            };

            /**
             * description print selected record
             * @param record
             * @param $event
             */
            self.print = function (record, $event) {
                var printCriteria = angular.copy(self.searchCriteriaCopy);
                printCriteria.idList.push(record.id);
                followUpUserService.setFollowupReportHeading(self.searchCriteriaUsed, printCriteria, (self.selectedFolder ? self.selectedFolder.getTranslatedName() : null))
                    .then(function (heading) {
                        followUpUserService.printUserFollowup(heading, printCriteria);
                    });
            };

            /**
             * @description edit workItem To My FollowUp
             * @param record
             * @param $event
             * @param defer
             */
            self.editDirectFollowUp = function (record, $event, defer) {
                record = _getOriginalFollowupBook(record);

                record.editMyDirectFollowUp(true)
                    .then(function () {
                        return self.reloadFollowupBooks(self.grid.page)
                            .then(function () {
                                new ResolveDefer(defer);
                            });
                    });
            };


            /**
             * @description Download Main Document
             * @param record
             * @param $event
             */
            self.downloadMainDocument = function (record, $event) {
                record
                    .mainDocumentDownload($event);
            };

            /**
             * @description Download Composite Document
             * @param record
             * @param $event
             */
            self.downloadCompositeDocument = function (record, $event) {
                record
                    .compositeDocumentDownload($event);
            };

            /**
             * @description download selected document
             * @param record
             * @param $event
             */
            self.downloadSelected = function (record, $event) {
                downloadService.openSelectedDownloadDialog(record, $event);
            };

            /**
             * @description merge and download
             * @param record
             */
            self.mergeAndDownloadFullDocument = function (record) {
                downloadService.mergeAndDownload(record);
            };

            /**
             * @description show last comment
             * @param record
             * @param $event
             */
            self.showLastCommentCallback = function (record, $event) {
                $event.preventDefault();
                documentCommentService.loadDocumentCommentsByVsId(record.vsId)
                    .then(function (documentComments) {
                        if (!documentComments.length) {
                            toast.info(langService.get('no_comments_added_yet'));
                            return;
                        }
                        var lastComment = _.chain(documentComments).sortBy('id').last().value();
                        dialog
                            .successMessage(lastComment.description, null, null, $event, true);

                    })
            }

            self.getTrackingSheetCallback = function (record, $event) {
                var action = self.gridActions.find(action => {
                    return action.text === "grid_action_view_tracking_sheet" && action.onlyShortcut;
                });

                return action.callback(record, action.params, $event);
            }

            self.gridActions = [
                // Document Information
                {
                    type: 'action',
                    icon: 'information-variant',
                    text: 'grid_action_document_info',
                    showInView: false,
                    subMenu: [
                        {
                            type: 'info',
                            checkShow: function (action, model) {
                                return true;
                            },
                            gridName: 'user-followup-book'
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
                    class: "action-green",
                    showInView: false,
                    permissionKey: [
                        'VIEW_DOCUMENT'
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
                    text: 'grid_action_terminate_followup',
                    shortcut: true,
                    callback: self.terminate,
                    class: "action-green",
                    sticky: true,
                    checkShow: function (action, model) {
                        model = _getOriginalFollowupBook(model);

                        return !model.isTerminated();
                    }
                },
                // edit follow up date
                {
                    type: 'action',
                    icon: 'pencil',
                    text: 'grid_action_edit_followup_date',
                    shortcut: true,
                    callback: self.editDirectFollowUp,
                    class: "action-green",
                    checkShow: function (action, model) {
                        model = _getOriginalFollowupBook(model);

                        return !model.isTerminated() && !model.isSharedFollowup();
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
                // Reassign Followup
                {
                    type: 'action',
                    icon: 'file-swap',
                    text: 'grid_action_reassign',
                    shortcut: true,
                    callback: self.reassignFollowup,
                    class: "action-green",
                    showInView: true,
                    checkShow: function (action, model) {
                        // only for dynamic followup books
                        if (model instanceof FollowupBook) {
                            return model.hasUserDynamicFollowup();
                        } else {
                            model = _getOriginalFollowupBook();
                            return model.hasUserDynamicFollowup();
                        }
                    }
                },
                // print
                {
                    type: 'action',
                    icon: 'printer',
                    text: 'print',
                    shortcut: true,
                    showInView: false,
                    callback: self.print,
                    class: "action-green",
                    checkShow: function (action, model) {
                        return true;
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
                    checkShow: function (action, model) {
                        return true;
                    }
                },
                // Download
                {
                    type: 'action',
                    icon: 'download',
                    text: 'grid_action_download',
                    shortcut: false,
                    showInViewOnly: true,
                    showInView: true,
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
                    subMenu: viewTrackingSheetService.getViewTrackingSheetOptions('grid', gridService.grids.inbox.userFollowupBook)
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
                    params: ['view_tracking_sheet', 'tabs', gridService.grids.inbox.userFollowupBook]
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
                    permissionKey: [],
                    checkAnyPermission: true,
                    subMenu: [
                        // Comments
                        {
                            type: 'action',
                            icon: 'comment',
                            text: 'grid_action_comments',
                            shortcut: false,
                            callback: self.manageComments,
                            class: "action-green",
                            sticky: true,
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
                        return gridService.checkToShowMainMenuBySubMenu(action, model);
                    },
                    permissionKey: [
                        "SEND_SMS",
                        ""
                    ],
                    checkAnyPermission: true,
                    subMenu: [
                        // SMS
                        {
                            type: 'action',
                            icon: 'message',
                            text: 'grid_action_send_sms',
                            permissionKey: "SEND_SMS",
                            callback: self.sendSMS,
                            class: "action-green",
                            checkShow: function (action, model) {
                                return !correspondenceService.isLimitedCentralUnitAccess(model);
                            }
                        },
                        // send reminder email to user
                        {
                            type: 'action',
                            icon: 'message',
                            text: 'grid_action_send_email_reminder',
                            callback: self.sendReminderEmailToUser,
                            showInView: false,
                            class: "action-green",
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
             * @description Opens the search dialog for books
             */
            self.openFilterDialog = function ($event) {
                if (self.grid.searchText) {
                    self.searchCriteria.docSubject = self.grid.searchText;
                }
                followUpUserService
                    .controllerMethod.openFilterDialog(self.grid, self.searchCriteria, false, $event)
                    .then(function (result) {
                        self.selectedFolder = null;
                        self.selectedFollowupBooks = [];
                        self.grid.page = 1;
                        self.grid.searchText = '';
                        self.followupBooks = result.result;
                        // if criteria is returned in result, means filter is used. otherwise, filter is reset
                        if (result.criteria) {
                            self.searchCriteriaUsed = true;
                            self.searchCriteria = result.criteria;
                            self.searchCriteriaCopy = angular.copy(result.criteria);
                        } else {
                            self.searchCriteriaUsed = false;
                            _initSearchCriteria();
                            self.toggleSidebarFolder();
                        }
                    })
                    .catch(function (error) {
                        if (error && error.hasOwnProperty('error') && error.error === 'serverError') {
                            self.selectedFolder = null;
                            self.grid.page = 1;
                            self.grid.searchText = '';
                            self.searchCriteriaUsed = true;
                            self.searchCriteria = error.criteria;
                            self.selectedFollowupBooks = [];
                            self.followupBooks = [];
                        }
                    });
            };

            self.resetFilter = function ($event) {
                self.grid.page = 1;
                self.grid.searchText = '';
                _initSearchCriteria();
                self.searchCriteriaUsed = false;

                self.followupBooks = [];
                self.selectedFolder = null;

                self.toggleSidebarFolder();
            };


            var _initSearchCriteria = function (skipDates) {
                self.searchCriteria = new FollowupBookCriteria({
                    userId: employeeService.getEmployee().id,
                    userOUID: employeeService.getEmployee().getOUID()
                });
                self.searchCriteriaCopy = angular.copy(self.searchCriteria);
                if (!skipDates) {
                    self.searchCriteria.fromFollowupDate = moment().subtract(configurationService.FOLLOWUP_BOOK_FILTER_START_BEFORE_VALUE, configurationService.FOLLOWUP_BOOK_FILTER_START_BEFORE_TYPE).toDate();
                    self.searchCriteria.toFollowupDate = moment(generator.getFutureDate(365)).endOf("day").toDate();
                }
            };

            self.searchCriteriaUsed = false;
            self.$onInit = function () {
                $timeout(function () {
                    self.toggleSidebarFolder();
                    self.getFolderContent(self.selectedFolder);
                });
                _initSearchCriteria();
            };

            self.openFolderItem = function () {
                var folderId = $stateParams.folder,
                    isDelayed = $stateParams['isDelayed'];
                if (folderId && isDelayed !== undefined) {
                    self.grid.isDueDatePassed = isDelayed.toLowerCase() === 'true';

                    var selectedFolder = self.folders.find(function (folder) {
                        return folder.id === Number(folderId);
                    });

                    if (!selectedFolder) {
                        dialog.infoMessage(langService.get('no_folder_found'));
                        return;
                    }
                    self.getFolderContent(selectedFolder);
                }
            };

            // to open Folder item if it exists.
            self.openFolderItem();
        }
    );
};
