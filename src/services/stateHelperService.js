module.exports = function (app) {
    app.service('stateHelperService', function (_, $state) {
        'ngInject';
        var self = this;
        self.serviceName = 'stateHelperService';
        self.states = [];

        /**
         * get Updated states
         */
        self.getUpdatedStates = function () {
            self.states = $state.get();
            return self;
        };
        /**
         * Get State By url
         * @param url
         */
        self.getStateByUrl = function (url) {
            return _.find(self.states, function (state) {
                var privatePortion = state.$$state();
                return privatePortion.url.exec(url);
            });
        }
    })
};