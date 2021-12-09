module.exports = function (app) {
    app.controller('selectApplicationUserPopCtrl', function (dialog,
                                                             label,
                                                             applicationUsers,
                                                             applicationUserService,
                                                             ApplicationUser,
                                                             $timeout,
                                                             langService,
                                                             organizationService,
                                                             $q,
                                                             _,
                                                             singleMode) {
        'ngInject';
            var self = this;
            self.controllerName = 'selectApplicationUserPopCtrl';
            // to check if single mode.
            self.singleMode = singleMode;
            // label for popup
            self.label = label;
            // all selected application Users
            self.applicationUsers = applicationUsers || [];
            // to disable the search text after rich the max value of users needs.
            self.isDisabled = !!(self.singleMode && self.applicationUsers.length);
            // current selected application user.
            self.applicationUser = null;
            // all available search criteria
            self.availableSearchCriteria = [
                {key: 'loginName', value: 'login_name'},
                {key: 'employeeNo', value: 'employee_number'},
                {key: 'organizationUnit', value: 'organization_unit'},
                {key: 'arFullName', value: 'arabic_name'},
                {key: 'enFullName', value: 'english_name'}
                // {key: 'customRole', value: 'role'}
            ];
            self.hasChanges = false;

            // search By field
            self.searchBy = self.availableSearchCriteria[0]; // login name by default.

            // some variables to debounce the search text
            var pendingSearch, cancelSearch = angular.noop, lastSearch;

            function refreshDebounce() {
                lastSearch = 0;
                pendingSearch = null;
                cancelSearch = angular.noop;
            }

            /**
             * Debounce if querying faster than 300ms
             */
            function debounceSearch() {
                var now = new Date().getMilliseconds();
                lastSearch = lastSearch || now;

                return ((now - lastSearch) < 300);
            }

            self.userExists = function (applicationUser) {
                return _.find(self.applicationUsers, function (appUser) {
                    return applicationUser.id === (appUser ? appUser.id : null);
                });
            };
            /**
             * @description search for application users.
             * @param searchText
             * @returns {Promise|applicationUsers}
             */
            self.querySearch = function (searchText) {

                if (!pendingSearch || !debounceSearch()) {
                    cancelSearch();

                    return pendingSearch = $q(function (resolve, reject) {
                        cancelSearch = reject;
                        $timeout(function () {
                            applicationUserService
                                .findUsersByText(searchText, self.searchBy).then(function (result) {
                                refreshDebounce();
                                resolve(_.filter(result, function (ApplicationUser) {
                                    return !self.userExists(ApplicationUser);
                                }));
                            });
                        }, 500);
                    })
                }
                return pendingSearch;
            };
            /**
             * @description filter result that came from backend
             * @param result
             * @param searchText
             * @return {Array}
             */
            self.filterResult = function (result, searchText) {
                return _.filter(result, function (user) {
                    return hasCriteria(user, searchText);
                });
            };

            // service-request: get custom role for user inside the userApplication body
            self.customRoleName = function (applicationUser) {

            };
            /**
             * @description after select user from auto complete
             * @param applicationUser
             */
            self.applicationUserSelected = function (applicationUser) {
                if (applicationUser)
                    self.applicationUsers.push(applicationUser);
                self.applicationUser = null;
                self.hasChanges = true;
                self.checkDisableMode();
            };
            /**
             * check if disabled
             */
            self.checkDisableMode = function () {
                self.isDisabled = !!(self.singleMode && self.applicationUsers.length);
            };
            /**
             * remove applicationUser from the grid
             * @param applicationUser
             */
            self.removeUser = function (applicationUser) {
                var index = self.applicationUsers.indexOf(applicationUser);
                self.applicationUsers.splice(index, 1);
                self.hasChanges = true;
                self.checkDisableMode();
            };
            /**
             * close dialog
             */
            self.close = function () {
                if (!self.applicationUsers.length) {
                    self.checkUserSelected();
                } else if (self.applicationUsers.length && self.hasChanges) {
                    self.warnUserToSaveChanges();
                } else {
                    dialog.cancel(self.applicationUsers);
                }
            };
            /**
             * warn user to save his changes before close the dialog.
             */
            self.warnUserToSaveChanges = function () {
                dialog
                    .confirmMessage(langService.get('sure_you_leave_without_save_changes'))
                    .then(function () {
                        dialog.cancel();
                    });
            };
            /**
             * save selected users
             */
            self.saveSelectedUsers = function () {

                if (self.checkUserSelected())
                    return;

                if (self.singleMode)
                    dialog.hide(self.applicationUsers[0]);
                else
                    dialog.hide(self.applicationUsers);

            };
            /**
             * check and confirm that user need to close the dialog
             */
            self.checkUserSelected = function () {
                if (!self.applicationUsers.length) {
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
