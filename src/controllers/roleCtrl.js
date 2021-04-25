module.exports = function (app) {
    app.controller('roleCtrl', function (roles,
                                         roleService,
                                         $q,
                                         _,
                                         $filter,
                                         permissions,
                                         langService,
                                         toast,
                                         ouApplicationUsers,
                                         contextHelpService,
                                         dialog,
                                         gridService,
                                         $timeout,
                                         generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'roleCtrl';
        contextHelpService.setHelpTo('roles');
        self.permissions = permissions;
        // all roles
        self.roles = roles;
        $timeout(function () {
            _prepareRoleMembers(); // run prepareRoleMember for the first time.
        });
        self.rolesCopy = angular.copy(self.roles);

        self.selectedRoles = [];

        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.role) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.role, self.roles),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.role, limit);
            },
            searchColumns: {
                arabicName: 'arName',
                englishName: 'enName',
                updatedBy: function (record) {
                    return self.getSortingKey('updatedByInfo', 'Information');
                },
                updatedOn: 'updatedOn'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.roles = gridService.searchGridData(self.grid, self.rolesCopy);
            }
        };

        function _prepareRoleMembers() {
            self.roles = _.map(self.roles, function (role) {
                role.members = _.filter(ouApplicationUsers, function (ouApplicationUser) {
                    var id = ouApplicationUser.customRoleId.hasOwnProperty('id') ? ouApplicationUser.customRoleId.id : ouApplicationUser.customRoleId;
                    return Number(id) === Number(role.id);
                });
                return role;
            });
        }

        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };

        self.statusServices = {
            'activate': roleService.activateBulkRoles,
            'deactivate': roleService.deactivateBulkRoles,
            'true': roleService.activateRole,
            'false': roleService.deactivateRole
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.roles = $filter('orderBy')(self.roles, self.grid.order);
        };

        /**
         * @description this method to reload the grid
         * @return {*|Promise<U>}
         */
        self.reloadRoles = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return roleService.loadRoles().then(function (result) {
                self.selectedRoles = [];
                self.roles = result;
                _prepareRoleMembers();
                self.rolesCopy = angular.copy(self.roles);
                defer.resolve(true);

                if (pageNumber)
                    self.grid.page = pageNumber;
                self.getSortedData();
                return result;
            });
        };

        /**
         * @description Opens dialog for add new role
         * @param $event
         */
        self.openAddRoleDialog = function ($event) {
            roleService
                .controllerMethod
                .roleAdd(self.permissions, $event)
                .then(function () {
                    self.reloadRoles(self.grid.page);
                })
        };

        /**
         * @description Opens dialog for edit role
         * @param $event
         */
        self.openEditRoleDialog = function (role, $event) {
            roleService
                .controllerMethod
                .roleEdit(role, self.permissions, $event)
                .then(function () {
                    self.reloadRoles(self.grid.page);
                });
        };

        /**
         *remove single role
         * @param role
         * @param $event
         */
        self.removeRole = function (role, $event) {
            roleService
                .controllerMethod
                .roleDelete($event, role)
                .then(function () {
                    self.reloadRoles(self.grid.page);
                });
        };

        /**
         *remove bulk roles
         * @param $event
         */
        self.removeRoles = function ($event) {
            var listArr = self.selectedRoles;

            var listIds = [];
            for (var i = 0; i < listArr.length; i++) {
                listIds.push(listArr[i].id);
            }

            roleService
                .controllerMethod
                .roleDeleteBulk(listIds, $event)
                .then(function () {
                    self.reloadRoles(self.grid.page);
                });
        };

        /**
         * change bulk role status
         * @param status
         */
        self.changeBulkStatusRoles = function (status) {
            self.statusServices[status](self.selectedRoles).then(function () {
                self.selectedRoles = [];
                self.reloadRoles(self.grid.page)
                    .then(function () {
                        toast.success(langService.get('selected_status_updated'));
                    });
            });
        };

        /**
         * change single role status
         * @param role
         */
        self.changeStatusRole = function (role) {
            self.statusServices[role.status](role)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    role.status = !role.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * open popup to show multiple permissions
         * @param role
         * @param $event
         */
        self.openPopupForMultiplePermissions = function (role, $event) {
            roleService
                .controllerMethod
                .multipleRolePermissions($event, role);
        };

        /**
         * open popup to show role members
         * @param role
         * @param $event
         */
        self.openPopupForRoleMembers = function (role, $event) {
            if (!role.members.length)
                return;

            roleService
                .controllerMethod
                .showRoleMembers($event, role);
        };

    });
};
