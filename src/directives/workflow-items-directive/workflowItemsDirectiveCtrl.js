module.exports = function (app) {
    app.controller('workflowItemsDirectiveCtrl', function ($scope,
                                                           dialog,
                                                           rootEntity,
                                                           cmsTemplate,
                                                           DistributionWFItem,
                                                           langService,
                                                           LangWatcher,
                                                           $filter,
                                                           $timeout,
                                                           _,
                                                           employeeService,
                                                           gridService,
                                                           lookupService,
                                                           $state,
                                                           workflowActionService,
                                                           Lookup) {
        'ngInject';
        var self = this,
            noneLookup = new Lookup({
                id: -1,
                defaultEnName: langService.getByLangKey('none', 'en'),
                defaultArName: langService.getByLangKey('none', 'ar'),
                lookupKey: -1
            });

        self.controllerName = 'workflowItemsDirectiveCtrl';
        LangWatcher($scope);

        self.globalSettings = rootEntity.getGlobalSettings();

        self.workflowItems = [];

        self.selectedWorkflowItems = [];

        self.selected = [];

        self.defaultWorkflowItemsSettings = new DistributionWFItem();

        /**
         * @description get translated key name to use it in orderBy.
         * @returns {string}
         */
        self.getTranslatedKey = function () {
            return langService.current === 'ar' ? 'arName' : 'enName';
        };


        var _initGrid = function () {
            self.workflowItemsCopy = angular.copy(self.workflowItems);
            self.grid = {
                limit: 5, // default limit
                page: 1, // first page
                order: '', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.workflowItems.length + 21);
                        }
                    }
                ],
                searchColumns: {
                    name: function (record) {
                        return record.getTranslatedKey();
                    }
                },
                searchText: '',
                searchCallback: function (grid) {
                    self.workflowItems = gridService.searchGridData(self.grid, self.workflowItemsCopy);
                }
            };
        };

        var _getGridLimit = function () {
            if (self.gridName.toLowerCase() === 'favoriteous') {
                self.grid.limit = (self.workflowItems.length + 21);
                self.grid.name = gridService.grids.launch.favoritesOUs;
            } else {
                self.grid.limit = 5;
                if (self.gridName.toLowerCase() === 'workflowgroups') {
                    self.grid.name = gridService.grids.launch.wfGroups;
                } else if (self.gridName.toLowerCase() === 'ous') {
                    self.grid.name = gridService.grids.launch.ous;
                }
            }
        };

        $timeout(function () {
            _initGrid();
            _getGridLimit();
        });

        /**
         * @description Checks if SLA Due date is disabled
         * @returns {boolean}
         */
        self.isSLADueDateDisabled = function (distWorkflowItem) {
            return distWorkflowItem.getWorkflowItemType().toLowerCase() === 'groupmail';
        };

        function _setDistWorkflowItem(distWorkflowItem, result) {
            distWorkflowItem
                .setDueDate(result.dueDate)
                .setComments(result.comments)
                .setAction(result.action)
                .setSendSMS(result.sendSMS)
                .setSendEmail(result.sendEmail)
                .setEscalationStatus(result.escalationStatus)
                .setEscalationUser(result.escalationUserId)
                .setEscalationUserOUId(result.escalationUserId)
                .setForwardSenderActionAndComment(result.forwardSenderActionAndComment);

            if (self.fromPredefined) {
                if (!self.isSLADueDateDisabled(distWorkflowItem)) {
                    distWorkflowItem.setSLADueDate(result.sLADueDate);
                }
            }
        }

        /**
         * @description just for apply notifications settings
         * @param distWorkflowItem
         * @param result
         * @private
         */
        function _applyNotificationSettings(distWorkflowItem, result) {
            distWorkflowItem
                .setSendSMS(result.sendSMS)
                .setSendEmail(result.sendEmail);
        }

        self.runItemNotExists = function (workflowItem) {
            return self.itemNotExistsCallback(workflowItem);
        };

        self.addWorkflowItem = function (workflowItem) {
            var currentOUEscalationProcess = employeeService.getEmployee().userOrganization.escalationProcess || noneLookup;
            if (workflowItem.escalationStatus) {
                if (workflowItem.escalationStatus.hasOwnProperty('lookupKey') && workflowItem.escalationStatus.lookupKey === -1) {
                    workflowItem.escalationStatus = noneLookup;
                } else {
                    workflowItem.escalationStatus = lookupService.getLookupByLookupKey(lookupService.escalationProcess, workflowItem.escalationStatus);
                }
            } else {
                workflowItem.escalationStatus = currentOUEscalationProcess;
            }

            /*   if (!workflowItem.escalationStatus && workflowItem.isGroup()) {
                var currentOUEscalationProcess = employeeService.getEmployee().userOrganization.escalationProcess;
                workflowItem.escalationStatus = currentOUEscalationProcess;
            } else {
                workflowItem.escalationStatus = null;
            }*/

            self.selected.push(angular.copy(workflowItem));
        };

        self.workflowItemSettingDialog = function (dialogTitle, distWorkflowItem, $event) {
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('workflow-item-settings'),
                controller: 'workflowItemSettingPopCtrl',
                controllerAs: 'ctrl',
                targetEvent: $event,
                bindToController: true,
                locals: {
                    comments: self.workflowComments,
                    workflowActions: self.workflowActions,
                    dialogTitle: dialogTitle,
                    distWorkflowItem: distWorkflowItem,
                    gridName: self.gridName,
                    organizationGroups: self.organizationGroups,
                    fromPredefined: self.fromPredefined,
                    item: self.item,
                    isWorkItem: angular.isArray(self.item) ? false : self.item.isWorkItem(),
                    hiddenForwardSenderInfo: self.hiddenForwardSenderInfo
                }
            })
        };


        self.setBulkWorkflowItemSettings = function ($event) {
            return self
                .workflowItemSettingDialog(langService.get('set_default_workflow_attributes'), self.defaultWorkflowItemsSettings, $event)
                .then(function (result) {
                    _setDistWorkflowItem(self.defaultWorkflowItemsSettings, result);
                    _.map(self.workflowItems, function (item, index) {
                        _setDistWorkflowItem(self.workflowItems[index], result);
                    });
                });
        };

        self.applyNotificationSettings = function ($event) {
            _.map(self.workflowItems, function (item, index) {
                _applyNotificationSettings(self.workflowItems[index], self.defaultWorkflowItemsSettings);
            });
        };


        self.setWorkflowItemSettings = function (workflowItem, $event) {
            return self
                .workflowItemSettingDialog((langService.get('workflow_properties') + ' ' + workflowItem.getTranslatedName()), workflowItem, $event)
                .then(function (result) {
                    _setDistWorkflowItem(workflowItem, result);
                    self.addWorkflowItem(workflowItem, $event);
                });
        };
        /**
         * delete workflowItem
         * @param workflowItem
         * @param $event
         */
        self.deleteWorkflowItem = function (workflowItem, $event) {
            self.selected = _.filter(self.selected, function (item) {
                return !workflowItem.isSameWorkflowItem(item)
            });
        };
        /**
         * check if all selected item in selected workflowItems
         * @param workflowItems
         * @returns {boolean}
         */
        self.allInSelected = function (workflowItems) {
            return !_.some(workflowItems, function (item) {
                return !self.runItemNotExists(item)
            });
        };

        self.addBulkWorkflowItems = function (workflowItems) {
            _.map(workflowItems, function (item) {
                self.addWorkflowItem(item);
            });
        };

        self.addAllBulkWorkflowItems = function (workflowItems) {
            var defaultAction = workflowActionService.getDefaultWorkflowAction(self.workflowActions);
            workflowItems.reduce((items, workflowItem) => {
                if (self.runItemNotExists(workflowItem)) {
                    if (!workflowItem.action) {
                        workflowItem.setAction(defaultAction)
                    }
                    //items.push(workflowItem);
                    self.addWorkflowItem(workflowItem);
                }
                return items
            }, [])
        }

        /**
         * @description Sets the workflow action
         * @param workflowItem
         * @param $event
         */
        // self.setWFAction = function (workflowItem, $event) {
        //     workflowItem.setAction(workflowItem.selectedWFAction);
        // };

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

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.workflowItems = $filter('orderBy')(self.workflowItems, self.grid.order);
        };

        /**
         * @description Opens the dialog to select wfGroup members
         * @param wfGroup
         * @param $event
         */
        self.openWFMemberDialog = function (wfGroup, $event) {
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('select-dist-workflow-group-members'),
                controller: 'distWorkflowGroupMembersPopCtrl',
                controllerAs: 'ctrl',
                targetEvent: $event,
                locals: {
                    wfGroup: wfGroup
                }
            }).then(function (result) {
                self.wfGroupMemberAddCallback(result);
            });
        };

        self.displayAddBulkAllOUs = function () {
            return self.gridName.toLowerCase() === 'ous' && employeeService.getEmployee().inCentralArchive() &&
                self.workflowItems.length && !self.selectedWorkflowItems.length && self.multiSelect &&
                ($state.current.name === 'app.incoming.add' || $state.current.name === 'app.incoming.simple-add');
        }
    });
};
