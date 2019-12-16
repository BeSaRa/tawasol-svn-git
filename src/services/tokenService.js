module.exports = function (app) {
    app.provider('tokenService', function () {
        'ngInject';
        var self = this,
            token = false,
            headerTokenKey = 'tawasol-auth-header',
            tokenKey = 'cmsToken',
            lastLoginOrganizationIDKey = 'lastLoginOrganizationID',
            defaultExpiryValue = 60,
            refresh = true,
            urls = [],
            runTimeUrls = [],
            excludedFromUpdateTokenUrls = [],
            $http = null, // set from langDirective
            authenticationService = null, // set from langDirective
            themeService = null,  // set from langDirective
            rootEntity = null;// set from langDirective
        /**
         * set last Login organization id Key
         * @param key
         */
        self.setLastLoginOrganizationIdKey = function (key) {
            lastLoginOrganizationIDKey = key;
        };
        /**
         * get last login organization id Key
         * @returns {string}
         */
        self.getLastLoginOrganizationIdKey = function () {
            return lastLoginOrganizationIDKey;
        };
        /**
         * to change header token key if need
         * @param key
         * @returns {*}
         */
        self.setHeaderTokenKey = function (key) {
            headerTokenKey = key;
            return self;
        };
        /**
         * get header token key
         * @returns {string}
         */
        self.getHeaderTokenKey = function () {
            return headerTokenKey;
        };
        /**
         * set token key in cookies
         * @param key
         * @returns {*}
         */
        self.setTokenKey = function (key) {
            tokenKey = key;
            return self;
        };
        /**
         * to get refresh status for application
         */
        self.getRefreshStatus = function () {
            return refresh;
        };
        /**
         * get token for current logged in user
         * @returns {string}
         */
        self.getTokenKey = function () {
            return tokenKey;
        };
        /**
         * get token for current logged in user
         * @returns {boolean}
         */
        self.getToken = function () {
            return token;
        };
        /**
         * set token for current logged in user
         * @param yourToken
         * @returns {*}
         */
        self.setToken = function (yourToken) {
            token = yourToken;
            refresh = false;
            return self;
        };
        /**
         * destroy current session
         */
        self.destroy = function () {
            token = null;
            refresh = true;
        };
        /**
         * to exclude url from sending token
         * @param url
         * @returns {*}
         */
        self.excludeTokenFromUrl = function (url) {
            urls.push(url);
            return self;
        };
        /**
         * to exclude url from update the token in cookies.
         * @param url
         * @return {*}
         */
        self.excludeUpdateToken = function (url) {
            excludedFromUpdateTokenUrls.push(url);
            return self;
        };
        /**
         * to return the excluded from update token.
         * @return {Array}
         */
        self.getExcludedUpdateTokenUrls = function () {
            return excludedFromUpdateTokenUrls;
        };
        /**
         * get excluded urls token
         * @returns {Array}
         */
        self.getExcludedUrls = function () {
            return urls;
        };
        self.getExcludedRunTimeUrls = function () {
            return runTimeUrls;
        };

        self.$get = function ($cookies, $q, urlService, $timeout, lookupService, employeeService) {
            'ngInject';
            return {
                tokenRefresh: function () {
                    var service = this;
                    var defer = $q.defer();
                    if (!self.getRefreshStatus() && service.getToken()) {
                        defer.resolve(service.getToken());
                    } else if (self.getRefreshStatus() && service.getToken()) {
                        $http
                            .post(urlService.validateToken, {ouId: authenticationService.getLastLoginOrganizationId()})
                            .then(function (result) {
                                result = result.data.rs;
                                if (result.hasOwnProperty('token')) {
                                    lookupService.setLookups(result.globalLookup); // set lookups
                                    rootEntity.setRootEntityGlobalSetting(result.globalSetting, true);
                                    var themeId = result.userInfo.defaultThemeID;
                                    var promise = $q.defer();
                                    $timeout(function () {
                                        if (!themeId) {
                                            promise.resolve(true);
                                            return;
                                        }
                                        themeService.loadThemeById(themeId).then(function (theme) {
                                            themeService.setCurrentTheme(theme);
                                            promise.resolve(true);
                                        }, function () {
                                            promise.resolve(true);
                                        });
                                    });
                                    promise.promise.then(function () {
                                        employeeService.setEmployee(result);
                                        service.setToken(service.getToken());
                                        defer.resolve(service.getToken());
                                    });
                                } else {
                                    defer.reject(false);
                                }
                            })
                            .catch(function () {
                                defer.reject(false);
                            })
                    } else {
                        defer.reject(true);
                    }
                    return defer.promise;
                },
                getToken: function () {
                    var currentToken = $cookies.get(self.getTokenKey());
                    return currentToken ? (self.getRefreshStatus() ? currentToken : (currentToken === self.getToken() ? currentToken : false)) : false;
                },
                setToken: function (token, expiry) {
                    var date = (new Date());
                    date.setMinutes(date.getMinutes() + (expiry || defaultExpiryValue));
                    $cookies.put(self.getTokenKey(), token, {
                        expires: date
                    });
                    self.setToken(token);
                },
                destroy: function () {
                    self.destroy();
                    $cookies.remove(self.getTokenKey());
                },
                setTokenForHeader: function (config) {
                    if (self.getExcludedUrls().indexOf(config.url) > -1 || self.getExcludedRunTimeUrls().indexOf(config.url) > -1) {
                        delete config.headers[self.getHeaderTokenKey()];
                        return config;
                    }

                    if (this.getToken())
                        config.headers[self.getHeaderTokenKey()] = this.getToken();

                    return config;
                },
                getLastLoginOrganizationIdKey: function () {
                    return self.getLastLoginOrganizationIdKey();
                },
                setRequireServices: function (http, authentication, theme, entity) {
                    $http = http;
                    authenticationService = authentication;
                    themeService = theme;
                    rootEntity = entity;
                },
                getRefreshStatus: function () {
                    return self.getRefreshStatus();
                },
                forceTokenRefresh: function () {
                    refresh = true;
                    return this.tokenRefresh();
                },
                getExcludedUpdateTokenUrls: function () {
                    return self.getExcludedUpdateTokenUrls();
                },
                excludeUrlInRuntime: function (url) {
                    runTimeUrls.push(url);
                },
                getExcludedRunTimeUrls: function () {
                    return runTimeUrls;
                },
                removeRunTimeUrl: function (url) {
                    runTimeUrls.splice(runTimeUrls.indexOf(url), 1);
                }

            }
        }
    });


};
