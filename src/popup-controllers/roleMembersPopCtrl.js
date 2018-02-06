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
                                                   role) {
        'ngInject';
        var self = this;
        self.controllerName = 'roleMembersPopCtrl';
        self.role = role;
        self.progress = null;

        self.roleMembers = angular.copy(self.role.members);

        self.roleMembers = _.map(self.roleMembers, function (member) {
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
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.roleMembers.length + 21);
                    }
                }
            ],
            filter: {search: {}}
        };

        self.closeRoleMembersPopup = function ($event) {
            return dialog.cancel();
        }
    });
};