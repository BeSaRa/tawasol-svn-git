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
                                                   $filter) {
        'ngInject';
        var self = this;
        self.controllerName = 'roleMembersPopCtrl';
        self.role = role;
        self.progress = null;

        self.roleMembersCopy = angular.copy(self.role.members);

        self.roleMembers = _.map(self.roleMembersCopy, function (member) {
            return new Member({
                employeeNo: member.applicationUser.employeeNo,
                loginName: member.applicationUser.loginName,
                arFullName: member.applicationUser.arFullName,
                enFullName: member.applicationUser.enFullName,
                organization: member.ouid,
                status: member.status
            });
        });

        self.roleMembersCopy = _.map(self.roleMembersCopy, function (member) {
            return new Member({
                employeeNo: member.applicationUser.employeeNo,
                loginName: member.applicationUser.loginName,
                arFullName: member.applicationUser.arFullName,
                enFullName: member.applicationUser.enFullName,
                organization: member.ouid,
                status: member.status
            });
        });

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
                employeeNo: 'employeeNo',
                loginName: 'loginName',
                arFullName: 'arFullName',
                enFullName: 'enFullName',
                organization: function () {
                    return self.getSortingKey('organization', 'Organization');
                },
                 status: function (model) {
                    return '';
                 }
            },
            searchText: '',
            searchCallback: function () {
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

        self.closeRoleMembersPopup = function ($event) {
            return dialog.cancel();
        }
    });
};