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
                                                                            langService) {
        'ngInject';
        var self = this;
        self.controllerName = 'applicationUserWorkflowParticipationPopCtrl';
        self.ouApplicationUser = angular.copy(ouApplicationUser);
        self.model = angular.copy(ouApplicationUser);
        self.applicationUsers = applicationUserService.applicationUsers;

        self.ouWithManagersList = _.filter(organizations, 'managerId');
        self.organizationsWithManager = _.map(self.ouWithManagersList, function (ou) {
            return {
                organization: ou,
                manager: ou.managerId
            }
        });
        self.ouWithViceManagersList = _.filter(organizations, 'viceManagerId');
        self.organizationsWithViceManager = _.map(self.ouWithViceManagersList, function (ou) {
            return {
                organization: ou,
                viceManager: ou.viceManagerId
            }
        });

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
                var map = _.map(self.ouApplicationUser.managers, function (manager) {
                    return manager.organization.getTranslatedName();
                });
                return map.join(', ');
            }
            return langService.get('managers');
        };

        self.getSelectedViceManagersText = function () {
            if (self.ouApplicationUser.viceManagers && self.ouApplicationUser.viceManagers.length) {
                var map = _.map(self.ouApplicationUser.viceManagers, function (viceManager) {
                    return viceManager.organization.getTranslatedName();
                });
                return map.join(', ');
            }
            return langService.get('managers');
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
                compareWith: 'organizationsWithManager'
            },
            viceManager: {
                selectedProperty: 'viceManagers',
                compareWith: 'organizationsWithViceManager'
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
                        self.ouApplicationUser[dropdownMapValue.selectedProperty] = angular.copy(self[dropdownMapValue.compareWith]);
                    }
                } else {
                    self.ouApplicationUser[dropdownMapValue.selectedProperty] = angular.copy(self[dropdownMapValue.compareWith]);
                }
            }
        };

        /**
         * @description Close the popup
         */
        self.closeApplicationUserWorkflowParticipationPopupFromCtrl = function () {
            //self.ouApplicationUser = self.model;
            dialog.cancel();
        }
    });
};
