module.exports = function (app) {
    app.controller('applicationUserWorkflowParticipationPopCtrl', function (dialog,
                                                                            ouApplicationUser,
                                                                            applicationUserService,
                                                                            validationService,
                                                                            generator,
                                                                            lookupService) {
        'ngInject';
        var self = this;
        self.controllerName = 'applicationUserWorkflowParticipationPopCtrl';
        self.ouApplicationUser = angular.copy(ouApplicationUser);
        self.model = angular.copy(ouApplicationUser);

        self.applicationUsers = applicationUserService.applicationUsers;

        self.workFlowSecurities = self.workFlowSecurities = lookupService.returnLookups(lookupService.workflowSecurity);

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
            if(!self.ouApplicationUser.sendToPrivateUsers)
                self.ouApplicationUser.privateUsers = null;
        };

        self.sendToManagersChange = function () {
            if(!self.ouApplicationUser.sendToManagers)
                self.ouApplicationUser.managers = null;
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

        /**
         * @description Close the popup
         */
        self.closeApplicationUserWorkflowParticipationPopupFromCtrl = function () {
            self.ouApplicationUser = self.model;
            dialog.cancel(self.ouApplicationUser);
        }
    });
};