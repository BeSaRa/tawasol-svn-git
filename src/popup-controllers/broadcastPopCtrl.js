module.exports = function (app) {
    app.controller('broadcastPopCtrl', function (broadcastService,
                                                 $q,
                                                 $filter,
                                                 langService,
                                                 toast,
                                                 dialog,
                                                 _,
                                                 correspondence,
                                                 organizations,
                                                 actions,
                                                 workflowGroups,
                                                 ranks,
                                                 jobTitles,
                                                 OUBroadcast,
                                                 correspondenceService,
                                                 WorkflowGroup,
                                                 Broadcast,
                                                 employeeService,
                                                 errorCode) {
            'ngInject';
            var self = this;

            self.controllerName = 'broadcastPopCtrl';

            self.progress = null;

            self.actions = actions;
            self.jobTitles = jobTitles;
            self.ranks = ranks;

            self.selectedAction = (self.actions && self.actions.length) ? self.actions[0] : null;
            self.selectedJobTitle = null;
            self.selectedRank = null;

            self.actionSearchText = '';
            self.ouSearchText = '';
            self.broadcastToAll = false;
            self.broadcastToAllOUs = false;
            self.broadcastToAllWF = false;
            self.employeeService = employeeService;
            self.broadcastRecordType = {
                organization: {
                    name: 'organization',
                    icon: 'bank',
                    text: 'organization'
                },
                workflowGroup: {
                    name: 'workflowGroup',
                    icon: 'account-group',
                    text: 'workflow_group'
                }
            };

            self.organizations = _.map(organizations, function (record) {
                record.broadcastRecordType = self.broadcastRecordType.organization;
                return record;
            });

            self.workflowGroups = _.map(workflowGroups, function (record) {
                record.broadcastRecordType = self.broadcastRecordType.workflowGroup;
                return record;
            });

            self.ouBroadcast = null;
            self.wfGroupBroadcast = null;

            self.addedOUAndWFGroupsToBroadcast = [];
            self.selectedAddedOUAndWFGroupsToBroadcast = [];

            self.grid = {
                limit: 5, // default limit
                page: 1, // first page
                order: '', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.addedOUAndWFGroupsToBroadcast.length + 21);
                        }
                    }
                ]
            };

            self.getSortedData = function () {
                self.addedOUAndWFGroupsToBroadcast = $filter('orderBy')(self.addedOUAndWFGroupsToBroadcast, self.grid.order);
            };

            /**
             * @description Check if the organization does not exists in the added organizations
             * @returns {boolean}
             * @param organization
             */
            self.organizationNotExists = function (organization) {
                return !_.find(self.addedOUAndWFGroupsToBroadcast, function (item) {
                    item = item.hasOwnProperty('itemId') ? item.itemId : item;
                    return item.id === organization.id && self.checkBroadcastRecordType(organization, self.broadcastRecordType.organization);
                });
            };

            /**
             * @description Check if the workflow group does not exists in the added workflow groups
             * @param workflowGroup
             * @returns {boolean}
             */
            self.workflowGroupNotExists = function (workflowGroup) {
                return !_.find(self.addedOUAndWFGroupsToBroadcast, function (item) {
                    item = item.hasOwnProperty('itemId') ? item.itemId : item;
                    return item.id === workflowGroup.id && self.checkBroadcastRecordType(item, self.broadcastRecordType.workflowGroup);
                });
            };

            self.checkBroadcastRecordType = function (record, typeToCompare) {
                record = record.hasOwnProperty('itemId') ? record.itemId : record;
                if (typeToCompare && typeof typeToCompare === 'object' && typeToCompare.hasOwnProperty('name'))
                    return record.broadcastRecordType.name === typeToCompare.name;
                return record.broadcastRecordType.name === typeToCompare;
            };

            /**
             * @description Add selected ous and wfGroups to grid
             */
            self.addToBroadcast = function (broadcastForm) {
                self.addOrganizationToBroadcast();
                self.addWorkflowGroupToBroadcast();
                self.selectedRank = null;
                self.selectedJobTitle = null;
                broadcastForm.$setUntouched();
            };

            var _isOuBroadcastAlreadyExist = function (ou) {
                var addedOus = angular.copy(_.filter(self.addedOUAndWFGroupsToBroadcast, function (item) {
                    return self.checkBroadcastRecordType(item, self.broadcastRecordType.organization);
                }));
                return !!_.find(addedOus, function (item) {
                    item.rank = item.rank ? item.rank.lookupKey : null;
                    item.jobTitle = item.jobTitle ? item.jobTitle.lookupKey : null;
                    return item.itemId.id === ou.id
                        && item.rank === (self.selectedRank ? self.selectedRank.lookupKey : null)
                        && item.jobTitle === (self.selectedJobTitle ? self.selectedJobTitle.lookupKey : null);
                });
            };

            var _isWFGroupBroadcastAlreadyExist = function (wfGroup) {
                var addedWFGroups = angular.copy(_.filter(self.addedOUAndWFGroupsToBroadcast, function (item) {
                    return self.checkBroadcastRecordType(item, self.broadcastRecordType.workflowGroup);
                }));
                return !!_.find(addedWFGroups, function (item) {
                    item.rank = item.rank ? item.rank.lookupKey : null;
                    item.jobTitle = item.jobTitle ? item.jobTitle.lookupKey : null;
                    return item.itemId.id === wfGroup.id
                        && item.rank === (self.selectedRank ? self.selectedRank.lookupKey : null)
                        && item.jobTitle === (self.selectedJobTitle ? self.selectedJobTitle.lookupKey : null);
                });
            };

            /**
             * @description add selected organization to grid
             */
            self.addOrganizationToBroadcast = function () {
                if (self.ouBroadcast && self.ouBroadcast.length) {
                    for (var i = 0; i < self.ouBroadcast.length; i++) {
                        if (!_isOuBroadcastAlreadyExist(self.ouBroadcast[i])) {
                            self.addedOUAndWFGroupsToBroadcast.push({
                                itemId: self.ouBroadcast[i],
                                jobTitle: self.selectedJobTitle,
                                rank: self.selectedRank
                            });
                        }
                    }
                }
                self.ouBroadcast = null;
            };

            /**
             * @description Removes the added record(OU/WfGroup) from list of added records
             * @param recordToDelete
             */
            self.removeRecordFromBroadcastGrid = function (recordToDelete) {
                recordToDelete = recordToDelete.hasOwnProperty('itemId') ? recordToDelete.itemId : recordToDelete;
                dialog.confirmMessage(langService.get('confirm_delete_msg'))
                    .then(function () {
                        var indexToDelete = _.findIndex(self.addedOUAndWFGroupsToBroadcast, function (addedRecord) {
                            addedRecord = addedRecord.hasOwnProperty('itemId') ? addedRecord.itemId : addedRecord;
                            return recordToDelete.id === addedRecord.id && self.checkBroadcastRecordType(addedRecord, recordToDelete.broadcastRecordType);
                        });
                        if (indexToDelete > -1) {
                            self.addedOUAndWFGroupsToBroadcast.splice(indexToDelete, 1);
                        }
                        self.selectedAddedOUAndWFGroupsToBroadcast = [];
                    })
            };

            /**
             * @description Removes the selected records(OUs/WfGroups) from list of added records
             */
            self.removeBulkRecordsFromBroadcastGrid = function () {
                dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'))
                    .then(function () {
                        _.map(self.selectedAddedOUAndWFGroupsToBroadcast, function (recordToDelete) {
                            recordToDelete = recordToDelete.hasOwnProperty('itemId') ? recordToDelete.itemId : recordToDelete;
                            return _.remove(self.addedOUAndWFGroupsToBroadcast, function (addedRecord) {
                                addedRecord = addedRecord.hasOwnProperty('itemId') ? addedRecord.itemId : addedRecord;
                                if (addedRecord.id === recordToDelete.id && self.checkBroadcastRecordType(addedRecord, recordToDelete.broadcastRecordType))
                                    return addedRecord;
                            });
                        });
                        self.selectedAddedOUAndWFGroupsToBroadcast = [];
                    });
            };

            /**
             * @description add selected workflow group to grid
             */
            self.addWorkflowGroupToBroadcast = function () {
                if (self.wfGroupBroadcast) {
                    for (var i = 0; i < self.wfGroupBroadcast.length; i++) {
                        if (!_isWFGroupBroadcastAlreadyExist(self.wfGroupBroadcast[i])) {
                            self.addedOUAndWFGroupsToBroadcast.push({
                                itemId: self.wfGroupBroadcast[i],
                                jobTitle: self.selectedJobTitle,
                                rank: self.selectedRank
                            });
                        }
                    }
                }
                self.wfGroupBroadcast = null;
            };

            self.checkDisabled = function () {
                return (self.addedOUAndWFGroupsToBroadcast.length === 0) || (!self.selectedAction);
            };
            /**
             * @description broadcast all selected organizations and workflow group with selected action
             */
            self.startBroadcast = function () {
                (self.broadcastToAll) ?
                    dialog.confirmMessage(langService.get('confirm_broadcast_to_all'))
                        .then(function () {
                            _startBroadcast();
                        }) : _startBroadcast();
            };

            function _startBroadcast() {
                var broadcast = new Broadcast({
                    wfGroups: _.filter(self.addedOUAndWFGroupsToBroadcast, function (record) {
                        record = record.hasOwnProperty('itemId') ? record.itemId : record;
                        return self.checkBroadcastRecordType(record, self.broadcastRecordType.workflowGroup);
                    }),
                    ouList: _.filter(self.addedOUAndWFGroupsToBroadcast, function (record) {
                        record = record.hasOwnProperty('itemId') ? record.itemId : record;
                        return self.checkBroadcastRecordType(record, self.broadcastRecordType.organization);
                    }),
                    action: self.selectedAction
                });

                return correspondenceService
                    .broadcasting(broadcast, correspondence, self.broadcastToAll)
                    .then(function (result) {
                        toast.success(langService.get('correspondence_broadcasted_successfully'));
                        dialog.hide(result);
                    })
                    .catch(function (error) {
                        errorCode.checkIf(error, 'NO_USER_TO_BROADCAST', function () {
                            dialog.errorMessage(langService.get('no_user_to_broadcast'));
                        })
                    });
            }

            /**
             * @description close broadcast popup
             */
            self.closePopup = function () {
                dialog.cancel();
            };

            /**
             * @description Clears the searchText for the given field
             * @param fieldType
             */
            self.clearSearchText = function (fieldType) {
                self[fieldType + 'SearchText'] = '';
            };

            /***
             * @description on toggle broadcast to all (organizations,wf groups)
             * @param broadcastForm
             */
            self.toggleBroadcastToAll = function (broadcastForm) {
                if (self.broadcastToAll) {
                    self.ouBroadcast = self.wfGroupBroadcast = null;
                    self.broadcastToAllOUs = self.broadcastToAllWF = false;
                    broadcastForm.$setUntouched();
                }
            }

            /***
             * @description
             * @param toggleAll
             */
            self.toggleAllBroadcast = function (toggleAll) {
                if (toggleAll === 'ous') {
                    self.ouBroadcast = null;
                    self.ouBroadcast = self.broadcastToAllOUs ? self.organizations : null;
                } else if (toggleAll === 'wfgroups') {
                    self.wfGroupBroadcast = self.broadcastToAllWF ? self.workflowGroups : null;
                }
            }

            /***
             * @description
             * @param toggleAll
             */
            self.onSelectBroadcast = function (toggleAll) {
                if (toggleAll === 'ous') {
                    self.broadcastToAllOUs = !!(self.ouBroadcast && self.ouBroadcast.length && self.ouBroadcast.length === self.organizations.length);
                } else if (toggleAll === 'wfgroups') {
                    self.broadcastToAllWF = !!(self.wfGroupBroadcast && self.wfGroupBroadcast.length && self.wfGroupBroadcast.length === self.workflowGroups.length);
                }
            }

            /**
             * @description Prevent the default dropdown behavior of keys inside the search box of dropdown
             * @param $event
             */
            self.preventSearchKeyDown = function ($event) {
                if ($event) {
                    var code = $event.which || $event.keyCode;
                    if (code !== 38 && code !== 40)
                        $event.stopPropagation();
                }
            };

        }
    );
};
