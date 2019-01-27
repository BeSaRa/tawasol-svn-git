module.exports = function (app) {
    app.service('counterService', function (urlService,
                                            errorCode,
                                            $http,
                                            $q,
                                            generator,
                                            Counter,
                                            _,
                                            $interval) {
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

        self.loadG2GCounter = function () {
            return $http.get(urlService.g2gInbox + 'counters', {
                excludeLoading: true
            }).then(function (result) {
                result = result.data.rs;
                self.counter.g2gDeptInbox = result.deptInbox;
                self.counter.g2gDeptReturned = result.deptReturned;
                self.counter.mapCounter();
                return self.counter;
            })
        };

        self.intervalG2GCounters = function () {
            // load g2g countess after every 15 minutes
            $interval(function () {
                self.loadG2GCounter();
            }, (15 * 60 * 1000));
        };


    });
};
