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
                                            langService,
                                            $filter,
                                            employeeService,
                                            tableGeneratorService,
                                            _) {
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

        self.search = '';
        self.permissions = {};
        self.totalPermissionsCount = 0;

        // for the first time the controller initialize
        self.permissions = _getPermissions(langService.current);

        _.map(self.permissions, function (keys) {
            _.map(keys, function (permissionsArr) {
                _.map(permissionsArr, function (value) {
                    if (value && !value.excluded) {
                        self.totalPermissionsCount++;
                    }
                })
            })
        });
        // for any change happened in language rebuild the permissions with the current corrected key.
        langService.listeningToChange(_getPermissions);

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
                            roleService.controllerMethod
                                .showSelectiveRoleMembers(self.role).then(function (selectedUsers) {
                                roleService.updateRole(self.role).then(function () {
                                    roleService.overrideMembersPermissions(self.role, selectedUsers)
                                        .then(function (overrideMemberResult) {
                                            var failedMembers = _getFailedMembers(overrideMemberResult, selectedUsers);
                                            if (failedMembers.length) {
                                                dialog.alertMessage(_prepareOverridePermissionMessage(failedMembers));
                                            } else {
                                                toast.success(langService.get('edit_success').change({name: self.role.getTranslatedName()}));
                                                dialog.hide()
                                            }
                                        })
                                });
                            })
                        });
                })
                .catch(function () {

                });
        };

        function _getFailedMembers(overrideMembersResult, selectedUsers) {
            return Object.keys(overrideMembersResult)
                .reduce((failedUsers, key) => {
                    // key: "userid:ouid"
                    if (!overrideMembersResult[key]) {
                        var [userId, ouId] = key.split(':');
                        var failedUser = selectedUsers.find(function (member) {
                            return member.getApplicationUserId() === Number(userId) && member.getOuId() === Number(ouId);
                        });
                        failedUsers.push(failedUser);
                    }

                    return failedUsers;
                }, [])
        }

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
                } else {
                    self.role.customRolePermission.push(item);
                }
            }
        };

        self.selectAllGroupPermissions = function (allGroupPermissions, key) {
            for (var i = 0; i < allGroupPermissions.length; i++) {
                for (var j = 0; j < allGroupPermissions[i].length; j++) {
                    //(function () {
                    if (allGroupPermissions[i][j] && !allGroupPermissions[i][j].excluded) {
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
                    if (allGroupPermissions[i][j] && !allGroupPermissions[i][j].excluded) {
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


        function _getPermissions(current) {
            return current === 'en' ? self.permissionsList[0] : self.permissionsList[1];
        }

        self.searchChanges = function () {
            self.permissions = $filter('permissionFilter')(_getPermissions(langService.current), self.search);
        };

        self.isIndeterminate = function () {
            var includedPermission = _.filter(self.role.customRolePermission, {'excluded': false});
            return (includedPermission.length !== 0 && includedPermission.length !== self.totalPermissionsCount);
        };

        self.isChecked = function () {
            var includedPermission = _.filter(self.role.customRolePermission, {'excluded': false});
            return includedPermission.length === self.totalPermissionsCount;
        };

        /**
         * @description parent checkbox
         */
        self.toggleAll = function () {
            var customRolePermissionCopy = angular.copy(self.role.customRolePermission);
            if (self.isChecked() && employeeService.isSuperAdminUser()) {
                customRolePermissionCopy = [];
            } else {
                for (var key in self.permissions) {
                    var permission = self.permissions[key];
                    for (var i = 0; i < permission.length; i++) {
                        for (var j = 0; j < permission[i].length; j++) {
                            if (permission[i][j] && !permission[i][j].excluded) {
                                var customRolePermissionIds = _.map(customRolePermissionCopy, "id");
                                var indexOfPermission = customRolePermissionIds.indexOf(permission[i][j]['id']);

                                if (self.isChecked() && indexOfPermission > -1) {
                                    customRolePermissionCopy.splice(indexOfPermission, 1);
                                } else if (!self.isChecked() && indexOfPermission === -1) {
                                    customRolePermissionCopy.push(permission[i][j]);
                                }
                            }
                        }
                    }
                }
            }
            self.role.customRolePermission = customRolePermissionCopy;
        };

        /**
         * @description prepare Failed Update User Permissions
         * @private
         * @param members
         */
        function _prepareOverridePermissionMessage(members) {
            var titleTemplate = angular.element('<span class="validation-title">' + langService.get('failed_override_permission') + '</span> <br/>');
            titleTemplate.html(langService.get('failed_override_permission'));

            var tableRows = _.map(members, function (user) {
                return [user.getApplicationUser().loginName, user.getTranslatedApplicationUserNameByLanguage('ar'), user.getTranslatedApplicationUserNameByLanguage('en'), user.getOrganizationTranslate()];
            });

            var table = tableGeneratorService.createTable([langService.get('login_name'), langService.get('arabic_name'), langService.get('english_name'), langService.get('organization_unit')], 'error-table');
            table.createTableRows(tableRows);

            titleTemplate.append(table.getTable(true));

            return titleTemplate.html();
        }
    });
};
