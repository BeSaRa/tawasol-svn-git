module.exports = function (app) {
    app.controller('workflowGroupPopCtrl', function (editMode,
                                                     workflowGroup,
                                                     WorkflowGroup,
                                                     validationService,
                                                     workflowGroupService,
                                                     toast,
                                                     _,
                                                     dialog,
                                                     generator,
                                                     langService,
                                                     isUserPreference,
                                                     ouApplicationUserService,
                                                     OUApplicationUser,
                                                     ApplicationUser,
                                                     Organization) {
        'ngInject';
        var self = this;
        self.controllerName = 'workflowGroupPopCtrl';
        self.editMode = editMode;
        self.isUserPreference = isUserPreference;
        self.model = angular.copy(workflowGroup);
        self.workflowGroup = angular.copy(workflowGroup);

        self.availableSearchCriteria = [
            {key: 'loginName', value: 'login_name'},
            {key: 'employeeNo', value: 'employee_number'},
            {key: 'organizationUnit', value: 'organization_unit'},
            {key: 'arFullName', value: 'arabic_name'},
            {key: 'enFullName', value: 'english_name'}
        ];
        self.selectedAppUser = null;

        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name',
            groupMembers: 'group_members'
        };

        self.removeUserLabels = {
            groupMembers: 'group_members'
        };

        self.checkRequiredFields = function (model) {
            var required = model.getRequiredFields(), result = [];
            _.map(required, function (property) {
                if (!generator.validRequired(model[property]))
                    if (isUserPreference) {
                        // if private wfGroup and one of arName or enName is filled, skip the property from required;
                        if ((property === 'arName' && !model['enName']) || (property === 'enName' && !model['arName']))
                            result.push(property);
                    }
                    else {
                        result.push(property);
                    }
            });
            return result;
        };

        /**
         * Add new workflow Group
         */
        self.addWorkflowGroupFromCtrl = function () {
            if (isUserPreference) {
                self.workflowGroup.global = false;
            }
            validationService
                .createValidation('ADD_WORKFLOW_GROUP')
                .addStep('check_required', true, self.checkRequiredFields, self.workflowGroup, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_workflow_group_members', true, workflowGroupService.checkWorkflowGroupMembersExist, self.workflowGroup, function (result) {
                    return !result;
                })
                .notifyFailure(function () {
                    toast.error(langService.get('group_members_required'));
                })
                .addStep('check_duplicate', true, workflowGroupService.checkDuplicateWorkflowGroup, [self.workflowGroup, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    workflowGroupService
                        .addWorkflowGroup(self.workflowGroup)
                        .then(function (result) {
                            dialog.hide(result);
                        });

                })
                .catch(function (error) {
                    console.log("ERROR", error);
                });
        };

        /**
         * Edit workflow Group
         */
        self.editWorkflowGroupFromCtrl = function () {
            validationService
                .createValidation('EDIT_WORKFLOW_GROUP')
                .addStep('check_required', true, self.checkRequiredFields, self.workflowGroup, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, workflowGroupService.checkDuplicateWorkflowGroup, [self.workflowGroup, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    workflowGroupService
                        .updateWorkflowGroup(self.workflowGroup)
                        .then(function (result) {
                            dialog.hide(result);
                        });

                })
                .catch(function () {

                });
        };

        /**
         * @description to add workflow group members
         * @param $event
         */
        self.selectGroupMember = function ($event) {
            var applicationUsers = self.getApplicationUsers(self.workflowGroup.groupMembers);
            ouApplicationUserService
                .controllerMethod
                .selectOUApplicationUsers(applicationUsers, self.removeUserLabels.groupMembers, $event, isUserPreference)
                .then(function (ouApplicationUsers) {
                    self.addApplicationUserToArray(ouApplicationUsers);
                });
        };

        /**
         * @description Adds the returned ouApplication users to the group members list
         * @param ouApplicationUsers
         */
        self.addApplicationUserToArray = function (ouApplicationUsers) {
            //if user select some app users
            if (ouApplicationUsers && ouApplicationUsers.length) {
                self.workflowGroup.groupMembers = ouApplicationUsers;
            }
        };


        /**
         * @description Open the popup to select group member in user preference
         * @param $event
         */
        self.selectGroupMemberUserWorkflowGroup = function ($event) {
            var groupMembers = self.workflowGroup.groupMembers;
            ouApplicationUserService
                .controllerMethod
                .selectUsersForUserWFGroup(groupMembers, isUserPreference, $event)
                .then(function (selectedUsers) {
                    self.addSelectedUsersToArray(selectedUsers);
                });
        };

        /**
         * @description Adds the returned selected users to the group members list in user preference
         * @param selectedUsers
         */
        self.addSelectedUsersToArray = function (selectedUsers) {
            if (selectedUsers && selectedUsers.length) {
                _.map(selectedUsers, function (selectedUser) {
                    var isMemberExist = _.find(self.workflowGroup.groupMembers, function (member) {
                        return member.applicationUser.id === selectedUser.toUserId
                            && member.ouid.id === selectedUser.appUserOUID
                    });
                    if (!isMemberExist) {
                        var user = new OUApplicationUser({
                            applicationUser: new ApplicationUser({
                                arFullName: selectedUser.arName,
                                enFullName: selectedUser.enName,
                                id: selectedUser.toUserId
                            }),
                            ouid: new Organization({
                                id: selectedUser.appUserOUID,
                                arName: selectedUser.arOUName,
                                enName: selectedUser.enOUName
                            })
                        });
                        self.workflowGroup.groupMembers.push(user);
                    }
                });
            }
        };

        self.getApplicationUsers = function (groupMembers) {
            if (!groupMembers.length)
                return [];

            return _.map(groupMembers, function (group) {
                return group;
            });
        };

        /**
         * to delete group members
         * @param property
         */
        self.deleteGroupMemberFrom = function (property) {
            var message = langService.get(self.removeUserLabels[property]);
            dialog
                .confirmMessage(message.change({name: self.model[property].getNames()}))
                .then(function () {
                    self.model[property] = null;
                });
        };

        /**
         * @description Close the popup
         */
        self.closeWorkflowGroupPopupFromCtrl = function () {
            dialog.cancel();
        };

        /**
         * @description Remove the group member
         * @param groupMember
         * @param $event
         */
        self.removeWorkflowGroupMember = function (groupMember, $event) {
            dialog
                .confirmMessage(langService.get('confirm_delete').change({name: groupMember.applicationUser.getNames()}))
                .then(function () {
                    var indexToDelete = 0;
                    var groupMemberToDelete = _.find(self.workflowGroup.groupMembers, function (member, index) {
                        indexToDelete = index;
                        return member.applicationUser.id === groupMember.applicationUser.id;
                    });
                    if (groupMemberToDelete) {
                        self.workflowGroup.groupMembers.splice(indexToDelete, 1);
                        //self.editWorkflowGroupFromCtrl();
                    }
                });
        };

        self.resetModel = function () {
            generator.resetFields(self.workflowGroup, self.model);
        };

    });
};