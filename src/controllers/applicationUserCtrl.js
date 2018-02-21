module.exports = function (app) {
    app.controller('applicationUserCtrl', function (lookupService,
                                                    applicationUserService,
                                                    applicationUsers,
                                                    ouApplicationUsers,
                                                    $q,
                                                    langService,
                                                    toast,
                                                    dialog,
                                                    jobTitles,
                                                    organizations,
                                                    classifications,
                                                    themes,
                                                    roles,
                                                    permissions,
                                                    userClassificationViewPermissions,
                                                    contextHelpService,
                                                    employeeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'applicationUserCtrl';

        self.progress = null;
        contextHelpService.setHelpTo('application-users');
        /**
         * @description All application users
         * @type {*}
         */
        self.applicationUsers = applicationUsers;
        /**
         * @description Current logged in applicationUser
         * @type {*}
         */
        self.currentEmployee = employeeService.getEmployee();

        /**
         * @description Contains the selected application users
         * @type {Array}
         */
        self.selectedApplicationUsers = [];

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
                        return (self.applicationUsers.length + 21);
                    }
                }
            ],
            filter: {search: {}}
        };

        /**
         * @description Contains methods for CRUD operations for application users
         */
        self.statusServices = {
            'activate': applicationUserService.activateBulkApplicationUsers,
            'deactivate': applicationUserService.deactivateBulkApplicationUsers,
            'true': applicationUserService.activateApplicationUser,
            'false': applicationUserService.deactivateApplicationUser
        };

        /**
         * @description Opens dialog for add new application user
         * @param $event
         */
        self.openAddApplicationUserDialog = function ($event) {
            applicationUserService
                .controllerMethod
                .applicationUserAdd(jobTitles, organizations, classifications, themes, roles, permissions, ouApplicationUsers, userClassificationViewPermissions, null, $event)
                .then(function () {
                    self.reloadApplicationUsers(self.grid.page);
                })
                .catch(function () {
                    self.reloadApplicationUsers(self.grid.page);
                });
        };

        /**
         * @description Opens dialog for edit application user
         * @param $event
         * @param {ApplicationUser} applicationUser
         */
        self.openEditApplicationUserDialog = function (applicationUser, $event) {
            applicationUserService
                .controllerMethod
                .applicationUserEdit(applicationUser, jobTitles, organizations, classifications, themes, roles, permissions, ouApplicationUsers, userClassificationViewPermissions, null, $event)
                .then(function (result) {
                    self.reloadApplicationUsers(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getNames()}));
                        });
                });
        };

        /**
         * @description Reload the grid of application user
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadApplicationUsers = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return applicationUserService
                .loadApplicationUsers()
                .then(function (result) {
                    self.applicationUsers = result;
                    self.selectedApplicationUsers = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Delete single application user
         * @param applicationUser
         * @param $event
         */
        self.removeApplicationUser = function (applicationUser, $event) {
            applicationUserService
                .controllerMethod
                .applicationUserDelete(applicationUser, $event)
                .then(function () {
                    self.reloadApplicationUsers(self.grid.page);
                });
        };

        /**
         * @description Delete multiple selected application users
         * @param $event
         */
        self.removeBulkApplicationUsers = function ($event) {
            applicationUserService
                .controllerMethod
                .applicationUserDeleteBulk(self.selectedApplicationUsers, $event)
                .then(function () {
                    self.reloadApplicationUsers(self.grid.page);
                    /* .then(function () {
                         toast.success(langService.get("delete_success"));
                     });*/
                });
        };

        /**
         * @description Change the status of application user
         * @param applicationUser
         */
        self.changeStatusApplicationUser = function (applicationUser) {
            self.statusServices[applicationUser.status](applicationUser)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    applicationUser.status = !applicationUser.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected application users
         * @param status
         */
        self.changeStatusBulkApplicationUsers = function (status) {
            self.statusServices[status](self.selectedApplicationUsers)
                .then(function () {
                    self.reloadApplicationUsers(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('selected_status_updated'));
                        });
                });
        };
    });
};