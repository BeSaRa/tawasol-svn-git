/**
 * @author BeSaRa
 * @param app
 * @name urlServiceProvider
 */
module.exports = function (app) {
    app.provider('urlService', function urlServiceService() {
        'ngInject';
        var self = this,
            environments = {},
            segments = {},
            currentEnv = null;

        /**
         * get Environment object by name
         * @param env
         * @returns {string}
         */
        function getEnv(env) {
            return env.toLowerCase();
        }

        /**
         * add url to specific Environment
         * @param key
         * @param value
         * @param environment
         * @returns {boolean}
         */
        function addUrl(key, value, environment) {
            var env = getEnv(environment);
            if (!environments.hasOwnProperty(env)) {
                // $log.debug('Please Select the Right Environment to add your url');
                environments[env] = {};
            }


            if (environments[env].hasOwnProperty(key)) {
                $log.debug(environment + ' Environment :  you have already this url:' + key + " " +
                    "with this value before : ",
                    environments[key] + " and now you override it with : " + value);
            }
            environments[env][key] = value;
        }

        /**
         * add url to Development Environment
         * @param key
         * @param value
         */
        self.addToDev = function (key, value) {
            addUrl(key, value, 'dev');
        };
        /**
         * add url to Test Environment
         * @param key
         * @param value
         */
        self.addToTest = function (key, value) {
            addUrl(key, value, 'test');
        };
        /**
         * add url to Development Environment
         * @param key
         * @param value
         */
        self.addToProduction = function (key, value) {
            addUrl(key, value, 'production');
        };
        /**
         * add url to Stage Environment
         * @param key
         * @param value
         */
        self.addToStage = function (key, value) {
            addUrl(key, value, 'production');
        };
        /**
         * add url to All Environment
         * @param key
         * @param values
         * @returns {urlServiceService}
         */
        self.addToAll = function (key, values) {
            var i, envArray = Object.keys(environments);
            if (angular.isArray(values)) {
                for (i = 0; i < values.length; i++) {
                    addUrl(key, values[i], envArray[i]);
                }
            } else if (angular.isString(values)) {

                for (i = 0; i < envArray.length; i++) {
                    addUrl(key, values, envArray[i]);
                }

            } else {
                for (i  in values) {
                    if (values.hasOwnProperty(i))
                        addUrl(key, values[i], i.toLowerCase());
                }
            }
            return self;
        };
        /**
         * add url to Environment with base Url for selected environment
         * @param key
         * @param value
         * @param env
         * @returns {boolean}
         */
        self.addWithBase = function (key, value, env) {
            if (!environments.hasOwnProperty(getEnv(env)))
                return false;

            var base = environments[getEnv(env)]['BASE'];

            if (!base)
                return false;

            if (base.charAt(base.length - 1) !== '/') {
                base += '/';
            }
            if (value.charAt(0) === '/')
                value = value.substr(1);

            value = base + value;

            addUrl(key, value, env);
        };
        /**
         * add to all Environments with base url
         * @param key
         * @param values
         * @returns {*}
         */
        self.addToAllWithBase = function (key, values) {
            if (!values || !key) return false;
            var i, envArray = Object.keys(environments);

            if (angular.isString(values)) {
                for (i = 0; i < envArray.length; i++) {
                    self.addWithBase(key, values, envArray[i]);
                }
            } else if (angular.isArray(values)) {
                for (i = 0; i < values.length; i++) {
                    self.addWithBase(key, values[i], envArray[i]);
                }
            } else {
                for (i in values) {
                    if (values.hasOwnProperty(i))
                        self.addWithBase(key, values[i], i.toLowerCase());
                }
            }
            return self;
        };
        /**
         * return the Environment urls
         * @returns {{devEnvironment: {}, testEnvironment: {}, stageEnvironment: {}, productionEnvironment: {}}}
         */
        self.getEnvironmentsUrl = function () {
            return environments;
        };
        /**
         * set current environment
         * @param env
         */
        self.setEnvironment = function (env) {
            env = env.toLowerCase();
            if (!environments.hasOwnProperty(env)) {
                environments[env] = {};
            }
            currentEnv = environments[env];
            return self;
        };
        /**
         * set development Bas url
         * @param value
         */
        self.setDevBaseUrl = function (value) {
            addUrl('BASE', value, 'dev');
            return self;
        };
        /**
         * set test Bas url
         * @param value
         */
        self.setTestBaseUrl = function (value) {
            addUrl('BASE', value, 'test');
            return self;
        };
        /**
         * set production Bas url
         * @param value
         */
        self.setProductionBaseUrl = function (value) {
            addUrl('BASE', value, 'production');
            return self
        };
        /**
         * set stage Bas url
         * @param value
         */
        self.setStageBaseUrl = function (value) {
            addUrl('BASE', value, 'stage');
            return self;
        };
        /**
         * set base url for given environment.
         * @param env
         * @param value
         */
        self.setBaseUrl = function (env, value) {
            addUrl('BASE', value, env);
            return self;
        };
        /**
         * @description add segment to use it later while create a new url.
         * @param key
         * @param value
         */
        self.addSegment = function (key, value) {
            if (segments.hasOwnProperty(key))
                console.error('segment already exists');

            segments[key] = value;
            return self;
        };
        /**
         * @description add url with selected segment
         * @param key
         * @param value
         * @param segmentKey
         * @return {urlServiceService}
         */
        self.addToAllWithSegment = function (key, value, segmentKey) {
            var segment = '';
            if (segmentKey && segments.hasOwnProperty(segmentKey))
                segment = segments[segmentKey];

            return self.addToAll(key, (segment + value));
        };
        /**
         * return the current environment
         * @name urlService
         * @returns {*}
         */
        self.$get = function () {
            'ngInject';
            return currentEnv;
        };
    });
};