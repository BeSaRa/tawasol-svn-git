module.exports = function (app) {
    app.service('roleService', function (urlService,
                                         $http,
                                         $q,
                                         generator,
                                         Role,
                                         _,
                                         dialog,
                                         cmsTemplate,
                                         langService,
                                         toast,
                                         lookupService,
                                         Permission) {
        'ngInject';
        var self = this;
        self.serviceName = 'roleService';

        self.roles = [];
        self.permissionsList = [];

        /**
         * @description load roles from server.
         * @returns {Promise|roles}
         */
        self.loadRoles = function () {
            return $http.get(urlService.roles + "/composite").then(function (result) {
                self.roles = generator.generateCollection(result.data.rs, Role, self._sharedMethods);
                self.roles = generator.interceptReceivedCollection('Role', self.roles);
                return self.roles;
            });
        };
        /**
         * @description get roles from self.roles if found and if not load it from server again.
         * @returns {Promise|roles}
         */
        self.getRoles = function () {
            return self.roles.length ? $q.when(self.roles) : self.loadRoles();
        };
        /**
         * @description add new role to service
         * @param role
         * @return {Promise|Role}
         */
        self.addRole = function (role) {
            return $http
                .post(urlService.roles,
                    generator.interceptSendInstance('Role', role))
                .then(function (result) {
                    return generator.interceptReceivedInstance('Role', generator.generateInstance(result.data.rs, Role, self._sharedMethods));
                });
        };
        /**
         * @description make an update for given role.
         * @param role
         * @return {Promise|Role}
         */
        self.updateRole = function (role) {
            return $http
                .put(urlService.roles,
                    generator.interceptSendInstance('Role', role))
                .then(function (result) {
                    return generator.interceptReceivedInstance('Role', generator.generateInstance(result.data.rs, Role, self._sharedMethods));
                });
        };
        /**
         * @description delete given role.
         * @param roleId
         * @return {Promise}
         */
        self.deleteRole = function (roleId) {
            var id = roleId.hasOwnProperty('id') ? roleId.id : roleId;
            return $http.delete((urlService.roles + '/' + id)).then(function (result) {
                return result.data.rs;
            });
        };
        /**
         * delete multiple roles
         * @param roles
         */
        self.deleteBulkRoles = function (roles) {
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.roles + '/bulk',
                data: roles
            }).then(function (result) {
                return result.data.rs;
            })
        };

        /**
         * @description create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteRole, self.updateRole);

        /**
         * @description get role by roleId
         * @param roleId
         * @returns {Role|undefined} return Role Model or undefined if not found.
         */
        self.getRoleById = function (roleId) {
            roleId = roleId instanceof Role ? roleId.id : roleId;
            return _.find(self.roles, function (role) {
                return Number(role.id) === Number(roleId)
            });
        };

        /**
         * Get all the permissions from DB
         * @returns {permissions}
         */
        self.getPermissions = function () {
            return $http.get(urlService.rolePermissions).then(function (result) {
                /*self.permissionsList = [];
                 angular.forEach(result.data.rs, function (value, key) {
                 self.permissionsList.push({
                 "permissionId": value.id,
                 "arName": value.arName,
                 "enName": value.enName,
                 "description": value.description
                 });
                 });

                 self.permissionsList = generator.generateCollection(result.data.rs, Permission, self._sharedMethods);
                 return self.permissionsList;*/
                return generator.generateCollection(result.data.rs, Permission, self._sharedMethods);
            })
        };

        self.getPermissionByGroup = function () {
            self.permissionsByGroup = [];
            var permissionByGroup = [];
            return self.getPermissions().then(function (result) {
                var permissionByGroupEN = {};
                var permissionByGroupAR = {};
                var groups = lookupService.returnLookups(lookupService.permissionGroup);
                for (var i = 0; i < groups.length; i++) {
                    var getPermissionsForGroup = _.filter(result, function (permission) {
                        return permission.groupId === groups[i].lookupKey;
                    });
                    if (getPermissionsForGroup.length > 0) {
                        getPermissionsForGroup = _.chunk(getPermissionsForGroup, 3);
                        self.fillTheRemainingItems(3, getPermissionsForGroup);
                        permissionByGroupEN[groups[i].defaultEnName] = getPermissionsForGroup;
                        permissionByGroupAR[groups[i].defaultArName] = getPermissionsForGroup;
                    }
                }
                permissionByGroup.push(permissionByGroupEN);//for English
                permissionByGroup.push(permissionByGroupAR);//for Arabic
                self.permissionsByGroup.push(permissionByGroupEN);//for English
                self.permissionsByGroup.push(permissionByGroupAR);//for Arabic
                return permissionByGroup;
            });
        };

        //self.getPermissions();

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param role
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateRole = function (role, editMode) {
            var rolesToFilter = self.roles;
            if (editMode) {
                rolesToFilter = _.filter(rolesToFilter, function (roleToFilter) {
                    return roleToFilter.id !== role.id;
                });
            }
            return _.some(_.map(rolesToFilter, function (existingRole) {
                return existingRole.arName === role.arName
                    || existingRole.enName.toLowerCase() === role.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * activate role
         * @param role
         */
        self.activateRole = function (role) {
            return $http
                .put((urlService.roles + '/activate/' + role.id))
                .then(function () {
                    return role;
                });
        };
        /**
         * deactivate role
         * @param role
         */
        self.deactivateRole = function (role) {
            return $http
                .put((urlService.roles + '/deactivate/' + role.id))
                .then(function () {
                    return role;
                });
        };
        /**
         * activate bulk of role
         * @param roles
         */
        self.activateBulkRoles = function (roles) {
            return $http
                .put((urlService.roles + '/activate/bulk'), _.map(roles, 'id'))
                .then(function () {
                    return roles;
                });
        };
        /**
         * deactivate bulk of role
         * @param roles
         */
        self.deactivateBulkRoles = function (roles) {
            return $http
                .put((urlService.roles + '/deactivate/bulk'), _.map(roles, 'id'))
                .then(function () {
                    return roles;
                });
        };

        /**
         * Get Role Members from the DB
         * @param roleId
         */
        self.getCustomRoleMembers = function (roleId) {
            return $http.get((urlService.roles + "/" + roleId + '/members')).then(function (result) {
                return result.data.rs;
            });
        };

        self.controllerMethod = {
            roleAdd: function (permissionsList, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('role'),
                        controller: 'rolePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            role: new Role(),
                            permissions: permissionsList
                            // permissions: self.permissionsList
                        }
                    })
            },
            roleEdit: function (role, permissionsList, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('role'),
                        controller: 'rolePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            role: role,
                            roles: self.roles,
                            permissions: permissionsList
                            // permissions: self.permissionsList
                        }
                    }).then(function () {

                    })
            },
            roleDelete: function ($event, role) {
                return dialog.confirmMessage((langService.get('confirm_delete').change({name: role.getTranslatedName()}))).then(function () {
                    return self.deleteRole(role).then(function (result) {
                        toast.success(langService.get("delete_specific_success").change({name: role.getNames()}));
                        return result;
                    })
                });
            },
            roleDeleteBulk: function (roles, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkRoles(roles)
                            .then(function (result) {
                                var response = false;
                                if (result.length === roles.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (role) {
                                        return role.getNames();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("delete_success"));
                                    response = true;
                                }
                                return response;
                            });
                    });
            },
            multipleRolePermissions: function ($event, role) {
                return dialog.showDialog({
                    templateUrl: cmsTemplate.getPopup('show-multiple-permissions'),
                    bindToController: true,
                    escToCancel: true,
                    targetEvent: $event,
                    controller: function () {
                    },
                    controllerAs: 'ctrl',
                    locals: {
                        role: role
                    }
                })
            },
            showRoleMembers: function ($event, role) {
                // self.getCustomRoleMembers(role.id).then(function (roleMembers) {
                dialog.showDialog({
                    templateUrl: cmsTemplate.getPopup('role-members'),
                    //bindToController: true,
                    escToCancel: true,
                    targetEvent: $event,
                    controller: 'roleMembersPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        role: role
                    }
                });
                // });
            }
        };

        /**
         * @description Find permissions by search text and search key
         * @param searchText
         * @param searchKey
         * @return {*|Promise<U>}
         */
        self.findPermissionsByText = function (searchText, searchKey) {
            // service-request: need service to return collection of permissions from backend-team based on search text.
            return self.getPermissions().then(function (result) {
                return _.filter(result, function (permission) {
                        return permission[searchKey.key].toLowerCase().indexOf(searchText.toLowerCase()) !== -1;
                    }
                );
            });
        };

        /**
         * @description Check if record has permissions selected or not. Returns true if selected
         * @param role
         * @returns {boolean}
         */
        self.checkRolePermissionsExist = function (role) {
            if (role.customRolePermission) {
                if (role.customRolePermission.length === 0) {
                    return true;
                }
            } else {
                return true;
            }

            return false;
        };

        self.fillTheRemainingItems = function (number, collection) {
            _.map(collection, function (value, index) {
                var count = (number - value.length);
                if (count) {
                    for (var i = 0; i < count; i++) {
                        collection[index].push(null);
                    }
                }
            });
            return collection;
        }

    });
};
