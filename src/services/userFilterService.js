module.exports = function (app) {
    app.service('userFilterService', function (urlService,
                                               langService,
                                               toast,
                                               employeeService,
                                               $http,
                                               $q,
                                               dialog,
                                               cmsTemplate,
                                               generator,
                                               UserFilter,
                                               _) {
        'ngInject';
        var self = this;
        self.serviceName = 'userFilterService';

        self.userFilters = [];

        /**
         * @description load userFilters from server.
         * @returns {Promise|userFilters}
         */
        self.loadUserFilters = function () {
            return $http.get(urlService.userFilters + '/user-filters').then(function (result) {
                self.userFilters = generator.generateCollection(result.data.rs, UserFilter);
                self.userFilters = generator.interceptReceivedCollection('UserFilter', self.userFilters);
                return self.userFilters;
            });
        };
        /**
         * @description get userFilters from self.userFilters if found and if not load it from server again.
         * @returns {Promise|userFilters}
         */
        self.getUserFilters = function () {
            return self.userFilters.length ? $q.when(self.userFilters) : self.loadUserFilters();
        };
        /**
         * @description add new userFilter to service
         * @param userFilter
         * @param ignoreMessage
         * @return {Promise|UserFilter}
         */
        self.addUserFilter = function (userFilter, ignoreMessage) {
            return $http
                .post(urlService.userFilters,
                    generator.interceptSendInstance('UserFilter', userFilter))
                .then(function (result) {
                    var method = result.data.rs ? 'success' : 'error',
                        message = result.data.rs ? langService.get('add_success').change({name: userFilter.getTranslatedName()}) : langService.get('error_messages');
                    if (!ignoreMessage)
                        toast[method](message);
                    userFilter.id = result.data.rs;
                    return userFilter;
                }).catch(function () {
                    toast.error(langService.get('error_messages'));
                    return userFilter;
                });
        };
        /**
         * @description make an update for given userFilter.
         * @param userFilter
         * @param ignoreMessage
         * @return {Promise|UserFilter}
         */
        self.updateUserFilter = function (userFilter, ignoreMessage) {
            var filter = generator.interceptSendInstance('UserFilter', userFilter);
            return $http
                .put(urlService.userFilters, filter)
                .then(function (result) {
                    var method = result.data.rs ? 'success' : 'error',
                        message = result.data.rs ? langService.get('update_success').change({name: userFilter.getTranslatedName()}) : langService.get('error_messages');
                    if (!ignoreMessage)
                        toast[method](message);

                    userFilter.parsedExpression = angular.toJson(filter.filterCriteria);

                    return userFilter;
                }).catch(function () {
                    toast.error(langService.get('error_messages'));
                    return filter;
                });
        };
        /**
         * @description delete given classification.
         * @param userFilter
         * @param ignoreMessage
         * @return {Promise}
         */
        self.deleteUserFilter = function (userFilter, ignoreMessage) {
            var id = userFilter.hasOwnProperty('id') ? userFilter.id : userFilter;
            return $http
                .delete((urlService.userFilters + '/' + id))
                .then(function (result) {
                    if (!ignoreMessage) {
                        result.data.rs ? toast.success(langService.get('delete_specific_success').change({name: userFilter.getTranslatedName()})) : toast.error(langService.get('error_messages'));
                    }
                    return userFilter;
                });
        };

        /**
         * @description load userFilter by userFilterId from server
         * @param userFilterId
         * @returns {UserFilter|undefined} return UserFilter Model or undefined if not found.
         */
        self.loadUserFilterById = function (userFilterId) {
            userFilterId = userFilterId instanceof UserFilter ? userFilterId.id : userFilterId;
            return $http.get(urlService.userFilters + '/' + userFilterId)
                .then(function (result) {
                    result = generator.generateInstance(result.data.rs, UserFilter);
                    result = generator.interceptReceivedInstance('UserFilter', result);
                    var index = _.findIndex(self.userFilters, function (filter) {
                        return (self.userFilters.id === filter.id);
                    });
                    self.userFilters[index] = result;
                    return result;
                });
        };
        /**
         * @description get userFilter by userFilterId
         * @param userFilterId
         * @returns {UserFilter|undefined} return UserFilter Model or undefined if not found.
         */
        self.getUserFilterById = function (userFilterId) {
            userFilterId = userFilterId instanceof UserFilter ? userFilterId.id : userFilterId;
            return _.find(self.userFilters, function (userFilter) {
                return Number(userFilter.id) === Number(userFilterId)
            });
        };
        /**
         * @description to show create filter dialog.
         * @param $event
         * @returns {promise|*}
         */
        self.createUserFilterDialog = function ($event) {
            var defer = $q.defer();
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('user-filters'),
                    controller: 'userFilterPopCtrl',
                    controllerAs: 'ctrl',
                    targetEvent: $event,
                    resolve: {
                        organizations: function (organizationService) {
                            'ngInject';
                            return organizationService.getOrganizations()
                                .then(function () {
                                    defer.resolve(true);
                                });
                        },
                        senders: function (ouApplicationUserService, employeeService) {
                            'ngInject';
                            return defer.promise.then(function () {
                                return ouApplicationUserService.searchByCriteria({regOu: employeeService.getEmployee().getRegistryOUID()})
                                    .then(function (result) {
                                        return _.uniqBy(_.map(result, 'applicationUser'), 'domainName');
                                    });
                            });
                        },
                        actions: function (workflowActionService) {
                            'ngInject';
                            return workflowActionService.loadCurrentUserWorkflowActions();
                        },
                        correspondenceSiteTypes: function (correspondenceSiteTypeService) {
                            'ngInject';
                            return correspondenceSiteTypeService.getCorrespondenceSiteTypes();
                        },
                        mainClassifications: function (classificationService) {
                            'ngInject';
                            return classificationService.classificationSearch('', undefined, true);
                        }
                    },
                    locals: {
                        filter: new UserFilter({
                            userId: employeeService.getEmployee().id,
                            ouId: employeeService.getEmployee().getOUID(),
                            sortOptionId: generator.createNewID(self.userFilters, 'sortOptionId') //self.userFilters.length + 1
                        }),
                        editMode: false
                    }
                });
        };

        self.editUserFilterDialog = function (filter, $event) {
            var defer = $q.defer();
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('user-filters'),
                    controller: 'userFilterPopCtrl',
                    controllerAs: 'ctrl',
                    targetEvent: $event,
                    resolve: {
                        organizations: function (organizationService) {
                            'ngInject';
                            return organizationService.getOrganizations()
                                .then(function () {
                                    defer.resolve(true);
                                });
                        },
                        senders: function (ouApplicationUserService, employeeService) {
                            'ngInject';
                            return defer.promise.then(function () {
                                return ouApplicationUserService.searchByCriteria({regOu: employeeService.getEmployee().getRegistryOUID()})
                                    .then(function (result) {
                                        return _.uniqBy(_.map(result, 'applicationUser'), 'domainName');
                                    });
                            });
                        },
                        actions: function (workflowActionService) {
                            'ngInject';
                            return workflowActionService.loadCurrentUserWorkflowActions();
                        },
                        correspondenceSiteTypes: function (correspondenceSiteTypeService) {
                            'ngInject';
                            return correspondenceSiteTypeService.getCorrespondenceSiteTypes();
                        },
                        mainClassifications: function (classificationService) {
                            'ngInject';
                            return classificationService.classificationSearch('', undefined, true);
                        }
                    },
                    locals: {
                        filter: filter,
                        editMode: true
                    }
                });
        };


        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param userFilter
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateUserFilter = function (userFilter, editMode) {
            var userFiltersToFilter = angular.copy(self.userFilters);
            if (editMode) {
                userFiltersToFilter = _.filter(userFiltersToFilter, function (userFilterToFilter) {
                    return userFilterToFilter.id !== userFilter.id;
                });
            }
            return _.some(_.map(userFiltersToFilter, function (existingUserFilter) {
                // if existing user filter doesn't have name, change them to empty strings
                existingUserFilter.arName = existingUserFilter.arName ? existingUserFilter.arName : '';
                existingUserFilter.enName = existingUserFilter.enName ? existingUserFilter.enName : '';

                // if user filter has arName and enName, check them
                if (userFilter.arName && userFilter.enName) {
                    return existingUserFilter.arName === userFilter.arName
                        || existingUserFilter.enName.toLowerCase() === userFilter.enName.toLowerCase();
                } else if (!userFilter.arName && userFilter.enName) {
                    return existingUserFilter.enName.toLowerCase() === userFilter.enName.toLowerCase();
                } else if (userFilter.arName && !userFilter.enName)
                    return existingUserFilter.arName === userFilter.arName;

            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

    });
};
