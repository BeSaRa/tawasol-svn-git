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
            // PSPDF_LICENSE_KEY: 'KG-tdeJHigxiE508_pkWvgUZPYz6IEWokopt21j2R_aV6sWdLtDmjWWdES4JUmYA9-RSJ191Gm5CHK2-ydujckel5gXG_hzwN97K8I48FRQvEU20eJqR_nRmAoOm0fwVTVixPkbhWScti5fnOdOTyl3AhD8a6hUptG9hH1yBniAanexj-GsT0EUfGTwfKmfnKGOt_hw5Y7i_FOfM_F9kGXby-8l31NsdVt1mkyVStp3m1bKleOCgceP8UTMj1ruxvn9Ct47RVk4vrNjoajCYHIgDrgJW-yWPB_iyYV0FOspCHaSKTrN70Bi2a7X7lWBKSn8QMNkWndAs6SZHRLTXm9PcYYz1RL57TatlmJuAHoR2nFN-6HEH4zfJQ3Hw3qFenuN5TLn49BvqkzlLcVRWM2E_O06KV0E53hZFDUYwe3tx2iP__RMg4put1-88CcTLi2hodRjamZD7vkS6ofIAZw==',
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
            SIGNATURE_BOX_SIZE: {width: 112, height: 47},
            CUSTOM_STAMP_SIZE: {width: 112, height: 88},
            BARCODE_BOX_SIZE: {width: 108, height: 58},
            USER_INFO_ANNOTATION_IDS: {
                date: 1,
                jobTitle: 2,
                username: 3
            },
            CHAT_BOT: {
                ENABLED: true,
                URL: 'http://tawasolbot-b750.azurewebsites.net/chatbot.html?',
                APPEND_TOKEN: true
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
