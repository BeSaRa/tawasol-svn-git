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
                                                           downloadService,
                                                           distributionWFService,
                                                           contextHelpService,
                                                           documentCommentService,
                                                           $stateParams,
                                                           $state,
                                                           FollowupBook) {
        'ngInject';
        var self = this;
        self.controllerName = 'userFollowupBookByUserCtrl';
        contextHelpService.setHelpTo('user-followup');

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

            // sorting from BE based on user selection (alphabetical or by org structure)
            return [].concat(regOus, sections);
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
        self.getAppUsersForOU = function ($event, setSelectedUser) {
            var defer = $q.defer();
            self.selectedUser = null;
            self.followupBooks = [];
            self.followupBooksCopy = angular.copy(self.followupBooks);
            self.selectedFollowupBooks = [];

            self.securityLevels = self.selectedOrganization ? self.selectedOrganization.securityLevels : [];
            self.selectedSecurityLevels = angular.copy(self.securityLevels); // by default, all security levels will be selected

            return distributionWFService
                .searchFollowupUsersByCriteria({ou: self.selectedOrganization})
                .then(function (result) {
                    self.applicationUsers = result;
                    if (setSelectedUser) {
                        self.setSelectedUserFromRoute();
                    }
                    defer.resolve(true)
                    return result;
                });
        };

        self.isCurrentUser = function (user) {
            return employeeService.getEmployee() && employeeService.getEmployee().id === generator.getNormalizedValue(user, 'id');
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
            },
            isDueDatePassed: gridService.getDueDatePassed(gridService.grids.inbox.userFollowupBookByUser),
            setIsDueDatePassed: function ($event) {
                _initSearchCriteria()
                    .then(function () {
                        gridService.setDueDatePassed(gridService.grids.inbox.userFollowupBookByUser, self.grid.isDueDatePassed);
                        if (hasQueryParams()) {
                            self.reloadFollowupBooks(1, true);
                        } else {
                            self.filterDueDatePassed();
                        }
                    });
            }
        };

        /**
         * @description filter books which due date passed
         */
        self.filterDueDatePassed = function () {
            self.followupBooks = self.grid.isDueDatePassed ? $filter('filter')(self.followupBooks, function (item) {
                return item.isDueDatePassed() && !item.isTerminated();
            }) : self.followupBooksCopy;
        }

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
                securityLevel: self.selectedSecurityLevels,
                isDelayed: false,//self.grid.isDueDatePassed,
                status: null
            });
            if (!skipDates) {
                self.searchCriteria.fromFollowupDate = moment().subtract(configurationService.FOLLOWUP_BOOK_FILTER_START_BEFORE_VALUE, configurationService.FOLLOWUP_BOOK_FILTER_START_BEFORE_TYPE).toDate();
                self.searchCriteria.toFollowupDate = moment(generator.getFutureDate(365)).endOf("day").toDate();
            }
            self.searchCriteriaCopy = angular.copy(self.searchCriteria);

            return $q.resolve(true);
        };

        /**
         * @description Handle the change of security levels
         * Reset the filter and search for user followup books again
         */
        self.onChangeSecurityLevel = function () {
            _initSearchCriteria()
                .then(function () {
                    self.reloadFollowupBooks(1, true);
                });
        };

        /**
         * @description Handle the change of application user
         * Reset the filter and search for user followup books again
         */
        self.onChangeUser = function () {
            _initSearchCriteria()
                .then(function () {
                    self.reloadFollowupBooks(1, true);
                });
        };

        /**
         * @description reload user followup books
         * @param pageNumber
         * @param resetQueryParams
         */
        self.reloadFollowupBooks = function (pageNumber, resetQueryParams) {
            if (!self.isValidBasicCriteria()) {
                return;
            }
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            var promise = null;
            if (!resetQueryParams && hasQueryParams()) {
                promise = followUpUserService.loadUserFollowupBooksByStats(self.selectedUser, self.selectedOrganization);
            } else {
                promise = followUpUserService.loadUserFollowupBooksByCriteria(null, self.searchCriteria);
                self.resetQueryParams();
            }

            return promise
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
            var deferTerminate = $q.defer();
            if (record.isSharedFollowup() || record.hasUserDynamicFollowup()) {
                dialog.confirmMessage(langService.get('confirm_terminate_with_shared_followup'))
                    .then(function () {
                        deferTerminate.resolve(true);
                    });
            } else {
                deferTerminate.resolve(true);
            }
            deferTerminate.promise.then(function () {
                record.terminate(false, record.hasUserDynamicFollowup(), $event).then(function () {
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
         * @description Terminate items Bulk
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
         * @description reassign dynamic follow up documents
         * @param record
         * @param $event
         * @param defer
         */
        self.reassignFollowup = function (record, $event, defer) {
            record = _getOriginalFollowupBook(record);

            followUpUserService
                .openReassignDialog(record, $event)
                .then(function () {
                    self.reloadFollowupBooks(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('reassign_mail_success'));
                            new ResolveDefer(defer);
                        });
                });
        }

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
                .openSendSMSDialog($event, self.selectedUser)
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
                .sendReminderEmail($event, self.selectedUser)
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
            if (!self.isValidBasicCriteria()) {
                return;
            }
            if (printSelectedBulk) {
                printCriteria.idList = _.map(self.selectedFollowupBooks, 'id');
            }

            followUpUserService.setFollowupReportHeading(self.searchCriteriaUsed, printCriteria, (self.selectedUser ? self.selectedUser.getTranslatedNameAndOU() : null))
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
            printCriteria.isDelayed = self.grid.isDueDatePassed;
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
            // edit employee follow up date
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit_followup_date',
                shortcut: true,
                callback: self.editEmployeeFollowUp,
                class: "action-green",
                checkShow: function (action, model) {
                    model = _getOriginalFollowupBook(model);

                    return !model.isTerminated() && !model.isSharedFollowup();
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

        self.setSelectedUserFromRoute = function () {
            var userId = $stateParams.user;
            self.selectedUser = self.applicationUsers.find((user) => {
                return !self.isCurrentUser(user) && user.id === Number(userId)
            });
            if (!self.selectedUser) {
                dialog.infoMessage(langService.get('user_not_found'));
            }
        }

        self.openFolderItem = function () {
            var userId = $stateParams.user, ouId = $stateParams.ou,
                isDelayed = $stateParams['isDelayed'];

            if (userId && ouId && isDelayed !== undefined) {
                self.grid.isDueDatePassed = isDelayed.toLowerCase() === 'true';
                self.selectedOrganization = self.organizations.find((org) => org.id === Number(ouId));
                self.getAppUsersForOU(null, true)
                    .then(function () {
                        _initSearchCriteria(true)
                            .then(function () {
                                self.reloadFollowupBooks(1);
                            });
                    });
            }
        };

        function hasQueryParams() {
            var userId = $state.params.user, ouId = $state.params.ou,
                isDelayed = $state.params['isDelayed'];

            return userId && ouId && isDelayed !== undefined && isDelayed.toLowerCase() === 'true';
        }

        self.resetQueryParams = function () {
            if (hasQueryParams()) {
                $state.go('app.inbox.user-followup', {user: null, ou: null, isDelayed: null});
            }
        }

        // to open Folder item if it exists.
        self.openFolderItem();

    });
};
