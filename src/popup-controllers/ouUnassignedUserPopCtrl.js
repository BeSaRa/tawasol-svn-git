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
                                                        UserOuPermission,
                                                        rootEntity) {
        'ngInject';
        var self = this;
        self.controllerName = 'ouUnassignedUserPopCtrl';
        self.ouApplicationUser = ouApplicationUser;
        self.roles = roleService.roles;

        self.roleSearchText = '';

        self.securityLevels = rootEntity.getGlobalSettings().getSecurityLevels();
        self.securityLevelsModel = {
            securityLevels: self.securityLevels,
            add: [],
            archive: []
        };

        function _generateArchiveAndAddSecurityArray() {
            _.map(self.securityLevelsModel.securityLevels, function (securityLevel, index) {
                self.securityLevelsModel.add[index] = !!_securityExists(securityLevel, self.ouApplicationUser.securityLevels);
                self.securityLevelsModel.archive[index] = !!_securityExists(securityLevel, self.ouApplicationUser.archiveSecurityLevels);
            });
        }

        _generateArchiveAndAddSecurityArray();

        function _securityExists(securityLevel, collection) {
            return _.find(collection, function (item) {
                return item.lookupKey === securityLevel.lookupKey;
            });
        }

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


        function _isAnySecurityLevelAdd() {
            return _.some(self.securityLevelsModel.add, function (securityLevel) {
                return !!securityLevel;
            });
        }

        function _isAnyArchiveSecurityLevel() {
            return _.some(self.securityLevelsModel.archive, function (securityLevel) {
                return !!securityLevel;
            });
        }

        self.isSaveEnabled = function (form) {
            return !form.$invalid && self.ouApplicationUser.customRoleId && _isAnySecurityLevelAdd() && _isAnyArchiveSecurityLevel();
        };

        var _setSecurityLevelsBeforeSave = function(){
            var securityLevelAdd = [], archiveSecurityLevels = [];
            _.map(self.securityLevels, function (securityLevel, index) {
                if (self.securityLevelsModel.add[index]) {
                    securityLevelAdd.push(securityLevel);
                }
                if (self.securityLevelsModel.archive[index]) {
                    archiveSecurityLevels.push(securityLevel);
                }
            });

            self.ouApplicationUser.securityLevels = securityLevelAdd;
            self.ouApplicationUser.archiveSecurityLevels = archiveSecurityLevels;
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
        self.addOuUnassignedUserFromCtrl = function (form) {
            if (!self.isSaveEnabled(form)) {
                toast.info(langService.get('select_ou_role_security_level'));
                return false;
            }
            _setSecurityLevelsBeforeSave();

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
