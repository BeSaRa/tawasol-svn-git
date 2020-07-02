module.exports = function (app) {
    app.controller('selectOUApplicationUsersPopCtrl', function (dialog,
                                                                label,
                                                                ouApplicationUsers,
                                                                ouApplicationUserService,
                                                                ApplicationUser,
                                                                OUApplicationUser,
                                                                Organization,
                                                                $timeout,
                                                                langService,
                                                                isUserPreference,
                                                                applicationUserService,
                                                                organizationService,
                                                                $q,
                                                                _,
                                                                singleMode,
                                                                organizations) {
            'ngInject';
            var self = this;
            self.controllerName = 'selectOUApplicationUsersPopCtrl';
            // to check if single mode.
            self.singleMode = singleMode;
            // label for popup
            self.label = label;
            // all selected application Users
            self.ouApplicationUsers = ouApplicationUsers || [];

            self.isUserPreference = isUserPreference;

            // current selected application user.
            self.ouApplicationUser = null;
            // all available search criteria
            self.availableSearchCriteria = [
                {key: 'loginName', value: 'login_name'},
                {key: 'domainName', value: 'domain_name'},
                {key: 'arFullName', value: 'arabic_name'},
                {key: 'enFullName', value: 'english_name'}
            ];

            self.organizations = organizations; //organizationService.organizations;

            self.selectedOu = (self.organizations && self.organizations.length) ? self.organizations[0].id : null;

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

            self.userExists = function (ouApplicationUser) {
                return _.find(self.ouApplicationUsers, function (ouAppUser) {
                    return (ouApplicationUser.applicationUser.id === (ouAppUser.applicationUser ? ouAppUser.applicationUser.id : null)) &&
                        ouApplicationUser.ouid.id === (ouAppUser.ouid ? ouAppUser.ouid.id : null);
                });
            };

            function _mapFromApplicationUserInfo(item) {
                item = new OUApplicationUser({
                    applicationUser: new ApplicationUser({
                        id: item.id,
                        domainName: item.domainName,
                        arFullName: item.arName,
                        enFullName: item.enName
                    }),
                    ouid: new Organization({
                        id: item.ouId,
                        arName: item.ouArName,
                        enName: item.ouEnName
                    })
                });
                return item;
            }

            function _selectServiceWithCriteria() {
                var service = isUserPreference ? applicationUserService : ouApplicationUserService;
                var method = isUserPreference ? 'findApplicationUserByOneCriteria' : 'findUsersByText';
                var map = isUserPreference ? _mapFromApplicationUserInfo : angular.identity;
                return service[method].apply(service, arguments).then(function (result) {
                    return _.map(result, map);
                });
            }

            /**
             * @description search for application users.
             * @param searchText
             * @returns {Promise|applicationUsers}
             */
            self.querySearch = function () {

                if (!pendingSearch || !debounceSearch()) {
                    cancelSearch();

                    return pendingSearch = $q(function (resolve, reject) {
                        cancelSearch = reject;
                        $timeout(function () {
                            _selectServiceWithCriteria(self.searchText, self.searchBy, self.selectedOu).then(function (result) {
                                refreshDebounce();
                                resolve(_.filter(result, function (ouApplicationUser) {
                                    return !self.userExists(ouApplicationUser);
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
             * @param ouApplicationUser
             */
            self.applicationUserSelected = function (ouApplicationUser) {
                if (ouApplicationUser)
                    self.ouApplicationUsers.push(ouApplicationUser);
                self.ouApplicationUser = null;
                self.hasChanges = true;
            };
            /**
             * check if disabled
             */
            self.checkDisableMode = function () {
                return !!(self.singleMode && self.ouApplicationUsers.length);
            };

            /**
             * remove applicationUser from the grid
             * @param ouApplicationUser
             */
            self.removeUser = function (ouApplicationUser) {
                var index = self.ouApplicationUsers.indexOf(ouApplicationUser);
                self.ouApplicationUsers.splice(index, 1);
                self.hasChanges = true;
            };
            /**
             * close dialog
             */
            self.close = function () {
                if (!self.ouApplicationUsers.length) {
                    self.checkUserSelected();
                } else if (self.ouApplicationUsers.length && self.hasChanges) {
                    self.warnUserToSaveChanges();
                } else {
                    dialog.cancel(self.ouApplicationUsers);
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
            self.saveSelectedOuUsers = function () {
                if (self.checkUserSelected())
                    return;

                if (self.singleMode)
                    dialog.hide(self.ouApplicationUsers[0]);
                else
                    dialog.hide(self.ouApplicationUsers);

            };
            /**
             * check and confirm that user need to close the dialog
             */
            self.checkUserSelected = function () {
                if (!self.ouApplicationUsers.length) {
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
