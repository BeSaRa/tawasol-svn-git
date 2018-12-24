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
                                                 OUBroadcast,
                                                 correspondenceService,
                                                 WorkflowGroup,
                                                 Broadcast,
                                                 errorCode) {
            'ngInject';
            var self = this;

            self.controllerName = 'broadcastPopCtrl';

            self.progress = null;

            self.actions = actions;
            self.selectedAction = (self.actions && self.actions.length) ? self.actions[0] : null;

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
                //order: 'arName', // default sorting order
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
                    return item.id === workflowGroup.id && self.checkBroadcastRecordType(item, self.broadcastRecordType.workflowGroup);
                });
            };

            self.checkBroadcastRecordType = function (record, typeToCompare) {
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
                broadcastForm.$setUntouched();
            };

            /**
             * @description add selected organization to grid
             */
            self.addOrganizationToBroadcast = function () {
                if (self.ouBroadcast && self.ouBroadcast.length) {
                    self.addedOUAndWFGroupsToBroadcast = self.addedOUAndWFGroupsToBroadcast.concat(self.ouBroadcast);
                }
                self.ouBroadcast = null;
            };

            self.removeRecordFromBroadcastGrid = function (record) {
                dialog.confirmMessage(langService.get('confirm_delete_msg'))
                    .then(function () {
                        self.removeOrganizationBroadcast(record);
                        self.removeWorkflowGroupBroadcast(record);
                        self.selectedAddedOUAndWFGroupsToBroadcast = [];
                    })
            };

            /**
             * @description remove single organization from list
             * @param ouToBroadcast
             */
            self.removeOrganizationBroadcast = function (ouToBroadcast) {
                var organizationIndexToDelete = _.findIndex(self.addedOUAndWFGroupsToBroadcast, function (ou) {
                    return ou.id === ouToBroadcast.id && self.checkBroadcastRecordType(organization, self.broadcastRecordType.organization);
                });
                if (organizationIndexToDelete > -1) {
                    self.addedOUAndWFGroupsToBroadcast.splice(organizationIndexToDelete, 1);
                }
            };

            /**
             * @description remove single workflow group from list
             * @param wfGroupToBroadcast
             */
            self.removeWorkflowGroupBroadcast = function (wfGroupToBroadcast) {
                var workflowGroupIndexToDelete = _.findIndex(self.addedOUAndWFGroupsToBroadcast, function (wfGroup) {
                    return wfGroup.id === wfGroupToBroadcast.id && self.checkBroadcastRecordType(organization, self.broadcastRecordType.workflowGroup);
                });
                if (workflowGroupIndexToDelete > -1) {
                    self.addedOUAndWFGroupsToBroadcast.splice(workflowGroupIndexToDelete, 1);
                }
            };

            self.removeBulkRecordsFromBroadcastGrid = function () {
                dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'))
                    .then(function () {
                        self.removeBulkOrganizationBroadcast();
                        self.removeBulkWorkflowGroupBroadcast();
                        self.selectedAddedOUAndWFGroupsToBroadcast = [];
                    });
            };

            /**
             * @description remove bulk organization from list
             */
            self.removeBulkOrganizationBroadcast = function () {
                _.map(self.selectedAddedOUAndWFGroupsToBroadcast, function (selectedOu) {
                    return _.remove(self.addedOUAndWFGroupsToBroadcast, function (Ou) {
                        if (Ou.id === selectedOu.id && self.checkBroadcastRecordType(Ou, self.broadcastRecordType.organization))
                            return Ou;
                    });
                });

            };

            /**
             * @description remove bulk workflow group from list
             */
            self.removeBulkWorkflowGroupBroadcast = function () {
                _.map(self.selectedAddedOUAndWFGroupsToBroadcast, function (selectedWf) {
                    return _.remove(self.addedOUAndWFGroupsToBroadcast, function (wfGroup) {
                        if (wfGroup.id === selectedWf.id && self.checkBroadcastRecordType(wfGroup, self.broadcastRecordType.workflowGroup))
                            return wfGroup;
                    });
                });
            };

            /**
             * @description add selected workflow group to grid
             */
            self.addWorkflowGroupToBroadcast = function () {
                if (self.wfGroupBroadcast) {
                    self.addedOUAndWFGroupsToBroadcast = self.addedOUAndWFGroupsToBroadcast.concat(self.wfGroupBroadcast);
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
                var broadcast = new Broadcast({
                    wfGroups: _.filter(self.addedOUAndWFGroupsToBroadcast, function (record) {
                        return self.checkBroadcastRecordType(record, self.broadcastRecordType.workflowGroup);
                    }),
                    ouList: _.filter(self.addedOUAndWFGroupsToBroadcast, function (record) {
                        return self.checkBroadcastRecordType(record, self.broadcastRecordType.organization);
                    }),
                    action: self.selectedAction
                });

                return correspondenceService
                    .broadcasting(broadcast, correspondence)
                    .then(function (result) {
                        toast.success(langService.get('correspondence_broadcasted_successfully'));
                        dialog.hide(result);
                    })
                    .catch(function (error) {
                        errorCode.checkIf(error, 'NO_USER_TO_BROADCAST', function () {
                            dialog.errorMessage(langService.get('no_user_to_broadcast'));
                        })
                    });
            };

            /**
             * @description close broadcast popup
             */
            self.closePopup = function () {
                dialog.cancel();
            }

        }
    );
};