module.exports = function (app) {
    app.controller('workflowActionPopCtrl', function (workflowActionService,
                                                      _,
                                                      editMode,
                                                      toast,
                                                      WorkflowAction,
                                                      validationService,
                                                      generator,
                                                      dialog,
                                                      langService,
                                                      workflowAction,
                                                      applicationUserService,
                                                      $q,
                                                      $timeout,
                                                      tabIndex,
                                                      UserWorkflowAction,
                                                      userWorkflowActionService,
                                                      distributionWFService) {
        'ngInject';
        var self = this;
        self.controllerName = 'workflowActionPopCtrl';
        self.editMode = editMode;
        self.tabIndex = tabIndex;
        self.selectedTabName = 'basic_info';

        self.selectedOrganization = null;

        /**
         * Select Tab Name
         * @param tabName
         * Save Banner Image
         */
        self.changeTabName = function (tabName) {
            self.selectedTabName = tabName;
        };

        self.workflowAction = angular.copy(workflowAction);
        self.model = angular.copy(workflowAction);

        self.availableSearchCriteria = [
            {key: 'loginName', value: 'login_name'},
            {key: 'employeeNo', value: 'employee_number'},
            {key: 'organizationUnit', value: 'organization_unit'},
            {key: 'arFullName', value: 'arabic_name'},
            {key: 'enFullName', value: 'english_name'}
            // {key: 'customRole', value: 'role'}
        ];
        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name',
            status: 'status',
            global: 'global'
        };

        self.changeSearchBy = function ($event) {
            self.selectedOrganization = null;
            if (self.searchBy && self.searchBy.key === 'organizationUnit') {
                self.searchText = '';
                distributionWFService
                    .loadDistWorkflowOrganizations('organizations')
                    .then(function (result) {
                        self.organizations = result;
                        self.users = [];
                    })
            }
            else {
                self.users = [];
                self.organizations = [];
            }
        };

        self.loadUsersByOU = function ($event) {
            if (self.selectedOrganization) {
                return distributionWFService
                    .searchUsersByCriteria({ou: self.selectedOrganization})
                    .then(function (result) {
                        self.users = result;
                    });
            }
            else {
                self.users = [];
            }
        };

        self.searchUsersByOU = function (searchText) {
            if (!searchText) {
                return _.filter(self.users, function (user) {
                    return (!self.userExists(user))
                });
            }
            else {
                searchText = searchText.toLowerCase();
                return _.filter(self.users, function (user) {
                    if (user.arName.indexOf(searchText) > -1
                        || user.enName.toLowerCase().indexOf(searchText) > -1
                        || user.domainName.toLowerCase().indexOf(searchText) > -1) {

                        return (!self.userExists(user));
                    }
                });
            }
        };


        /**
         * @description Add new workflow action
         */
        self.addWorkflowActionFromCtrl = function () {
            validationService
                .createValidation('ADD_WORKFLOW_ACTION')
                .addStep('check_required', true, generator.checkRequiredFields, self.workflowAction, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, workflowActionService.checkDuplicateWorkflowAction, [self.workflowAction, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    workflowActionService
                        .addWorkflowAction(self.workflowAction)
                        .then(function () {
                            dialog.hide(self.workflowAction);
                        });
                })
                .catch(function () {

                });
        };

        self.isWorkflowActionValid = function (form) {
            return (form.$invalid
                || (self.workflowAction.arName === self.model.arName
                    && self.workflowAction.enName === self.model.enName
                    && self.workflowAction.exportable === self.model.exportable
                    && self.workflowAction.transferable === self.model.transferable
                    && self.workflowAction.isGlobal === self.model.isGlobal
                    && _.isEqual(_.map(self.workflowAction.relatedUsers, 'id').sort(), _.map(self.model.relatedUsers, 'id').sort())
                )
                || (!self.workflowAction.isGlobal && !self.workflowAction.relatedUsers.length)
            );
        };

        /**
         * @description Edit workflow action
         */
        self.editWorkflowActionFromCtrl = function () {
            validationService
                .createValidation('EDIT_WORKFLOW_ACTION')
                .addStep('check_required', true, generator.checkRequiredFields, self.workflowAction, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, workflowActionService.checkDuplicateWorkflowAction, [self.workflowAction, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    workflowActionService
                        .updateWorkflowAction(self.workflowAction)
                        .then(function () {
                            dialog.hide(self.workflowAction);
                        });
                })
                .catch(function () {

                });
        };
        /**
         * @description Close the popup
         */
        self.closeWorkflowActionPopupFromCtrl = function () {
            dialog.cancel();
        };

        //-------------New Code ------------
        self.hasChanges = false;
        // search By field
        self.searchBy = self.availableSearchCriteria[0];
        // some variables to debounce the search text
        var pendingSearch, cancelSearch = angular.noop, lastSearch;

        function refreshDebounce() {
            lastSearch = 0;
            pendingSearch = null;
            cancelSearch = angular.noop;
        }

        /**
         * Debounce if querying faster than 300ms
         */
        function debounceSearch() {
            var now = new Date().getMilliseconds();
            lastSearch = lastSearch || now;
            return ((now - lastSearch) < 300);
        }

        self.userExists = function (applicationUser) {
            return _.find(self.workflowAction.relatedUsers, function (appUser) {
                return applicationUser.id === (appUser ? appUser.id : null);
            });
        };
        /**
         * @description search for application users.
         * @param searchText
         * @returns {Promise|applicationUsers}
         */
        self.querySearch = function (searchText) {
            if (!pendingSearch || !debounceSearch()) {
                cancelSearch();
                return pendingSearch = $q(function (resolve, reject) {
                    cancelSearch = reject;
                    $timeout(function () {
                        applicationUserService
                            .findUsersByText(searchText, self.searchBy).then(function (result) {
                            refreshDebounce();
                            resolve(_.filter(result, function (ApplicationUser) {
                                return !self.userExists(ApplicationUser);
                            }));
                        });
                    }, 500);
                });
            }
            return pendingSearch;
        };
        /**
         * @description filter result that came from backend
         * @param result
         * @param searchText
         * @return {Array}
         */
        self.filterResult = function (result, searchText) {
            return _.filter(result, function (user) {
                return hasCriteria(user, searchText);
            });
        };
        self.selectedAppUser = null;
        /**
         * @description save after select application user from auto complete
         * @param applicationUser
         */
        self.applicationUserSelected = function (applicationUser) {
            var getSelectedUsers = true;
            if (self.workflowAction.relatedUsers.length > 0) {
                if (applicationUser) {
                    self.workflowAction.relatedUsers.filter(function (appUsers) {
                        if (appUsers.id === applicationUser.id) {
                            getSelectedUsers = false;
                        }
                    });
                }
            }
            //if app user do not exist in grid then add
            if (getSelectedUsers && applicationUser) {
                var relateUsers = new UserWorkflowAction();
                relateUsers.userId = applicationUser.id;
                relateUsers.wfAction = {id: self.workflowAction.id};
                var relatedUsers = self.workflowAction.relatedUsers;
                userWorkflowActionService.addUserWorkflowAction(relateUsers).then(function (result) {
                    if (result) {
                        applicationUserService.loadApplicationUsers().then(function (orResult) {
                            _.filter(_.map(orResult, function (data) {
                                if (data.id === result.userId) {
                                    data['selectedUserId'] = result.id;
                                    return data;
                                }
                            }), function (combinedResult) {
                                if (combinedResult) {
                                    relatedUsers.push(combinedResult);
                                }
                            });
                        });

                        self.workflowAction.relatedUsers = relatedUsers;
                    }
                    self.workflowAction.global = false;
                    workflowActionService.updateWorkflowAction(self.workflowAction).then(function () {
                        toast.success(langService.get('save_success'));
                    });
                });
            }
        };
        /**
         * check if disabled
         */
        self.checkDisableMode = function () {
            self.isDisabled = !!(self.singleMode && self.workflowAction.relatedUsers.length);
        };
        /**
         * remove applicationUser from the grid
         * @param applicationUser
         */
        self.removeUser = function (applicationUser) {
            workflowActionService.deleteSelectedUserWorkFlow(applicationUser.selectedUserId).then(function () {
                var index = self.workflowAction.relatedUsers.indexOf(applicationUser);
                self.workflowAction.relatedUsers.splice(index, 1);
                self.workflowAction.global = self.workflowAction.relatedUsers.length <= 0;
                workflowActionService.updateWorkflowAction(self.workflowAction).then(function () {
                    toast.success(langService.get('delete_success'));
                });
            });
        };
        /**
         * close dialog
         */
        self.close = function () {
            if (!self.workflowAction.relatedUsers.length) {
                self.checkUserSelected();
            } else if (self.workflowAction.relatedUsers.length && self.hasChanges) {
                self.warnUserToSaveChanges();
            } else {
                dialog.cancel(self.workflowAction.relatedUsers);
            }
        };
        /**
         * warn user to save his changes before close the dialog.
         */
        self.warnUserToSaveChanges = function () {
            dialog
                .confirmMessage(langService.get('sure_you_leave_without_save_changes'))
                .then(function () {
                    dialog.cancel();
                });
        };
        /**
         * save selected users
         */
        self.saveSelectedUsers = function () {

            if (self.checkUserSelected())
                return;
            if (self.singleMode)
                dialog.hide(self.workflowAction.relatedUsers[0]);
            else
                dialog.hide(self.workflowAction.relatedUsers);
        };
        /**
         * check and confirm that user need to close the dialog
         */
        self.checkUserSelected = function () {
            if (!self.workflowAction.relatedUsers.length) {
                return dialog
                    .confirmMessage(langService.get('confirm_leave_select_user'))
                    .then(function () {
                        dialog.cancel();
                    });
            }
        };
        /**
         * @description save the workflow action when change global
         */
        self.changeWorkflowActionGlobal = function () {
            if (self.workflowAction.global) {
                if (self.workflowAction.relatedUsers.length > 0) {
                    dialog.confirmMessage(langService.get('related_user_confirm'))
                        .then(function () {
                            workflowActionService
                                .deleteBulkUserWorkflowActions(self.workflowAction.relatedUsers)
                                .then(function () {
                                    workflowAction.global = true;
                                    workflowActionService.updateWorkflowAction(self.workflowAction).then(function () {
                                        self.workflowAction.relatedUsers = [];
                                        toast.success(langService.get('delete_success'));
                                    });
                                });
                        })
                        .catch(function () {
                            self.workflowAction.global = false;
                        });
                }
                else {
                    self.workflowAction.global = true;
                }
            }
        };

    });
};
