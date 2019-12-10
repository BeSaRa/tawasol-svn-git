module.exports = function (app) {
    app.controller('selectEscalationUserPopCtrl', function (langService,
                                                            organizationService,
                                                            $q,
                                                            dialog,
                                                            escalationUsers,
                                                            gridService,
                                                            employeeService,
                                                            $timeout,
                                                            $filter,
                                                            generator,
                                                            _) {
        'ngInject';
        var self = this;
        self.controllerName = 'selectEscalationUserPopCtrl';
        self.currentEmployee = employeeService.getEmployee();
        self.escalationUsers = _.filter(escalationUsers, function (user) {
            return self.currentEmployee.id !== user.id
        });
        self.escalationUsersCopy = angular.copy(self.escalationUsers);

        self.selectedEscalationUser = [];

        $timeout(function () {
            if (self.escalationUserId) {
                var escalationUserId = self.escalationUserId.hasOwnProperty('id') ? self.escalationUserId.id : self.escalationUserId;

                self.selectedEscalationUser = _.filter(self.escalationUsers, function (wfUser) {
                    return wfUser.id === escalationUserId;
                })
            }

        });

        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.escalationUsers.length + 21);
                    }
                }
            ],
            searchColumns: {
                arabicName: 'arName',
                englishName: 'enName',
                domainName: 'domainName',
            },
            searchText: '',
            searchCallback: function (grid) {
                self.escalationUsers = gridService.searchGridData(self.grid, self.escalationUsersCopy);
            }
        };

        self.selectEscalationUser = function ($event) {
            dialog.hide(self.selectedEscalationUser[0]);
        };

        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function (property, modelType) {
            if (property === 'ou') {
                return 'ou' + generator.ucFirst(langService.current) + 'Name';
            } else if (property === 'user') {
                return langService.current + 'Name';
            }
            return generator.getColumnSortingKey(property, modelType);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.escalationUsers = $filter('orderBy')(self.escalationUsers, self.grid.order);
        };

        /**
         * close dialog
         */
        self.closeSelectEscalationUser = function () {
            dialog.cancel();
        };

    });
};
