module.exports = function (app) {
    app.controller('rolePopCtrl', function (editMode,
                                            role,
                                            Role,
                                            permissions,
                                            validationService,
                                            roleService,
                                            toast,
                                            dialog,
                                            generator,
                                            langService) {
        'ngInject';
        var self = this;
        self.controllerName = 'rolePopCtrl';
        self.permissionsList = permissions;
        /*self.permissionsList = _.chunk(permissions, 3);*/
        self.editMode = editMode;
        //self.role = editMode ? role : new Role();
        self.role = angular.copy(role);
        self.model = angular.copy(role);

        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name',
            customRolePermission: 'permissions'
        };

        /**
         * Add new Role
         */
        self.addRoleFromCtrl = function () {
            validationService
                .createValidation('ADD_ROLE')
                .addStep('check_required', true, generator.checkRequiredFields, self.role, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_role_permissions', true, roleService.checkRolePermissionsExist, self.role, function (result) {
                    return !result;
                })
                .notifyFailure(function () {
                    toast.error(langService.get('permissions_required'));
                })
                .addStep('check_duplicate', true, roleService.checkDuplicateRole, [self.role, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    roleService.addRole(self.role).then(function () {
                        toast.success(langService.get('add_success').change({name: self.role.getTranslatedName()}));
                        dialog.hide();
                    });
                })
                .catch(function () {

                });
        };

        /**
         * Edit Role
         */
        self.editRoleFromCtrl = function () {
            validationService
                .createValidation('EDIT_ROLE')
                .addStep('check_required', true, generator.checkRequiredFields, self.role, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_role_permissions', true, roleService.checkRolePermissionsExist, self.role, function (result) {
                    return !result;
                })
                .notifyFailure(function () {
                    toast.error(langService.get('permissions_required'));
                })
                .addStep('check_duplicate', true, roleService.checkDuplicateRole, [self.role, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {

                    dialog.confirmMessage(langService.get('custom_role_warning_message'))
                        .then(function () {
                            roleService.updateRole(self.role).then(function () {
                                toast.success(langService.get('edit_success').change({name: self.role.getTranslatedName()}));
                                dialog.hide();
                            });
                        });
                    // roleService.updateRole(self.role).then(function (result) {
                    //     toast.success(langService.get('edit_success').change({name: self.role.getTranslatedName()}));
                    //
                    //     //check if permissions changes for role and then ask confirmation to change for members also
                    //     // if (result.customRolePermission.length !== self.role.customRolePermission.length) {
                    //     //     dialog.confirmMessage(langService.get('permission_change_popup_message')).then(function () {
                    //     //     }, function () {
                    //     //     });
                    //     // } else {
                    //     //     var samePermissionCount = 0;
                    //     //     for (var i = 0; i < result.customRolePermission.length; i++) {
                    //     //         if (result.customRolePermission[i].permissionId === self.role.customRolePermission[i].permissionId) {
                    //     //             samePermissionCount += 1;
                    //     //         }
                    //     //     }
                    //     //     if (samePermissionCount !== result.customRolePermission.length) {
                    //     //         dialog.confirmMessage(langService.get('permission_change_popup_message')).then(function () {
                    //     //
                    //     //         }, function () {
                    //     //         });
                    //     //     }
                    //     // }
                    //
                    //
                    // });
                })
                .catch(function () {

                });
        };

        /**
         * @description Close the popup
         */
        self.closeRolePopupFromCtrl = function () {
            dialog.cancel();
        };

        self.customRolePermissionsExists = function (item) {
            var i;
            for (i = 0; i < self.role.customRolePermission.length; i++) {
                if (self.role.customRolePermission[i].id === item.id) {
                    return true;
                }
            }
        };
        self.selectPermissions = function (item) {
            if (item) {
                var idx = false;
                var i;
                var index;
                for (i = 0; i < self.role.customRolePermission.length; i++) {
                    if (self.role.customRolePermission[i].id === item.id) {
                        idx = true;
                        index = i;
                    }
                }
                if (idx) {
                    self.role.customRolePermission.splice(index, 1);
                }
                else {
                    self.role.customRolePermission.push(item);
                }
            }
        };

        self.selectAllGroupPermissions = function (allGroupPermissions, key) {
            for (var i = 0; i < allGroupPermissions.length; i++) {
                for (var j = 0; j < allGroupPermissions[i].length; j++) {
                    //(function () {
                    if (allGroupPermissions[i][j]) {
                        var isPermissionExist = _.filter(self.role.customRolePermission, function (permission) {
                            return allGroupPermissions[i][j].id === permission.id;
                        })[0];
                        //on click event get previous value of checkbox (true/false)
                        if (!self[key]) {
                            if (!isPermissionExist) {
                                self.role.customRolePermission.push(allGroupPermissions[i][j]);
                            }
                        } else {
                            if (isPermissionExist) {
                                var indexOfPermission = _.findIndex(self.role.customRolePermission, function (x) {
                                    return x.id === isPermissionExist.id;
                                });
                                self.role.customRolePermission.splice(indexOfPermission, 1);
                            }
                        }
                    }
                    //})();
                }
            }
        };

        self.selectParentCheckbox = function (allGroupPermissions, key) {
            var count = 0;
            for (var i = 0; i < allGroupPermissions.length; i++) {
                for (var j = 0; j < allGroupPermissions[i].length; j++) {
                    if (allGroupPermissions[i][j]) {
                        var isPermissionExist = _.filter(self.role.customRolePermission, function (permission) {
                            return allGroupPermissions[i][j].id === permission.id;
                        })[0];
                        if (!isPermissionExist) {
                            return false;
                        } else {
                            count = i;
                        }
                    }
                }
            }
            if ((count + 1) === allGroupPermissions.length) {
                return true;
            }
        }

    });
};