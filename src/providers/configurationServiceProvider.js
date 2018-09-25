module.exports = function (app) {
    app.provider('configurationService', function () {
        var provider = this, configuration = {
            SEARCH_YEARS: 2000
        };
        var configurationServiceProvider = provider;
        /**
         *
         * @param Key
         * @param value
         * @return {configurationServiceProvider}
         */
        provider.updateConfiguration = function (Key, value) {
            
            return this;
        };

        provider.$get = function () {
            return configuration;
        }
    });
};