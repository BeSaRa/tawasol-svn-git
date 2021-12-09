module.exports = function (app) {
    app.service('cacheService', function ($http, langService, toast, urlService) {
        'ngInject';
        var self = this;
        self.serviceName = 'cacheService';

        self.refreshCache = function () {
            return $http
                .post(urlService.refreshCache)
                .then(function () {
                    toast.success(langService.get('cache_refreshed_successfully'));
                    return true;
                });
        }

    });
};
