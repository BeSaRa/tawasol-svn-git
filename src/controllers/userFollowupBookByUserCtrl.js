module.exports = function (app) {
    app.controller('userFollowupBookByUserCtrl', function ($q,
                                                           $filter,
                                                           userSubscriptionService,
                                                           langService,
                                                           mailNotificationService,
                                                           followUpUserService,
                                                           gridService,
                                                           employeeService,
                                                           dialog,
                                                           viewTrackingSheetService,
                                                           FollowupBookCriteria,
                                                           moment,
                                                           generator,
                                                           configurationService,
                                                           ouApplicationUsers,
                                                           correspondenceService,
                                                           counterService,
                                                           ResolveDefer,
                                                           toast) {
        'ngInject';
        var self = this;
        self.controllerName = 'userFollowupBookByUserCtrl';

        self.followupBooks = [];
        self.followupBooksCopy = angular.copy(self.followupBooks);
        self.selectedFollowupBooks = [];

        self.ouApplicationUsers = ouApplicationUsers;
        self.selectedUser = null;
        self.appUserSearchText = '';

        self.searchCriteriaUsed = false;

        /**
         * @description
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            name: gridService.grids.administration.userFollowupBookByUser,
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.userFollowupBookByUser) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.userFollowupBookByUser, self.workItems),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.userFollowupBookByUser, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.administration.userFollowupBookByUser),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.administration.userFollowupBookByUser, self.grid.truncateSubject);
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
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.followupBooks = $filter('orderBy')(self.followupBooks, self.grid.order);
        };


        var _initSearchCriteria = function (skipDates) {
            self.searchCriteria = null;
            self.searchCriteriaUsed = false;

            if (!self.selectedUser) {
                return;
            }

            self.searchCriteria = new FollowupBookCriteria({
                userId: self.selectedUser.getApplicationUserId(),
                userOUID: self.selectedUser.getOuId()
            });
            self.searchCriteriaCopy = angular.copy(self.searchCriteria);
            if (!skipDates) {
                self.searchCriteria.fromFollowupDate = moment().subtract(configurationService.FOLLOWUP_BOOK_FILTER_START_BEFORE_VALUE, configurationService.FOLLOWUP_BOOK_FILTER_START_BEFORE_TYPE).toDate();
                self.searchCriteria.toFollowupDate = moment().endOf("day").toDate();
            }
            return $q.resolve(true);
        };

        /**
         * @description Reset the filter and search for user followup books again
         */
        self.onChangeUser = function () {
            _initSearchCriteria()
                .then(function () {
                    self.reloadFollowupBooks(1);
                });
        };

        /**
         * @description reload user followup books
         * @param pageNumber
         */
        self.reloadFollowupBooks = function (pageNumber) {
            if (!self.selectedUser) {
                return;
            }
            var defer = $q.defer();
            self.grid.progress = defer.promise;

            return followUpUserService.loadUserFollowupBooksByCriteria(null, self.searchCriteria)
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
                    return result;
                });
        };

        /**
         * @description Opens the search dialog for books
         */
        self.openFilterDialog = function ($event) {
            if (!self.selectedUser) {
                return;
            }
            if (self.grid.searchText) {
                self.searchCriteria.docSubject = self.grid.searchText;
            }
            followUpUserService
                .controllerMethod.openFilterDialog(self.grid, self.searchCriteria)
                .then(function (result) {
                    self.grid.page = 1;
                    self.grid.searchText = '';
                    self.followupBooks = result.result;
                    // if criteria is returned in result, means filter is used. otherwise, filter is reset
                    if (result.criteria) {
                        self.searchCriteriaUsed = true;
                        self.searchCriteria = result.criteria;
                        self.searchCriteriaCopy = angular.copy(result.criteria);
                    } else {
                        _initSearchCriteria();
                    }
                })
                .catch(function (error) {
                    if (error && error.hasOwnProperty('error') && error.error === 'serverError') {
                        self.grid.page = 1;
                        self.grid.searchText = '';
                        self.searchCriteriaUsed = true;
                        self.searchCriteria = error.criteria;
                        self.followupBooks = [];
                    }
                });
        };

        self.resetFilter = function ($event) {
            self.grid.page = 1;
            self.grid.searchText = '';
            _initSearchCriteria()
                .then(function () {
                    self.reloadFollowupBooks(1);
                });
        };


        /**
         * @description Terminate record
         * @param record
         * @param $event
         * @param defer
         */
        self.terminate = function (record, $event, defer) {
            record.terminate(false, $event).then(function () {
                return self.reloadFollowupBooks(self.grid.page);
            });
        };

        /**
         * @description Terminate items Bulk
         * @param $event
         */
        self.terminateBulk = function ($event) {
            followUpUserService.terminateBulkFollowup(self.selectedFollowupBooks).then(function () {
                return self.reloadFollowupBooks(self.grid.page);
            });
        };

        /**
         * @description Moves the record to other folder
         * @param record
         * @param $event
         * @param defer
         */
        self.moveToFolder = function (record, $event, defer) {
            record
                .addToFolder(true, $event)
                .then(function () {
                    self.reloadFollowupBooks(self.grid.page);
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
                    self.reloadFollowupBooks(self.grid.page);
                });
        };

        /**
         * @description Transfer to another employee
         * @param record
         * @param $event
         * @param defer
         */
        self.transferToAnotherEmployee = function (record, $event, defer) {
            followUpUserService
                .openTransferDialog(record, self.selectedUser, $event)
                .then(function () {
                    self.reloadFollowupBooks(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('transfer_mail_success'));
                            new ResolveDefer(defer)
                        });
                })
        };

        self.transferToAnotherEmployeeBulk = function ($event) {
            followUpUserService
                .openTransferDialog(self.selectedFollowupBooks, self.selectedUser, $event)
                .then(function () {
                    self.reloadFollowupBooks(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('transfer_mail_success'))
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
            correspondenceService
                .viewCorrespondence(record, [], checkIfEditPropertiesAllowed(record, true), false)
                .then(function () {
                    return self.reloadFollowupBooks(self.grid.page);
                })
                .catch(function () {
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
            record.viewFromQueue(self.gridActions, 'search' + generator.ucFirst(record.getInfo().documentClass), $event)
                .then(function () {
                    return self.reloadFollowupBooks(self.grid.page);
                })
                .catch(function () {
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
            if (!self.selectedUser) {
                return;
            }
            record
                .openSendSMSDialog(self.selectedUser.getMobileNumber(), $event)
                .then(function () {
                    return self.reloadFollowupBooks(self.grid.page);
                });
        };

        /**
         * @description Sends the reminder email to specific user
         * @param record
         * @param $event
         * @param defer
         */
        self.sendReminderEmailToUser = function (record, $event, defer) {
            if (!self.selectedUser) {
                return;
            }
            record
                .sendReminderEmail(self.selectedUser.getEmail(), $event)
                .then(function (result) {
                    if (result) {
                        return self.reloadFollowupBooks(self.grid.page);
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

        self.printResult = function ($event) {
            followUpUserService.setFollowupReportHeading(self.searchCriteriaUsed, self.searchCriteriaCopy, (self.selectedUser ? self.selectedUser.getAppUserAndOuTranslate() : null))
                .then(function (heading) {
                    followUpUserService.printUserFollowupFromWebPage(heading, self.searchCriteriaCopy);
                });
        };

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
                text: 'grid_action_terminate',
                shortcut: true,
                callback: self.terminate,
                class: "action-green",
                sticky: true,
                checkShow: function (action, model) {
                    return true;
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
            },// Transfer To Another Employee
            {
                type: 'action',
                icon: 'transfer',
                text: 'transfer_mail',
                shortcut: true,
                callback: self.transferToAnotherEmployee,
                class: "action-green",
                showInView: true,
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
                subMenu: viewTrackingSheetService.getViewTrackingSheetOptions('grid', gridService.grids.administration.userFollowupBookByUser)
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
                params: ['view_tracking_sheet', 'tabs', gridService.grids.administration.userFollowupBookByUser]
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
                    "MANAGE_DOCUMENT’S_COMMENTS"
                ],
                checkAnyPermission: true,
                subMenu: [
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
                            return true;
                        }
                    },
                    // send reminder email to user
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'grid_action_send_email_reminder',
                        callback: self.sendReminderEmailToUser,
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
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };


        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of workflow action dropdown
         * @param $event
         */
        self.preventSearchKeyDown = function ($event) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                if (code !== 38 && code !== 40)
                    $event.stopPropagation();
            }
        };

    });
};
