module.exports = function (app) {
    app.provider('resolver', function () {
        'ngInject';
        var self = this,
            resolves = {},
            resolvesToAll = {},
            stateProvider = {},
            exclude = {};

        self.setStateProvider = function (provider) {
            stateProvider = provider;
            return self;
        };

        function addResolve(stateName, resolveName, callback) {
            if (resolves.hasOwnProperty(stateName)) {
                if (resolves[stateName].hasOwnProperty(resolveName)) {
                    console.log("StateName: ", "HAS THIS RESOLVE NAME BEFORE: ", resolveName);
                    return self;
                }
            } else {
                resolves[stateName] = {};
            }
            resolves[stateName][resolveName] = callback;
            return self;
        }

        self.resolveToState = function (stateName, resolveName, callback) {
            if (angular.isArray(stateName)) {
                for (var i = 0; i < stateName.length; i++) {
                    addResolve(stateName[i], resolveName, callback);
                }
            } else {
                addResolve(stateName, resolveName, callback);
            }
            return self;
        };

        self.resolveToAllState = function (resolveName, callback) {
            if (resolvesToAll.hasOwnProperty(resolveName)) {
                console.log("Repeated Resolve Inside Resolve ALL: ", "HAS THIS RESOLVE NAME BEFORE: ", resolveName);
                return self;
            }
            resolvesToAll[resolveName] = callback;
            return self;
        };

        self.bulkResolveToState = function (stateName, resolve) {
            var resolveKeys = Object.keys(resolve);
            for (var i = 0; i < resolveKeys.length; i++) {
                self.resolveToState(stateName, resolveKeys[i], resolve[resolveKeys[i]]);
            }
            return self;
        };

        self.bulkResolveToAllState = function (resolve) {
            var resolveKeys = Object.keys(resolve);
            for (var i = 0; i < resolveKeys.length; i++) {
                self.resolveToAllState(resolveKeys[i], resolve[resolveKeys[i]]);
            }
            return self;
        };

        self.excludeResolveFrom = function (resolveName, stateNames) {

            if (!angular.isArray(stateNames)) {
                if (!exclude.hasOwnProperty(stateNames)) {
                    exclude[stateNames] = [];
                }
                exclude[stateNames].push(resolveName);
            } else {
                for (var i = 0; i < stateNames.length; i++) {
                    if (!exclude.hasOwnProperty(stateNames[i])) {
                        exclude[stateNames[i]] = [];
                    }
                    exclude[stateNames[i]].push(resolveName);
                }
            }
            return self;
        };

        self.registerResolver = function () {
            if (!stateProvider.hasOwnProperty('state')) {
                console.error("please provide me with stateProvider");
                return false;
            }
            var originalState = stateProvider.state;

            stateProvider.state = function (stateName, route) {
                if (!route.hasOwnProperty('resolve')) {
                    route.resolve = {};
                }

                // to override resolve for specific state
                if (Object.keys(resolvesToAll).length) {
                    route.resolve = angular.extend(route.resolve, resolvesToAll);
                }

                if (resolves.hasOwnProperty(stateName)) {
                    route.resolve = angular.extend(route.resolve, resolves[stateName]);
                }

                if (exclude.hasOwnProperty(stateName)) {
                    for (var i = 0; i < exclude[stateName].length; i++) {
                        if (route.resolve.hasOwnProperty(exclude[stateName][i]))
                            delete route.resolve[exclude[stateName][i]];
                    }
                }

                return originalState.call(stateProvider, stateName, route);
            }

        };


        self.$get = function () {
            'ngInject';
        }
    })
};