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
                                                    employeeService,
                                                    userClassificationViewPermissionService,
                                                    ApplicationUserLookup,
                                                    ApplicationUserView,
                                                    organizationService,
                                                    rootEntity,
                                                    errorCode,
                                                    roleService,
                                                    userSubscriptionService) {
        'ngInject';
        var self = this;
        self.serviceName = 'applicationUserService';

        self.applicationUsers = [];
        self.totalCount = 0;

        /**
         * @description Load the application users from server.
         * @returns {Promise|applicationUsers}
         */
        self.loadApplicationUsers = function (limited) {
            return $http.get(urlService.applicationUsers + (limited ? '/limited' : '')).then(function (result) {
                self.applicationUsers = generator.generateCollection(result.data.rs, ApplicationUser, self._sharedMethods);
                self.applicationUsers = generator.interceptReceivedCollection('ApplicationUser', self.applicationUsers);
                return self.applicationUsers;
            });
        };

        /**
         * @description Get application users from self.applicationUsers if found and if not load it from server again.
         * @returns {Promise|applicationUsers}
         */
        self.getApplicationUsers = function (limited) {
            return self.applicationUsers.length ? $q.when(self.applicationUsers) : self.loadApplicationUsers(limited);
        };

        /**
         * @description Loads application users for grid view
         * @returns {*}
         */
        self.loadApplicationUsersView = function (page, limit, criteria) {
            var offset = ((page - 1) * limit);
            var params = {offset: offset, limit: limit};
            if (criteria) {
                params.criteria = criteria;
            }
            return $http.get(urlService.applicationUsers + '/view', {params: params}).then(function (result) {
                self.totalCount = result.data.count;
                return generator.interceptReceivedCollection('ApplicationUserView', generator.generateCollection(result.data.rs, ApplicationUserView, self._sharedMethods));
            });
        };

        self.applicationUserViewSearch = function (criteria) {
            return $http.get(urlService.applicationUsers + '/view/criteria', {
                params: {
                    criteria: criteria
                }
            }).then(function (result) {
                return generator.interceptReceivedCollection('ApplicationUserView', generator.generateCollection(result.data.rs, ApplicationUserView, self._sharedMethods));
            })
        };

        /**
         * @description Contains methods for CRUD operations for application users
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new application user
             * @param $event
             */
            applicationUserAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('application-user'),
                        controller: 'applicationUserPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            applicationUser: new ApplicationUser(),
                            applicationUsers: self.applicationUsers,
                            ouApplicationUsers: [],
                            ouViewPermissions: []
                        },
                        resolve: {
                            organizations: function (organizationService) {
                                'ngInject';
                                return organizationService.loadOrganizations();
                            }
                        }
                    });
            },
            /**
             * @description Opens popup to edit application user
             * @param applicationUser
             * @param $event
             */
            applicationUserEdit: function (applicationUser, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('application-user'),
                        controller: 'applicationUserPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            applicationUsers: self.applicationUsers
                        },
                        resolve: {
                            applicationUser: function () {
                                'ngInject';
                                return self.loadApplicationUserById(applicationUser);
                            },
                            ouApplicationUsers: function (ouApplicationUserService) {
                                'ngInject';
                                return ouApplicationUserService.loadOUApplicationUsersByUserId(applicationUser.id);
                            },
                            ouViewPermissions: function (ouApplicationUserService) {
                                'ngInject';
                                return ouApplicationUserService.getOUsViewPermissionForUser(applicationUser.id);
                            },
                            organizations: function (organizationService) {
                                'ngInject';
                                return organizationService.loadOrganizations();
                            }
                        }
                    });
            },

            /**
             * @description Opens popup to add new application user
             * @param currentOrganization
             * @param $event
             */
            applicationUserFromOuAdd: function (currentOrganization, $event) {
                var ouId = currentOrganization.hasOwnProperty('id') ? currentOrganization.id : currentOrganization;
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('application-user-from-ou'),
                        controller: 'applicationUserFromOuPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            applicationUser: !!ouId ? new ApplicationUser({defaultOUID: ouId}) : new ApplicationUser(),
                            applicationUsers: self.applicationUsers,
                            ouApplicationUsers: [],
                            ouViewPermissions: [],
                            currentOrganization: currentOrganization
                        },
                        resolve: {
                            organizations: function (organizationService) {
                                'ngInject';
                                return organizationService.getAllOrganizationsStructure();
                            }
                        }
                    });
            },
            /**
             * @description Opens popup to edit application user
             * @param ouApplicationUser
             * @param $event
             */
            applicationUserFromOuEdit: function (ouApplicationUser, $event) {
                var currentOrganization = _.find(organizationService.allOrganizationsStructure, function (ou) {
                    return ou.id === ouApplicationUser.getOuId();
                });
                var applicationUser = ouApplicationUser.applicationUser;
                applicationUser = (applicationUser instanceof ApplicationUser) ? applicationUser : new ApplicationUser(applicationUser);
                applicationUser = generator.interceptReceivedInstance('ApplicationUser', applicationUser);

                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('application-user-from-ou'),
                        controller: 'applicationUserFromOuPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            applicationUser: applicationUser,
                            applicationUsers: self.applicationUsers,
                            currentOrganization: currentOrganization
                        },
                        resolve: {
                            organizations: function (organizationService) {
                                'ngInject';
                                return organizationService.getAllOrganizationsStructure();
                            },
                            ouApplicationUsers: function (ouApplicationUserService) {
                                'ngInject';
                                return ouApplicationUserService.loadOUApplicationUsersByUserId(applicationUser.id);
                            },
                            ouViewPermissions: function (ouApplicationUserService) {
                                'ngInject';
                                return ouApplicationUserService.getOUsViewPermissionForUser(applicationUser.id);
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
                        templateUrl: cmsTemplate.getPopup('select-application-user'),
                        targetEvent: $event,
                        controller: 'selectApplicationUserPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            singleMode: false,
                            applicationUsers: !applicationUsers ? [] : angular.copy(applicationUsers),
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
                        templateUrl: cmsTemplate.getPopup('select-application-user'),
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
             * @param selectedTab
             * @param $event
             * @returns {promise}
             */
            manageUserPreference: function (applicationUser, selectedTab, $event) {
                applicationUser = applicationUser ? applicationUser : employeeService.getEmployee();
                var ouApplicationUser = employeeService.getCurrentOUApplicationUser();
                var employee = employeeService.getEmployee();
                self.globalSetting = rootEntity.returnRootEntity().settings;
                var isManagerOfCurrentOu = self.globalSetting.outofofficeFromAllUsers && organizationService.isManagerOfCurrentOu(employee);
                var resolveOrganizations = $q.defer();
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('user-preference'),
                        controller: 'userPreferencePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            selectedTab: selectedTab
                        },
                        resolve: {
                            applicationUser: function (applicationUserService) {
                                'ngInject';
                                return applicationUserService.loadApplicationUserById(applicationUser.id);
                            },
                            jobTitles: function (jobTitleService) {
                                'ngInject';
                                return jobTitleService.getJobTitles();
                            },
                            ranks: function (rankService) {
                                'ngInject';
                                return rankService.getRanks();
                            },
                            themes: function (themeService) {
                                'ngInject';
                                return themeService.getThemes();
                            },
                            organizations: function (organizationService) {
                                'ngInject';
                                return organizationService.getOrganizations().then(function (result) {
                                    resolveOrganizations.resolve(result);
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
                                resolveOrganizations.promise.then(function () {
                                    ouApplicationUserService.loadOUApplicationUsersByUserId(applicationUser.id).then(function (result) {
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
                                return userWorkflowGroupService.getUserWorkflowGroupsByUser();
                            },
                            userFolders: function (userFolderService) {
                                'ngInject';
                                return userFolderService.getUserFoldersForApplicationUser()
                                    .then(function (result) {
                                        return result;
                                    });
                            },
                            followupFolders: function (followUpUserService) {
                                'ngInject';
                                return followUpUserService.loadFollowupFoldersByOuAndUser(ouApplicationUser.getOuId(), applicationUser.id, true);
                            },
                            availableProxies: function (ouApplicationUserService) {
                                'ngInject';
                                return isManagerOfCurrentOu ? [] : resolveOrganizations.promise.then(function () {
                                    return _getProxyUsers(ouApplicationUserService, applicationUser, ouApplicationUser, false);
                                });
                            },
                            proxyOrganizations: function (organizationService) {
                                'ngInject';
                                return isManagerOfCurrentOu ? organizationService.loadAllActiveOrganizations() : [];
                            },
                            predefinedActions: function (predefinedActionService) {
                                'ngInject';
                                return predefinedActionService.loadPredefinedActionsForUser();
                            },
                            ouApplicationUser: function (ouApplicationUserService) {
                                'ngInject';
                                return ouApplicationUserService.loadOUApplicationUserByUserIdAndOUId(applicationUser.id, ouApplicationUser.getOuId());
                            }
                        }
                    });
            },

            /**
             * @description Opens dialog to manage user Subscriptions
             * @param $event
             * @returns {promise}
             */
            manageSubscriptions: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('manage-subscriptions'),
                        controller: 'manageSubscriptionsPopCtrl',
                        controllerAs: 'ctrl',
                        //bindToController: true,
                        resolve: {
                            userSubscriptions: function (userSubscriptionService) {
                                'ngInject';
                                return userSubscriptionService.loadUserSubscriptionsByUserId(employeeService.getEmployee().id);
                            }
                        }
                    });
            }
        };

        function _getProxyUsers(ouApplicationUserService, applicationUser, ouApplicationUser, outOfOffice) {
            return ouApplicationUserService
                .getAvailableProxies(ouApplicationUser.getRegistryOUID(), true, applicationUser.id, outOfOffice)
                .then(function (result) {
                    var proxyInfo = applicationUser.hasProxy() ? applicationUser.getProxyInformation() : null;
                    return applicationUser.hasProxy() ?
                        (applicationUser.currentProxyUserInCollection(result) ? result : (ouApplicationUserService
                            .loadProxyUserByUserIdAndOUId(proxyInfo.userId, proxyInfo.ouId))
                            .then(function (proxyUser) {
                                result.push(proxyUser);
                                return result;
                            })) : result;
                });
        }

        /**
         * @description Checks if ldap user exists
         * @param {string}domainName
         * @returns true/false{boolean}
         * Returns true if LDAP user exist, you can add new application user.
         * Returns false if LDAP user doesn't exist, you can't add new application user.
         */
        self.checkLDAPUserExist = function (domainName) {
            domainName = domainName.hasOwnProperty('domainName') ? domainName.domainName : domainName;
            return $http.get(urlService.applicationUserLdap.change({domainName: domainName}))
                .then(function (result) {
                    return result.data.rs;
                }).catch(function (error) {
                    return false;
                })
        };

        /**
         * @description Add new application user
         * @param applicationUser
         * @return {Promise|ApplicationUser}
         */
        self.addApplicationUser = function (applicationUser) {
            var defer = $q.defer();
            self.checkLDAPUserExist(applicationUser)
                .then(function (result) {
                    if (result)
                        defer.resolve(result);
                    else
                        defer.reject('LDAP_USER_MISSING');
                });
            return defer.promise.then(function () {
                return $http
                    .post(urlService.applicationUsers,
                        generator.interceptSendInstance('ApplicationUser', applicationUser))
                    .then(function (result) {
                        applicationUser.id = result.data.rs;
                        return applicationUser;
                    })
                    .catch(function (error) {
                        //  console.log('addUserFail', error);
                        if (error && errorCode.checkIf(error, 'FAILED_DUPLICATE_EMPLOYEE_NUMBER') === true) {
                            dialog.errorMessage(generator.getTranslatedError(error));
                        }
                        return $q.reject('addUserFail');
                    });
            }).catch(function (error) {
                if (error === 'LDAP_USER_MISSING') {
                    dialog.errorMessage(langService.get('ldap_user_doesnot_exist_add_please'));
                }
                return $q.reject(false);
            });
        };

        /**
         * @description Update the given application user.
         * @param applicationUser
         * @return {Promise|ApplicationUser}
         */
        self.updateApplicationUser = function (applicationUser) {
            //console.log(applicationUser);
            return $http
                .put(urlService.applicationUsers,
                    generator.interceptSendInstance('ApplicationUser', applicationUser))
                .then(function () {
                    return applicationUser;
                }).catch(function (error) {
                    if (error && errorCode.checkIf(error, 'FAILED_DUPLICATE_EMPLOYEE_NUMBER') === true) {
                        dialog.errorMessage(generator.getTranslatedError(error));
                    }
                    return $q.reject(false);
                });
        };
        /**
         * @description Update the given user preferences.
         * @param applicationUser
         * @return {Promise|ApplicationUser}
         */
        self.updateUserPreferences = function (applicationUser) {
            return $http
                .put(urlService.applicationUsers + '/user-preferences',
                    generator.interceptSendInstance('ApplicationUser', applicationUser))
                .then(function () {
                    return applicationUser;
                }).catch(function (error) {
                    if (error && errorCode.checkIf(error, 'FAILED_DUPLICATE_EMPLOYEE_NUMBER') === true) {
                        dialog.errorMessage(generator.getTranslatedError(error));
                    }
                    return $q.reject(false);
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
                url: urlService.applicationUsers + '/bulk',
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
         * @description Load application user by applicationUserId
         * @param applicationUserId
         * @returns {ApplicationUser|undefined} return ApplicationUser Model or undefined if not found.
         */
        self.loadApplicationUserById = function (applicationUserId) {
            applicationUserId = generator.getNormalizedValue(applicationUserId, 'id');
            return $http.get(urlService.applicationUsers + '/' + applicationUserId).then(function (result) {
                return generator.interceptReceivedInstance('ApplicationUser', generator.generateInstance(result.data.rs, ApplicationUser, self._sharedMethods));
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
            }) || applicationUserId;
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
                return existingApplicationUser.arFullName.toLowerCase() === applicationUser.arFullName.toLowerCase()
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

        self.updateCurrentLanguage = function (language) {
            var languageId = language.hasOwnProperty('id') ? language.lookupKey : language;
            return $http
                .put(urlService.applicationUsers + '/change-lang/' + languageId)
                .then(function (result) {
                    return result.data.rs;
                })
        };

        self.applicationUserSearch = function (criteria) {
            return $http.get(urlService.applicationUsers + '/criteria', {
                params: {
                    criteria: criteria
                }
            }).then(function (result) {
                self.applicationUsers = generator.generateCollection(result.data.rs, ApplicationUser, self._sharedMethods);
                self.applicationUsers = generator.interceptReceivedCollection('ApplicationUser', self.applicationUsers);
                return self.applicationUsers;
            })
        };

        self.totalApplicationUsersCount = function () {
            return $http.get(urlService.applicationUsers + '/count')
                .then(function (result) {
                    return result.data.rs;
                });
        };

        self.exportApplicationUsers = function (withInfo) {
            var defer = $q.defer(),
                urlTypeMap = {
                    pdf: {
                        url: urlService.applicationUsers + (withInfo ? '/export/info/pdf' : '/export/pdf'),
                        type: 'pdf',
                        text: 'PDF',
                        id: 1
                    },
                    excel: {
                        url: urlService.applicationUsers + (withInfo ? '/export/info/excel' : '/export/excel'),
                        type: 'excel',
                        text: 'EXCEL',
                        id: 2
                    }
                };

            dialog.confirmThreeButtonMessage(langService.get('select_file_type_to_print_download'), '', urlTypeMap.pdf.text, urlTypeMap.excel.text, null, null, false)
                .then(function (result) {
                    if (result.button === urlTypeMap.pdf.id) {
                        defer.resolve(urlTypeMap.pdf);
                    } else if (result.button === urlTypeMap.excel.id) {
                        defer.resolve(urlTypeMap.excel);
                    }
                });

            return defer.promise.then(function (exportOption) {
                var errorMessage = langService.get('error_export_to_file').change({format: (exportOption.type === 'excel' ? 'EXCEL' : 'PDF')});
                return $http.get(exportOption.url)
                    .then(function (result) {
                        return result.data.rs;
                    }).catch(function () {
                        toast.error(errorMessage);
                    });
            });
        };

        self.loadViewLookups = function () {
            return $http.get(urlService.applicationUsers + '/view/lookup')
                .then(function (result) {
                    result.data.rs = generator.generateInstance(result.data.rs, ApplicationUserLookup);
                    return generator.interceptReceivedInstance('ApplicationUserLookup', result.data.rs);
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
