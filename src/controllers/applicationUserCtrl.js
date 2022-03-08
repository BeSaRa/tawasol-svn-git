module.exports = function (app) {
    app.controller('applicationUserCtrl', function (lookupService,
                                                    applicationUserService,
                                                    applicationUsers,
                                                    // ouApplicationUsers,
                                                    $q,
                                                    $filter,
                                                    langService,
                                                    toast,
                                                    dialog,
                                                    contextHelpService,
                                                    employeeService,
                                                    gridService,
                                                    applicationUsersCount) {
        'ngInject';
        var self = this;
        self.controllerName = 'applicationUserCtrl';

        contextHelpService.setHelpTo('application-users');
        /**
         * @description All application users
         * @type {*}
         */
        self.applicationUsers = applicationUsers;
        self.applicationUsersCopy = angular.copy(self.applicationUsers);
        self.totalRecords = applicationUserService.totalCount;
        /**
         * @description Current logged in applicationUser
         * @type {*}
         */
        self.currentEmployee = employeeService.getEmployee();
        self.applicationUsersCount = applicationUsersCount;
        /**
         * @description Contains the selected application users
         * @type {Array}
         */
        self.selectedApplicationUsers = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.applicationUser) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.applicationUser, self.totalRecords),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.applicationUser, limit);
                self.reloadApplicationUsers(page)
            },
            searchColumns: {
                arabicName: 'arFullName',
                englishName: 'enFullName',
                loginName: 'loginName',
                domainName: 'domainName',
                employeeNo: 'employeeNo'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.applicationUsers = gridService.searchGridData(self.grid, self.applicationUsersCopy);
            }
        };

        self.searchMode = false;

        self.searchModel = '';

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
                .applicationUserAdd($event)
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
                .applicationUserEdit(applicationUser, $event)
                .then(function (result) {
                    if (self.searchModel) {
                        toast.success(langService.get('edit_success').change({name: result.getNames()}));
                        self.searchInApplicationUser(self.searchModel);
                    } else {
                        self.reloadApplicationUsers(self.grid.page)
                            .then(function () {
                                toast.success(langService.get('edit_success').change({name: result.getNames()}));
                            });
                    }
                });
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.applicationUsers = $filter('orderBy')(self.applicationUsers, self.grid.order);
        };

        self.cancelSearchFilter = function () {
            self.searchMode = false;
            self.searchModel = '';
            self.grid.page = 1;
            self.grid.searchText = '';
            self.grid.searchText = '';
            self.reloadApplicationUsers();
        }

        /**
         * @description Reload the grid of application user
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadApplicationUsers = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return applicationUserService
                .loadApplicationUsersView(self.grid.page, self.grid.limit, self.searchModel)
                .then(function (result) {
                    self.applicationUsers = result;
                    self.applicationUsersCopy = angular.copy(self.applicationUsers);
                    self.totalRecords = applicationUserService.totalCount;

                    self.selectedApplicationUsers = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        self.searchInApplicationUser = function (searchText) {
            if (!searchText)
                return;
            self.searchMode = true;
            return self
                .reloadApplicationUsers(1)
                .then(function (result) {
                    self.applicationUsers = result;
                })
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

        self.exportApplicationUsers = function ($event) {
            applicationUserService.exportApplicationUsers().then(function (result) {
                window.open(result);
            })
        };
    });
};
