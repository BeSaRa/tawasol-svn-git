module.exports = function (app) {
    app.service('titleService', function () {
        'ngInject';
        var self = this;
        self.serviceName = 'titleService';

        self.suffix = '';
        self.prefix = '';
        self.title = '';
        /**
         * set title for the Current page
         * @param title - (require) the title for page
         * @param prefix - (optional) prefix before title
         * @param suffix - (optional) suffix after title
         */
        self.setTitle = function (title, prefix, suffix) {
            if (!title)
                return;

            self.title = title;
            prefix && self.setPrefix(prefix);
            suffix && self.setSuffix(suffix);
        };
        /**
         * set prefix for the title
         * @param prefix
         */
        self.setPrefix = function (prefix) {
            self.prefix = prefix || '';
        };
        /**
         * set suffix for the title
         * @param suffix
         */
        self.setSuffix = function (suffix) {
            self.suffix = suffix || '';
        };

    });
};