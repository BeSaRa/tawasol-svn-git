module.exports = function (app) {
    app.controller('broadcastPopCtrl', function (broadcastService,
                                                 $q,
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

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.gridOrganizations = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.organizationsBroadcast.length + 21);
                    }
                }
            ]
        };


        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.gridWorkflowGroups = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.allSelectedWorkflowGroups.length + 21);
                    }
                }
            ]
        };

        self.organizations = organizations;
        self.workflowGroups = workflowGroups;
        self.actions = actions;
        self.correspondence = correspondence;
        self.selectedAction = null;

        self.ouBroadcast = new OUBroadcast();
        self.workflowGroupBroadcast = new WorkflowGroup();

        self.selectedOrganizationBroadcast = [];
        self.selectedWorkflowGroupBroadcast = [];

        self.organizationsBroadcast = [];
        self.allSelectedWorkflowGroups = [];

        /**
         * @description add selected organization to grid
         * @param organizationForm
         */
        self.addOrganizationToBroadcast = function (organizationForm) {
            var isOUExist = _.find(self.organizationsBroadcast, function (ou) {
                return ou.id === self.ouBroadcast.id;
            });
            if (!isOUExist) {
                self.organizationsBroadcast.push(self.ouBroadcast);
            }
            self.ouBroadcast = new OUBroadcast();
            organizationForm.$setUntouched();
        };

        /**
         * @description remove single organization from list
         * @param organization
         */
        self.removeOrganizationBroadcast = function (organization) {
            var organizationToDelete = _.filter(self.organizationsBroadcast, function (ou) {
                return ou.id === organization.id;
            })[0];
            var organizationIndexToDelete = self.organizationsBroadcast.indexOf(organizationToDelete);
            self.organizationsBroadcast.splice(organizationIndexToDelete, 1);
            self.selectedOrganizationBroadcast = [];
        };

        /**
         * @description remove bulk organization from list
         */
        self.removeBulkOrganizationBroadcast = function () {
            self.organizationsBroadcast = [];
            self.selectedOrganizationBroadcast = [];
        };

        /**
         * @description add selected workflow group to grid
         * @param workflowGroupForm
         */
        self.addWorkflowGroupToBroadcast = function (workflowGroupForm) {
            var isWorkflowGroupExist = _.find(self.allSelectedWorkflowGroups, function (workflowGroup) {
                return workflowGroup.id === self.workflowGroupBroadcast.id;
            });
            if (!isWorkflowGroupExist) {
                self.allSelectedWorkflowGroups.push(self.workflowGroupBroadcast);
            }
            self.workflowGroupBroadcast = new WorkflowGroup();
            workflowGroupForm.$setUntouched();
        };

        /**
         * @description remove single workflow group from list
         * @param workflowGroupsBroadcast
         */
        self.removeWorkflowGroupBroadcast = function (workflowGroupsBroadcast) {
            var workflowGroupToDelete = _.filter(self.allSelectedWorkflowGroups, function (wfGroup) {
                return wfGroup.id === workflowGroupsBroadcast.id;
            })[0];
            var workflowGroupIndexToDelete = self.allSelectedWorkflowGroups.indexOf(workflowGroupToDelete);
            self.allSelectedWorkflowGroups.splice(workflowGroupIndexToDelete, 1);
            self.selectedWorkflowGroupBroadcast = [];
        };

        /**
         * @description remove bulk workflow group from list
         */
        self.removeBulkWorkflowGroupBroadcast = function () {
            self.allSelectedWorkflowGroups = [];
            self.selectedWorkflowGroupBroadcast = [];
        };

        /**
         * @description broadcast all selected organizations and workflow group with selected action
         */
        self.startBroadcast = function () {
            self.broadcast = new Broadcast({
                wfGroups: self.allSelectedWorkflowGroups,
                ouList: self.organizationsBroadcast,
                action: self.selectedAction
            });

            return correspondenceService
                .broadcasting(self.broadcast, self.correspondence)
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

        self.organizationNotExists = function (organization) {
            return !_.find(self.organizationsBroadcast, function (item) {
                return item.id === organization.id
            });
        };

        /**
         * @description close broadcast popup
         */
        self.closeBroadcastPopupFromCtrl = function () {
            dialog.cancel();
        }

    });
};