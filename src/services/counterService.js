module.exports = function (app) {
    app.service('counterService', function (urlService,
                                            errorCode,
                                            $http,
                                            $q,
                                            generator,
                                            Counter,
                                            _) {
        'ngInject';
        var self = this;
        self.serviceName = 'counterService';
        self.counter = {};
        self.folderCount = {};
        /**
         * load all counters for service
         */
        self.loadCounters = function () {
            return $http
                .get(urlService.folderCount, {
                    excludeLoading: true
                })
                .then(function (folder) {
                    self.folderCount = folder.data.rs;

                    var folderCount = _.reduce(self.folderCount, function (oldValue, currentValue) {
                        return oldValue + currentValue;
                    }, 0);
                    return $http.get(urlService.counters, {
                        excludeLoading: true
                    }).then(function (result) {
                        result.data.rs.foldersCount = folderCount;
                        self.counter = generator.interceptReceivedInstance('Counter', generator.generateInstance(result.data.rs, Counter));
                        return self.counter;
                    }).catch(function (error) {
                        return errorCode.checkIf(error, 'ENTITY_NOT_FOUND', function () {
                            return $q.resolve({});
                        });
                    });
                });

        };


    });
};
