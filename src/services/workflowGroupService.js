module.exports = function (app) {
    app.service('workflowGroupService', function (urlService,
                                                  $http,
                                                  $q,
                                                  generator,
                                                  WorkflowGroup,
                                                  _,
                                                  dialog,
                                                  langService,
                                                  toast,
                                                  cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'workflowGroupService';

        self.workflowGroups = [];

        /**
         * @description load workflow Groups from server.
         * @returns {Promise|workflowGroups}
         */
        self.loadWorkflowGroups = function () {
            return $http.get(urlService.workflowGroups + '/all-global').then(function (result) {
                self.workflowGroups = generator.generateCollection(result.data.rs, WorkflowGroup, self._sharedMethods);
                self.workflowGroups = generator.interceptReceivedCollection('WorkflowGroup', self.workflowGroups);
                return self.workflowGroups;
            });
        };
        /**
         * @description get workflow Groups from self.workflowGroups if found and if not load it from server again.
         * @returns {Promise|workflowGroups}
         */
        self.getWorkflowGroups = function () {
            return self.workflowGroups.length ? $q.when(self.workflowGroups) : self.loadWorkflowGroups();
        };

        /**
         * @description Contains methods for CRUD operations for workflow Groups
         */
        self.controllerMethod = {
            workflowGroupAdd: function (isUserPreference, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('workflow-group'),
                        controller: 'workflowGroupPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            workflowGroup: new WorkflowGroup(),
                            isUserPreference: isUserPreference
                        }
                    })
            },
            workflowGroupEdit: function (workflowGroup, isUserPreference, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('workflow-group'),
                        controller: 'workflowGroupPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            workflowGroup: workflowGroup,
                            workflowGroups: self.workflowGroups,
                            isUserPreference: isUserPreference
                        }
                    })
            },
            workflowGroupDelete: function ($event, workflowGroup) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: workflowGroup.getNames()}))
                    .then(function () {
                        return self.deleteWorkflowGroup(workflowGroup).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: workflowGroup.getNames()}));
                            return true;
                        })
                    });
            },
            workflowGroupDeleteBulk: function (workflowGroups, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'))
                    .then(function () {
                        return self.deleteBulkWorkflowGroups(workflowGroups).then(function (result) {
                            var response = false;
                            if (result.length === workflowGroups.length) {
                                toast.error(langService.get("failed_delete_selected"));
                                response = false;
                            } else if (result.length) {
                                generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (workflowGroup) {
                                    return workflowGroup.getNames();
                                }));
                                response = true;
                            } else {
                                toast.success(langService.get("delete_success"));
                                response = true;
                            }
                            return response;
                        });
                    });
            },
            showGroupMembers: function (groupMembers, $event) {
                return dialog.showDialog({
                    templateUrl: cmsTemplate.getPopup('group-members'),
                    escToCancel: true,
                    targetEvent: $event,
                    controller: 'groupMembersPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        groupMembers: groupMembers
                    }
                });
            }
        };

        /**
         * @description add new workflow Group
         * @param workflowGroup
         * @return {Promise|WorkflowGroup}
         */
        self.addWorkflowGroup = function (workflowGroup) {
            return $http
                .post(urlService.workflowGroups,
                    generator.interceptSendInstance('WorkflowGroup', workflowGroup))
                .then(function (result) {
                    workflowGroup.id = result.data.rs;
                    return generator.generateInstance(workflowGroup, WorkflowGroup, self._sharedMethods);
                });
        };
        /**
         * @description make an update for given workflow Group.
         * @param workflowGroup
         * @return {Promise|WorkflowGroup}
         */
        self.updateWorkflowGroup = function (workflowGroup) {
            return $http
                .put(urlService.workflowGroups,
                    generator.interceptSendInstance('WorkflowGroup', workflowGroup))
                .then(function () {
                    return generator.generateInstance(workflowGroup, WorkflowGroup, self._sharedMethods);
                });
        };
        /**
         * @description delete given workflow Group.
         * @param workflowGroup
         * @return {Promise|null}
         */
        self.deleteWorkflowGroup = function (workflowGroup) {
            var id = workflowGroup.hasOwnProperty('id') ? workflowGroup.id : workflowGroup;
            return $http.delete((urlService.workflowGroups + '/' + id)).then(function (result) {
                return result;
            });
        };

        /**
         * @description delete bulk document types.
         * @param workflowGroups
         * @return {Promise|null}
         */
        self.deleteBulkWorkflowGroups = function (workflowGroups) {
            var bulkIds = workflowGroups[0].hasOwnProperty('id') ? _.map(workflowGroups, 'id') : workflowGroups;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.workflowGroups + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedWorkflowGroups = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedWorkflowGroups.push(key);
                });
                return _.filter(workflowGroups, function (workflowGroup) {
                    return (failedWorkflowGroups.indexOf(workflowGroup.id) > -1);
                });
            });
        };

        /**
         * @description get workflow Group by workflowGroupId
         * @param workflowGroupId
         * @returns {WorkflowGroup|undefined} return WorkflowGroup Model or undefined if not found.
         */
        self.getWorkflowGroupById = function (workflowGroupId) {
            workflowGroupId = workflowGroupId instanceof WorkflowGroup ? workflowGroupId.id : workflowGroupId;
            return _.find(self.workflowGroups, function (workflowGroup) {
                return Number(workflowGroup.id) === Number(workflowGroupId)
            });
        };

        /**
         * @description activate workflow Group
         * @param workflowGroup
         */
        self.activateWorkflowGroup = function (workflowGroup) {
            return $http
                .put((urlService.workflowGroups + '/activate/' + workflowGroup.id))
                .then(function () {
                    return workflowGroup;
                });
        };

        /**
         * @description Deactivate workflow Group
         * @param workflowGroup
         */
        self.deactivateWorkflowGroup = function (workflowGroup) {
            return $http
                .put((urlService.workflowGroups + '/deactivate/' + workflowGroup.id))
                .then(function () {
                    return workflowGroup;
                });
        };

        /**
         * @description Activate bulk of workflow Groups
         * @param workflowGroups
         */
        self.activateBulkWorkflowGroups = function (workflowGroups) {
            return $http
                .put((urlService.workflowGroups + '/activate/bulk'), _.map(workflowGroups, 'id'))
                .then(function () {
                    return workflowGroups;
                });
        };

        /**
         * @description Deactivate bulk of workflow Groups
         * @param workflowGroups
         */
        self.deactivateBulkWorkflowGroups = function (workflowGroups) {
            return $http
                .put((urlService.workflowGroups + '/deactivate/bulk'), _.map(workflowGroups, 'id'))
                .then(function () {
                    return workflowGroups;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param workflowGroup
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateWorkflowGroup = function (workflowGroup, editMode) {
            var workflowGroupsToFilter = angular.copy(self.workflowGroups);
            if (editMode) {
                workflowGroupsToFilter = _.filter(workflowGroupsToFilter, function (workflowGroupToFilter) {
                    return workflowGroupToFilter.id !== workflowGroup.id;
                });
            }
            return _.some(_.map(workflowGroupsToFilter, function (existingWorkflowGroup) {
                // private/user workflow group accepts empty, so check with conditions
                if (!workflowGroup.global) {
                    // if existing workflow group doesn't have name, change them to empty strings
                    existingWorkflowGroup.arName = existingWorkflowGroup.arName ? existingWorkflowGroup.arName : '';
                    existingWorkflowGroup.enName = existingWorkflowGroup.enName ? existingWorkflowGroup.enName : '';

                    // if workflow group has arName and enName, check them
                    if (workflowGroup.arName && workflowGroup.enName) {
                        return existingWorkflowGroup.arName === workflowGroup.arName
                            || existingWorkflowGroup.enName.toLowerCase() === workflowGroup.enName.toLowerCase();
                    } else if (!workflowGroup.arName && workflowGroup.enName) {
                        return existingWorkflowGroup.enName.toLowerCase() === workflowGroup.enName.toLowerCase();
                    } else if (workflowGroup.arName && !workflowGroup.enName)
                        return existingWorkflowGroup.arName === workflowGroup.arName;
                } else {
                    return existingWorkflowGroup.arName === workflowGroup.arName
                        || existingWorkflowGroup.enName.toLowerCase() === workflowGroup.enName.toLowerCase();
                }
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Check if record has group members selected or not. Returns true if selected
         * @param workflowGroup
         * @returns {boolean}
         */
        self.checkWorkflowGroupMembersExist = function (workflowGroup) {
            if (workflowGroup.groupMembers) {
                if (workflowGroup.groupMembers.length === 0) {
                    return true;
                }
            } else {
                return true;
            }

            return false;
        };

        /**
         * @description create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteWorkflowGroup, self.updateWorkflowGroup);

    });
};
