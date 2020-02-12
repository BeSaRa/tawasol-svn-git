module.exports = function (app) {
    app.controller('selectOUApplicationUserSinglePopCtrl', function (dialog,
                                                                     label,
                                                                     applicationUser,
                                                                     ouApplicationUsers,
                                                                     ouApplicationUserService,
                                                                     ApplicationUser,
                                                                     OUApplicationUser,
                                                                     Organization,
                                                                     isViceManager,
                                                                     $timeout,
                                                                     langService,
                                                                     $q,
                                                                     $filter,
                                                                     generator,
                                                                     gridService,
                                                                     _) {
            'ngInject';
            var self = this;
            self.controllerName = 'selectOUApplicationUserSinglePopCtrl';

            // label for popup
            self.label = label;
            // all selected application Users
            self.ouApplicationUsers = ouApplicationUsers;
            self.ouApplicationUsersCopy = angular.copy(self.ouApplicationUsers);

            self.isViceManager = isViceManager;
            // current selected application user.
            self.ouApplicationUser = applicationUser;

            self.ouApplicationUserSelected = self.ouApplicationUser ? _.filter(self.ouApplicationUsers, function (ouAppUser) {
                return ouAppUser.applicationUser.id === self.ouApplicationUser.id
            }) : [];
            self.isAddManagerToAllUsersEnabled = false;

            /**
             * @description Get the sorting key for information or lookup model
             * @param property
             * @param modelType
             * @returns {*}
             */
            self.getSortingKey = function (property, modelType) {
                if (property === 'applicationUser') {
                    return property + '.' + (langService.current === 'ar' ? 'arFullName' : 'enFullName');
                }
            };

            /**
             * @description Gets the grid records by sorting
             */
            self.getSortedData = function () {
                self.ouApplicationUsers = $filter('orderBy')(self.ouApplicationUsers, self.grid.order);
            };

            /**
             * @description Contains options for grid configuration
             * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
             */
            self.grid = {
                progress: null,
                limit: 5, // default limit
                page: 1, // first page
                order: '', // default sorting order
                limitOptions: [5, 10, 20,
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.ouApplicationUsers.length + 21);
                        }
                    }
                ],
                searchColumns: {
                    applicationUser: function () {
                        return self.getSortingKey('applicationUser', 'ApplicationUser');
                    },
                    loginName: 'applicationUser.loginName',
                    domainName: 'applicationUser.domainName'
                    //employeeNo: 'employeeNo'
                },
                searchText: '',
                searchCallback: function (grid) {
                    self.ouApplicationUsers = gridService.searchGridData(self.grid, self.ouApplicationUsersCopy);
                }
            };

            /**
             * close dialog
             */
            self.close = function () {
                dialog.cancel();
            };

            /**
             * save selected users
             */
            self.saveSelectedOuUser = function () {
                if (self.checkUserSelected())
                    return;

                var applicationUser = {
                    applicationUser: self.ouApplicationUserSelected[0].applicationUser,
                    isAddManagerToAllUsersEnabled: self.isAddManagerToAllUsersEnabled
                };

                dialog.hide(applicationUser);

            };
            /**
             * check and confirm that user need to close the dialog
             */
            self.checkUserSelected = function () {
                if (!self.ouApplicationUserSelected.length) {
                    return dialog
                        .confirmMessage(langService.get('confirm_leave_select_user'))
                        .then(function () {
                            dialog.cancel();
                        });
                }
            }

        }
    );
};
