module.exports = function (app) {
    app.service('userWorkflowGroupService', function (urlService,
                                                      $http,
                                                      errorCode,
                                                      $q,
                                                      generator,
                                                      UserWorkflowGroup,
                                                      _,
                                                      dialog,
                                                      langService,
                                                      toast,
                                                      cmsTemplate,
                                                      WorkflowGroup) {
        'ngInject';
        var self = this;
        self.serviceName = 'userWorkflowGroupService';

        self.userWorkflowGroups = [];

        /**
         * @description Load the user workflow groups from server.
         * @returns {Promise|userWorkflowGroups}
         */
        self.loadUserWorkflowGroups = function () {
            return $http.get(urlService.userWorkflowGroups).then(function (result) {
                self.userWorkflowGroups = generator.generateCollection(result.data.rs, UserWorkflowGroup, self._sharedMethods);
                self.userWorkflowGroups = generator.interceptReceivedCollection('UserWorkflowGroup', self.userWorkflowGroups);
                return self.userWorkflowGroups;
            })
                .catch(function (error) {
                    return errorCode.checkIf(error, 'EMPTY_RESULT', function () {
                        return $q.resolve([]);
                    })
                });
        };

        /**
         * @description Get user workflow groups from self.userWorkflowGroups if found and if not load it from server again.
         * @returns {Promise|userWorkflowGroups}
         */
        self.getUserWorkflowGroups = function () {
            return self.userWorkflowGroups.length ? $q.when(self.userWorkflowGroups) : self.loadUserWorkflowGroups();
        };

        /**
         * @description Contains methods for CRUD operations for user workflow groups
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new user workflow group
             * @param $event
             */
            userWorkflowGroupAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('user-workflow-group'),
                        controller: 'userWorkflowGroupPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            userWorkflowGroup: new UserWorkflowGroup(
                                {
                                    itemOrder: generator.createNewID(self.userWorkflowGroups, 'itemOrder')
                                }),
                            userWorkflowGroups: self.userWorkflowGroups
                        }
                    });
            },
            /**
             * @description Opens popup to edit user workflow group
             * @param userWorkflowGroup
             * @param applicationUser
             * @param $event
             */
            userWorkflowGroupEdit: function (userWorkflowGroup, applicationUser, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('user-workflow-group'),
                        controller: 'userWorkflowGroupPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            userWorkflowGroup: userWorkflowGroup,
                            userWorkflowGroups: self.userWorkflowGroups,
                            applicationUser: applicationUser
                        }
                    });
            },
            /**
             * @description Show confirm box and delete user workflow group
             * @param userWorkflowGroup
             * @param $event
             */
            userWorkflowGroupDelete: function (userWorkflowGroup, workflowGroup, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: new WorkflowGroup(workflowGroup).getNames()}), null, null, $event)
                    .then(function () {
                        return self.deleteUserWorkflowGroup(userWorkflowGroup)
                            .then(function (result) {
                                // toast.success(langService.get("delete_specific_success").change({name: userWorkflowGroup.getNames()}));
                                return result;
                            })
                    });
            },
            /**
             * @description Show confirm box and delete bulk user workflow groups
             * @param userWorkflowGroups
             * @param $event
             */

            userWorkflowGroupDeleteBulk: function (userWorkflowGroups, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkUserWorkflowGroups(userWorkflowGroups)
                            .then(function (result) {
                                /**
                                 * result is the records array which were failed to delete
                                 */
                                self.failedToDeleteRecords = result;
                                var response = false;
                                if (result.length === userWorkflowGroups.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (userWorkflowGroup) {
                                        return userWorkflowGroup.getNames();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("delete_success"));
                                    response = true;
                                }
                                return response;
                            });
                    });
            }
        };

        self.failedToDeleteRecords = [];

        /**
         * @description Add new user workflow group
         * @param userWorkflowGroup
         * @return {Promise|UserWorkflowGroup}
         */
        self.addUserWorkflowGroup = function (userWorkflowGroup) {
            return $http
                .post(urlService.userWorkflowGroups,
                    generator.interceptSendInstance('UserWorkflowGroup', userWorkflowGroup))
                .then(function (result) {
                    return generator.interceptReceivedInstance('UserWorkflowGroup', generator.generateInstance(result.data.rs, UserWorkflowGroup, self._sharedMethods));
                });
        };

        /**
         * @description Update the given user workflow group.
         * @param userWorkflowGroup
         * @return {Promise|UserWorkflowGroup}
         */
        self.updateUserWorkflowGroup = function (userWorkflowGroup) {
            return $http
                .put(urlService.userWorkflowGroups,
                    generator.interceptSendInstance('UserWorkflowGroup', userWorkflowGroup))
                .then(function () {
                    return generator.interceptReceivedInstance('UserWorkflowGroup', generator.generateInstance(userWorkflowGroup, UserWorkflowGroup, self._sharedMethods));
                });
        };

        /**
         * @description Delete given user workflow group.
         * @param userWorkflowGroup
         * @return {Promise|null}
         */
        self.deleteUserWorkflowGroup = function (userWorkflowGroup) {
            var id = userWorkflowGroup.hasOwnProperty('id') ? userWorkflowGroup.id : userWorkflowGroup;
            return $http.delete((urlService.userWorkflowGroups + '/' + id)).then(function (result) {
                return result.data.rs;
            });
        };

        /**
         * @description Delete bulk user workflow groups.
         * @param userWorkflowGroups
         * @return {Promise|null}
         */
        self.deleteBulkUserWorkflowGroups = function (userWorkflowGroups) {
            var bulkIds = userWorkflowGroups[0].hasOwnProperty('id') ? _.map(userWorkflowGroups, 'id') : userWorkflowGroups;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.userWorkflowGroups + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedUserWorkflowGroups = [];

                _.map(result, function (value, key) {
                    if (!value)
                        failedUserWorkflowGroups.push(key);
                });

                return _.filter(userWorkflowGroups, function (userWorkflowGroup) {
                    return (failedUserWorkflowGroups.indexOf(userWorkflowGroup.id) > -1);
                });
            });
        };

        /**
         * @description Get user workflow group by userWorkflowGroupId
         * @param userWorkflowGroupId
         * @returns {UserWorkflowGroup|undefined} return UserWorkflowGroup Model or undefined if not found.
         */
        self.getUserWorkflowGroupById = function (userWorkflowGroupId) {
            userWorkflowGroupId = userWorkflowGroupId instanceof UserWorkflowGroup ? userWorkflowGroupId.id : userWorkflowGroupId;
            return _.find(self.userWorkflowGroups, function (userWorkflowGroup) {
                return Number(userWorkflowGroup.id) === Number(userWorkflowGroupId)
            });
        };

        /**
         * @description Activate user workflow group
         * @param userWorkflowGroup
         */
        self.activateUserWorkflowGroup = function (userWorkflowGroup) {
            return $http
                .put(urlService.userWorkflowGroups + '/activate/' + userWorkflowGroup.id)
                .then(function () {
                    return userWorkflowGroup;
                });
        };

        /**
         * @description Deactivate user workflow group
         * @param userWorkflowGroup
         */
        self.deactivateUserWorkflowGroup = function (userWorkflowGroup) {
            return $http
                .put(urlService.userWorkflowGroups + '/deactivate/' + userWorkflowGroup.id)
                .then(function () {
                    return userWorkflowGroup;
                });
        };

        /**
         * @description Activate bulk of user workflow groups
         * @param userWorkflowGroups
         */
        self.activateBulkUserWorkflowGroups = function (userWorkflowGroups) {
            var bulkIds = userWorkflowGroups[0].hasOwnProperty('id') ? _.map(userWorkflowGroups, 'id') : userWorkflowGroups;
            return $http
                .put((urlService.userWorkflowGroups + '/activate/bulk'), bulkIds)
                .then(function () {
                    return userWorkflowGroups;
                });
        };

        /**
         * @description Deactivate bulk of user workflow groups
         * @param userWorkflowGroups
         */
        self.deactivateBulkUserWorkflowGroups = function (userWorkflowGroups) {
            var bulkIds = userWorkflowGroups[0].hasOwnProperty('id') ? _.map(userWorkflowGroups, 'id') : userWorkflowGroups;
            return $http
                .put((urlService.userWorkflowGroups + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return userWorkflowGroups;
                });
        };

        /**
         * @description Get user workflow group by user id
         //* @param userId
         * @param $event
         */
        self.getUserWorkflowGroupsByUser = function ($event) {
            return $http.get(urlService.userWorkflowGroups + '/user/all')
                .then(function (result) {
                    self.userWorkflowGroups = generator.generateCollection(result.data.rs, UserWorkflowGroup, self._sharedMethods);
                    self.userWorkflowGroups = generator.interceptReceivedCollection('UserWorkflowGroup', self.userWorkflowGroups);
                    return self.userWorkflowGroups;
                })
                .catch(function (error) {
                    return errorCode.checkIf(error, 'EMPTY_RESULT', function () {
                        return $q.resolve([]);
                    })
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param userWorkflowGroup
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateUserWorkflowGroup = function (userWorkflowGroup, editMode) {
            var userWorkflowGroupsToFilter = self.userWorkflowGroups;
            if (editMode) {
                userWorkflowGroupsToFilter = _.filter(userWorkflowGroupsToFilter, function (userWorkflowGroupToFilter) {
                    return userWorkflowGroupToFilter.id !== userWorkflowGroup.id;
                });
            }
            return _.some(_.map(userWorkflowGroupsToFilter, function (existingUserWorkflowGroup) {
                return existingUserWorkflowGroup.arName === userWorkflowGroup.arName
                    || existingUserWorkflowGroup.enName.toLowerCase() === userWorkflowGroup.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteUserWorkflowGroup, self.updateUserWorkflowGroup);
    });
};
