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
         * to end loading status
         */
        self.endLoading = function () {
            if (self.loading)
                self.loading = false;
        };

    })
};