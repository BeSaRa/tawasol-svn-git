module.exports = function (app) {
    app.controller('incomingDepartmentInboxCtrl', function (lookupService,
                                                            incomingDepartmentInboxService,
                                                            incomingDepartmentInboxes,
                                                            correspondenceService,
                                                            managerService,
                                                            $state,
                                                            viewTrackingSheetService,
                                                            errorCode,
                                                            $q,
                                                            $filter,
                                                            langService,
                                                            viewDocumentService,
                                                            toast,
                                                            dialog,
                                                            Information,
                                                            contextHelpService,
                                                            counterService,
                                                            employeeService,
                                                            ResolveDefer,
                                                            generator,
                                                            listGeneratorService,
                                                            Incoming,
                                                            _,
                                                            emailItem,
                                                            mailNotificationService,
                                                            gridService,
                                                            rootEntity,
                                                            $timeout) {
        'ngInject';
        var self = this;

        self.controllerName = 'incomingDepartmentInboxCtrl';

        contextHelpService.setHelpTo('department-inbox-incoming');
        /**
         * @description All incoming department inbox items
         * @type {*}
         */
        self.incomingDepartmentInboxes = incomingDepartmentInboxes;
        self.incomingDepartmentInboxesCopy = angular.copy(self.incomingDepartmentInboxes);

        /**
         * @description Contains the selected incoming department inbox items
         * @type {Array}
         */
        self.selectedIncomingDepartmentInboxes = [];

        /**
         * @description Mark item as read/unread
         * @param workItem
         * @param $event
         */
        self.markAsReadUnread = function (workItem, $event) {
            return workItem.markAsReadUnread($event)
                .then(function (result) {
                    self.reloadIncomingDepartmentInboxes(self.grid.page);
                    counterService.loadCounters();
                })
        };

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.department.incoming) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.department.incoming, self.incomingDepartmentInboxes),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.department.incoming, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.department.incoming),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.department.incoming, self.grid.truncateSubject);
            },
            searchColumns: {
                serial: 'generalStepElm.docFullSerial',
                subject: 'generalStepElm.docSubject',
                receivedDate: 'generalStepElm.receivedDate',
                type: 'type',
                senderRegOu: function (record) {
                    return self.getSortingKey('fromOU', 'Information');
                },
                numberOfDays: 'generalStepElm.numberOfDays',
                sender: function (record) {
                    return self.getSortingKey('sender', 'Information');
                },
                dueDate: 'generalStepElm.dueDate'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.incomingDepartmentInboxes = gridService.searchGridData(self.grid, self.incomingDepartmentInboxesCopy);
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

        function _getWorkflowName(model) {
            return model.getInfo().documentClass;
        }

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.incomingDepartmentInboxes = $filter('orderBy')(self.incomingDepartmentInboxes, self.grid.order);
        };

        /**
         * @description Reload the grid of incoming department inbox item
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadIncomingDepartmentInboxes = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return incomingDepartmentInboxService
                .loadIncomingDepartmentInboxes()
                .then(function (result) {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.incomingDepartmentInboxes = result;
                    self.incomingDepartmentInboxesCopy = angular.copy(self.incomingDepartmentInboxes);
                    self.selectedIncomingDepartmentInboxes = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };


        self.checkIfReturnBulkAvailable = function () {
            self.itemsWithoutReturn = [];
            _.map(self.selectedIncomingDepartmentInboxes, function (workItem) {
                if (workItem.generalStepElm.isReassigned)
                    self.itemsWithoutReturn.push(workItem.generalStepElm.vsId);
            });
            return !(self.itemsWithoutReturn && self.itemsWithoutReturn.length);
        };

        self.checkIfQuickReceiveBulkAvailable = function () {
            if (!employeeService.hasPermissionTo("QUICK_RECEIVE_INCOMING")) {
                return false;
            }
            self.itemsWithoutQuickReceive = [];
            _.map(self.selectedIncomingDepartmentInboxes, function (workItem) {
                if (workItem.generalStepElm.isReassigned)
                    self.itemsWithoutQuickReceive.push(workItem.generalStepElm.vsId);
            });
            return !(self.itemsWithoutQuickReceive && self.itemsWithoutQuickReceive.length);
        };

        /**
         * @description Return the bulk incoming department inbox items
         * @param $event
         */
        self.returnWorkItemsBulk = function ($event) {
            if (!self.selectedIncomingDepartmentInboxes.length) {
                return;
            }
            var selectedItems = angular.copy(self.selectedIncomingDepartmentInboxes);
            if (!self.checkIfReturnBulkAvailable()) {
                if (self.itemsWithoutReturn.length === selectedItems.length) {
                    dialog.alertMessage(langService.get('selected_items_can_not_be_returned'));
                    return false;
                }
                dialog.confirmMessage(langService.get('some_items_cannot_return_skip_and_return'), null, null, $event).then(function () {
                    self.selectedIncomingDepartmentInboxes = selectedItems = _.filter(self.selectedIncomingDepartmentInboxes, function (workItem) {
                        return self.itemsWithoutReturn.indexOf(workItem.generalStepElm.vsId) === -1;
                    });
                    if (self.selectedIncomingDepartmentInboxes.length)
                        _returnBulk(selectedItems, $event);
                })
            } else {
                _returnBulk(selectedItems, $event);
            }
        };

        function _returnBulk(selectedItems, $event) {
            correspondenceService
                .returnBulkWorkItem(selectedItems, $event)
                .then(function () {
                    self.reloadIncomingDepartmentInboxes(self.grid.page);
                });
        }

        /**
         * @description Return the incoming department inbox item
         * @param workItem
         * @param $event
         * @param defer
         */
        self.returnWorkItem = function (workItem, $event, defer) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            workItem
                .returnWorkItem($event)
                .then(function () {
                    new ResolveDefer(defer);
                    self.reloadIncomingDepartmentInboxes(self.grid.page);
                });
        };

        /**
         * @description Return the incoming department To Central Archive returned
         * @param workItem
         * @param $event
         * @param defer
         */
        self.returnWorkItemToCentralArchive = function (workItem, $event, defer) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            workItem
                .returnWorkItemToCentralArchive($event)
                .then(function () {
                    new ResolveDefer(defer);
                    self.reloadIncomingDepartmentInboxes(self.grid.page);
                });
        };

        /**
         * @description Return the incoming department To Central Archive returned
         * @param workItem
         * @param $event
         * @param defer
         */
        self.returnWorkItemToCentralArchive = function (workItem, $event, defer) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            workItem
                .returnWorkItemToCentralArchive($event)
                .then(function () {
                    new ResolveDefer(defer);
                    self.reloadIncomingDepartmentInboxes(self.grid.page);
                });
        };

        /**
         * @description Accept the incoming department inbox item
         * @param workItem
         * @param $event
         * @param defer
         */
        self.receiveWorkItem = function (workItem, $event, defer) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            var info = workItem.getInfo();
            dialog.hide();
            $state.go('app.incoming.add', {action: 'receive', wobNum: info.wobNumber});
        };


        self.quickReceiveBulk = function ($event, defer) {
            if (!self.selectedIncomingDepartmentInboxes.length) {
                return;
            }
            var selectedItems = angular.copy(self.selectedIncomingDepartmentInboxes);
            if (!self.checkIfQuickReceiveBulkAvailable()) {
                if (self.itemsWithoutQuickReceive.length === selectedItems.length) {
                    dialog.alertMessage(langService.get('selected_items_can_not_be_quick_received'));
                    return false;
                }
                dialog.confirmMessage(langService.get('some_items_cannot_quick_receive_skip_and_return'), null, null, $event).then(function () {
                    self.selectedIncomingDepartmentInboxes = selectedItems = _.filter(self.selectedIncomingDepartmentInboxes, function (workItem) {
                        return self.itemsWithoutQuickReceive.indexOf(workItem.generalStepElm.vsId) === -1;
                    });
                    if (self.selectedIncomingDepartmentInboxes.length)
                        _quickReceiveBulk(selectedItems, $event);
                })
            } else {
                _quickReceiveBulk(selectedItems, $event);
            }
        };


        function _quickReceiveBulk(selectedItems, $event) {
            correspondenceService
                .quickReceiveBulkCorrespondence(self.selectedIncomingDepartmentInboxes)
                .then(function (result) {
                    var list = listGeneratorService.createUnOrderList(),
                        langKeys = ['quick_received_success', 'not_launched_book_will_go_to_review', 'confirm_launch_distribution_workflow'];
                    _.map(langKeys, function (item) {
                        list.addItemToList(langService.get(item));
                    });

                    dialog.confirmMessage(list.getList(), null, null, $event)
                        .then(function () {
                            var correspondences = [];
                            for (var i = 0; i < result.length; i++) {
                                correspondences.push(new Incoming({
                                    vsId: result[i],
                                    docSubject: selectedItems[i].getInfo().title,
                                    securityLevel: selectedItems[i].generalStepElm.securityLevel,
                                    mainSiteId: true // to avoid the check correspondence sites for the document before launch it.
                                }))
                            }
                            correspondenceService
                                .launchCorrespondenceWorkflow(correspondences, $event, 'forward', 'favorites', true)
                                .then(function () {
                                    self.reloadIncomingDepartmentInboxes(self.grid.page)
                                        .then(function () {
                                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                                        });
                                });
                        })
                        .catch(function () {
                            self.reloadIncomingDepartmentInboxes(self.grid.page)
                                .then(function () {
                                    new ResolveDefer(defer);
                                });
                        });
                    /*self.reloadIncomingDepartmentInboxes(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });*/
                });
        }

        /**
         * @description Quick Accept the incoming department inbox item
         * @param incomingDepartmentInbox
         * @param $event
         * @param defer
         */
        self.quickReceiveWorkItem = function (incomingDepartmentInbox, $event, defer) {
            if (incomingDepartmentInbox.isLocked() && !incomingDepartmentInbox.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(incomingDepartmentInbox, null));
                return;
            }
            var documentName = angular.copy(incomingDepartmentInbox.generalStepElm.docSubject);
            incomingDepartmentInboxService.controllerMethod
                .incomingDepartmentInboxQuickReceive(incomingDepartmentInbox, $event)
                .then(function (result) {
                    var list = listGeneratorService.createUnOrderList(),
                        langKeys = ['quick_received_success', 'not_launched_book_will_go_to_review', 'confirm_launch_distribution_workflow'];
                    _.map(langKeys, function (item) {
                        list.addItemToList(langService.get(item));
                    });

                    dialog.confirmMessage(list.getList(), null, null, $event)
                        .then(function () {
                            var correspondence = new Incoming({
                                vsId: result,
                                docSubject: documentName,
                                securityLevel: incomingDepartmentInbox.generalStepElm.securityLevel,
                                mainSiteId: true // to avoid the check correspondence sites for the document before launch it.
                            });
                            /* isDeptIncoming is sent true to avoid alert message */
                            correspondence.launchWorkFlow($event, 'forward', 'favorites', true)
                                .then(function () {
                                    self.reloadIncomingDepartmentInboxes(self.grid.page)
                                        .then(function () {
                                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                                            new ResolveDefer(defer);
                                        });
                                })
                                .catch(function () {
                                    self.reloadIncomingDepartmentInboxes(self.grid.page)
                                        .then(function () {
                                            new ResolveDefer(defer);
                                        });
                                });
                        })
                        .catch(function () {
                            self.reloadIncomingDepartmentInboxes(self.grid.page)
                                .then(function () {
                                    new ResolveDefer(defer);
                                });
                        });

                })
                .catch(function (error) {
                    if (errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                        dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: incomingDepartmentInbox.getInfo().wobNumber}));
                        return false;
                    }
                    errorCode.checkIf(error, 'INVALID_REFERENCE_FORMAT', function () {
                        dialog
                            .confirmMessage(langService.get('quick_receive_failed_missing_properties'))
                            .then(function () {
                                return self.receiveWorkItem(incomingDepartmentInbox, $event);
                            });
                    });
                });
        };

        /**
         * @description Launch distribution workflow for department incoming item
         * @param workItem
         * @param $event
         * @param defer
         */
        self.launchDistributionWorkflow = function (workItem, $event, defer) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            workItem.launchWorkFlow($event, 'forward', 'favorites', true)
                .then(function () {
                    self.reloadIncomingDepartmentInboxes(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Launch distribution workflow with quick send
         * @param workItem
         * @param $event
         * @param defer
         */
        self.quickSend = function (workItem, $event, defer) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            workItem.quickSendLaunchWorkflow($event, 'favorites', 'forward', true)
                .then(function () {
                    self.reloadIncomingDepartmentInboxes(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                })
        };

        var checkIfEditCorrespondenceSiteAllowed = function (model, checkForViewPopup) {
            /*var info = model.getInfo();
             var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
             var allowed = (hasPermission && info.documentClass !== "internal");
             if (checkForViewPopup)
             return !(allowed);
             return allowed;*/
            if (checkForViewPopup)
                return true;
            return false;
        };

        /**
         * @description Preview document
         * @param incomingDepartmentInbox
         * @param $event
         */
        self.previewDocument = function (incomingDepartmentInbox, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            if (incomingDepartmentInbox.isLocked() && !incomingDepartmentInbox.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(incomingDepartmentInbox, null));
                return;
            }
            //if not transferred, disable edit properties
            var disableProperties = checkIfEditPropertiesAllowed(incomingDepartmentInbox, true) && !incomingDepartmentInbox.isTransferredDocument();

            correspondenceService.viewCorrespondenceWorkItem(incomingDepartmentInbox.getInfo(), self.gridActions, disableProperties, checkIfEditCorrespondenceSiteAllowed(incomingDepartmentInbox, true), true, false, false, true)
                .then(function () {
                    correspondenceService.unlockWorkItem(incomingDepartmentInbox, true, $event).then(function () {
                        return self.reloadIncomingDepartmentInboxes(self.grid.page);
                    });
                })
                .catch(function (error) {
                    if (error !== 'itemLocked') {
                        return self.reloadIncomingDepartmentInboxes(self.grid.page);
                    }
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
                return false;
            }
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            workItem.viewNewDepartmentIncomingAsWorkItem(self.gridActions, 'departmentIncoming', $event)
                .then(function () {
                    correspondenceService.unlockWorkItem(workItem, true, $event).then(function () {
                        self.reloadIncomingDepartmentInboxes(self.grid.page);
                    });
                })
                .catch(function (error) {
                    if (error !== 'itemLocked')
                        self.reloadIncomingDepartmentInboxes(self.grid.page);
                });

            /*  var info = workItem.getInfo();
              /!*
                  If document is sent to regOu from launchScreen
                  else document is exported from ready to export
              *!/
              if (!info.incomingVsId && info.docType !== 1) {
                  workItem.viewNewDepartmentIncomingAsWorkItem(self.gridActions, 'departmentIncoming', $event)
                      .then(function () {
                          self.reloadIncomingDepartmentInboxes(self.grid.page);
                      })
                      .catch(function (error) {
                          if (error !== 'itemIsLocked')
                              self.reloadIncomingDepartmentInboxes(self.grid.page);
                      });
              }
              else {
                  workItem.viewNewDepartmentIncomingAsCorrespondence(self.gridActions, 'departmentIncoming', $event)
                      .then(function () {
                          self.reloadIncomingDepartmentInboxes(self.grid.page);
                      })
                      .catch(function (error) {
                          if (error !== 'itemIsLocked')
                              self.reloadIncomingDepartmentInboxes(self.grid.page);
                      });
              }*/
        };

        /**
         * @description get document versions
         * @param workItem
         * @param $event
         * @return {*}
         */
        self.getDocumentVersions = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
            return workItem
                .viewSpecificVersion(self.gridActions, $event);
        };
        /**
         * @description duplicate current version
         * @param workItem
         * @param $event
         */
        self.duplicateCurrentVersion = function (workItem, $event) {
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
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
            if (workItem.isLocked() && !workItem.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(workItem, null));
                return;
            }
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
         * @description Unlocks the workItem
         * @param workItem
         * @param $event
         * @returns {*}
         */
        self.unlockWorkItem = function (workItem, $event) {
            return workItem.unlockWorkItem($event)
                .then(function (result) {
                    if (result)
                        self.reloadIncomingDepartmentInboxes(self.grid.page);
                });
        };

        self.checkIfUnlockBulkAvailable = function () {
            self.itemsWithoutUnlock = [];
            _.map(self.selectedIncomingDepartmentInboxes, function (workItem) {
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
            var selectedItems = angular.copy(self.selectedIncomingDepartmentInboxes);
            if (!self.checkIfUnlockBulkAvailable()) {
                if (self.itemsWithoutUnlock.length === selectedItems.length) {
                    dialog.alertMessage(langService.get('selected_items_can_not_be_unlocked'));
                    return false;
                }
                dialog.confirmMessage(langService.get('some_items_cannot_be_unlocked_skip_and_unlock'), null, null, $event).then(function () {
                    self.selectedIncomingDepartmentInboxes = selectedItems = _.filter(self.selectedIncomingDepartmentInboxes, function (workItem) {
                        return self.itemsWithoutUnlock.indexOf(workItem.generalStepElm.vsId) === -1;
                    });
                    if (self.selectedIncomingDepartmentInboxes.length)
                        _unlockBulk(selectedItems, $event);
                })
            } else {
                _unlockBulk(selectedItems, $event);
            }
        };

        var _unlockBulk = function (selectedItems, $event) {
            correspondenceService
                .unlockBulkWorkItems(selectedItems, $event)
                .then(function () {
                    self.reloadIncomingDepartmentInboxes(self.grid.page);
                });
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
                .viewTrackingSheetPopup(workItem, params, $event)
                .then(function (result) {

                });
        };

        /**
         * @description Manage attachments for incoming department inbox item
         * @param incomingDepartmentInbox
         * @param $event
         */
        self.manageAttachments = function (incomingDepartmentInbox, $event) {
            if (incomingDepartmentInbox.isLocked() && !incomingDepartmentInbox.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(incomingDepartmentInbox, null));
                return;
            }
            incomingDepartmentInbox.manageDocumentAttachments($event)
                .then(function () {
                    self.reloadIncomingDepartmentInboxes(self.grid.page);
                }).catch(function () {
                self.reloadIncomingDepartmentInboxes(self.grid.page);
            });
        };

        /**
         * @description Manage linked documents for incoming department inbox item
         * @param incomingDepartmentInbox
         * @param $event
         */
        self.manageLinkedDocuments = function (incomingDepartmentInbox, $event) {
            if (incomingDepartmentInbox.isLocked() && !incomingDepartmentInbox.isLockedByCurrentUser()) {
                dialog.infoMessage(generator.getBookLockMessage(incomingDepartmentInbox, null));
                return;
            }
            var info = incomingDepartmentInbox.getInfo();
            managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass, "welcome")
                .then(function () {
                    self.reloadIncomingDepartmentInboxes(self.grid.page);
                }).catch(function () {
                self.reloadIncomingDepartmentInboxes(self.grid.page);
            });
        };

        self.editProperties = function (workItem, $event) {
            var info = workItem.getInfo();
            managerService
                .manageDocumentProperties(info.vsId, info.documentClass, info.title, $event)
                .finally(function (e) {
                    self.reloadIncomingDepartmentInboxes(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });

                });
        };

        /**
         * @description Reply workItem
         * @param workItem
         * @param $event
         * @param defer
         */
        self.reply = function (workItem, $event, defer) {
            workItem.replySimple($event, 'reply', 'senderDepartment')
                .then(function () {
                    self.reloadIncomingDepartmentInboxes(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
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
                return !hasPermission;
            return hasPermission;
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
                        },
                        gridName: 'department-incoming'
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
                        showInView: false,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        disabled: function (model) {
                            return model.isLocked() && !model.isLockedByCurrentUser();
                        },
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
                        showInView: false,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        disabled: function (model) {
                            return model.isLocked() && !model.isLockedByCurrentUser();
                        },
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
                        callback: self.getDocumentVersions,
                        permissionKey: "VIEW_DOCUMENT_VERSION",
                        class: "action-green",
                        showInView: true,
                        hide: true,
                        disabled: function (model) {
                            return model.isLocked() && !model.isLockedByCurrentUser();
                        },
                        checkShow: function (action, model) {
                            return true;
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
            // Edit outgoing properties
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit_properties',
                shortcut: true,
                showInView: false,
                callback: self.editProperties,
                class: "action-green",
                checkShow: function (action, model) {
                    return checkIfEditPropertiesAllowed(model) && model.isTransferredDocument();
                }
            },
            // Quick Reply
            {
                type: 'action',
                icon: 'reply',
                text: 'grid_action_quick_reply',
                callback: self.reply,
                sticky: false,
                class: "action-green",
                checkShow: function (action, model) {
                    return model.isTransferredDocument();
                }
            },
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                shortcut: false,
                showInView: false,
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "MANAGE_ATTACHMENTS",
                    "MANAGE_LINKED_DOCUMENTS",
                ],
                checkAnyPermission: true,
                subMenu: [
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
                            //var info = model.getInfo();
                            return model.generalStepElm.isReassigned;
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
                            //var info = model.getInfo();
                            return model.generalStepElm.isReassigned;
                        }
                    }
                ]
            },
            // Return
            {
                type: 'action',
                icon: 'undo-variant',
                text: 'grid_action_return',
                shortcut: true,
                callback: self.returnWorkItem,
                class: "action-green",
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    //var info = model.getInfo();
                    return !model.generalStepElm.isReassigned;//!!info.incomingVsId;
                }
            },
            // Return To Central Archive
            {
                type: 'action',
                icon: 'archive',
                text: 'grid_action_return_to_archive',
                shortcut: true,
                callback: self.returnWorkItemToCentralArchive,
                class: "action-green",
                checkShow: function (action, model) {
                    // Document is created by central archive.
                    // Document is sent from central archive.
                    // Document is created by central archive for the receiver department.
                    // Document isn’t sent to multiple workflows.
                    return model.generalStepElm.fromCentralArchive &&
                        !model.generalStepElm.sentToMultipleOus &&
                        rootEntity.getGlobalSettings().returnToCentralArchive;
                }
            },
            // Receive
            {
                type: 'action',
                icon: 'check',
                text: 'grid_action_receive',
                shortcut: true,
                callback: self.receiveWorkItem,
                class: "action-green",
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    //var info = model.getInfo();
                    return !model.generalStepElm.isReassigned && employeeService.hasPermissionTo('ADD_NEW_INCOMING_DOCUMENT');//!!info.incomingVsId;
                }
            },
            // View Tracking Sheet
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view_tracking_sheet',
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: function (action, model) {
                    return model.generalStepElm.isReassigned;
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
                    return model.generalStepElm.isReassigned;
                },
                callback: self.viewTrackingSheet,
                params: ['view_tracking_sheet', 'tabs']
            },
            // Quick Receive
            {
                type: 'action',
                icon: 'check-all',
                text: 'grid_action_quick_receive',
                shortcut: true,
                hide: false,
                callback: self.quickReceiveWorkItem,
                class: "action-green",
                permissionKey: "QUICK_RECEIVE_INCOMING",
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    //var info = model.getInfo();
                    return !model.generalStepElm.isReassigned && employeeService.hasPermissionTo('ADD_NEW_INCOMING_DOCUMENT');//!!info.incomingVsId;
                }
            },
            //Launch Distribution Workflow
            {
                type: 'action',
                icon: 'sitemap',
                text: 'grid_action_launch_distribution_workflow',
                shortcut: true,
                callback: self.launchDistributionWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    //var info = model.getInfo();
                    return model.generalStepElm.isReassigned;//!info.incomingVsId;
                }
            },
            // Quick Send (Quick Launch)
            {
                type: 'action',
                icon: 'sitemap',
                text: 'grid_action_quick_send',
                shortcut: true,
                callback: self.quickSend,
                class: "action-green",
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
                disabled: function (model) {
                    return model.isLocked() && !model.isLockedByCurrentUser();
                },
                checkShow: function (action, model) {
                    //var info = model.getInfo();
                    return !model.hasActiveSeqWF() && model.generalStepElm.isReassigned;//!info.incomingVsId;
                }
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
                        callback: self.duplicateCurrentVersion,
                        class: "action-green",
                        permissionKey: 'DUPLICATE_BOOK_CURRENT',
                        showInView: true,
                        hide: true,
                        disabled: function (model) {
                            return model.isLocked() && !model.isLockedByCurrentUser();
                        },
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            return (info.documentClass === 'outgoing' || info.documentClass === 'internal') && !info.isPaper;
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
                        hide: true,
                        disabled: function (model) {
                            return model.isLocked() && !model.isLockedByCurrentUser();
                        },
                        permissionKey: 'DUPLICATE_BOOK_FROM_VERSION',
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                ]
            },
            // Unlock
            {
                type: 'action',
                icon: 'lock-open',
                text: 'grid_action_unlock',
                shortcut: false,
                callback: self.unlockWorkItem,
                class: "action-green",
                // showInView: true,
                permissionKey: '',
                checkShow: function (action, model) {
                    return model.isLocked() && model.getLockingInfo().domainName !== employeeService.getEmployee().domainName;
                }
            }
        ];

        self.shortcutActions = gridService.getShortcutActions(self.gridActions);
        self.contextMenuActions = gridService.getContextMenuActions(self.gridActions);

        self.openEmailItem = function () {
            emailItem ? self.viewDocument(emailItem) : null;
        };
        // to open Email item if it exists.
        self.openEmailItem();

        self.refreshGrid = function (time) {
            $timeout(function () {
                $state.is('app.department-inbox.incoming') && self.reloadIncomingDepartmentInboxes(self.grid.page);
            }, time)
                .then(function () {
                    $state.is('app.department-inbox.incoming') && self.refreshGrid(time);
                });
        };

        if (employeeService.getEmployee().getIntervalMin()) {
            self.refreshGrid(employeeService.getEmployee().getIntervalMin());
        }
    });
};
