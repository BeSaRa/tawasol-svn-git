module.exports = function (app) {
    app.service('userCommentService', function (urlService,
                                                $http,
                                                $q,
                                                generator,
                                                UserComment,
                                                _,
                                                dialog,
                                                langService,
                                                toast,
                                                cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'userCommentService';

        self.userComments = [];

        /**
         * @description Load the user comments from server.
         * @returns {Promise|userComments}
         */
        self.loadUserComments = function () {
            return $http.get(urlService.userComments).then(function (result) {
                self.userComments = generator.generateCollection(result.data.rs, UserComment, self._sharedMethods);
                self.userComments = generator.interceptReceivedCollection('UserComment', self.userComments);
                return self.userComments;
            });
        };

        /**
         * @description Get user comments from self.userComments if found and if not load it from server again.
         * @returns {Promise|userComments}
         */
        self.getUserComments = function () {
            return self.userComments.length ? $q.when(self.userComments) : self.loadUserComments();
        };

        self.loadUserCommentsForDistribution = function () {
            return $http.get(urlService.userComments + '/dist').then(function (result) {
                result = generator.generateCollection(result.data.rs, UserComment, self._sharedMethods);
                result = generator.interceptReceivedCollection('UserComment', result);
                /*if (!skipSorting) {
                    result = _.sortBy(result, [function (comment) {
                        return comment.shortComment.toLowerCase();
                    }]);
                }*/
                return result;
            });
        };

        self.filterUserCommentsByAppUserId = function (appUserId) {
            appUserId = appUserId && appUserId.hasOwnProperty('id') ? appUserId.id : appUserId;
            return self.getUserComments().then(function () {
                return _.filter(self.userComments, function (userComment) {
                    return userComment.userId === appUserId;
                });
            })
        };

        /**
         * @description Contains methods for CRUD operations for user comments
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new user comment
             * @param appUserId
             * @param ouId
             * @param $event
             */
            userCommentAddDialog: function (appUserId, ouId, $event) {
                appUserId = appUserId && appUserId.hasOwnProperty('id') ? appUserId.id : appUserId;
                return self.filterUserCommentsByAppUserId(appUserId)
                    .then(function (userComments) {
                        var userComment = new UserComment({
                            userId: appUserId,
                            itemOrder: generator.createNewID(userComments, 'itemOrder'),
                            ouId: ouId ? ouId : null
                        });
                        // just to verify/override if default status changed to false in model
                        if (ouId) {
                            userComment.status = true;
                        }
                        return dialog
                            .showDialog({
                                targetEvent: $event || null,
                                templateUrl: cmsTemplate.getPopup('user-comment'),
                                controller: 'userCommentPopCtrl',
                                controllerAs: 'ctrl',
                                locals: {
                                    userComment: userComment
                                },
                                resolve: {
                                    organizationsForAppUser: function (employeeService) {
                                        'ngInject';
                                        return employeeService.getEmployee().ouList;
                                    }
                                }
                            });
                    });

            },
            /**
             * @description Opens popup to edit user comment
             * @param userComment
             * @param $event
             */
            userCommentEditDialog: function (userComment, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event || null,
                        templateUrl: cmsTemplate.getPopup('user-comment'),
                        controller: 'userCommentPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            userComment: angular.copy(userComment)
                        },
                        resolve: {
                            organizationsForAppUser: function (employeeService) {
                                'ngInject';
                                return employeeService.getEmployee().ouList;
                            }
                        }
                    });
            },
            /**
             * @description Show confirm box and delete user comment
             * @param userComment
             * @param $event
             */
            userCommentDelete: function (userComment, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete_msg'), null, null, $event)
                    .then(function () {
                        return self.deleteUserComment(userComment).then(function () {
                            toast.success(langService.get("delete_success"));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and delete bulk user comments
             * @param userComments
             * @param $event
             */
            userCommentDeleteBulk: function (userComments, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkUserComments(userComments)
                            .then(function (result) {
                                var response = false;
                                if (result.length === userComments.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (userComment) {
                                        return userComment.getNames();
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

        /**
         * @description Add new user comment
         * @param userComment
         * @return {Promise|UserComment}
         */
        self.addUserComment = function (userComment) {
            return $http
                .post(urlService.userComments,
                    generator.interceptSendInstance('UserComment', userComment))
                .then(function (result) {
                    userComment.id = result.data.rs;
                    return userComment;
                });
        };

        /**
         * @description Update the given user comment.
         * @param userComment
         * @return {Promise|UserComment}
         */
        self.updateUserComment = function (userComment) {
            return $http
                .put(urlService.userComments,
                    generator.interceptSendInstance('UserComment', userComment))
                .then(function () {
                    return userComment;
                });
        };

        /**
         * @description Delete given user comment.
         * @param userComment
         * @return {Promise|null}
         */
        self.deleteUserComment = function (userComment) {
            var id = userComment.hasOwnProperty('id') ? userComment.id : userComment;
            return $http.delete((urlService.userComments + '/' + id));
        };

        /**
         * @description Delete bulk user comments.
         * @param userComments
         * @return {Promise|null}
         */
        self.deleteBulkUserComments = function (userComments) {
            var bulkIds = userComments[0].hasOwnProperty('id') ? _.map(userComments, 'id') : userComments;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.userComments + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedUserComments = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedUserComments.push(key);
                });
                return _.filter(userComments, function (userComment) {
                    return (failedUserComments.indexOf(userComment.id) > -1);
                });
            });
        };

        /**
         * @description Get user comment by userCommentId
         * @param userCommentId
         * @returns {UserComment|undefined} return UserComment Model or undefined if not found.
         */
        self.getUserCommentById = function (userCommentId) {
            userCommentId = userCommentId instanceof UserComment ? userCommentId.id : userCommentId;
            return _.find(self.userComments, function (userComment) {
                return Number(userComment.id) === Number(userCommentId);
            });
        };

        /**
         * @description Activate user comment
         * @param userComment
         */
        self.activateUserComment = function (userComment) {
            return $http
                .put((urlService.userComments + '/activate/' + userComment.id))
                .then(function () {
                    return userComment;
                });
        };

        /**
         * @description Deactivate user comment
         * @param userComment
         */
        self.deactivateUserComment = function (userComment) {
            return $http
                .put((urlService.userComments + '/deactivate/' + userComment.id))
                .then(function () {
                    return userComment;
                });
        };

        /**
         * @description Activate bulk of user comments
         * @param userComments
         */
        self.activateBulkUserComments = function (userComments) {
            var bulkIds = userComments[0].hasOwnProperty('id') ? _.map(userComments, 'id') : userComments;
            return $http
                .put((urlService.userComments + '/activate/bulk'), bulkIds)
                .then(function () {
                    return userComments;
                });
        };

        /**
         * @description Deactivate bulk of user comments
         * @param userComments
         */
        self.deactivateBulkUserComments = function (userComments) {
            var bulkIds = userComments[0].hasOwnProperty('id') ? _.map(userComments, 'id') : userComments;
            return $http
                .put((urlService.userComments + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return userComments;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param userComment
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateUserComment = function (userComment, editMode) {
            var userCommentsToFilter = self.userComments;
            if (editMode) {
                userCommentsToFilter = _.filter(userCommentsToFilter, function (userCommentToFilter) {
                    return userCommentToFilter.id !== userComment.id;
                });
            }
            return _.some(_.map(userCommentsToFilter, function (existingUserComment) {
                return existingUserComment.shortComment === userComment.shortComment
                    || existingUserComment.shortComment.toLowerCase() === userComment.shortComment.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteUserComment, self.updateUserComment);
    });
};
