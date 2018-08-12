module.exports = function (app) {
    app.controller('selectOUApplicationUserSinglePopCtrl', function (dialog,
                                                                     label,
                                                                     ouApplicationUser,
                                                                     ouApplicationUsers,
                                                                     ouApplicationUserService,
                                                                     ApplicationUser,
                                                                     OUApplicationUser,
                                                                     Organization,
                                                                     $timeout,
                                                                     langService,
                                                                     $q,
                                                                     $filter,
                                                                     generator,
                                                                     _) {
            'ngInject';
            var self = this;
            self.controllerName = 'selectOUApplicationUserSinglePopCtrl';

            self.progress = null;

            // label for popup
            self.label = label;
            // all selected application Users
            self.ouApplicationUsers = ouApplicationUsers;

            // current selected application user.
            self.ouApplicationUser = ouApplicationUser;
            self.ouApplicationUserCopy = angular.copy(self.ouApplicationUser);

            self.ouApplicationUserSelected = self.ouApplicationUser ? _.filter(self.ouApplicationUsers, function (ouAppUser) {
                return ouAppUser.applicationUser.id === self.ouApplicationUser.id
            }) : [];


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
                limit: 5, // default limit
                page: 1, // first page
                order: '', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.ouApplicationUsers.length + 21);
                        }
                    }
                ],
                filter: {search: {}}
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
                dialog.hide(self.ouApplicationUserSelected[0].applicationUser);

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
