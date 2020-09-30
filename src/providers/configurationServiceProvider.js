module.exports = function (app) {
    app.provider('configurationService', function () {
        'ngInject';
        var provider = this, configuration = {
            SEARCH_YEARS: 2000,
            IGNORE_HTTPS_FOR_SCANNER: false,
            SCANNER_HTTPS_PORTS: [49735, 49736, 49737],
            SCANNER_HTTP_PORTS: [49732/*, 49733, 49734*/],
            CORRESPONDENCE_SITES_TYPES_LOOKUPS: [1 /* internal sites */, 3 /* g2g sites */, 5 /* internal g2g sites */],
            G2G_CORRESPONDENCE_SITES_TYPE: 3,
            OFFICE_ONLINE_DELAY: 3000,
            DEFAULT_START_TASK_TIME: '08:00',
            DEFAULT_SEND_LINK_TIME: '20:00',
            DEFAULT_SEND_RELATED_DOCS: true,
            ICN_ENTRY_TEMPLATE_MENU_TYPE: 3,
            ICN_SEARCH_TEMPLATE_MENU_TYPE: 4,
            STATES_DISABLED_WHILE_ADD_TASK: [1],
            G2G_QATAR_SOURCE: true,
            FOLLOWUP_BOOK_FILTER_START_BEFORE_TYPE: 'days', //'months', 'days'
            FOLLOWUP_BOOK_FILTER_START_BEFORE_VALUE: 30,
            ANNOTATE_DOCUMENT_PERMISSION: '',
            APP_CONTEXT: 'ui',
            PSPDF_LICENSE_KEY: false,
            // PSPDF_LICENSE_KEY: 'S_5u8iQ-OhOsT7ZqKwy0fo0oX4tCg935ILEFDW1wGNtmVVQc8WbCo3GQxa4re9f1LyMdRQiNMc_DEp_pOurQZIBDsk67Vf4oBNJ-w8wKGYyDTBGe0u6InMe2zky4S3GXvO5rmmKPTObkerfi7y1GHKb5kguP02eynRtmXe596YpF6ZpcUaMZXUwoqgDDn9FuzRgcRGKRvtEBtGgKnKQKuDoLqBDp9GXAAUSLVR1xnsXXx1dnogCLQbGp_6MeEomXCf9EX8YJNx9tk06MOUzp1DYbl5q0LNGRE6fcgA11wpsA0Z-s0Vx7ampbopBR39pCcRQKDWkUOyMeQbW9-QZJWfs5YkmejVZJXv8m29B7YFAyVA5-7ejGH5yrsNZjA-UYI1giNZbMG1Y5La3wAn6Ll_uhc9KSP-spuBKViuBbGNX7Bg2O66fi9_jvSmM34DVe',
            REPLICATION_EXCLUDED_LIST: ['Note', 'Highlight', 'Squiggle', 'StrikeOut', 'Underline', 'Redaction'],
            SELECT_MAIN_SITE_IF_ONLY_ONE: true
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
            'ngInject';
            return configuration;
        }
    });
};
