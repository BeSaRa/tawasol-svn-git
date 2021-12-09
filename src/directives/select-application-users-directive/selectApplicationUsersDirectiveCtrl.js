module.exports = function (app) {
    app.controller('selectApplicationUsersDirectiveCtrl', function (_,
                                                                    $q,
                                                                    dialog,
                                                                    $scope,
                                                                    LangWatcher,
                                                                    langService,
                                                                    $timeout,
                                                                    ApplicationUser,
                                                                    distributionWFService,
                                                                    applicationUserService) {
        'ngInject';
        var self = this;
        self.controllerName = 'selectApplicationUsersDirectiveCtrl';
        LangWatcher($scope);

        self.selectedOrganization = null;
        self.searchedUsers = [];
        self.searchText = '';

        self.inlineOuSearchText = '';

        self.availableSearchCriteria = [
            {key: 'loginName', value: 'login_name'},
            {key: 'employeeNo', value: 'employee_number'},
            {key: 'organizationUnit', value: 'organization_unit'},
            {key: 'arFullName', value: 'arabic_name'},
            {key: 'enFullName', value: 'english_name'}
        ];
        // search By field
        self.searchBy = self.availableSearchCriteria[0];

        /**
         * @description Change Search By
         * @param $event
         */
        self.changeSearchBy = function ($event) {
            self.selectedOrganization = null;

            if (self.searchBy && self.searchBy.key === 'organizationUnit') {
                distributionWFService
                    .loadDistWorkflowOrganizations('organizations')
                    .then(function (result) {
                        self.organizations = result;
                        self.searchedUsers = [];
                    })
            } else {
                self.searchedUsers = [];
                self.organizations = [];
                self.searchText = '';
            }
        };

        /**
         * @description Load application users by selected organization
         * @param $event
         * @returns {*}
         */
        self.loadUsersByOU = function ($event) {
            if (self.selectedOrganization) {
                return distributionWFService
                    .searchUsersByCriteria({ou: self.selectedOrganization})
                    .then(function (result) {
                        self.searchedUsers = result;
                    });
            } else {
                self.searchedUsers = [];
            }
        };

        /**
         * @description Search inside users loaded by OU
         * @param searchText
         * @returns {Array}
         */
        self.searchUsersByOU = function (searchText) {
            if (!searchText) {
                return _.filter(self.searchedUsers, function (user) {
                    return (!self.userExists(user))
                });
            } else {
                searchText = searchText.toLowerCase();
                return _.filter(self.searchedUsers, function (user) {
                    if (user.arName.indexOf(searchText) > -1
                        || user.enName.toLowerCase().indexOf(searchText) > -1
                        || user.domainName.toLowerCase().indexOf(searchText) > -1) {

                        return (!self.userExists(user));
                    }
                });
            }
        };

        /**
         * @description search for application users.
         * @param searchText
         * @returns {Promise|applicationUsers}
         */
        self.searchApplicationUsers = function (searchText) {
            if (!pendingSearch || !debounceSearch()) {
                cancelSearch();
                return pendingSearch = $q(function (resolve, reject) {
                    cancelSearch = reject;
                    $timeout(function () {
                        applicationUserService
                            .findUsersByText(searchText, self.searchBy).then(function (result) {
                            refreshDebounce();
                            resolve(_.filter(result, function (applicationUser) {
                                return !self.userExists(applicationUser);
                            }));
                        });
                    }, 500);
                });
            }
            return pendingSearch;
        };

        /**
         * @description Check if user already exists
         * @param applicationUser
         */
        self.userExists = function (applicationUser) {
            return _.find(self.existingUsers, function (existingUser) {
                return applicationUser.id === (existingUser ? existingUser.id : null);
            });
        };

        /**
         * @description Add to list or save user when selected
         * @param user
         */
        self.applicationUserSelected = function (user) {
            if (user) {
                if (!(user instanceof ApplicationUser)) {
                    user = new ApplicationUser({
                        id: user.id,
                        arFullName: user.arName,
                        enFullName: user.enName,
                        domainName: user.domainName
                    })
                }
                // if add mode, push the user to array
                if (!self.editMode) {
                    _addToArray(user);
                    self.searchText = '';
                } else {
                    // if save callback is available, call method and show success message and push the user to existingUsers
                    // else push the user to array
                    if (self.saveCallback)
                        self.saveCallback(user)
                            .then(function () {
                                self.searchText = '';
                                _addToArray(user);
                            });
                    else {
                        _addToArray(user);
                        self.searchText = '';
                    }
                }
            }
        };

        /**
         * @description Removes the selected User from list
         * @param user
         */
        self.deleteUser = function (user) {
            if (user && self.allowDelete) {
                dialog.confirmMessage(langService.get('confirm_delete').change({name: user.getTranslatedName()}))
                    .then(function () {
                        // if delete callback exists, call the method and show success message and remove the user from existingUsers.
                        if (!self.deleteCallback) {
                            _removeFromArray(user);
                        } else {
                            self.deleteCallback(user)
                                .then(function () {
                                    _removeFromArray(user);
                                    self.searchText = '';
                                });
                        }
                    });
            }
        };

        var _addToArray = function (user) {
            if (!self.userExists(user))
                self.existingUsers.push(user);
        };
        var _removeFromArray = function (user) {
            var index = _.findIndex(self.existingUsers, function (existingUser) {
                return existingUser.id === user.id;
            });
            if (index > -1)
                self.existingUsers.splice(index, 1);
        };


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

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };

        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of dropdown
         * @param $event
         */
        self.preventSearchKeyDown = function ($event) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                if (code !== 38 && code !== 40)
                    $event.stopPropagation();
            }
        };

    });
};
