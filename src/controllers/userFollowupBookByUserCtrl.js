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
                                                           followUpOrganizations,
                                                           correspondenceService,
                                                           counterService,
                                                           ResolveDefer,
                                                           toast,
                                                           _,
                                                           Information,
                                                           distributionWFService,
                                                           FollowupBook) {
        'ngInject';
        var self = this;
        self.controllerName = 'userFollowupBookByUserCtrl';

        self.followupBooks = [];
        self.followupBooksCopy = angular.copy(self.followupBooks);
        self.selectedFollowupBooks = [];

        self.appUserSearchText = '';
        self.inlineOUSearchText = '';
        self.inlineAppUserSearchText = '';

        self.openedDocumentCopy = null;

        self.searchCriteriaUsed = false;
        self.employeeService = employeeService;

        var _mapRegOUSections = function () {
            // filter all regOU (has registry)
            var regOus = _.filter(followUpOrganizations, function (item) {
                    return item.hasRegistry;
                }),
                // filter all sections (no registry)
                sections = _.filter(followUpOrganizations, function (ou) {
                    return !ou.hasRegistry;
                }),
                // registry parent organization
                parentRegistryOu;

            // To show (regou - section), append the dummy property "tempRegOUSection"
            regOus = _.map(regOus, function (regOu) {
                regOu.tempRegOUSection = new Information({
                    arName: regOu.arName,
                    enName: regOu.enName
                });
                return regOu;
            });
            sections = _.map(sections, function (section) {
                parentRegistryOu = (section.regouId || section.regOuId);
                if (typeof parentRegistryOu === 'number') {
                    parentRegistryOu = _.find(followUpOrganizations, function (ou) {
                        return ou.id === parentRegistryOu;
                    })
                }

                section.tempRegOUSection = new Information({
                    arName: ((parentRegistryOu) ? parentRegistryOu.arName + ' - ' : '') + section.arName,
                    enName: ((parentRegistryOu) ? parentRegistryOu.enName + ' - ' : '') + section.enName
                });
                return section;
            });

            // sort regOu-section
            return _.sortBy([].concat(regOus, sections), [function (ou) {
                return ou.tempRegOUSection[langService.current + 'Name'].toLowerCase();
            }]);
        };
        self.organizations = _mapRegOUSections();
        self.applicationUsers = [];
        self.securityLevels = [];
        self.selectedOrganization = self.employeeService.getEmployee().userOrganization;
        self.selectedUser = null;
        self.selectedSecurityLevels = null;

        function _getOriginalFollowupBook(record) {
            if (!(record instanceof FollowupBook) && self.openedDocumentCopy) {
                record = angular.copy(self.openedDocumentCopy);
            }

            return angular.copy(record);
        }

        /**
         * @description Get the Application Users and Security Levels for the selected Organization
         */
        self.getAppUsersForOU = function ($event) {
            self.selectedUser = null;
            self.followupBooks = [];
            self.followupBooksCopy = angular.copy(self.followupBooks);
            self.selectedFollowupBooks = [];

            self.securityLevels = self.selectedOrganization ? self.selectedOrganization.securityLevels : [];
            self.selectedSecurityLevels = angular.copy(self.securityLevels); // by default, all security levels will be selected

            return distributionWFService
                .searchUsersByCriteria({ou: self.selectedOrganization})
                .then(function (result) {
                    self.applicationUsers = result;
                    return result;
                });
        };

        self.notCurrentUser = function (user) {
            return employeeService.getEmployee().id === user.id;
        };


        /**
         * @description
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            name: gridService.grids.inbox.userFollowupBookByUser,
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.inbox.userFollowupBookByUser) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.inbox.userFollowupBookByUser, self.workItems),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.inbox.userFollowupBookByUser, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.inbox.userFollowupBookByUser),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.inbox.userFollowupBookByUser, self.grid.truncateSubject);
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

            if (!self.isValidBasicCriteria()) {
                return $q.reject(false);
            }

            self.searchCriteria = new FollowupBookCriteria({
                userId: self.selectedUser,
                userOUID: self.selectedOrganization,
                securityLevel: self.selectedSecurityLevels
            });
            self.searchCriteriaCopy = angular.copy(self.searchCriteria);
            if (!skipDates) {
                self.searchCriteria.fromFollowupDate = moment().subtract(configurationService.FOLLOWUP_BOOK_FILTER_START_BEFORE_VALUE, configurationService.FOLLOWUP_BOOK_FILTER_START_BEFORE_TYPE).toDate();
                self.searchCriteria.toFollowupDate = moment(generator.getFutureDate(30)).endOf("day").toDate();
            }
            return $q.resolve(true);
        };

        /**
         * @description Handle the change of security levels
         * Reset the filter and search for user followup books again
         */
        self.onChangeSecurityLevel = function () {
            _initSearchCriteria()
                .then(function () {
                    self.reloadFollowupBooks(1);
                });
        };

        /**
         * @description Handle the change of application user
         * Reset the filter and search for user followup books again
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
            if (!self.isValidBasicCriteria()) {
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

        self.isValidBasicCriteria = function () {
            return !!self.selectedOrganization && (!!self.selectedSecurityLevels && self.selectedSecurityLevels.length > 0) && !!self.selectedUser;
        };

        /**
         * @description Opens the search dialog for books
         */
        self.openFilterDialog = function ($event) {
            if (!self.isValidBasicCriteria()) {
                return;
            }
            if (self.grid.searchText) {
                self.searchCriteria.docSubject = self.grid.searchText;
            }
            followUpUserService
                .controllerMethod.openFilterDialog(self.grid, self.searchCriteria, true, $event)
                .then(function (result) {
                    self.grid.page = 1;
                    self.grid.searchText = '';
                    self.followupBooks = result.result;
                    self.selectedFollowupBooks = [];
                    // if criteria is returned in result, means filter is used. otherwise, filter is reset
                    if (result.criteria) {
                        self.searchCriteriaUsed = true;
                        self.searchCriteria = result.criteria;
                        self.searchCriteriaCopy = angular.copy(result.criteria);
                    } else {
                        _initSearchCriteria()
                            .then(function () {
                                self.reloadFollowupBooks(1);
                            });
                    }
                })
                .catch(function (error) {
                    if (error && error.hasOwnProperty('error') && error.error === 'serverError') {
                        self.grid.page = 1;
                        self.grid.searchText = '';
                        self.searchCriteriaUsed = true;
                        self.searchCriteria = error.criteria;
                        self.followupBooks = [];
                        self.selectedFollowupBooks = [];
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
            record = _getOriginalFollowupBook(record);

            if (record.isTerminated()) {
                return;
            }
            record.terminate(false, $event).then(function () {
                return self.reloadFollowupBooks(self.grid.page)
                    .then(function (result) {
                        new ResolveDefer(defer);
                    });
            });
        };

        self.checkIfTerminateBulkAvailable = function () {
            return _.every(self.selectedFollowupBooks, function (item) {
                return !item.isTerminated();
            });
        };

        /**
         * @description Terminate items Bulk
         * @param $event
         */
        self.terminateBulk = function ($event) {
            if (!self.checkIfTerminateBulkAvailable()) {
                return;
            }
            followUpUserService.terminateBulkFollowup(self.selectedFollowupBooks).then(function () {
                return self.reloadFollowupBooks(self.grid.page);
            });
        };

        /**
         * @description Transfer to another employee
         * @param record
         * @param $event
         * @param defer
         */
        self.transferToAnotherEmployee = function (record, $event, defer) {
            record = _getOriginalFollowupBook(record);

            followUpUserService
                .openTransferDialog(record, self.selectedOrganization, self.selectedUser, $event)
                .then(function () {
                    self.reloadFollowupBooks(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('transfer_mail_success'));
                            new ResolveDefer(defer);
                        });
                })
        };

        self.transferToAnotherEmployeeBulk = function ($event) {
            followUpUserService
                .openTransferDialog(self.selectedFollowupBooks, self.selectedOrganization, self.selectedUser, $event)
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
            if (!self.isValidBasicCriteria()) {
                return;
            }
            record
                .openSendSMSDialog(null, $event)
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
            if (!self.isValidBasicCriteria()) {
                return;
            }
            record
                .sendReminderEmail(null, $event)
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
            var printDate = printSelectedBulk ? self.selectedFollowupBooks : self.followupBooks;
            printDate = _.filter(printDate, function (followupBook) {
                return !followupBook.isTerminated();
            });
            followUpUserService.setFollowupReportHeading(self.searchCriteriaUsed, printDate, (self.selectedUser ? self.selectedUser.getTranslatedNameAndOU() : null))
                .then(function (heading) {
                    followUpUserService.printUserFollowup(heading, printDate);
                });
        };

        /**
         * description print selected record
         * @param record
         * @param $event
         */
        self.print = function (record, $event) {
            followUpUserService.setFollowupReportHeading(self.searchCriteriaUsed, record, (self.selectedFolder ? self.selectedFolder.getTranslatedName() : null))
                .then(function (heading) {
                    followUpUserService.printUserFollowup(heading, record);
                });
        };

        /**
         * @description edit workItem To My FollowUp
         * @param record
         * @param $event
         * @param defer
         */
        self.editEmployeeFollowUp = function (record, $event, defer) {
            record = _getOriginalFollowupBook(record);

            record.editUserFollowUp(true)
                .then(function () {
                    return self.reloadFollowupBooks(self.grid.page)
                        .then(function (result) {
                            new ResolveDefer(defer);
                        });
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
                    return true;
                }
            },
            // edit employee follow up
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit',
                shortcut: true,
                callback: self.editEmployeeFollowUp,
                class: "action-green",
                checkShow: function (action, model) {
                    model = _getOriginalFollowupBook(model);

                    return !model.isTerminated();
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
                subMenu: viewTrackingSheetService.getViewTrackingSheetOptions('grid', gridService.grids.inbox.userFollowupBookByUser)
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
                params: ['view_tracking_sheet', 'tabs', gridService.grids.inbox.userFollowupBookByUser]
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
