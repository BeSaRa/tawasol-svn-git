module.exports = function (app) {
    app.controller('applicationUserWorkflowParticipationPopCtrl', function (dialog,
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

        self.workFlowSecurities = self.workFlowSecurities = lookupService.returnLookups(lookupService.workflowSecurity);


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

        self.getSelectedPrivateUsersText();

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


        /**
         * @description Add the workflow participation changes to grid
         */
        self.addApplicationUserWorkflowParticipationPopupFromCtrl = function () {
            console.log(self.ouApplicationUser.privateUsers);
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

        /**
         * @description Close the popup
         */
        self.closeApplicationUserWorkflowParticipationPopupFromCtrl = function () {
            //self.ouApplicationUser = self.model;
            dialog.cancel(self.model);
        }
    });
};