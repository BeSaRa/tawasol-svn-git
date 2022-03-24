module.exports = function (app) {
    app.controller('roleMembersPopCtrl', function (_,
                                                   $q,
                                                   toast,
                                                   rootEntity,
                                                   validationService,
                                                   generator,
                                                   dialog,
                                                   Member,
                                                   langService,
                                                   role,
                                                   gridService,
                                                   overrideRoles,
                                                   members,
                                                   roleService,
                                                   $filter) {
        'ngInject';
        var self = this;
        self.controllerName = 'roleMembersPopCtrl';
        self.role = role;
        self.progress = null;

        self.roleMembers = members;
        self.roleMembersCopy = angular.copy(members);
        self.overrideRoles = overrideRoles;

        /**
         * @description Contains the selected application users
         * @type {Array}
         */
        self.selectedRoleMembers = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.role, self.roleMembers),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.role, limit);
            },
            searchColumns: {
                employeeNo: 'applicationUser.employeeNo',
                loginName: 'applicationUser.loginName',
                arFullName: 'applicationUser.arFullName',
                enFullName: 'applicationUser.enFullName',
                organization: function () {
                    return self.getSortingKey('ouid', 'Information');
                },
                status: function (model) {
                    return '';
                }
            },
            searchText: '',
            searchCallback: function (grid) {
                self.roleMembers = gridService.searchGridData(self.grid, self.roleMembersCopy);
            }
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.roleMembers = $filter('orderBy')(self.roleMembers, self.grid.order);
        };

        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };

        /**
         * @description
         * @param $event
         */
        self.overrideMembersPermissions = function ($event) {
            dialog.hide(self.selectedRoleMembers);
        }

        self.closeRoleMembersPopup = function ($event) {
            return dialog.cancel();
        }
    });
};
