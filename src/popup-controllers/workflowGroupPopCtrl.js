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
                                                     usersWorkflowGroupByAdmin,
                                                     userWorkflowGroupService,
                                                     Organization) {
        'ngInject';
        var self = this;
        self.controllerName = 'workflowGroupPopCtrl';
        self.editMode = editMode;
        self.isUserPreference = isUserPreference;
        self.usersWorkflowGroupByAdmin = usersWorkflowGroupByAdmin;
        self.workflowGroup = angular.copy(workflowGroup);
        self.model = angular.copy(workflowGroup);

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
                    } else {
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

        /*  self.selectGroupMember = function ($event) {
              var applicationUsers = self.getApplicationUsers(self.workflowGroup.groupMembers);
              ouApplicationUserService
                  .controllerMethod
                  .selectOUApplicationUsers(applicationUsers, self.removeUserLabels.groupMembers, $event, isUserPreference)
                  .then(function (ouApplicationUsers) {
                      self.addApplicationUserToArray(ouApplicationUsers);
                  });
          };

          /!**
           * @description Adds the returned ouApplication users to the group members list
           * @param ouApplicationUsers
           *!/
          self.addApplicationUserToArray = function (ouApplicationUsers) {
              //if user select some app users
              if (ouApplicationUsers && ouApplicationUsers.length) {
                  self.workflowGroup.groupMembers = ouApplicationUsers;
              }
          };*/


        /**
         * @description Open the popup to select group member in user preference
         * @param groupMembers
         * @param isAdminAssigned
         * @param $event
         */
        self.selectGroupMemberUserWorkflowGroup = function (groupMembers, isAdminAssigned, $event) {
            ouApplicationUserService
                .controllerMethod
                .selectUsersForUserWFGroup(groupMembers, isUserPreference, isAdminAssigned, self.workflowGroup, $event)
                .then(function (selectedUsers) {
                    if (isAdminAssigned) {
                        userWorkflowGroupService.loadUsersWorkflowGroupAssignedByAdmin(self.workflowGroup).then(function (users) {
                            self.usersWorkflowGroupByAdmin = users;
                            if (!users.length && selectedUsers.length) {
                                self.editWorkflowGroupFromCtrl();
                            }
                        })
                    } else {
                        self.addSelectedUsersToArray(selectedUsers, groupMembers);
                    }
                });
        };

        /**
         * @description Adds the returned selected users to the group members list in user preference
         * @param selectedUsers
         * @param groupMembers
         */
        self.addSelectedUsersToArray = function (selectedUsers, groupMembers) {
            if (selectedUsers && selectedUsers.length) {
                _.map(selectedUsers, function (selectedUser) {
                    var isMemberExist = _.find(groupMembers, function (member) {
                        return member.applicationUser.id === selectedUser.toUserId;
                    });


                    if (isMemberExist) {
                        dialog.confirmMessage(langService.get('replace_workflow_group_member').change(
                            {
                                name: isMemberExist.applicationUser.getTranslatedName(),
                                ou: isMemberExist.ouid.getTranslatedName()
                            }))
                            .then(function () {
                                _removeWorkflowGroupMember(isMemberExist, groupMembers);
                                _addSelectedUserToArray(selectedUser, groupMembers);
                            });
                    } else {
                        _addSelectedUserToArray(selectedUser, groupMembers);
                    }
                });
            }
        };

        function _addSelectedUserToArray(selectedUser, groupMembers) {
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
            groupMembers.push(user);
        }

        self.getApplicationUsers = function (groupMembers) {
            if (!groupMembers.length)
                return [];

            return _.map(groupMembers, function (group) {
                return group;
            });
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
                    _removeWorkflowGroupMember(groupMember)
                });
        };

        /**
         * @description remove private workflow group member
         * @param groupMember
         * @param $event
         */
        self.removeUserWorkflowGroupAssignedByAdmin = function (groupMember, $event) {
            userWorkflowGroupService
                .controllerMethod
                .userWorkflowGroupDelete(groupMember, self.workflowGroup, $event)
                .then(function (result) {
                    userWorkflowGroupService.loadUsersWorkflowGroupAssignedByAdmin(self.workflowGroup)
                        .then(function (users) {
                            self.usersWorkflowGroupByAdmin = users;
                        })
                })
        }

        function _removeWorkflowGroupMember(groupMember) {
            var index = _.findIndex(self.workflowGroup.groupMembers, function (addedGroupMember) {
                return addedGroupMember.applicationUser.id === groupMember.applicationUser.id;
            });
            if (index > -1)
                self.workflowGroup.groupMembers.splice(index, 1);
        }

        self.resetModel = function () {
            generator.resetFields(self.workflowGroup, self.model);
        };

        /**
         * @description Close the popup
         */
        self.closeWorkflowGroupPopupFromCtrl = function () {
            dialog.cancel();
        };


        self.onChangeGlobal = function () {
            self.workflowGroup.isAdminAssigned = !self.workflowGroup.global;
        }

        self.checkWorkflowGroupDisabled = function () {
            return self.workflowGroup.groupMembers.length === 0 || (!self.isUserPreference && !self.workflowGroup.global && self.usersWorkflowGroupByAdmin.length === 0);
        }
    });
};
