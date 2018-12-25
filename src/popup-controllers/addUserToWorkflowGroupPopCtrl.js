module.exports = function (app) {
    app.controller('addUserToWorkflowGroupPopCtrl', function (UserSearchCriteria,
                                                              employeeService,
                                                              distributionWFService,
                                                              dialog,
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

            /**
             * @description Close the dialog and sends the selected users
             */
            self.addToWorkflowGroup = function () {
                dialog.hide(self.selectedUsers);
            };


            self.closeAddToWorkflowGroupPopupFromCtrl = function () {
                dialog.cancel();
            }
        }
    )
};