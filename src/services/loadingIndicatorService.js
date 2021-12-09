module.exports = function (app) {
    app.service('loadingIndicatorService', function ($timeout) {
        'ngInject';
        var self = this;
        self.loading = false;
        /**
         * to start loading status
         */
        self.startLoading = function () {
            if (!self.loading)
                self.loading = true;
        };
        /**
         * @description force start loading
         */
        self.forceStartLoading = function () {
            self.loading = true;
        };
        /**
         * force end loading
         */
        self.forceEndLoading = function () {
            self.loading = false;
        };
        /**
         * to end loading status
         */
        self.endLoading = function () {
            if (self.loading)
                self.loading = false;
        };

    })
};