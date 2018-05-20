module.exports = function (app) {
    app.service('ouApplicationUserService', function (urlService,
                                                      toast,
                                                      cmsTemplate,
                                                      langService,
                                                      dialog,
                                                      $http,
                                                      ProxyUser,
                                                      $q,
                                                      $timeout,
                                                      generator,
                                                      OUApplicationUser,
                                                      _,
                                                      UserOuPermission,
                                                      ApplicationUser,
                                                      ProxyInfo) {
        'ngInject';
        var self = this;
        self.serviceName = 'ouApplicationUserService';

        self.ouApplicationUsers = [];
        self.unAssignedUsers = [];
        /**
         * @description load unrelated ApplicationUsers from server.
         * @returns {Promise|ouApplicationUsers}
         */

        self.loadUnassignedOUApplicationUsers = function (organization) {
            organization = organization.hasOwnProperty('id') ? organization.id : organization;
            return $http.get(urlService.unRelatedApplicationUsersByOUId.change({OUId: organization})).then(function (result) {
                self.unAssignedUsers = generator.generateCollection(result.data.rs, ApplicationUser, self._sharedMethods);
                self.unAssignedUsers = generator.interceptReceivedCollection('ApplicationUser', self.unAssignedUsers);

                return self.unAssignedUsers;
            });
        };

        /**
         * @description load ouApplicationUsers from server.
         * @returns {Promise|ouApplicationUsers}
         */
        self.loadOUApplicationUsers = function () {
            return $http.get(urlService.ouApplicationUsers).then(function (result) {
                self.ouApplicationUsers = generator.generateCollection(result.data.rs, OUApplicationUser, self._sharedMethods);
                self.ouApplicationUsers = generator.interceptReceivedCollection('OUApplicationUser', self.ouApplicationUsers);
                return self.ouApplicationUsers;
            });
        };


        /**
         * @description load related ApplicationUsers from server.
         * @returns {Promise|ouApplicationUsers}
         */
        self.loadRelatedOUApplicationUsers = function (organization) {
            organization = organization.hasOwnProperty('id') ? organization.id : organization;
            return $http.get(urlService.relatedApplicationUsersByOUId.change({OUId: organization})).then(function (result) {
                self.ouApplicationUsers = generator.generateCollection(result.data.rs, OUApplicationUser, self._sharedMethods);
                self.ouApplicationUsers = generator.interceptReceivedCollection('OUApplicationUser', self.ouApplicationUsers);
                return self.ouApplicationUsers;
            });
        };

        /**
         * @description get ouApplicationUsers from self.ouApplicationUsers if found and if not load it from server again.
         * @returns {Promise|ouApplicationUsers}
         */
        self.getOUApplicationUsers = function () {
            return self.ouApplicationUsers.length ? $q.when(self.ouApplicationUsers) : self.loadOUApplicationUsers();
        };

        self.loadAllPrivateUsers = function () {
            return $http.get(urlService.allPrivateUsers).then(function (result) {
                self.allPrivateUsers = generator.generateCollection(result.data.rs, OUApplicationUser, self._sharedMethods);
                self.allPrivateUsers = generator.interceptReceivedCollection('OUApplicationUser', self.allPrivateUsers);
                return self.allPrivateUsers;
            })
        };

        /**
         * @description get all private users as ouApplicationUsers from self.allPrivatesUsers if found and if not load it from server again.
         * @returns {Promise|allPrivateUsers}
         */
        self.getOUApplicationUsers = function () {
            return self.allPrivateUsers.length ? $q.when(self.allPrivateUsers) : self.loadAllPrivateUsers();
        };

        /**
         * @description Contains methods for CRUD operations for ou application users
         */
        self.controllerMethod = {
            /**
             * @description method to select multiple ou application users from dialog.
             * @param ouApplicationUsers
             * @param label to dialog. If not found, will be select user.
             * @param $event to display popup from the current mouse click event.
             * @param isUserPreference
             * @returns {Promise|ApplicationUser} return the selected application users.
             */
            selectOUApplicationUsers: function (ouApplicationUsers, label, $event, isUserPreference) {
                return dialog
                    .showDialog({
                        template: cmsTemplate.getPopup('select-ou-application-users'),
                        targetEvent: $event,
                        controller: 'selectOUApplicationUsersPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            singleMode: false,
                            ouApplicationUsers: !ouApplicationUsers ? [] : ouApplicationUsers,
                            label: label,
                            isUserPreference: isUserPreference
                        },
                        resolve: {
                            organizations: function (organizationService) {
                                'ngInject';
                                return organizationService.getOrganizations();
                            }
                        }
                    });
            },
            /**
             * @description method to select ou application user from dialog.
             * @param organization
             * @param property
             * @param label to dialog. If not found, will be select user.
             * @param $event to display popup from the current mouse click event.
             * @returns {Promise|ApplicationUser} return the selected application users.
             */
            selectOUApplicationUserSingle: function (organization, property, label, $event) {
                return dialog
                    .showDialog({
                        template: cmsTemplate.getPopup('select-ou-application-user-single'),
                        targetEvent: $event,
                        controller: 'selectOUApplicationUserSinglePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            ouApplicationUser: organization[property],
                            label: label,
                            organization: organization
                        },
                        resolve: {
                            ouApplicationUsers: function () {
                                'ngInject'
                                return self.loadRelatedOUApplicationUsers(organization)
                                    .then(function (result) {
                                        return _.filter(result, function (ouApplicationUserResult) {
                                            if (property === 'managerId') {
                                                var viceManager = organization.viceManagerId;
                                                if (viceManager)
                                                    return ouApplicationUserResult.applicationUser.id !== viceManager.id;
                                                return ouApplicationUserResult;
                                            }
                                            else if (property === 'viceManagerId') {
                                                var manager = organization.managerId;
                                                if (manager)
                                                    return ouApplicationUserResult.applicationUser.id !== manager.id;
                                                return ouApplicationUserResult;
                                            }
                                            return ouApplicationUserResult;
                                        })
                                    });
                            }
                        }
                    });
            },
            /**
             * @description Opens the popup to search and select the users to be added as group members for workflow group
             * @param groupMembers
             * @param isUserPreference
             * @param $event
             * @returns {promise}
             */
            selectUsersForUserWFGroup: function (groupMembers, isUserPreference, $event) {
                return dialog
                    .showDialog({
                        template: cmsTemplate.getPopup('add-user-to-workflow-group'),
                        targetEvent: $event,
                        controller: 'addUserToWorkflowGroupPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            groupMembers: !groupMembers ? [] : groupMembers,
                            isUserPreference: isUserPreference
                        },
                        resolve: {
                            organizations: function (organizationService) {
                                'ngInject';
                                return organizationService.getOrganizations();
                            },
                            organizationGroups: function (distributionWFService) {
                                'ngInject';
                                return distributionWFService
                                    .loadDistWorkflowOrganizations('organizations')
                            }

                        }
                    });
            }
        };

        /**
         * @description Find OU application users by search text and search key
         * @param searchText
         * @param searchKey
         * @return {*|Promise<U>}
         */
        /*self.findUsersByText = function (searchText, searchKey) {
         // service-request: need service to return collection of users from backend-team based on search text.
         searchText = searchText.toLowerCase().trim();
         return self.loadOUApplicationUsers().then(function (result) {
         return _.filter(result, function (ouApplicationUser) {
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
         value = ouApplicationUser.applicationUser[properties[i]].toString().toLowerCase().trim();
         if (value.indexOf(searchText) !== -1) {
         found = true;
         break;
         }
         }
         return found;
         }

         if (searchKey.key !== 'employeeNo')
         return ouApplicationUser.applicationUser[searchKey.key].toLowerCase().indexOf(searchText) !== -1;
         else
         return (Number(ouApplicationUser.applicationUser[searchKey.key]) === Number(searchText));
         }
         );
         });
         };*/

        /**
         * @description Find OU application users by search text and search key
         * @param searchText
         * @param searchKey
         * @param organizationUnit
         * @return {*|Promise<U>}
         */
        self.findUsersByText = function (searchText, searchKey, organizationUnit) {
            searchText = searchText.toLowerCase().trim();
            var loginName = '',
                arFullName = '',
                enFullName = '',
                domainName = '';
            switch (searchKey.key) {
                case 'loginName':
                    loginName = searchText;
                    break;
                case 'arFullName':
                    arFullName = searchText;
                    break;
                case 'enFullName':
                    enFullName = searchText;
                    break;
                case 'domainName':
                    domainName = searchText;
                    break;
                default:
                    break;
            }

            /*var config = {
             headers: {
             'Content-Type': 'application/json;charset=UTF-8',
             'Access-Control-Allow-Headers': 'Accept, Content-Type'
             }
             };*/

            return $http.post(urlService.searchOUApplicationUser + '/search', {
                ou: organizationUnit,
                domainName: domainName,
                arName: arFullName,
                enName: enFullName,
                loginName: loginName
            }).then(function (result) {
                self.searchOUApplicationUsers = generator.generateCollection(result.data.rs, OUApplicationUser, self._sharedMethods);
                self.searchOUApplicationUsers = generator.interceptReceivedCollection('OUApplicationUser', self.searchOUApplicationUsers);
                return self.searchOUApplicationUsers;
            });
        };

        /**
         * @description add new ouApplicationUser to service
         * @param ouApplicationUser
         * @return {Promise|OUApplicationUser}
         */
        self.addOUApplicationUser = function (ouApplicationUser) {
            return $http
                .post(urlService.ouApplicationUsers,
                    generator.interceptSendInstance('OUApplicationUser', ouApplicationUser))
                .then(function (result) {
                    ouApplicationUser.id = result.data.rs;
                    return generator.generateInstance(ouApplicationUser, OUApplicationUser, self._sharedMethods);
                });
        };
        /**
         * @description make an update for given ouApplicationUser.
         * @param ouApplicationUser
         * @return {Promise|OUApplicationUser}
         */
        self.updateOUApplicationUser = function (ouApplicationUser) {

            return $http
                .put(urlService.ouApplicationUsers,
                    generator.interceptSendInstance('OUApplicationUser', ouApplicationUser))
                .then(function () {
                    return generator.generateInstance(ouApplicationUser, OUApplicationUser, self._sharedMethods);
                });
        };

        /**
         * @description update proxy user for given ouApplicationUser
         * @param ouApplicationUser
         * @returns {*}
         */
        self.updateProxyUser = function (ouApplicationUser) {
            return $http
                .put(urlService.ouApplicationUsers + '/proxy', generator.interceptSendInstance(['OUApplicationUser', 'SendProxy'], ouApplicationUser))
                .then(function () {
                    return generator.generateInstance(ouApplicationUser, OUApplicationUser, self._sharedMethods);
                });
        };
        /**
         * @description delete given ouApplicationUser.
         * @param ouApplicationUser
         * @param $event
         * @return {Promise}
         */
        self.deleteOUApplicationUser = function (ouApplicationUser, $event) {
            return dialog.confirmMessage(langService.get('confirm_delete').change({name: ouApplicationUser.ouid.getNames()}), null, null, $event)
                .then(function () {
                    var id = ouApplicationUser.hasOwnProperty('id') ? ouApplicationUser.id : ouApplicationUser;
                    return $http
                        .delete((urlService.ouApplicationUsers + '/' + id));
                });
        };
        /**
         * @description Delete bulk organization types.
         * @param ouApplicationUsers
         * @param $event
         * @return {Promise|null}
         */
        self.deleteBulkOUApplicationUsers = function (ouApplicationUsers, $event) {
            return dialog
                .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                .then(function () {
                    var bulkIds = ouApplicationUsers[0].hasOwnProperty('id') ? _.map(ouApplicationUsers, 'id') : ouApplicationUsers;
                    return $http({
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        url: urlService.ouApplicationUsers + '/bulk',
                        data: bulkIds
                    }).then(function (result) {
                        result = result.data.rs;
                        var failedOUApplicationUsers = [];
                        _.map(result, function (value, key) {
                            if (!value)
                                failedOUApplicationUsers.push(key);
                        });
                        return _.filter(ouApplicationUsers, function (ouApplicationUser) {
                            return (failedOUApplicationUsers.indexOf(ouApplicationUser.id) > -1);
                        });
                    });
                });
        };
        /**
         * @description create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteOUApplicationUser, self.updateOUApplicationUser);

        /**
         * @description get ouApplicationUser by ouApplicationUserId
         * @param ouApplicationUserId
         * @returns {OUApplicationUser|undefined} return OUApplicationUser Model or undefined if not found.
         */
        self.getOUApplicationUserById = function (ouApplicationUserId) {
            ouApplicationUserId = ouApplicationUserId instanceof OUApplicationUser ? ouApplicationUserId.id : ouApplicationUserId;
            return self.getOUApplicationUsers().then(function (ouApplicationUsers) {
                return _.find(ouApplicationUsers, function (ouApplicationUser) {
                    return Number(ouApplicationUser.id) === Number(ouApplicationUserId);
                });
            });
        };


        self.ouApplicationUsersByUserId = [];

        /**
         * @description get ouApplicationUser by applicationUserId
         * @param applicationUserId
         * @returns {OUApplicationUser|undefined} return OUApplicationUser Model or undefined if not found.
         */
        self.loadOUApplicationUsersByUserId = function (applicationUserId) {
            applicationUserId = applicationUserId instanceof ApplicationUser ? applicationUserId.id : applicationUserId;
            return $http.get(urlService.ouApplicationUsersByUserId.change({userId: applicationUserId})).then(function (result) {
                self.ouApplicationUsersByUserId = generator.generateCollection(result.data.rs, OUApplicationUser, self._sharedMethods);
                self.ouApplicationUsersByUserId = generator.interceptReceivedCollection('OUApplicationUser', self.ouApplicationUsersByUserId);
                return self.ouApplicationUsersByUserId;
            });
        };

        /**
         * @description get ouApplicationUsers from self.ouApplicationUsers if found and if not load it from server again.
         * @returns {Promise|ouApplicationUsers}
         */
        self.getOUApplicationUsersByUserId = function (applicationUserId) {
            applicationUserId = applicationUserId instanceof ApplicationUser ? applicationUserId.id : applicationUserId;
            return (self.ouApplicationUsersByUserId.length
                && self.ouApplicationUsersByUserId[0].applicationUser.id === applicationUserId)
                ? $q.when(self.ouApplicationUsersByUserId)
                : self.loadOUApplicationUsersByUserId(applicationUserId);
        };
        /* /!**
          * @description Get Organizations by Application User
          * @param applicationUserId
          * @returns {*|Promise<any>}
          *!/
         self.getOUApplicationUsersByUserId = function (applicationUserId) {
             applicationUserId = applicationUserId instanceof ApplicationUser ? applicationUserId.id : applicationUserId;
             return self.loadOUApplicationUsers().then(function (ouApplicationUsers) {
                 return _.filter(ouApplicationUsers, function (ouApplicationUser) {
                     if (Number(ouApplicationUser.applicationUser.id) === Number(applicationUserId))
                         return ouApplicationUser.ouid;
                 });
             });
         };*/

        self.getUsersWhoSetYouAsProxy = function (applicationUserId) {
            applicationUserId = applicationUserId instanceof ApplicationUser ? applicationUserId.id : applicationUserId;
            return $http.get(urlService.usersWhoSetYouAsProxy + applicationUserId)
                .then(function (result) {
                    result = generator.generateCollection(result.data.rs, ProxyInfo, self._sharedMethods);
                    return result;
                });
        };

        /**
         * @description get children for parent ouApplicationUsers
         * @param parents ouApplicationUsers to get they children
         * @param children ouApplicationUsers to search in
         * @return {Array}
         */
        self.getChildrenOUApplicationUsers = function (parents, children) {
            return _.map(parents, function (ouApplicationUser) {
                ouApplicationUser.children = [];
                if (children.hasOwnProperty(ouApplicationUser.id)) {
                    ouApplicationUser.setChildren(children[ouApplicationUser.id]);
                }
                return ouApplicationUser;
            });
        };

        /**
         * @description to make separation between parents and children records
         * @param ouApplicationUsers
         * @param parents
         * @param children
         * @return {*}
         */
        self.ouApplicationUserSeparator = function (ouApplicationUsers, parents, children) {
            _.map(ouApplicationUsers, function (ouApplicationUser) {
                var parent = ouApplicationUser.parent;
                if (!parent) {
                    parents.push(ouApplicationUser);
                } else {
                    if (!children.hasOwnProperty(parent)) {
                        children[parent] = [];
                    }
                    children[parent].push(ouApplicationUser);
                }
            });
            return self;
        };

        /**
         * @description to create the hierarchy for the parent and child for ouApplicationUsers
         * @param ouApplicationUsers
         * @return {Array| OUApplicationUser} array of parents ouApplicationUsers
         */
        self.createOUApplicationUserHierarchy = function (ouApplicationUsers) {
            var parents = [], children = {};
            return self
                .ouApplicationUserSeparator(ouApplicationUsers, parents, children)
                .getChildrenOUApplicationUsers(parents, children);
        };

        /**
         * @description get parent ouApplicationUsers
         * @param excludeOUApplicationUser
         * @return {Array}
         */
        self.getParentOUApplicationUsers = function (excludeOUApplicationUser) {
            return _.filter(self.ouApplicationUsers, function (ouApplicationUser) {
                if (excludeOUApplicationUser)
                    return !ouApplicationUser.parent && excludeOUApplicationUser.id !== ouApplicationUser.id;
                else
                    return !ouApplicationUser.parent;
            });
        };

        /**
         * @description Activate ouApplicationUser
         * @param ouApplicationUser
         */
        self.activateOUApplicationUser = function (ouApplicationUser) {
            return $http
                .put((urlService.ouApplicationUsers + '/activate/' + ouApplicationUser.id))
                .then(function () {
                    return ouApplicationUser;
                });
        };

        /**
         * @description Deactivate ouApplicationUser
         * @param ouApplicationUser
         */
        self.deactivateOUApplicationUser = function (ouApplicationUser) {
            return $http
                .put((urlService.ouApplicationUsers + '/deactivate/' + ouApplicationUser.id))
                .then(function () {
                    return ouApplicationUser;
                });
        };

        /**
         * @description Activate bulk ouApplicationUsers
         * @param ouApplicationUsers
         */
        self.activateBulkOUApplicationUsers = function (ouApplicationUsers) {
            var bulkIds = ouApplicationUsers[0].hasOwnProperty('id') ? _.map(ouApplicationUsers, 'id') : ouApplicationUsers;
            return $http
                .put((urlService.ouApplicationUsers + '/activate/bulk'), bulkIds)
                .then(function () {
                    return ouApplicationUsers;
                });
        };

        /**
         * @description Deactivate bulk ouApplicationUsers
         * @param ouApplicationUsers
         */
        self.deactivateBulkOUApplicationUsers = function (ouApplicationUsers) {
            var bulkIds = ouApplicationUsers[0].hasOwnProperty('id') ? _.map(ouApplicationUsers, 'id') : ouApplicationUsers;
            return $http
                .put((urlService.ouApplicationUsers + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return ouApplicationUsers;
                });
        };

        /**
         * @description Get the User OU Permission By user id and ou id
         * @param userId
         * @param ouId
         */
        self.getUserOuPermissionByUserIdAndOuId = function (userId, ouId) {
            return $http
                .get(urlService.userOuPermissions + '/user/' + userId + '/ou/' + ouId)
                .then(function (result) {
                    return generator.generateCollection(result.data.rs, UserOuPermission, self._sharedMethods);
                });
        };
        /*
         /!**
         * @description Intercept the object to pass to service
         * @param ouApplicationUser
         *!/
         self.processUserOuPermissionData = function (ouApplicationUser) {
         var userOuPermissions = [];
         for (var i = 0; i < ouApplicationUser.customRoleId.customRolePermission.length; i++) {
         userOuPermissions.push(new UserOuPermission({
         userId: ouApplicationUser.applicationUser.id,
         ouId: ouApplicationUser.ouid.id,
         customRoleId: ouApplicationUser.customRoleId.id,
         permissionId: ouApplicationUser.customRoleId.customRolePermission[i].id
         }));
         }
         return userOuPermissions;
         };*/


        /**
         * @description Add the User OU Permissions
         * @param ouUserPermissions
         */
        self.addUserOuPermission = function (ouUserPermissions) {
            return $http
                .post(urlService.userOuPermissions + '/bulk', ouUserPermissions)
                .then(function () {
                    return true;
                });
        };

        /**
         * @description Update the User OU Permissions
         * @param ouUserPermissions
         */
        self.updateUserOuPermission = function (ouUserPermissions) {
            return $http
                .put(urlService.userOuPermissions + '/bulk', ouUserPermissions)
                .then(function () {
                    return true;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param ouApplicationUser
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateOUApplicationUser = function (ouApplicationUser, editMode) {
            var ouApplicationUsersToFilter = self.ouApplicationUsers;
            if (editMode) {
                ouApplicationUsersToFilter = _.filter(ouApplicationUsersToFilter, function (ouApplicationUserToFilter) {
                    return ouApplicationUserToFilter.id !== ouApplicationUser.id;
                });
            }
            return _.some(_.map(ouApplicationUsersToFilter, function (existingOUApplicationUser) {
                return existingOUApplicationUser.arName === ouApplicationUser.arName
                    || existingOUApplicationUser.enName.toLowerCase() === ouApplicationUser.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };
        /**
         * @description search for ouApplicationUser by criteria.
         * @param criteria
         */
        self.searchByCriteria = function (criteria) {
            return $http
                .post(urlService.ouApplicationUsers + '/search', criteria)
                .then(function (result) {
                    return generator.interceptReceivedCollection('OUApplicationUser', generator.generateCollection(result.data.rs, OUApplicationUser));
                });
        };

        /**
         * @description to map the proxy User
         * @param collection
         * @returns {Array}
         * @private
         */
        function _mapProxyUser(collection) {
            return _.map(collection, function (ouApplicationUser) {
                return (new ProxyUser()).mapFromOUApplicationUser(ouApplicationUser);
            })
        }

        /**
         * @description get available proxy users for given registry organization.
         * @param registryOuId
         */
        self.getAvailableProxies = function (registryOuId) {
            return self.searchByCriteria({regOu: registryOuId}).then(function (result) {
                result = _.filter(result, function (ouAppUser) {
                    return !ouAppUser.applicationUser.outOfOffice;
                });
                return _mapProxyUser(result);
            })
        }


    })
    ;
}
;