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
        var self = this, g2gInterval;
        self.serviceName = 'counterService';
        self.counter = new Counter();
        self.folderCount = {};
        self.g2gIncomingCount = {
            first: 0,
            second: 0
        };
        self.g2gReturnedCount = {
            first: 0,
            second: 0
        };

        /**
         * @description load all counters for service except G2G counters
         */
        self.loadCounters = function () {
            return $http
                .get(urlService.folderCount, {
                    excludeLoading: true
                })
                .then(function (folder) {
                    self.folderCount = folder.data.rs;

                    var firstCount = _.reduce(folder.data.rs, function (oldValue, currentValue) {
                        return oldValue + currentValue.first;
                    }, 0);

                    var secondCount = _.reduce(folder.data.rs, function (oldValue, currentValue) {
                        return oldValue + currentValue.second;
                    }, 0);

                    return $http.get(urlService.counters, {
                        excludeLoading: true
                    }).then(function (result) {
                        result.data.rs.foldersCount = {
                            first: firstCount,
                            second: secondCount
                        };
                        // keep the g2g counters with original values unless reloaded by service after given interval
                        result.data.rs.g2gDeptInbox = angular.copy(self.g2gIncomingCount);
                        result.data.rs.g2gDeptReturned = angular.copy(self.g2gReturnedCount);

                        self.counter = generator.interceptReceivedInstance('Counter', generator.generateInstance(result.data.rs, Counter));
                        self.counter.overdueDocuments = self.counter.overdueIncomingDocuments = self.counter.overdueOutgoingDocuments = {
                            first: 0,
                            second: 0
                        };
                        return self.counter;
                    }).catch(function (error) {
                        return errorCode.checkIf(error, 'ENTITY_NOT_FOUND', function () {
                            return $q.resolve({});
                        });
                    });
                });

        };

        /**
         * @description Loads the G2G counters
         */
        self.loadG2GCounters = function () {
            return $http.get(urlService.g2gInbox + 'counters', {
                excludeLoading: true
            }).then(function (result) {
                result = result.data.rs;
                self.g2gIncomingCount = result.deptInbox;
                self.g2gReturnedCount = result.deptReturned;

                self.counter.g2gDeptInbox = result.deptInbox;
                self.counter.g2gDeptReturned = result.deptReturned;
                self.counter.mapCounter();
                return self.counter;
            }).catch(function () {
                self.stopG2GCounter();
            })
        };

        /**
         * @description Starts/Reset the G2G counters request interval
         */
        self.intervalG2GCounters = function () {
            // load g2g countess after every 15 minutes
            self.stopG2GCounter();
            g2gInterval = $interval(function () {
                self.loadG2GCounters().catch(function () {
                    self.stopG2GCounter();
                });
            }, (15 * 60 * 1000));
        };

        self.loadOverdueCounters = function () {
            return $http.get(urlService.overdueCounters).then(function (result) {
                self.counter.overdueOutgoingDocuments = {
                    first: result.data.rs.first,
                    second: 0
                };
                self.counter.overdueIncomingDocuments = {
                    first: result.data.rs.second,
                    second: 0
                };
                return self.counter;
            })
        };

        /**
         * @description Stops the G2G counter service requests
         */
        self.stopG2GCounter = function () {
            if (g2gInterval)
                $interval.cancel(g2gInterval);
        };

    });
};
