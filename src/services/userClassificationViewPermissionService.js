module.exports = function (app) {
    app.service('userClassificationViewPermissionService', function (urlService,
                                                                     $http,
                                                                     $q,
                                                                     generator,
                                                                     UserClassificationViewPermission,
                                                                     ApplicationUser,
                                                                     validationService,
                                                                     _) {
        'ngInject';
        var self = this;
        self.serviceName = 'userClassificationViewPermissionService';

        self.userClassificationViewPermissions = [];

        /**
         * @description Load the user classification view permissions from server.
         * @returns {Promise|userClassificationViewPermissions}
         */
        self.loadUserClassificationViewPermissions = function () {
            return $http.get(urlService.userClassificationViewPermissions).then(function (result) {
                self.userClassificationViewPermissions = generator.generateCollection(result.data.rs, UserClassificationViewPermission, self._sharedMethods);
                self.userClassificationViewPermissions = generator.interceptReceivedCollection('UserClassificationViewPermission', self.userClassificationViewPermissions);
                return self.userClassificationViewPermissions;
            });
        };

        /**
         * @description Get user classification view permissions from self.userClassificationViewPermissions if found and if not load it from server again.
         * @returns {Promise|userClassificationViewPermissions}
         */
        self.getUserClassificationViewPermissions = function () {
            return self.userClassificationViewPermissions.length ? $q.when(self.userClassificationViewPermissions) : self.loadUserClassificationViewPermissions();
        };

        /**
         * @description Add new user classification view permission
         * @param userClassificationViewPermission
         * @return {Promise|UserClassificationViewPermission}
         */
        self.addUserClassificationViewPermission = function (userClassificationViewPermission) {
            return $http
                .post(urlService.userClassificationViewPermissions,
                    generator.interceptSendInstance('UserClassificationViewPermission', userClassificationViewPermission))
                .then(function () {
                    return self.loadUserClassificationViewPermissions()
                        .then(function () {
                            return generator.generateInstance(userClassificationViewPermission, UserClassificationViewPermission, self._sharedMethods);
                        });

                });
        };

        /**
         * @description Update the given user classification view permission.
         * @param userClassificationViewPermission
         * @return {Promise|UserClassificationViewPermission}
         */
        self.updateUserClassificationViewPermission = function (userClassificationViewPermission) {
            return $http
                .put(urlService.userClassificationViewPermissions,
                    generator.interceptSendInstance('UserClassificationViewPermission', userClassificationViewPermission))
                .then(function () {
                    return self.loadUserClassificationViewPermissions()
                        .then(function () {
                            return generator.generateInstance(userClassificationViewPermission, UserClassificationViewPermission, self._sharedMethods);
                        });
                });
        };

        /**
         * @description Delete given user classification view permission.
         * @param userClassificationViewPermission
         * @return {Promise|null}
         */
        self.deleteUserClassificationViewPermission = function (userClassificationViewPermission) {
            var id = userClassificationViewPermission.hasOwnProperty('id') ? userClassificationViewPermission.id : userClassificationViewPermission;
            return $http.delete((urlService.userClassificationViewPermissions + '/' + id))
                .then(function () {
                    return self.loadUserClassificationViewPermissions();
                });
        };

        /**
         * @description Delete bulk user classification view permissions.
         * @param userClassificationViewPermissions
         * @return {Promise|null}
         */
        self.deleteBulkUserClassificationViewPermissions = function (userClassificationViewPermissions) {
            var bulkIds = userClassificationViewPermissions[0].hasOwnProperty('id') ? _.map(userClassificationViewPermissions, 'id') : userClassificationViewPermissions;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.userClassificationViewPermissions + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedUserClassificationViewPermissions = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedUserClassificationViewPermissions.push(key);
                });
                return _.filter(userClassificationViewPermissions, function (userClassificationViewPermission) {
                    return (failedUserClassificationViewPermissions.indexOf(userClassificationViewPermission.id) > -1);
                });
            });
        };

        /**
         * @description Get user classification view permission by userClassificationViewPermissionId
         * @param userClassificationViewPermissionId
         * @returns {UserClassificationViewPermission|undefined} return UserClassificationViewPermission Model or undefined if not found.
         */
        self.getUserClassificationViewPermissionById = function (userClassificationViewPermissionId) {
            userClassificationViewPermissionId = userClassificationViewPermissionId instanceof UserClassificationViewPermission ? userClassificationViewPermissionId.id : userClassificationViewPermissionId;
            return _.find(self.userClassificationViewPermissions, function (userClassificationViewPermission) {
                return Number(userClassificationViewPermission.id) === Number(userClassificationViewPermissionId);
            });
        };

        /**
         * @description Get user classification view permission by application user id
         * @param applicationUserId
         * @returns {UserClassificationViewPermissions|undefined} return UserClassificationViewPermissions Model or undefined if not found.
         */
        self.getUserClassificationViewPermissionsByUserId = function (applicationUserId) {
            applicationUserId = applicationUserId instanceof ApplicationUser ? applicationUserId.id : applicationUserId;
            return _.filter(self.userClassificationViewPermissions, function (userClassificationViewPermission) {
                return Number(userClassificationViewPermission.userId) === Number(applicationUserId);
            });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param userClassificationViewPermission
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateUserClassificationViewPermission = function (userClassificationViewPermission, editMode) {
            var userClassificationViewPermissionsToFilter = self.userClassificationViewPermissions;
            if (editMode) {
                userClassificationViewPermissionsToFilter = _.filter(userClassificationViewPermissionsToFilter, function (userClassificationViewPermissionToFilter) {
                    return userClassificationViewPermissionToFilter.id !== userClassificationViewPermission.id;
                });
            }
            return _.some(_.map(userClassificationViewPermissionsToFilter, function (existingUserClassificationViewPermission) {
                return existingUserClassificationViewPermission.classificationId.id === userClassificationViewPermission.classificationId.id
                    && existingUserClassificationViewPermission.userId === userClassificationViewPermission.userId;
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteUserClassificationViewPermission, self.updateUserClassificationViewPermission);
    });
};
