module.exports = function (app) {
    app.factory('CMSInterceptor', function (tokenService, loadingIndicatorService, exception, $q) {
        'ngInject';
        var countRequests = 0;
        return {
            // to adjust the request before sending.
            request: function (config) {
                exception.request(config);
                if (config.hasOwnProperty('loading') && !config.loading) {

                } else {
                    countRequests += 1;
                    loadingIndicatorService.startLoading();
                }
                return tokenService.setTokenForHeader(config);
            },
            // when request has an error while send process.
            requestError: function (reason) {
                exception.requestError(reason);

                if (reason.config.hasOwnProperty('loading') && !reason.config.loading) {

                } else {
                    countRequests -= 1;
                }
                !countRequests ? loadingIndicatorService.endLoading() : null;
                return $q.reject(reason);
            },
            // after getting response
            response: function (result) {
                exception.response(result);
                if (result.config.hasOwnProperty('loading') && !result.config.loading) {

                } else {
                    countRequests -= 1;
                }
                !countRequests ? loadingIndicatorService.endLoading() : null;
                return result;
            },
            // when response has an error.
            responseError: function (rejection) {
                exception.responseError(rejection);
                if (rejection.config.hasOwnProperty('loading') && !rejection.config.loading) {

                } else {
                    countRequests -= 1;
                }
                !countRequests ? loadingIndicatorService.endLoading() : null;
                return $q.reject(rejection);
            }
        }
    })
};