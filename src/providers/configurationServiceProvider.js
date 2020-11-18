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
            // PSPDF_LICENSE_KEY: false,
            PSPDF_LICENSE_KEY: 'Onl2Q0e1go6bqEygUIxNj-FPmkcpLLqE0fXNcvMIZC9z073qKaQpFE35vTVXN2GAqUeaOXzL9OT11lWn8YvOY1XY9tFVmPcj-9YDu4vCnyj5-Z6XmP4hj4r3_ZlMIGwQ2-83euah5F45aWhov1xA0Xp43Z-S9LCl11Q1dqG8nnrX6x9S0ONX5_E4UG93HP1hPYQI2_mNG4Lj8jlVxfSupFj6hK9T_Ma-D-PGZ-qVCLmKDeie1buTo9ycJ5QxmlHkKRJA7NKOLo0_siScXumHmLaYS1gVBfxq-Fj-kg9OPNggn0AQ2FcfeWyzR2Yq8mlTHnc5FwQ39uaYHz1_jHg4CsEmXPxBhcK7ldQC8odBZxG6NkWDrIwj60sWXJcn0_Yg7K00HrMI__OMXlqP94vQRUlFEz3jq3E53IVuPV72YP8ib9AdC5FMTmhKOW0TCRjx',
            REPLICATION_EXCLUDED_LIST: ['Note', 'Highlight', 'Squiggle', 'StrikeOut', 'Underline', 'Redaction'],
            OFFICIAL_ATTACHMENT_EXCLUDED_TOOLBAR_ITEMS : [
                "annotate",
                "ink",
                "highlighter",
                "text-highlighter",
                "ink-eraser",
                "image",
                "note",
                "text",
                "line",
                "arrow",
                "rectangle",
                "ellipse",
                "polyline",
                "polygon",
                "document-editor",
                "barcode",
                "stamp",
                "custom-stamps",
                "username-date",
                // "approve",
                // "ink-signature",
            ],
            READY_TO_EXPORT_EXCLUDED_TOOLBAR_ITEMS : [
                "annotate",
                "ink",
                "highlighter",
                "text-highlighter",
                "ink-eraser",
                "ink-signature",
                "image",
                "note",
                "text",
                "line",
                "arrow",
                "rectangle",
                "ellipse",
                "polyline",
                "polygon",
                "document-editor",
                "approve",
                // "barcode",
            ],
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
