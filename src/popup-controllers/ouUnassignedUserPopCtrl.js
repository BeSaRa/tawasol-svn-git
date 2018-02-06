module.exports = function (app) {
    app.controller('ouUnassignedUserPopCtrl', function (_,
                                                        toast,
                                                        validationService,
                                                        generator,
                                                        dialog,
                                                        langService,
                                                        ouApplicationUser,
                                                        lookupService,
                                                        roleService,
                                                        ouApplicationUserService,
                                                        UserOuPermission) {
        'ngInject';
        var self = this;
        self.controllerName = 'ouUnassignedUserPopCtrl';
        self.ouApplicationUser = ouApplicationUser;
        self.securityLevels = lookupService.returnLookups(lookupService.securityLevel);
        self.roles = roleService.roles;

        /**
         * @description Contains the labels for the fields for validation purpose
         */
        self.validateLabels = {
            customRoleId: 'role',
            securityLevels: 'security_levels'
        };

        self.required = [
            'customRoleId',
            'securityLevels'
        ];

        self.checkRequiredFields_ouUnassigned = function (model) {
            var required = self.required, result = [];
            _.map(required, function (property) {
                if (!generator.validRequired(model[property]))
                    result.push(property);
            });
            return result;
        };

        /**
         * @description Adds the selected values of organization, custom role, security level to the grid
         */
        self.addOUApplicationUserFromCtrl = function (ouAppUser) {
            return ouApplicationUserService
                .addOUApplicationUser(ouAppUser)
                .then(function (result) {
                    return result;
                });
        };


        /**
         * @description Add new ou unassigned user
         */
        self.addOuUnassignedUserFromCtrl = function () {
            validationService
                .createValidation('ADD_OU_UNASSIGNED_USER')
                .addStep('check_required', true, self.checkRequiredFields_ouUnassigned, self.ouApplicationUser, function (result) {
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
                    self.addOUApplicationUserFromCtrl(self.ouApplicationUser)
                        .then(function () {
                            ouApplicationUserService
                                .addUserOuPermission(self.prepareCustomRolePermissions())
                                .then(function () {
                                    toast.success(langService.get('user_added_to_organization_successfully').change({
                                        user: self.ouApplicationUser.applicationUser.getTranslatedName(),
                                        organization: self.ouApplicationUser.ouid.getTranslatedName()
                                    }));
                                    dialog.hide(self.ouApplicationUser);
                                });

                        });
                })
                .catch(function () {

                });
        };

        self.prepareCustomRolePermissions = function () {
            var permissions = [];
            _.map(self.ouApplicationUser.customRoleId.customRolePermission, function (permission) {
                permissions.push(new UserOuPermission({
                    userId: self.ouApplicationUser.applicationUser.id,
                    ouId: self.ouApplicationUser.ouid.id,
                    customRoleId: self.ouApplicationUser.customRoleId.id,
                    permissionId: permission.id
                }))
            });
            return permissions;
        };


        /**
         * @description Close the popup
         */
        self.closeOuUnassignedUserPopupFromCtrl = function () {
            dialog.cancel();
        }
    });
};