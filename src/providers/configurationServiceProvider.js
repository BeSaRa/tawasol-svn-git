module.exports = function (app) {
    app.provider('configurationService', function () {
        var provider = this, configuration = {
            SEARCH_YEARS: 2000,
            IGNORE_HTTPS_FOR_SCANNER: false,
            SCANNER_HTTPS_PORTS: [49735, 49736, 49737],
            SCANNER_HTTP_PORTS: [49732/*, 49733, 49734*/],
            OFFICE_ONLINE_DELAY: 3000
        };
        var configurationServiceProvider = provider;
        /**
         *
         * @param key
         * @param value
         * @return {configurationServiceProvider}
         */
        provider.updateConfiguration = function (key, value) {
            if (configuration.hasOwnProperty(key)) {
                configuration[key] = value;
            }
            return this;
        };

        provider.$get = function () {
            return configuration;
        }
    });
};
