module.exports = function (app) {
    app.controller('applicationUserEditPermissionPopCtrl', function (_,
                                                                     toast,
                                                                     $rootScope,
                                                                     validationService,
                                                                     $filter,
                                                                     generator,
                                                                     dialog,
                                                                     tokenService,
                                                                     employeeService,
                                                                     langService,
                                                                     ouApplicationUser,
                                                                     permissions,
                                                                     userOuPermissions,
                                                                     ouApplicationUserService,
                                                                     UserOuPermission) {
        'ngInject';
        var self = this;
        self.controllerName = 'applicationUserEditPermissionPopCtrl';

        //self.permissionsChunkArray = _.chunk(permissions, 3);
        self.permissionsList = permissions;

        self.userOuPermissions = userOuPermissions;
        self.userOuPermissionsIds = _.map(userOuPermissions, 'permissionId');

        self.ouApplicationUser = angular.copy(ouApplicationUser);
        self.model = angular.copy(ouApplicationUser);

        self.validateLabels = {};

        self.search = '';
        self.permissions = {};
        self.totalPermissionsCount = 0;

        function _getPermissions(current) {
            return current === 'en' ? self.permissionsList[0] : self.permissionsList[1];
        }

        // for the first time the controller initialize
        self.permissions = _getPermissions(langService.current);

        _.map(self.permissions, function (keys) {
            _.map(keys, function (permissionsArr) {
                _.map(permissionsArr, function (value) {
                    if (value)
                        self.totalPermissionsCount++;
                })
            })
        });

        function _savePermissionsSuccess() {
            toast.success(langService.get('update_success'));
            dialog.hide(true);
        }

        /**
         * @description add user ou permissions
         */
        self.saveUserOuPermissionsFromCtrl = function () {
            var userOuPermissions = [];
            for (var i = 0; i < self.userOuPermissionsIds.length; i++) {
                userOuPermissions.push(new UserOuPermission({
                    userId: self.ouApplicationUser.applicationUser.id,
                    ouId: self.ouApplicationUser.ouid.id,
                    customRoleId: self.ouApplicationUser.customRoleId.id,
                    permissionId: self.userOuPermissionsIds[i]
                }));
            }

            ouApplicationUserService
                .addUserOuPermission(userOuPermissions)
                .then(function () {
                    if (employeeService.isCurrentEmployee(self.ouApplicationUser.applicationUser)) {
                        tokenService.forceTokenRefresh()
                            .then(function () {
                                _savePermissionsSuccess();
                                $rootScope.$broadcast('$currentEmployeePermissionsChanged');
                            })
                    } else {
                        _savePermissionsSuccess();
                    }
                });
        };

        /**
         * @description Close the popup
         */
        self.closeUserOuPermissionsFromCtrl = function () {
            dialog.cancel();
        };

        /**
         * @description Check if current permission is already saved. If yes, return true
         * @param permission
         * @returns {boolean}
         */
        self.userOUPermissionsExists = function (permission) {
            return (self.userOuPermissionsIds.indexOf(permission.id) > -1)
        };

        /**
         * @description Toggle Permissions for the ou application user
         * @param permission
         */
        self.toggleUserOuPermission = function (permission) {
            var index = self.userOuPermissionsIds.indexOf(permission.id);
            if (index > -1) {
                self.userOuPermissionsIds.splice(index, 1);
            }
            else {
                self.userOuPermissionsIds.push(permission.id);
            }
        };

        self.selectAllGroupPermissions = function (allGroupPermissions, key) {
            for (var i = 0; i < allGroupPermissions.length; i++) {
                for (var j = 0; j < allGroupPermissions[i].length; j++) {
                    if (allGroupPermissions[i][j]) {
                        var isPermissionExist = _.filter(self.userOuPermissionsIds, function (permissionId) {
                            return allGroupPermissions[i][j].id === permissionId;
                        })[0];
                        //on click event get previous value of checkbox (true/false)
                        if (!self[key]) {
                            if (!isPermissionExist) {
                                self.userOuPermissionsIds.push(allGroupPermissions[i][j]['id']);
                            }
                        } else {
                            if (isPermissionExist) {
                                var indexOfPermission = _.findIndex(self.userOuPermissionsIds, function (permissionId) {
                                    return permissionId === isPermissionExist;
                                });
                                self.userOuPermissionsIds.splice(indexOfPermission, 1);
                            }
                        }
                    }
                }
            }
        };

        self.selectParentCheckbox = function (allGroupPermissions) {
            var count = 0;
            for (var i = 0; i < allGroupPermissions.length; i++) {
                for (var j = 0; j < allGroupPermissions[i].length; j++) {
                    if (allGroupPermissions[i][j]) {
                        var isPermissionExist = _.filter(self.userOuPermissionsIds, function (permissionId) {
                            return allGroupPermissions[i][j].id === permissionId;
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

        self.searchChanges = function () {
            self.permissions = $filter('permissionFilter')(_getPermissions(), self.search);
        };
        // for any change happened in language rebuild the permissions with the current corrected key.
        langService.listeningToChange(_getPermissions);

        self.isIndeterminate = function () {
            return (self.userOuPermissionsIds.length !== 0 && self.userOuPermissionsIds.length !== self.totalPermissionsCount);
        };

        self.isChecked = function () {
            return self.userOuPermissionsIds.length === self.totalPermissionsCount;
        };

        /**
         * @description parent checkbox
         */
        self.toggleAll = function () {
            if (self.isChecked()) {
                self.userOuPermissionsIds = [];
            }
            else  {
                for (var key in self.permissions) {
                    var permission = self.permissions[key];
                    for (var i = 0; i < permission.length; i++) {
                        for (var j = 0; j < permission[i].length; j++) {
                            if (permission[i][j]) {
                                if (self.userOuPermissionsIds.indexOf(permission[i][j]['id']) === -1)
                                    self.userOuPermissionsIds.push(permission[i][j]['id']);
                            }
                        }
                    }
                }
            }
        };

    });
};