module.exports = function (app) {
    app.controller('ouApplicationUserPopCtrl', function (_,
                                                         editMode,
                                                         dialog,
                                                         roles,
                                                         ouApplicationUser,
                                                         ouApplicationUsers,
                                                         organizations,
                                                         organizationService,
                                                         Information,
                                                         langService,
                                                         rootEntity,
                                                         toast,
                                                         ouApplicationUserService,
                                                         UserOuPermission,
                                                         tokenService,
                                                         employeeService,
                                                         popupFromOU) {
        'ngInject';
        var self = this;
        self.controllerName = 'ouApplicationUserPopCtrl';
        self.editMode = editMode;
        self.popupFromOU = popupFromOU;

        self.ouApplicationUsers = ouApplicationUsers;
        self.roles = roles;
        self.securityLevels = rootEntity.getGlobalSettings().securityLevels;
        self.organizations = organizations;
        self.organizationsCopy = _sortRegOusSections(angular.copy(self.organizations), true);

        self.ouApplicationUser = ouApplicationUser;
        self.model = angular.copy(self.ouApplicationUser);

        self.ouSearchText = '';
        self.parentOuSearchText = '';
        self.roleSearchText = '';

        self.securityLevelsModel = {
            securityLevels: self.securityLevels,
            add: [],
            view: []
        };

        function _generateViewAndAddSecurityArray() {
            _.map(self.securityLevelsModel.securityLevels, function (securityLevel, index) {
                self.securityLevelsModel.add[index] = !!_securityExists(securityLevel, self.ouApplicationUser.securityLevels);
                self.securityLevelsModel.view[index] = !!_securityExists(securityLevel, self.ouApplicationUser.archiveSecurityLevels);
            });
        }

        _generateViewAndAddSecurityArray();

        function _securityExists(securityLevel, collection) {
            return _.find(collection, function (item) {
                return item.lookupKey === securityLevel.lookupKey;
            });
        }


        /**
         * @description Filter already added organizations to skip it in dropdown.
         * @returns {Array}
         */
        self.excludedOrganizations = _.map(self.ouApplicationUsers, 'ouid.id');

        self.excludeOrganizationsIfExists = function (organization) {
            return self.excludedOrganizations.indexOf(organization.id) === -1;
        };

        /**
         * @description Get the list of Parent Organizations with registry and select default ou with registry.
         */
        self.getParentOrganizationsWithRegistry = function () {
            self.parentsWithRegistryList = organizationService.getAllParentsHasRegistry(self.ouApplicationUser.ouid, false);
            self.ouApplicationUser.ouRegistryID = (self.parentsWithRegistryList && self.parentsWithRegistryList.length)
                ? (self.ouApplicationUserBeforeEdit ? self.ouApplicationUserBeforeEdit.ouRegistryID : self.parentsWithRegistryList[0].id)
                : null;
        };

        if (self.editMode) {
            self.getParentOrganizationsWithRegistry();
        }

        function _sortRegOusSections(organizations, appendRegOUSection) {
            // filter all regOU
            var regOus = _.filter(organizations, function (item) {
                    return item.hasRegistry;
                }),
                // registry parent organization
                parentRegistryOu;

            regOus = _.map(regOus, function (regOu) {
                regOu.tempRegOUSection = new Information({
                    arName: regOu.arName,
                    enName: regOu.enName
                });
                return regOu;
            });

            // filter all sections (no registry)
            var groups = _.filter(organizations, function (item) {
                return !item.hasRegistry;
            });

            // if needed to show regou - section, append the dummy property "tempRegOUSection"
            groups = _.map(groups, function (item) {
                if (typeof item.registryParentId === 'number') {
                    parentRegistryOu = _.find(regOus, {'id': item.registryParentId});
                } else {
                    parentRegistryOu = item.registryParentId;
                }

                // if ou is section(has no registry and has regOuId, add temporary field for regOu)
                item.tempRegOUSection = new Information({
                    arName: (parentRegistryOu ? parentRegistryOu.arName : '') + ' - ' + item.arName,
                    enName: (parentRegistryOu ? parentRegistryOu.enName : '') + ' - ' + item.enName
                });
                return item;
            });

            return _.sortBy([].concat(regOus, groups), [function (ou) {
                return ou.tempRegOUSection[langService.current + 'Name'].toLowerCase();
            }]);
        }

        function _isAnyAddSecurityLevel() {
            return _.some(self.securityLevelsModel.add, function (securityLevel) {
                return !!securityLevel;
            });
        }

        function _isAnyViewSecurityLevel() {
            return _.some(self.securityLevelsModel.view, function (securityLevel) {
                return !!securityLevel;
            });
        }

        self.isSaveEnabled = function (form) {
            return !form.$invalid && self.ouApplicationUser.ouid && self.ouApplicationUser.customRoleId// && (_isAnyAddSecurityLevel() || _isAnyViewSecurityLevel());
        };

        var _setSecurityLevelsBeforeSave = function () {
            var addSecurityLevel = [], viewSecurityLevels = [];
            _.map(self.securityLevels, function (securityLevel, index) {
                if (self.securityLevelsModel.add[index]) {
                    addSecurityLevel.push(securityLevel);
                }
                if (self.securityLevelsModel.view[index]) {
                    viewSecurityLevels.push(securityLevel);
                }
            });

            self.ouApplicationUser.securityLevels = addSecurityLevel;
            self.ouApplicationUser.archiveSecurityLevels = viewSecurityLevels;
        };

        /**
         * @description Add/Update the ouApplicationUser
         * @param form
         * @param $event
         * @returns {boolean}
         */
        self.saveOUApplicationUser = function (form, $event) {
            if (!self.isSaveEnabled(form)) {
                toast.info(langService.get('select_ou_role_security_level'));
                return false;
            }
            _setSecurityLevelsBeforeSave();
            self.ouApplicationUser.wfsecurity = self.ouApplicationUser.ouid.wfsecurity.lookupKey;

            if (!self.ouApplicationUser.id) {
                ouApplicationUserService
                    .addOUApplicationUser(self.ouApplicationUser)
                    .then(function (result) {

                        var userOuPermissions = [];
                        for (var i = 0; i < result.customRoleId.customRolePermission.length; i++) {
                            userOuPermissions.push(new UserOuPermission({
                                userId: result.applicationUser.id,
                                ouId: result.ouid.id,
                                customRoleId: result.customRoleId.id,
                                permissionId: result.customRoleId.customRolePermission[i].id
                            }));
                        }

                        if (!userOuPermissions.length) {
                            toast.success(langService.get('save_success'));
                            dialog.hide();
                        } else {
                            ouApplicationUserService
                                .addUserOuPermission(userOuPermissions)
                                /*.then(function () {
                                    toast.success(langService.get('save_success'));
                                    //dialog.hide();
                                })*/
                                .then(function () {
                                    tokenService.forceTokenRefresh()
                                        .then(function () {
                                            toast.success(langService.get('save_success'));
                                            dialog.hide();
                                        })
                                });
                        }
                    });
            } else {
                ouApplicationUserService
                    .updateOUApplicationUser(self.ouApplicationUser)
                    .then(function () {
                        toast.success(langService.get('edited_successfully'));
                        if (employeeService.isCurrentOUApplicationUser(ouApplicationUser)) {
                            employeeService.setCurrentOUApplicationUser(ouApplicationUser);
                            employeeService.setCurrentEmployee(self.ouApplicationUser.applicationUser);
                        }

                        dialog.hide();
                    });
            }

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


        self.closePopup = function ($event) {
            dialog.cancel();
        };
    });
};
