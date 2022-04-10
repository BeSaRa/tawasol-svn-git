module.exports = function (app) {
    app.controller('applicationUserWorkflowParticipationPopCtrl', function (dialog,
                                                                            _,
                                                                            ouApplicationUser,
                                                                            applicationUserService,
                                                                            validationService,
                                                                            generator,
                                                                            lookupService,
                                                                            organizations,
                                                                            privateUsers,
                                                                            Information,
                                                                            langService,
                                                                            managers,
                                                                            viceManagers,
                                                                            toast,
                                                                            $q,
                                                                            $filter,
                                                                            UserSpecifiedDistWF,
                                                                            registryOrganizations,
                                                                            organizationService,
                                                                            selectiveDepartmentsList,
                                                                            userSpecificDistributionWFService,
                                                                            customLevelGroups,
                                                                            OUApplicationUser) {
        'ngInject';
        var self = this;
        self.controllerName = 'applicationUserWorkflowParticipationPopCtrl';
        self.ouApplicationUser = angular.copy(ouApplicationUser);
        self.model = angular.copy(ouApplicationUser);
        self.applicationUsers = applicationUserService.applicationUsers;
        self.managersSearchText = '';
        self.viceManagersSearchText = '';

        self.managersList = managers;
        self.viceManagersList = viceManagers;
        self.customLevelGroupsList = customLevelGroups;

        self.organizationsWithPrivateUsers = [];

        self.tabsToShow = [
            'general',
            'selectiveDepartments'
        ];
        self.selectedTab = "general";

        self.showTab = function (tabName) {
            return (self.tabsToShow.indexOf(tabName) > -1);
        };
        self.selectedTabIndex = self.tabsToShow.indexOf(self.selectedTab);

        if (self.selectedTab !== 'general') {
            self.setCurrentTab('general');
        }

        /**
         * @description Set the current tab name
         * @param tabName
         */
        self.setCurrentTab = function (tabName) {
            self.selectedTab = tabName;
        }

        var _getPrivateUserOuIndex = function (privateUser) {
            return _.findIndex(self.organizationsWithPrivateUsers, {id: (privateUser.ouid.hasOwnProperty('id') ? privateUser.ouid.id : privateUser.ouid)});
        };

        var _generatePrivateUserList = function () {
            _.map(privateUsers, function (privateUser) {
                // if list doesn't contain ou, push ou to the list and then find index again
                var index = _getPrivateUserOuIndex(privateUser);
                if (index < 0) {
                    self.organizationsWithPrivateUsers.push(angular.copy(privateUser.ouid));
                    index = _getPrivateUserOuIndex(privateUser);
                }
                // if ou doesn't have privateUsers property, add empty property and then push value
                if (!self.organizationsWithPrivateUsers[index].hasOwnProperty('privateUsers'))
                    self.organizationsWithPrivateUsers[index].privateUsers = [];
                self.organizationsWithPrivateUsers[index].privateUsers.push(privateUser);
            });
        };

        var _mapPrivateUsersToList = function () {
            // if no private users exists, reset saved private users
            if (!privateUsers.length) {
                self.ouApplicationUser.privateUsers = [];
                return;
            }

            // if data is same as service returned(string format), parse it.
            if (self.ouApplicationUser.privateUsers && angular.isString(self.ouApplicationUser.privateUsers)) {
                self.ouApplicationUser.privateUsers = JSON.parse(self.ouApplicationUser.privateUsers);
            }

            if (self.ouApplicationUser.privateUsers && self.ouApplicationUser.privateUsers.hasOwnProperty('ouAppUserIds')) {
                self.ouApplicationUser.privateUsers = _.map(self.ouApplicationUser.privateUsers.ouAppUserIds, function (savedPrivateUser) {
                    return _.find(privateUsers, function (privateUser) {
                        return privateUser.applicationUser.id === savedPrivateUser.id && privateUser.ouid.id === savedPrivateUser.ouId;
                    });
                });
                // remove null/undefined privateUsers (if privateUser list doesn't contain saved private user, filter it)
                self.ouApplicationUser.privateUsers = _.filter(self.ouApplicationUser.privateUsers, function (savedPrivateUser) {
                    return !!savedPrivateUser;
                })
            } else if (self.ouApplicationUser.privateUsers && self.ouApplicationUser.privateUsers.length && self.ouApplicationUser.privateUsers[0] instanceof OUApplicationUser) {
                // do nothing as its already ouApplicationUsers list
            } else {
                self.ouApplicationUser.privateUsers = [];
            }
        };

        _generatePrivateUserList();
        _mapPrivateUsersToList();


        self.workFlowSecurities = angular.copy(lookupService.returnLookups(lookupService.workflowSecurity));

        self.getSelectedPrivateUsersText = function () {
            if (self.ouApplicationUser.privateUsers && self.ouApplicationUser.privateUsers.length) {
                var map = _.map(self.ouApplicationUser.privateUsers, function (privateUser) {
                    if (langService.current === 'en')
                        return privateUser.ouid.getTranslatedName() + ' - ' + privateUser.applicationUser.getTranslatedName();
                    return privateUser.applicationUser.getTranslatedName() + ' - ' + privateUser.ouid.getTranslatedName();
                });
                return map.join(', ');
            }
            return langService.get('private_users');
        };


        self.getSelectedManagersText = function () {
            if (self.ouApplicationUser.managers && self.ouApplicationUser.managers.length) {
                // saved manager id is the id of ou, not user
                var selectedManagers = _.filter(self.managersList, function (manager) {
                    return (self.ouApplicationUser.managers.indexOf(manager.ouRegistryID.hasOwnProperty('id') ? manager.ouRegistryID.id : manager.ouRegistryID)) > -1;
                });
                if (selectedManagers && selectedManagers.length) {
                    return _.map(selectedManagers, function (m) {
                        return m.ouRegistryID.getTranslatedName();
                    }).join(', ');
                }
                return langService.get('managers');
            }
            return langService.get('managers');
        };

        self.getSelectedViceManagersText = function () {
            if (self.ouApplicationUser.viceManagers && self.ouApplicationUser.viceManagers.length) {
                // saved viceManager id is the id of ou, not user
                var selectedViceManagers = _.filter(self.viceManagersList, function (viceManager) {
                    return (self.ouApplicationUser.viceManagers.indexOf(viceManager.ouRegistryID.hasOwnProperty('id') ? viceManager.ouRegistryID.id : viceManager.ouRegistryID)) > -1;
                });
                if (selectedViceManagers && selectedViceManagers.length) {
                    return _.map(selectedViceManagers, function (vm) {
                        return vm.ouRegistryID.getTranslatedName();
                    }).join(', ');
                }
                return langService.get('vice_manager');
            }
            return langService.get('vice_manager');
        };

        self.getSelectedPrivateUsersText();
        self.getSelectedManagersText();
        self.getSelectedViceManagersText();

        var requiredFields = [
            'sendToPrivateUsers',
            'sendToManagers',
            'privateUsers',
            'managers',
            'sendToAllEntityUsers',
            'sendToAllRegistryOUUsers',
            'sendToAllParentOUUsers'
        ];

        self.validateLabels = {
            sendToPrivateUsers: 'send_to_private_users',
            sendToManagers: 'send_to_managers',
            privateUsers: 'private_users',
            managers: 'managers',
            sendToAllEntityUsers: 'send_to_all_organizations_users',
            sendToAllRegistryOUUsers: 'send_to_any_user_in_same_unit_and_to_all_units',
            sendToAllParentOUUsers: 'send_to_any_user_in_same_unit_parent_child_same_parent'
        };

        self.checkRequiredFieldsAppUserWorkflowParticipation = function (model) {
            var required = self.requiredFields, result = [];
            _.map(required, function (property) {
                if (!generator.validRequired(model[property]))
                    result.push(property);
            });
            return result;
        };

        self.sendToPrivateUsersChange = function () {
            if (!self.ouApplicationUser.sendToPrivateUsers)
                self.ouApplicationUser.privateUsers = null;
            self.getSelectedPrivateUsersText();
        };

        self.sendToManagersChange = function () {
            if (!self.ouApplicationUser.sendToManagers)
                self.ouApplicationUser.managers = null;
            self.getSelectedManagersText();
        };

        self.sendToViceManagerChange = function () {
            if (!self.ouApplicationUser.sendToViceManager) {
                self.ouApplicationUser.viceManagers = null;
            }
            self.getSelectedViceManagersText();
        };

        /**
         * @description Add the workflow participation changes to grid
         */
        self.addWorkflowParticipation = function () {
            self.requiredFields = angular.copy(requiredFields);

            if (!self.ouApplicationUser.sendToPrivateUsers) {
                self.requiredFields = _.filter(self.requiredFields, function (requiredField) {
                    return requiredField !== "privateUsers";
                })
            }
            if (!self.ouApplicationUser.sendToManagers) {
                self.requiredFields = _.filter(self.requiredFields, function (requiredField) {
                    return requiredField !== "managers";
                })
            }

            validationService
                .createValidation('SAVE_WORKFLOW_PARTICIPATION')
                .addStep('check_required', true, self.checkRequiredFieldsAppUserWorkflowParticipation, self.ouApplicationUser, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .validate()
                .then(function () {
                    dialog.hide(self.ouApplicationUser);
                })
                .catch(function () {

                });
        };

        var dropdownMapValue, dropdownsMap = {
            manager: {
                selectedProperty: 'managers',
                compareWith: 'managersList'
            },
            viceManager: {
                selectedProperty: 'viceManagers',
                compareWith: 'viceManagersList'
            }
        };

        /**
         * @description Check if option in dropdown is checked
         * @returns {boolean}
         */
        self.isChecked = function (recordType) {
            dropdownMapValue = dropdownsMap[recordType];
            if (dropdownMapValue) {
                return !!(self.ouApplicationUser[dropdownMapValue.selectedProperty]
                    && self.ouApplicationUser[dropdownMapValue.selectedProperty].length === self[dropdownMapValue.compareWith].length);
            }
            return false;
        };

        /**
         * @description Check if some options in dropdown are selected
         * @returns {boolean}
         */
        self.isIndeterminate = function (recordType) {
            dropdownMapValue = dropdownsMap[recordType];
            if (dropdownMapValue) {
                return !!(self.ouApplicationUser[dropdownMapValue.selectedProperty]
                    && self.ouApplicationUser[dropdownMapValue.selectedProperty].length < self[dropdownMapValue.compareWith].length);
            }
            return false;
        };

        /**
         * @description Toggle the selection for options in dropdown
         * @param recordType
         * @param $event
         */
        self.toggleAll = function (recordType, $event) {
            dropdownMapValue = dropdownsMap[recordType];
            if (dropdownMapValue) {
                if (self.ouApplicationUser[dropdownMapValue.selectedProperty]) {
                    if (self.ouApplicationUser[dropdownMapValue.selectedProperty].length === self[dropdownMapValue.compareWith].length) {
                        self.ouApplicationUser[dropdownMapValue.selectedProperty] = null;
                    } else {
                        self.ouApplicationUser[dropdownMapValue.selectedProperty] = angular.copy(_.map(self[dropdownMapValue.compareWith], 'ouRegistryID.id'));
                    }
                } else {
                    self.ouApplicationUser[dropdownMapValue.selectedProperty] = angular.copy(_.map(self[dropdownMapValue.compareWith], 'ouRegistryID.id'));
                }
            }
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            //self.ouApplicationUser = self.model;
            dialog.cancel();
        };

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };

        self.sendToDifferentOuLevelSelected = function () {
            return self.ouApplicationUser.wfsecurity === 6;
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


        self.inlineUserOUSearchText = '';

        self.selectiveDepartments = selectiveDepartmentsList;
        self.registryOrganizations = registryOrganizations;
        self.subOrganizations = [];
        self.Ou = null;
        self.regOu = null;
        self.withSubs = null;
        self.selectedSelectiveDepartments = [];

        var _resetSelectiveDepartmentModel = function () {
            self.Ou = null;
            self.regOu = null;
            self.withSubs = false;

            self.selectiveDepartment = new UserSpecifiedDistWF({
                userId: ouApplicationUser.applicationUser.id,
                ouId: ouApplicationUser.ouid.id,
                toOUID: null,
                withSubs: false
            });
        };
        _resetSelectiveDepartmentModel();

        /**
         * @description Save the selective department
         */
        self.saveSelectiveDepartment = function () {
            if (self.isAddSelectiveOrganizationDisabled()) {
                return;
            }

            self.selectiveDepartment.toOUID = self.Ou ? self.Ou : self.regOu;
            self.selectiveDepartment.withSubs = self.withSubs;

            userSpecificDistributionWFService
                .saveSelectiveDepartment(self.selectiveDepartment)
                .then(function (result) {
                    self.reloadSelectiveDepartments()
                        .then(function () {
                            toast.success(langService.get('save_success'));
                        })
                }).catch(function () {

            });
        };

        /**
         * @description Removes the selective department from grid
         * @param selectiveDept
         * @param $index
         * @param $event
         */
        self.removeSelectiveDepartment = function (selectiveDept, $index, $event) {
            return dialog
                .confirmMessage(langService.get('confirm_remove').change({name: selectiveDept.ouInfo.getTranslatedName()}), null, null, $event)
                .then(function () {
                    userSpecificDistributionWFService
                        .deleteSelectiveDepartment(selectiveDept)
                        .then(function (result) {
                            self.reloadSelectiveDepartments()
                                .then(function () {
                                    toast.success(langService.get("delete_specific_success").change({name: selectiveDept.ouInfo.getNames()}));
                                })
                        }).catch(function () {

                    });
                });
        };

        self.onRegistryChanged = function () {
            self.subOrganizations = [];
            self.Ou = null;
            self.withSubs = false;

            organizationService
                .loadChildrenOrganizations(self.regOu, true)
                .then(function (result) {
                    // sort sections/sub-organizations
                    result = _.sortBy(result, [function (ou) {
                        return ou[langService.current + 'Name'].toLowerCase();
                    }]);

                    self.subOrganizations = result;
                })
        };

        self.getTranslatedWithSubs = function (value) {
            return value ? langService.get('with_subs_ou') : langService.get('without_subs_ou');
        };

        self.isAddSelectiveOrganizationDisabled = function () {
            return !self.regOu ||
                (!self.Ou &&
                    _.some(self.selectiveDepartments, function (ou) {
                        return ou.ouInfo.id === self.regOu.id;
                    }));
        };

        self.isRegOuDisabled = function (organization) {
            return !organization.status ||
                _.some(self.selectiveDepartments, function (ou) {
                    return ou.ouInfo.id === organization.id && ou.withSubs;
                });
        };

        self.isSectionDisabled = function (organization) {
            return !organization.status ||
                _.some(self.selectiveDepartments, function (ou) {
                    return ou.ouInfo.id === organization.id;
                });
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.selectiveDepartments = $filter('orderBy')(self.selectiveDepartments, self.selectiveDepartmentsGrid.order);
        };

        /**
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         * @type {Array}
         */
        self.selectiveDepartmentsGrid = {
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.selectiveDepartments.length + 21);
                    }
                }
            ]
        };

        self.reloadSelectiveDepartments = function (pageNumber) {
            var defer = $q.defer();
            self.selectiveDepartmentsGrid.progress = defer.promise;
            return userSpecificDistributionWFService.loadSelectiveDepartments(ouApplicationUser.getApplicationUserId(), ouApplicationUser.getOuId())
                .then(function (result) {
                    self.selectiveDepartments = result;
                    defer.resolve(true);

                    if (pageNumber)
                        self.selectiveDepartmentsGrid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

    });
};
