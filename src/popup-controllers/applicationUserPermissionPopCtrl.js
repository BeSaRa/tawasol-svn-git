module.exports = function (app) {
    app.controller('applicationUserPermissionPopCtrl', function (_,
                                                                 toast,
                                                                 configurationService,
                                                                 $rootScope,
                                                                 layoutService,
                                                                 validationService,
                                                                 dynamicMenuItemService,
                                                                 $filter,
                                                                 generator,
                                                                 dialog,
                                                                 tokenService,
                                                                 employeeService,
                                                                 langService,
                                                                 counterService,
                                                                 ouApplicationUser,
                                                                 permissions,
                                                                 userOuPermissions,
                                                                 userMenuItems,
                                                                 dynamicMenuItems,
                                                                 ouApplicationUserService,
                                                                 UserMenuItem,
                                                                 UserOuPermission) {
        'ngInject';
        var self = this;
        self.controllerName = 'applicationUserPermissionPopCtrl';

        //self.permissionsChunkArray = _.chunk(permissions, 3);
        self.permissionsList = permissions;
        var allPermissionsList = [];
        for (var key in permissions[0]) {
            for (var i = 0; i < (permissions[0][key].length); i++) {
                allPermissionsList = allPermissionsList.concat(_.filter(permissions[0][key][i], function (permission) {
                    return !!permission;
                }));
            }
        }

        var _getPermissionIdByPermissionKey = function (permissionKey) {
            permissionKey = permissionKey.hasOwnProperty('permissionKey') ? permissionKey.permissionKey : permissionKey;
            var permissionResult = _.find(allPermissionsList, function (permission) {
                return permission.permissionKey === permissionKey;
            });
            return permissionResult ? permissionResult.id : 0;
        };

        var userInboxPermissionId = _getPermissionIdByPermissionKey('USER_INBOX'),
            landingPagePermissionId = _getPermissionIdByPermissionKey('LANDING_PAGE');


        if (dynamicMenuItems && _excludeICNTemplates(dynamicMenuItems).length) {
            self.permissionsList[0][langService.getKey('private_menu_items', 'en')] = _.chunk(_convertMenuItems(_excludeICNTemplates(dynamicMenuItems)), 3);
            self.permissionsList[1][langService.getKey('private_menu_items', 'ar')] = _.chunk(_convertMenuItems(_excludeICNTemplates(dynamicMenuItems)), 3);
        }

        if (dynamicMenuItems && _getICNEntryTemplates(dynamicMenuItems).length) {
            self.permissionsList[0][langService.getKey('icn_entry_template', 'en')] = _.chunk(_convertMenuItems(_getICNEntryTemplates(dynamicMenuItems)), 3);
            self.permissionsList[1][langService.getKey('icn_entry_template', 'ar')] = _.chunk(_convertMenuItems(_getICNEntryTemplates(dynamicMenuItems)), 3);
        }
        if (dynamicMenuItems && _getICNSearchTemplates(dynamicMenuItems).length) {
            self.permissionsList[0][langService.getKey('icn_search_template', 'en')] = _.chunk(_convertMenuItems(_getICNSearchTemplates(dynamicMenuItems)), 3);
            self.permissionsList[1][langService.getKey('icn_search_template', 'ar')] = _.chunk(_convertMenuItems(_getICNSearchTemplates(dynamicMenuItems)), 3);
        }

        // icn_search_template
        // icn_entry_template
        function _convertMenuItems(menuItems) {
            return _.map(menuItems, function (item) {
                item.arName = item.menuItem.arName;
                item.enName = item.menuItem.enName;
                item.id = 'dm' + item.menuItem.id;
                return item;
            });
        }

        function _getICNSearchTemplates(menuItems) {
            return _.filter(menuItems, function (item) {
                return item.menuItem.menuType === configurationService.ICN_SEARCH_TEMPLATE_MENU_TYPE;
            });
        }

        function _getICNEntryTemplates(menuItems) {
            return _.filter(menuItems, function (item) {
                return item.menuItem.menuType === configurationService.ICN_ENTRY_TEMPLATE_MENU_TYPE;
            });
        }

        function _excludeICNTemplates(menuItems) {
            var types = [configurationService.ICN_ENTRY_TEMPLATE_MENU_TYPE, configurationService.ICN_SEARCH_TEMPLATE_MENU_TYPE];
            return _.filter(menuItems, function (item) {
                return types.indexOf(item.menuItem.menuType) === -1;
            });
        }

        self.excludedUserOuPermissions = [];
        self.userOuPermissions = userOuPermissions;
        self.userOuPermissionsIds = _.map(userOuPermissions, (userPermission) => {
            if (userPermission && userPermission.permission.excluded) {
                self.excludedUserOuPermissions.push(userPermission);
            }
            return userPermission.permissionId;
        });

        if (userMenuItems.length) {
            self.userOuPermissionsIds = self.userOuPermissionsIds.concat(_.map(_convertMenuItems(userMenuItems), 'id'))
        }

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
                    if (value && ((value.hasOwnProperty('excluded') && !value.excluded) || value instanceof UserMenuItem)) {
                        self.totalPermissionsCount++;
                    }
                })
            })
        });

        function _savePermissionsSuccess() {
            toast.success(langService.get('update_success'));
            dialog.hide(true);
        }

        function _getMenuItemById(menuItemId) {
            menuItemId = Number(menuItemId.replace('dm', ''));
            return _.find(dynamicMenuItems, function (item) {
                return item.menuItem.id === menuItemId;
            });
        }

        function _successMessage() {
            if (employeeService.isCurrentOUApplicationUser(self.ouApplicationUser)) {
                tokenService.forceTokenRefresh()
                    .then(function () {
                        layoutService.loadLandingPage();
                        counterService.loadCounters().then(function () {
                            if (employeeService.getEmployee().hasAnyPermissions(["GOVERNMENT_TO_GOVERNMENT", "OLD_SYSTEM_COMMUINCATION"])) {
                                // console.log('permission granted');
                                counterService.loadG2GCounters()
                                    .then(function () {
                                        counterService.intervalG2GCounters();
                                    });
                            } else {
                                // console.log('permission revoked');
                                counterService.stopG2GCounter();
                            }
                        });
                        _savePermissionsSuccess();
                        $rootScope.$broadcast('$currentEmployeePermissionsChanged');
                    })
            } else {
                _savePermissionsSuccess();
            }
        }

        /**
         * @description add user ou permissions
         */
        self.saveUserOuPermissionsFromCtrl = function () {
            var landingPageIndex = _.findIndex(self.userOuPermissionsIds, function (userOuPermissionId) {
                return userOuPermissionId === landingPagePermissionId
            }), userInboxIndex = _.findIndex(self.userOuPermissionsIds, function (userOuPermissionId) {
                return userOuPermissionId === userInboxPermissionId
            });

            if (landingPagePermissionId > 0 && userInboxPermissionId > 0 && landingPageIndex === -1 && userInboxIndex === -1) {
                toast.info(langService.get('select_landing_page_or_user_inbox_permission'));
            } else {
                var userOuPermissions = [], userMenuItemsIds = [],
                    userId = self.ouApplicationUser.applicationUser.id,
                    ouId = self.ouApplicationUser.ouid.id;

                for (var i = 0; i < self.userOuPermissionsIds.length; i++) {
                    if (_.startsWith(self.userOuPermissionsIds[i], 'dm')) {
                        userMenuItemsIds.push(_getMenuItemById(self.userOuPermissionsIds[i]));
                        continue;
                    }
                    userOuPermissions.push(new UserOuPermission({
                        userId: userId,
                        ouId: ouId,
                        customRoleId: self.ouApplicationUser.customRoleId.id,
                        permissionId: self.userOuPermissionsIds[i]
                    }));
                }
                return ouApplicationUserService
                    .addUserOuPermission(userOuPermissions)
                    .then(function () {
                        if (!dynamicMenuItems.length) {
                            return _successMessage();
                        }
                        return dynamicMenuItemService
                            .saveBulkUserMenuItems(userMenuItemsIds, userId, ouId)
                            .then(function () {
                                return _successMessage();
                            });
                    });
            }
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
            } else {
                self.userOuPermissionsIds.push(permission.id);
            }
        };

        self.selectAllGroupPermissions = function (allGroupPermissions, key) {
            for (var i = 0; i < allGroupPermissions.length; i++) {
                for (var j = 0; j < allGroupPermissions[i].length; j++) {
                    if (allGroupPermissions[i][j] && !allGroupPermissions[i][j].excluded) {
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
                    if (allGroupPermissions[i][j] && !allGroupPermissions[i][j].excluded) {
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
        };

        self.searchChanges = function () {
            self.permissions = $filter('permissionFilter')(_getPermissions(langService.current), self.search);
        };
        // for any change happened in language rebuild the permissions with the current corrected key.
        langService.listeningToChange(_getPermissions);

        self.isIndeterminate = function () {
            var userOuPermissions = self.userOuPermissionsIds.length - self.excludedUserOuPermissions.length;
            return (userOuPermissions !== 0 && userOuPermissions !== self.totalPermissionsCount);
        };

        self.isChecked = function () {
            var userOuPermissions = self.userOuPermissionsIds.length - self.excludedUserOuPermissions.length;
            return userOuPermissions === self.totalPermissionsCount;
        };

        /**
         * @description parent checkbox
         */
        self.toggleAll = function () {
            var userOuPermissionsIdsCopy = angular.copy(self.userOuPermissionsIds);
            if (self.isChecked() && employeeService.isSuperAdminUser()) {
                userOuPermissionsIdsCopy = [];
            } else {
                for (var key in self.permissions) {
                    var permission = self.permissions[key];
                    for (var i = 0; i < permission.length; i++) {
                        for (var j = 0; j < permission[i].length; j++) {
                            if (permission[i][j] && !permission[i][j].excluded) {
                                var indexOfPermission = userOuPermissionsIdsCopy.indexOf(permission[i][j]['id']);
                                if (self.isChecked() && indexOfPermission > -1) {
                                    userOuPermissionsIdsCopy.splice(indexOfPermission, 1)
                                } else if (!self.isChecked() && indexOfPermission === -1) {
                                    userOuPermissionsIdsCopy.push(permission[i][j]['id']);
                                }
                            }
                        }
                    }
                }
            }

            self.userOuPermissionsIds = userOuPermissionsIdsCopy;
        };

    });
};
