module.exports = function (app) {
    app.service('applicationUserService', function (urlService,
                                                    $http,
                                                    $q,
                                                    generator,
                                                    ApplicationUser,
                                                    ApplicationUserInfo,
                                                    _,
                                                    dialog,
                                                    langService,
                                                    toast,
                                                    cmsTemplate,
                                                    employeeService) {
        'ngInject';
        var self = this;
        self.serviceName = 'applicationUserService';

        self.applicationUsers = [];

        /**
         * @description Load the application users from server.
         * @returns {Promise|applicationUsers}
         */
        self.loadApplicationUsers = function () {
            return $http.get(urlService.applicationUsers).then(function (result) {
                self.applicationUsers = generator.generateCollection(result.data.rs, ApplicationUser, self._sharedMethods);
                self.applicationUsers = generator.interceptReceivedCollection('ApplicationUser', self.applicationUsers);
                return self.applicationUsers;
            });
        };

        /**
         * @description Get application users from self.applicationUsers if found and if not load it from server again.
         * @returns {Promise|applicationUsers}
         */
        self.getApplicationUsers = function () {
            return self.applicationUsers.length ? $q.when(self.applicationUsers) : self.loadApplicationUsers();
        };

        /**
         * @description Contains methods for CRUD operations for application users
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new application user
             * @param jobTitles
             * @param organizations
             * @param classifications
             * @param themes
             * @param roles
             * @param permissions
             * @param ouApplicationUsers
             * @param userClassificationViewPermissions
             * @param $event
             */
            applicationUserAdd: function (jobTitles, organizations, classifications, themes, roles, permissions, ouApplicationUsers, userClassificationViewPermissions, currentOrganization, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('application-user'),
                        controller: 'applicationUserPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            applicationUser: currentOrganization ? new ApplicationUser({defaultOUID: currentOrganization}) : new ApplicationUser(),
                            applicationUsers: self.applicationUsers,
                            jobTitles: jobTitles,
                            organizations: organizations,
                            classifications: classifications,
                            themes: themes,
                            userClassificationViewPermissions: userClassificationViewPermissions,
                            roles: roles,
                            permissions: permissions,
                            ouApplicationUsers: [],
                            currentOrganization: currentOrganization
                        }
                    });
            },
            /**
             * @description Opens popup to edit application user
             * @param applicationUser
             * @param jobTitles
             * @param organizations
             * @param classifications
             * @param themes
             * @param roles
             * @param permissions
             * @param ouApplicationUsers
             * @param userClassificationViewPermissions
             * @param $event
             */
            applicationUserEdit: function (applicationUser, jobTitles, organizations, classifications, themes, roles, permissions, ouApplicationUsers, userClassificationViewPermissions, currentOrganization, $event) {
                var userClassificationViewPermissionsByUserId = _.filter(userClassificationViewPermissions, function (userClassificationViewPermission) {
                    return Number(userClassificationViewPermission.userId) === Number(applicationUser.id);
                });
                /*var ouApplicationUsersByUserId = _.filter(ouApplicationUsers, function (ouApplicationUser) {
                    return Number(ouApplicationUser.applicationUser.id) === Number(applicationUser.id);
                });*/
                applicationUser = generator.interceptReceivedInstance('ApplicationUser', applicationUser);

                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('application-user'),
                        controller: 'applicationUserPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            applicationUser: applicationUser,
                            applicationUsers: self.applicationUsers,
                            jobTitles: jobTitles,
                            organizations: organizations,
                            classifications: classifications,
                            themes: themes,
                            userClassificationViewPermissions: userClassificationViewPermissionsByUserId,
                            roles: roles,
                            permissions: permissions,
                            //ouApplicationUsers: ouApplicationUsersByUserId,
                            currentOrganization: currentOrganization
                        },
                        resolve: {
                            ouApplicationUsers: function (ouApplicationUserService) {
                                'ngInject';
                                return ouApplicationUserService.getOUApplicationUsersByUserId(applicationUser.id);
                            },

                            // by BeSaRa to resolve the signature if found
                            signature: function (applicationUserSignatureService, $q) {
                                'ngInject';

                                if (applicationUser.hasOwnProperty('signature') && applicationUser.signature.length)
                                    return $q.when(applicationUser.signature);

                                return applicationUserSignatureService.loadApplicationUserSignatures(applicationUser.id).then(function (result) {
                                    applicationUser.signature = result;
                                });
                            }
                        }
                    });
            },
            /**
             * @description Show confirm box and delete application user
             * @param applicationUser
             * @param $event
             */
            applicationUserDelete: function (applicationUser, $event) {
                console.log(applicationUser, employeeService.getEmployee());
                if (applicationUser.id === employeeService.getEmployee().id) {
                    toast.info(langService.get('can_not_delete_current_user'));
                    return false;
                }
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: applicationUser.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deleteApplicationUser(applicationUser).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: applicationUser.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and delete bulk application users
             * @param applicationUsers
             * @param $event
             */
            applicationUserDeleteBulk: function (applicationUsers, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        applicationUsers = _.filter(applicationUsers, function (applicationUser) {
                            return applicationUser.id !== employeeService.getEmployee().id;
                        });
                        return self.deleteBulkApplicationUsers(applicationUsers)
                            .then(function (result) {
                                var response = false;
                                if (result.length === applicationUsers.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (applicationUser) {
                                        return applicationUser.getNames();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("delete_success"));
                                    response = true;
                                }
                                return response;
                            });
                    });
            },
            /**
             * @description method to select multiple application users from dialog.
             * @param applicationUsers: the older application users to set it in the grid.
             * @param label to dialog. If not found, will be select user.
             * @param $event to display popup from the current mouse click event.
             * @returns {Promise|ApplicationUser} return the selected application users.
             */
            selectApplicationUsers: function (applicationUsers, label, $event) {
                return dialog
                    .showDialog({
                        template: cmsTemplate.getPopup('select-application-user'),
                        targetEvent: $event,
                        controller: 'selectApplicationUserPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            singleMode: false,
                            applicationUsers: !applicationUsers ? [] : applicationUsers,
                            label: label
                        }
                    });
            },
            /**
             * @description method to select single Application User from dialog.
             * @param applicationUser the older application user to set it in the grid.
             * @param label to dialog. If not found, will be select user.
             * @param $event to display popup from the current mouse click event.
             * @returns {Promise|ApplicationUser} return the selected application user.
             */
            selectApplicationUser: function (applicationUser, label, $event) {
                return dialog
                    .showDialog({
                        template: cmsTemplate.getPopup('select-application-user'),
                        targetEvent: $event,
                        controller: 'selectApplicationUserPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            singleMode: true,
                            applicationUsers: applicationUser ? [applicationUser] : [],
                            label: label
                        }
                    });
            },
            /**
             * @description Opens dialog to manage user preferences
             * @param {ApplicationUser}applicationUser
             * @param $event
             * @returns {promise}
             */
            manageUserPreference: function (applicationUser, $event) {
                applicationUser = applicationUser ? applicationUser : employeeService.getEmployee();
                var resolveOuApplicationUsers = $q.defer();
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('user-preference'),
                        controller: 'userPreferencePopCtrl',
                        controllerAs: 'ctrl',
                        resolve: {
                            jobTitles: function (jobTitleService) {
                                'ngInject';
                                return jobTitleService.getJobTitles();
                            },
                            themes: function (themeService) {
                                'ngInject';
                                return themeService.getThemes();
                            },
                            organizations: function (organizationService) {
                                'ngInject';
                                return organizationService.getOrganizations().then(function (result) {
                                    resolveOuApplicationUsers.resolve(result);
                                    return result
                                });
                            },
                            roles: function (roleService) {
                                'ngInject';
                                return roleService.getRoles();
                            },
                            permissions: function (roleService) {
                                'ngInject';
                                return roleService.getPermissions();
                            },
                            ouApplicationUsers: function (ouApplicationUserService) {
                                'ngInject';
                                var defer = $q.defer();
                                resolveOuApplicationUsers.promise.then(function () {
                                    ouApplicationUserService.getOUApplicationUsersByUserId(applicationUser.id).then(function (result) {
                                        defer.resolve(result);
                                    });
                                });
                                return defer.promise;
                            },
                            applicationUsers: function (applicationUserService) {
                                'ngInject';
                                return applicationUserService.getApplicationUsers();
                            },
                            userComments: function (userCommentService) {
                                'ngInject';
                                return userCommentService.getUserComments()
                                    .then(function (result) {
                                        return _.filter(result, function (userComment) {
                                            return userComment.userId === applicationUser.id;
                                        });
                                    });
                            },
                            workflowGroups: function (workflowGroupService) {
                                'ngInject';
                                return workflowGroupService.getWorkflowGroups();
                            },
                            userWorkflowGroups: function (userWorkflowGroupService) {
                                'ngInject';
                                return userWorkflowGroupService.getUserWorkflowGroupByUserId();
                            },
                            // by BeSaRa to resolve the signature if found
                            signature: function (applicationUserSignatureService, $q) {
                                'ngInject';
                                if (applicationUser.hasOwnProperty('signature') && applicationUser.signature.length)
                                    return $q.when(applicationUser.signature);

                                return applicationUserSignatureService.loadApplicationUserSignatures(applicationUser.id)
                                    .then(function (result) {
                                        applicationUser.signature = result;
                                        //deferDelay.resolve(applicationUser);
                                        return result;
                                    });
                            },
                            userFolders: function (userFolderService) {
                                'ngInject';
                                return userFolderService.getUserFoldersForApplicationUser()
                                    .then(function (result) {
                                        return result;
                                    });
                            }
                        },
                        locals: {
                            applicationUser: applicationUser
                        }
                    });
            }
        };

        /**
         * @description Add new application user
         * @param applicationUser
         * @return {Promise|ApplicationUser}
         */
        self.addApplicationUser = function (applicationUser) {
            return $http
                .post(urlService.applicationUsers,
                    generator.interceptSendInstance('ApplicationUser', applicationUser))
                .then(function (result) {
                    applicationUser.id = result.data.rs;
                    return applicationUser;
                });
        };

        /**
         * @description Update the given application user.
         * @param applicationUser
         * @return {Promise|ApplicationUser}
         */
        self.updateApplicationUser = function (applicationUser) {
            return $http
                .put(urlService.applicationUsers,
                    generator.interceptSendInstance('ApplicationUser', applicationUser))
                .then(function () {
                    return applicationUser;
                });
        };

        /**
         * @description Delete given application user.
         * @param applicationUser
         * @return {Promise|null}
         */
        self.deleteApplicationUser = function (applicationUser) {
            var id = applicationUser.hasOwnProperty('id') ? applicationUser.id : applicationUser;
            return $http.delete((urlService.applicationUsers + '/' + id));
        };

        /**
         * @description Delete bulk application users.
         * @param applicationUsers
         * @return {Promise|null}
         */
        self.deleteBulkApplicationUsers = function (applicationUsers) {
            var bulkIds = applicationUsers[0].hasOwnProperty('id') ? _.map(applicationUsers, 'id') : applicationUsers;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.applicationUsers + '/' + 'bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedApplicationUsers = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedApplicationUsers.push(key);
                });
                return _.filter(applicationUsers, function (applicationUser) {
                    return (failedApplicationUsers.indexOf(applicationUser.id) > -1);
                });
            });
        };

        /**
         * @description Get application user by applicationUserId
         * @param applicationUserId
         * @returns {ApplicationUser|undefined} return ApplicationUser Model or undefined if not found.
         */
        self.getApplicationUserById = function (applicationUserId) {
            applicationUserId = applicationUserId instanceof ApplicationUser ? applicationUserId.id : applicationUserId;
            return _.find(self.applicationUsers, function (applicationUser) {
                return Number(applicationUser.id) === Number(applicationUserId);
            });
        };

        /**
         * @description Activate application user
         * @param applicationUser
         */
        self.activateApplicationUser = function (applicationUser) {
            return $http
                .put((urlService.applicationUsers + '/activate/' + applicationUser.id))
                .then(function () {
                    return applicationUser;
                });
        };

        /**
         * @description Deactivate application user
         * @param applicationUser
         */
        self.deactivateApplicationUser = function (applicationUser) {
            return $http
                .put((urlService.applicationUsers + '/deactivate/' + applicationUser.id))
                .then(function () {
                    return applicationUser;
                });
        };

        /**
         * @description Activate bulk of application users
         * @param applicationUsers
         */
        self.activateBulkApplicationUsers = function (applicationUsers) {
            var bulkIds = applicationUsers[0].hasOwnProperty('id') ? _.map(applicationUsers, 'id') : applicationUsers;
            return $http
                .put((urlService.applicationUsers + '/activate/bulk'), bulkIds)
                .then(function () {
                    return applicationUsers;
                });
        };

        /**
         * @description Deactivate bulk of application users
         * @param applicationUsers
         */
        self.deactivateBulkApplicationUsers = function (applicationUsers) {
            var bulkIds = applicationUsers[0].hasOwnProperty('id') ? _.map(applicationUsers, 'id') : applicationUsers;
            return $http
                .put((urlService.applicationUsers + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return applicationUsers;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param applicationUser
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateApplicationUser = function (applicationUser, editMode) {
            var applicationUsersToFilter = self.applicationUsers;
            if (editMode) {
                applicationUsersToFilter = _.filter(applicationUsersToFilter, function (applicationUserToFilter) {
                    return applicationUserToFilter.id !== applicationUser.id;
                });
            }
            return _.some(_.map(applicationUsersToFilter, function (existingApplicationUser) {
                return existingApplicationUser.arFullName === applicationUser.arFullName
                    || existingApplicationUser.enFullName.toLowerCase() === applicationUser.enFullName.toLowerCase()
                    || existingApplicationUser.domainName.toLowerCase() === applicationUser.domainName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Check if record with same employee number exists. Returns true if exists
         * @param applicationUser
         * @param propertyName
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateApplicationUserProperties = function (applicationUser, propertyName, editMode) {
            var applicationUsersToFilter = self.applicationUsers;
            if (editMode) {
                applicationUsersToFilter = _.filter(applicationUsersToFilter, function (applicationUserToFilter) {
                    return applicationUserToFilter.id !== applicationUser.id;
                });
            }
            return _.some(_.map(applicationUsersToFilter, function (existingApplicationUser) {
                return (Number(existingApplicationUser[propertyName]) === Number(applicationUser[propertyName]));
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Find application users by search text and search key
         * @param searchText
         * @param searchKey
         * @return {*|Promise<U>}
         */
        self.findUsersByText = function (searchText, searchKey) {
            // service-request: need service to return collection of users from backend-team based on search text.
            searchText = searchText.toLowerCase().trim();
            return self.loadApplicationUsers().then(function (result) {
                return _.filter(result, function (applicationUser) {
                        var properties = [
                            'arFullName',
                            'domainName',
                            'enFullName',
                            'employeeNo',
                            'email',
                            'loginName',
                            'mobile',
                            'qid'];

                        if (!searchKey) {
                            var found = false;
                            var value = "";
                            for (var i = 0; i < properties.length; i++) {
                                value = applicationUser[properties[i]].toString().toLowerCase().trim();
                                if (value.indexOf(searchText) !== -1) {
                                    found = true;
                                    break;
                                }
                            }
                            return found;
                        }

                        if (searchKey.key !== 'employeeNo')
                            return applicationUser[searchKey.key].toLowerCase().indexOf(searchText) !== -1;
                        else
                            return (Number(applicationUser[searchKey.key]) === Number(searchText));
                    }
                );
            });
        };
        /**
         * @description find applicationUser by One Criteria.
         * @param criteria
         * @param value
         */
        self.findApplicationUserByOneCriteria = function (value, criteria) {
            if (!value || !value.length) {
                return $q.resolve([]);
            }
            criteria = criteria.hasOwnProperty('key') ? criteria.key : criteria;
            return $http
                .get(urlService.applicationUsers + "/dist/like/key/" + criteria + "/val/" + value)
                .then(function (result) {
                    return generator.interceptReceivedCollection('ApplicationUserInfo', generator.generateCollection(result.data.rs, ApplicationUserInfo));
                });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteApplicationUser, self.updateApplicationUser);
    });
};
