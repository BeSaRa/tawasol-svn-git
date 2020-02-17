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
                                                                            langService,
                                                                            managers,
                                                                            viceManagers) {
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

        self.organizationsWithPrivateUsers = [];
        _.map(privateUsers, function (privateUser) {
            var index = _.findIndex(self.organizationsWithPrivateUsers, {id: privateUser.ouid.id});
            if (index < 0)
                self.organizationsWithPrivateUsers.push(privateUser.ouid);
            if (index === -1)
                index = _.findIndex(self.organizationsWithPrivateUsers, {id: privateUser.ouid.id});
            if (!self.organizationsWithPrivateUsers[index].hasOwnProperty('privateUsers'))
                self.organizationsWithPrivateUsers[index].privateUsers = [];
            self.organizationsWithPrivateUsers[index].privateUsers.push(privateUser);
        });

        self.workFlowSecurities = angular.copy(lookupService.returnLookups(lookupService.workflowSecurity));

        self.ouApplicationUser.privateUsers = _.filter(self.ouApplicationUser.privateUsers, function (privateUser) {
            return _.map(privateUsers, 'id').indexOf(privateUser.id) > -1;
        });

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
                    return (self.ouApplicationUser.managers.indexOf(manager.ouid.hasOwnProperty('id') ? manager.ouid.id : manager.ouid)) > -1;
                });
                if (selectedManagers && selectedManagers.length) {
                    return _.map(selectedManagers, function (m) {
                        return m.ouid.getTranslatedName();
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
                    return (self.ouApplicationUser.viceManagers.indexOf(viceManager.ouid.hasOwnProperty('id') ? viceManager.ouid.id : viceManager.ouid)) > -1;
                });
                if (selectedViceManagers && selectedViceManagers.length) {
                    return _.map(selectedViceManagers, function (vm) {
                        return vm.ouid.getTranslatedName();
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
        self.addApplicationUserWorkflowParticipationPopupFromCtrl = function () {
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
                .createValidation('ADD_OUT_OF_OFFICE_SETTINGS')
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
         * @description Check if some of options in dropdown are selected
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
                        self.ouApplicationUser[dropdownMapValue.selectedProperty] = angular.copy(_.map(self[dropdownMapValue.compareWith], 'ouid.id'));
                    }
                } else {
                    self.ouApplicationUser[dropdownMapValue.selectedProperty] = angular.copy(_.map(self[dropdownMapValue.compareWith], 'ouid.id'));
                }
            }
        };

        /**
         * @description Close the popup
         */
        self.closeApplicationUserWorkflowParticipationPopupFromCtrl = function () {
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
    });
};
