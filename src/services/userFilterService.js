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
                    template: cmsTemplate.getPopup('user-filters'),
                    controller: 'filterPopCtrl',
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
                                        return _.map(result, 'applicationUser');
                                    });
                            });
                        },
                        actions: function (workflowActionService) {
                            'ngInject';
                            return workflowActionService.loadCurrentUserWorkflowActions();
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
                    template: cmsTemplate.getPopup('user-filters'),
                    controller: 'filterPopCtrl',
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
                                        return _.map(result, 'applicationUser');
                                    });
                            });
                        },
                        actions: function (workflowActionService) {
                            'ngInject';
                            return workflowActionService.loadCurrentUserWorkflowActions();
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
            var userFiltersToFilter = self.userFilters;
            if (editMode) {
                userFiltersToFilter = _.filter(userFiltersToFilter, function (userFilterToFilter) {
                    return userFilterToFilter.id !== userFilter.id;
                });
            }
            return _.some(_.map(userFiltersToFilter, function (existingUserFilter) {
                return existingUserFilter.arName.toLowerCase() === userFilter.arName.toLowerCase()
                    || existingUserFilter.enName.toLowerCase() === userFilter.enName.toLowerCase();
                // || existingUserFilter.lookupStrKey.toLowerCase() === userFilter.lookupStrKey.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

    });
};
