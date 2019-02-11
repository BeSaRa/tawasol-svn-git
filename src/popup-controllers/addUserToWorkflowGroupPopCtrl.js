module.exports = function (app) {
    app.controller('addUserToWorkflowGroupPopCtrl', function (UserSearchCriteria,
                                                              employeeService,
                                                              distributionWFService,
                                                              dialog,
                                                              _,
                                                              langService,
                                                              ouApplicationUserService,
                                                              DistributionUserWFItem,
                                                              groupMembers,
                                                              generator,
                                                              isUserPreference,
                                                              organizationGroups,
                                                              $filter) {
            'ngInject';
            var self = this;

            self.controllerName = 'addUserToWorkflowGroupPopCtrl';
            self.organizationGroups = organizationGroups;


            self.usersCriteria = new UserSearchCriteria({
                ou: (self.organizationGroups.length ? _.find(self.organizationGroups, function (item) {
                    return item.id === employeeService.getEmployee().getOUID()
                }) : employeeService.getEmployee().getOUID()),
                hide: !self.organizationGroups.length
            });


            //self.users = distUsers;
            self.selectedUsers = [];
            self.users = [];
            self.onSearchUsers = function () {
                return distributionWFService
                    .searchUsersByCriteria(self.usersCriteria)
                    .then(function (result) {
                        self.users = _mapWFUser(result);
                        self.selectedUsers = [];
                    });
            };

            self.onSearchUsers();

            self.searchedUsersGrid = {
                limit: 5, //self.globalSetting.searchAmount, // default limit
                page: 1, // first page
                order: '', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.users.length + 21);
                        }
                    }
                ]
            };

            /**
             * @description Gets the grid records by sorting
             */
            self.getSortedData = function () {
                self.users = $filter('orderBy')(self.users, self.searchedUsersGrid.order);
            };

            /**
             * @description Get the sorting key for information or lookup model
             * @param property
             * @param modelType
             * @returns {*}
             */
            self.getSortingKey = function (property, modelType) {
                if (property === 'organization')
                    return 'ou' + (langService.currentLangTitleCase) + 'Name';
                return generator.getColumnSortingKey(property, modelType);
            };

            /**
             * @description map the WFUser to be dist user.
             * @param collection
             * @returns {Array}
             * @private
             */
            function _mapWFUser(collection) {
                return _.map(collection, function (workflowUser) {
                    return (new DistributionUserWFItem()).mapFromWFUser(workflowUser);
                });
            }

            /**
             * @description Check if the searched user is already added to the group members list
             * @param user
             * @returns {boolean}
             */
            self.checkIfExist = function (user) {
                return !!_.find(groupMembers, function (groupMember) {
                    return groupMember.applicationUser.id === user.toUserId
                        && groupMember.ouid.id === user.appUserOUID;
                });
            };
            self.checkIfAdded = function (user) {
                return !!_.find(self.addedUsers, function (addedUser) {
                    return addedUser.toUserId === user.toUserId
                        && addedUser.appUserOUID === user.appUserOUID;
                });
            };

            /**
             * @description Close the dialog and sends the added users to save
             */
            self.addToWorkflowGroup = function () {
                dialog.hide(self.addedUsers);
            };


            self.closeAddToWorkflowGroupPopupFromCtrl = function () {
                dialog.cancel();
            };

            self.addedUsers = [];
            self.selectedAddedUsers = [];
            self.addedUsersGrid = {
                limit: 5, //self.globalSetting.searchAmount, // default limit
                page: 1, // first page
                order: '', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.addedUsers.length + 21);
                        }
                    }
                ]
            };
            /**
             * @description Gets the grid records by sorting
             */
            self.getSortedDataAddedUsers = function () {
                self.addedUsers = $filter('orderBy')(self.addedUsers, self.addedUsersGrid.order);
            };

            self.addSelectedUsers = function () {
                self.addedUsers = self.addedUsers.concat(angular.copy(self.selectedUsers));
                self.selectedUsers = [];
            };

            self.removeAddedUser = function (user) {
                dialog.confirmMessage(langService.get('confirm_delete').change({name: user.getTranslatedName()}))
                    .then(function () {
                        var index = _.findIndex(self.addedUsers, function (addedUser) {
                            return addedUser.toUserId === user.toUserId
                                && addedUser.appUserOUID === user.appUserOUID
                        });
                        self.addedUsers.splice(index, 1);
                    })
            };

        /**
         * @description Get the search results grid total count
         * @returns {number}
         */
        self.getSearchedUsersGridTotal = function () {
                return _.filter(self.users, function (user) {
                    return !self.checkIfExist(user) && !self.checkIfAdded(user);
                }).length;
            }


        }
    )
};