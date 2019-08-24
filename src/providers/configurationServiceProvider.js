module.exports = function (app) {
    app.provider('configurationService', function () {
        var provider = this, configuration = {
            SEARCH_YEARS: 2000,
            IGNORE_HTTPS_FOR_SCANNER: false,
            SCANNER_HTTPS_PORTS: [49735, 49736, 49737],
            SCANNER_HTTP_PORTS: [49732/*, 49733, 49734*/],
            CORRESPONDENCE_SITES_TYPES_LOOKUPS: [1 /* internal sites */, 3 /* g2g sites */, 5 /* internal g2g sites */],
            OFFICE_ONLINE_DELAY: 3000,
            DEFAULT_START_TASK_TIME: '08:00',
            DEFAULT_SEND_RELATED_DOCS: true ,
            ICN_ENTRY_TEMPLATE_MENU_TYPE: 3,
            ICN_SEARCH_TEMPLATE_MENU_TYPE: 4
        };
        var configurationServiceProvider = provider;
        /**
         *
         * @param key
         * @param value
         * @param unionArray
         * @return {configurationServiceProvider}
         */
        provider.updateConfiguration = function (key, value, unionArray) {
            if (configuration.hasOwnProperty(key)) {
                if (angular.isArray(configuration[key]) && unionArray) {
                    configuration[key] = configuration[key].concat(value);
                } else {
                    configuration[key] = value;
                }
            }
            return this;
        };

        provider.$get = function () {
            return configuration;
        }
    });
};
