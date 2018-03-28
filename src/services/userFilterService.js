module.exports = function (app) {
    app.service('userFilterService', function (urlService, $http , $q , generator, UserFilter , _) {
        'ngInject';
        var self = this;
        self.serviceName = 'userFilterService';

        self.userFilters = [];

        /**
         * @description load userFilters from server.
         * @returns {Promise|userFilters}
         */
        self.loadUserFilters = function () {
            return $http.get(urlService.userFilters).then(function (result) {
                self.userFilters = generator.generateCollection(result.data.rs, UserFilter, self._sharedMethods);
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
         * @return {Promise|UserFilter}
         */
        self.addUserFilter = function (userFilter) {
            return $http
                .post(urlService.userFilters,
                    generator.interceptSendInstance('UserFilter', userFilter))
                .then(function () {
                    return userFilter;
                });
        };
        /**
         * @description make an update for given userFilter.
         * @param userFilter
         * @return {Promise|UserFilter}
         */
        self.updateUserFilter = function (userFilter) {
            return $http
                .put(urlService.userFilters,
                    generator.interceptSendInstance('UserFilter', userFilter))
                .then(function () {
                    return userFilter;
                });
        };
        /**
         * @description delete given classification.
         * @param userFilter
         * @return {Promise}
         */
        self.deleteUserFilter = function (userFilter) {
            var id = userFilter.hasOwnProperty('id') ? userFilter.id : userFilter;
            return $http
                .delete((urlService.userFilters + '/' + id));
        };
        /**
         * @description create the shred method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteUserFilter, self.updateUserFilter);

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

    });
};
