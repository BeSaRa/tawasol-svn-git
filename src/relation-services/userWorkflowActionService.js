module.exports = function (app) {
    app.service('userWorkflowActionService', function (urlService,
                                                    $http ,
                                                    $q ,
                                                    generator,
                                                    UserWorkflowAction,
                                                    _) {
        'ngInject';
        var self = this;
        self.serviceName = 'userWorkflowActionService';

        self.userWorkflowActions = [];

        /**
         * @description Load the user workflow actions from server.
         * @returns {Promise|userWorkflowActions}
         */
        self.loadUserWorkflowActions = function () {
            return $http.get(urlService.userWorkflowActions).then(function (result) {
                self.userWorkflowActions = generator.generateCollection(result.data.rs, UserWorkflowAction, self._sharedMethods);
                self.userWorkflowActions = generator.interceptReceivedCollection('UserWorkflowAction', self.userWorkflowActions);
                return self.userWorkflowActions;
            });
        };

        /**
         * @description Get user workflow actions from self.userWorkflowActions if found and if not load it from server again.
         * @returns {Promise|userWorkflowActions}
         */
        self.getUserWorkflowActions = function () {
            return self.userWorkflowActions.length ? $q.when(self.userWorkflowActions) : self.loadUserWorkflowActions();
        };
        /**
         * @description Add new user workflow action
         * @param userWorkflowAction
         * @return {Promise|UserWorkflowAction}
         */
        self.addUserWorkflowAction = function (userWorkflowAction) {
            return $http
                .post(urlService.userWorkflowActions,
                    generator.interceptSendInstance('UserWorkflowAction', userWorkflowAction))
                .then(function (result) {
                    userWorkflowAction.id = result.data.rs;
                    return generator.interceptReceivedInstance('UserWorkflowAction', generator.generateInstance(userWorkflowAction, UserWorkflowAction, self._sharedMethods));
                    //self.relatedUsers.push(userWorkflowAction);
                    return userWorkflowAction;
                });
        };

        /**
         * @description Update the given user workflow action.
         * @param userWorkflowAction
         * @return {Promise|UserWorkflowAction}
         */
        self.updateUserWorkflowAction = function (userWorkflowAction) {
            return $http
                .put(urlService.userWorkflowActions,
                    generator.interceptSendInstance('UserWorkflowAction', userWorkflowAction))
                .then(function () {
                    return userWorkflowAction;
                });
        };

        /**
         * @description Delete given user workflow action.
         * @param userWorkflowAction
         * @return {Promise|null}
         */
        self.deleteUserWorkflowAction = function (userWorkflowAction) {
            var id = userWorkflowAction.hasOwnProperty('id') ? userWorkflowAction.id : userWorkflowAction;
            return $http.delete((urlService.userWorkflowActions + '/' + id));
        };

        /**
         * @description Delete bulk user workflow actions.
         * @param userWorkflowActions
         * @return {Promise|null}
         */
        self.deleteBulkUserWorkflowActions = function (userWorkflowActions) {

            var bulkIds = userWorkflowActions[0].hasOwnProperty('id') ? _.map(userWorkflowActions, 'id') : userWorkflowActions;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.userWorkflowActions + '/' + 'bulk',
                data: bulkIds
            }).then(function (result) {

                result = result.data.rs;
                var failedUserWorkflowActions = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedUserWorkflowActions.push(key);
                });
                return _.filter(userWorkflowActions, function (userWorkflowAction) {
                    return (failedUserWorkflowActions.indexOf(userWorkflowAction.id) > -1);
                });
            });
        };

        /**
         * @description Get user workflow action by userWorkflowActionId
         * @param userWorkflowActionId
         * @returns {UserWorkflowAction|undefined} return UserWorkflowAction Model or undefined if not found.
         */
        self.getUserWorkflowActionById = function (userWorkflowActionId) {
            userWorkflowActionId = userWorkflowActionId instanceof UserWorkflowAction ? userWorkflowActionId.id : userWorkflowActionId;
            return _.find(self.userWorkflowActions, function (userWorkflowAction) {
                return Number(userWorkflowAction.id) === Number(userWorkflowActionId);
            });
        };

         /**
         * @description Activate user workflow action
         * @param userWorkflowAction
         */
        self.activateUserWorkflowAction = function (userWorkflowAction) {
            return $http
                .put((urlService.userWorkflowActions + '/activate/' + userWorkflowAction.id))
                .then(function () {
                    return userWorkflowAction;
                });
        };

        /**
         * @description Deactivate user workflow action
         * @param userWorkflowAction
         */
        self.deactivateUserWorkflowAction = function (userWorkflowAction) {
            return $http
                .put((urlService.userWorkflowActions + '/deactivate/' + userWorkflowAction.id))
                .then(function () {
                    return userWorkflowAction;
                });
        };

        /**
         * @description Activate bulk of user workflow actions
         * @param userWorkflowActions
         */
        self.activateBulkUserWorkflowActions = function (userWorkflowActions) {
            var bulkIds = userWorkflowActions[0].hasOwnProperty('id') ? _.map(userWorkflowActions, 'id') : userWorkflowActions;
            return $http
                .put((urlService.userWorkflowActions + '/activate/bulk'), bulkIds)
                .then(function () {
                    return userWorkflowActions;
                });
        };

         /**
         * @description Deactivate bulk of user workflow actions
         * @param userWorkflowActions
         */
        self.deactivateBulkUserWorkflowActions = function (userWorkflowActions) {
            var bulkIds = userWorkflowActions[0].hasOwnProperty('id') ? _.map(userWorkflowActions, 'id') : userWorkflowActions;
            return $http
                .put((urlService.userWorkflowActions + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return userWorkflowActions;
                });
        };

        /**
         * @description return the list of the user workflow actions
         * @param applicationUsers
         * @param workflowAction
         * @param insert
         * @return {Array}
         */
        self.createListUserWorkflowActions = function (applicationUsers, workflowAction, insert) {

            var userWorkflowActions = _.map(applicationUsers, function (applicationUser) {
                var userWorkflowAction = new UserWorkflowAction();
                return userWorkflowAction.setUserId(applicationUser).setWorkflowAction(workflowAction);
            });

            if (!insert)
                return $q.when(userWorkflowActions);

            return self.addBulkUserWorkflowActions(userWorkflowActions);
        };

        /**
         * @description add bulk related users
         * @param userWorkflowActions
         * @returns {Promise|[UserWorkflowAction]}
         */
        self.addBulkUserWorkflowActions = function (userWorkflowActions) {

            return $http.post((urlService.userWorkflowActions + '/user-id/bulk'),
                generator.interceptSendCollection('UserWorkflowAction', userWorkflowActions))
                .then(function (result) {
                    result = result.data.rs;
                    userWorkflowActions = _.map(userWorkflowActions, function (userWorkflowAction, index) {
                        userWorkflowAction.id = result[index];
                        return userWorkflowAction;
                    });
                    return userWorkflowActions;
                })
        };


        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param userWorkflowAction
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateUserWorkflowAction = function (userWorkflowAction, editMode) {
            var userWorkflowActionsToFilter = self.userWorkflowActions;
            if (editMode) {
                userWorkflowActionsToFilter = _.filter(userWorkflowActionsToFilter, function (userWorkflowActionToFilter) {
                    return userWorkflowActionToFilter.id !== userWorkflowAction.id;
                });
            }
            return _.some(_.map(userWorkflowActionsToFilter, function (existingUserWorkflowAction) {
                return existingUserWorkflowAction.arName === userWorkflowAction.arName
                    || existingUserWorkflowAction.enName.toLowerCase() === userWorkflowAction.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteUserWorkflowAction, self.updateUserWorkflowAction);
    });
};
