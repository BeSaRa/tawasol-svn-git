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
                                                              isAdminAssigned,
                                                              workflowGroup,
                                                              organizationGroups,
                                                              $filter,
                                                              userWorkflowGroupService,
                                                              Information) {
            'ngInject';
            var self = this;

            self.controllerName = 'addUserToWorkflowGroupPopCtrl';
            self.inlineOUSearchText = '';
            self.workflowGroup = workflowGroup;

            var _mapRegOUSections = function () {
                // filter all regOU (has registry)
                var regOus = _.filter(organizationGroups, function (ou) {
                        return ou.hasRegistry;
                    }),
                    // filter all sections (no registry)
                    sections = _.filter(organizationGroups, function (ou) {
                        return !ou.hasRegistry;
                    }),
                    // registry parent organization
                    parentRegistryOu;

                // To show (regou - section), append the dummy property "tempRegOUSection"
                regOus = _.map(regOus, function (regOu) {
                    regOu.tempRegOUSection = new Information({
                        arName: regOu.arName,
                        enName: regOu.enName
                    });
                    return regOu;
                });
                sections = _.map(sections, function (section) {
                    parentRegistryOu = (section.regouId || section.regOuId);
                    if (typeof parentRegistryOu === 'number') {
                        parentRegistryOu = _.find(organizationGroups, function (ou) {
                            return ou.id === parentRegistryOu;
                        });
                    }

                    section.tempRegOUSection = new Information({
                        arName: ((parentRegistryOu) ? parentRegistryOu.arName + ' - ' : '') + section.arName,
                        enName: ((parentRegistryOu) ? parentRegistryOu.enName + ' - ' : '') + section.enName
                    });
                    return section;
                });

                // sorting from BE based on user selection (alphabetical or by org structure)
                return [].concat(regOus, sections)
            };

            self.organizationGroups = _mapRegOUSections();//organizationGroups;

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
                if (property === 'organization') {
                    return langService.current + 'OUName';
                    // return 'ou' + (langService.currentLangTitleCase) + 'Name';
                }
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
                    if (isAdminAssigned) {
                        return groupMember.applicationUser.id === user.toUserId;
                    } else {
                        return groupMember.applicationUser.id === user.toUserId
                            && groupMember.ouid.id === user.appUserOUID;
                    }
                });
            };
            self.checkIfAdded = function (user) {
                return !!_.find(self.addedUsers, function (addedUser) {
                    if (isAdminAssigned) {
                        return addedUser.toUserId === user.toUserId;
                    } else {
                        return addedUser.toUserId === user.toUserId
                            && addedUser.appUserOUID === user.appUserOUID;
                    }
                });
            };

            /**
             * @description Close the dialog and sends the added users to save
             */
            self.addToWorkflowGroup = function () {
                if (isAdminAssigned) {
                    var applicationUserIds = _.map(self.addedUsers, 'toUserId');
                    var groupMembersId = _.map(groupMembers, function (member) {
                        return member.applicationUser.id;
                    });
                    userWorkflowGroupService.addBulkUserWorkflowGroup(self.workflowGroup, applicationUserIds.concat(groupMembersId))
                        .then(function (result) {
                            dialog.hide(self.addedUsers);
                        });
                } else {
                    dialog.hide(self.addedUsers);
                }
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
            };


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

        }
    )
};
