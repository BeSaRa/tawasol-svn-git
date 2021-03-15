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
            // PSPDF_LICENSE_KEY: 'wMyBDBZ7S3YrSWLKk0MWlZY4sLpYmEg0JgfjJc_UNbZyjQyNIGum49F34rkXv3CtbEk4mSlReFHf_xh9V2rlPfDTU4OVnEloZO_sfiFU96elhZbOezowI9lG9Mp4VH9MIrH1E4koWZPCrn6shKFvE-9T0Z3TQ58O9_Jfo72pKFPln_8RhDx579fvJkQ-kwQCITcSl6RYaESckLYvYcWInfh5EIdKELzuxGnKwb9ci9MQs3aZJQUasxwxvIIbZrS0K4bOjh9lKz9RDAMKL8uLQelQ5y6d28V77TW1g1PuZJNnQ66rcNBXwmciXCKT-MFDLyU-QlAFFOtiiO7VpfeAiXD-Bccxn_nVLwD9pQOAyRFUWrQ0vRqBnuP9k_oN0LC3ZpkDfahmOe34HDIoyFdR-ZOwj6vjXo6LrRkjyLcojzKzfRwAWnJabqgHCZDEBuryYd2Fkg_7kOuv3UDyQU2_ww==',
            REPLICATION_EXCLUDED_LIST: ['Note', 'Highlight', 'Squiggle', 'StrikeOut', 'Underline', 'Redaction'],
            OFFICIAL_ATTACHMENT_EXCLUDED_TOOLBAR_ITEMS: [
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
                // "custom-stamps",
                // "username-date",
                // "approve",
                // "ink-signature",
            ],
            READY_TO_EXPORT_EXCLUDED_TOOLBAR_ITEMS: [
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
            SELECT_MAIN_SITE_IF_ONLY_ONE: true,
            REASONABLE_INK_SIGNATURE_SIZE: {width: 120, height: 57},
            USER_INFO_ANNOTATION_IDS: {
                date: 1,
                jobTitle: 2,
                username: 3
            }
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
