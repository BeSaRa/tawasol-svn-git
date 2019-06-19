module.exports = function (app) {
    app.controller('administratorsCtrl', function ($q,
                                                   _,
                                                   $filter,
                                                   langService,
                                                   toast,
                                                   dialog,
                                                   contextHelpService,
                                                   employeeService,
                                                   gridService,
                                                   administratorService) {
        'ngInject';
        var self = this;
        self.controllerName = 'administratorsCtrl';
        contextHelpService.setHelpTo('administrators');

        self.administrators = administratorService.administrators;
        self.administratorsCopy = angular.copy(self.administrators);
        self.selectedAdministrators = [];
        self.recordTypeOptions = [
            {key: 'all', value: 0},
            {key: 'super_admin', value: 1},
            {key: 'admin', value: 2},
        ];
        self.showRecordType = 0;

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.administrators) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.administrators, self.administrators),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.administrators, limit);
            },
            searchColumns: {
                arName: 'userInfo.arName',
                enName: 'userInfo.enName'
            },
            searchText: '',
            searchCallback: function () {
                self.administrators = gridService.searchGridData(self.grid, self.administratorsCopy);
            }
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.administrators = $filter('orderBy')(self.administrators, self.grid.order);
        };

        /**
         * @description Filters the administrators depending on super admin, admin or all
         * @param $event
         */
        self.filterAdministratorRecords = function ($event) {
            if (self.showRecordType === 0) {
                self.administrators = angular.copy(self.administratorsCopy);
            } else {
                self.administrators = _.filter(self.administratorsCopy, function (administrator) {
                    return administrator.isSuperAdmin === (self.showRecordType === 1);
                })
            }
        };

        /**
         * @description Reload the grid of administrators
         * @param pageNumber
         * @returns {Promise<any>}
         */
        self.reloadAdministrators = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return administratorService
                .loadAllAdministrators()
                .then(function (result) {
                    self.administratorsCopy = angular.copy(result);
                    self.filterRecords();
                    self.selectedAdministrators = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Opens dialog for add new administrator
         * @param $event
         */
        self.openAddAdministratorDialog = function ($event) {
            administratorService.controllerMethod
                .openAddDialog($event)
                .then(function (result) {
                    self.reloadAdministrators(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('save_success'));
                        });
                })
        };

        /**
         * @description Opens dialog for edit administrator
         * @param record
         * @param $event
         */
        self.openEditAdministratorDialog = function (record, $event) {
            return administratorService.controllerMethod
                .openEditDialog(record, $event)
                .then(function (result) {
                    return self.reloadAdministrators(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('save_success'));
                            return true;
                        });
                })
        };

        /**
         * @description Handles the change of isSuperAdmin switch in grid
         * It will contain the new value of isSuperAdmin property
         * @param record
         * @param $event
         */
        self.onChangeIsSuperAdmin = function (record, $event) {
            // on change from admin to super admin
            if (record.isSuperAdmin) {
                dialog.confirmMessage(langService.get('confirm_change_admin_to_super_admin'))
                    .then(function (result) {
                        administratorService.saveAdministrator(record)
                            .then(function () {
                                toast.success(langService.get('save_success'));
                            });
                    })
                    .catch(function (error) {
                        record.isSuperAdmin = false;
                        return false;
                    })
            } else {
                // on change from super admin to admin
                self.openEditAdministratorDialog(record, $event)
                    .catch(function () {
                        record.isSuperAdmin = true;
                        return false;
                    });
            }
        };

        self.openAdminOUsDialog = function (record, $event) {
            administratorService.controllerMethod
                .openAdminOrganizationsDialog(record);
        };
    });
};
