module.exports = function (app) {
    app.provider('exception', function () {
        'ngInject';

        function Exception(url, callback, regex) {
            this.url = url;
            this.callback = callback;
            this.regex = regex;
        }

        var self = this,
            listeners = {},
            exceptions = [],
            generalListeners = {};

        function registerException(url, callback) {
            exceptions.push(new Exception(url, callback, url instanceof RegExp));
            return self;
        }

        self.getExceptions = function () {
            return exceptions;
        };
        self.addListener = function (url, exception) {
            if (!listeners.hasOwnProperty(url)) {
                listeners[url] = [];
            }
            listeners[url].push(exception);
        };
        self.runGeneralListener = function (xhr) {
            if (!generalListeners.hasOwnProperty(xhr.status))
                return;

            var length = generalListeners[xhr.status].length;
            for (var i = 0; i < length; i++) {
                generalListeners[xhr.status][i](xhr);
            }
        };

        self.runListener = function (url, xhr) {
            self.runGeneralListener(xhr);

            if (!listeners.hasOwnProperty(url))
                return;
            var length = listeners[url].length;
            for (var i = 0; i < length; i++) {
                listeners[url][i].callback(xhr.status, xhr);
            }
            self.deleteListener(url);
        };

        self.deleteListener = function (url) {
            if (listeners.hasOwnProperty(url)) {
                delete listeners[url];
            }
        };

        self.addExceptionHandler = function (url, callback) {
            if (angular.isArray(url)) {
                for (var i = 0; i < url.length; i++) {
                    registerException(url[i], callback);
                }
                return self;
            }
            return registerException(url, callback);
        };

        self.addGeneralExceptionHandler = function (statusCode, callback) {
            statusCode = Number(statusCode);
            if (!generalListeners.hasOwnProperty(statusCode)) {
                generalListeners[statusCode] = [];
            }
            generalListeners[statusCode].push(callback);
            return self;
        };

        self.$get = function () {
            'ngInject';
            return angular.extend({
                checkUrlValidation: function (url, exception) {
                    if (exception.regex) {
                        if (exception.url.test(url)) {
                            self.addListener(url, exception);
                        }
                    } else if (url === exception.url) {
                        self.addListener(url, exception);
                    }
                },
                request: function (config) {
                    var list = self.getExceptions();
                    for (var i = 0; i < list.length; i++) {
                        this.checkUrlValidation(config.url, list[i])
                    }
                },
                requestError: function (config) {
                    self.runListener(config.url, config);
                },
                response: function (xhr) {
                    self.deleteListener(xhr.config.url);
                },
                responseError: function (xhr) {
                    console.log(xhr);
                    self.runListener(xhr.config.url, xhr);
                }
            },self);
        }
    })
};