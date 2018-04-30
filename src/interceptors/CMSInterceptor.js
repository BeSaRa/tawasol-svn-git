module.exports = function (app) {
    app.factory('CMSInterceptor', function (tokenService, loadingIndicatorService, exception, $q) {
        'ngInject';
        var countRequests = 0;
        return {
            // to adjust the request before sending.
            request: function (config) {
                exception.request(config);
                if (!config.hasOwnProperty('excludeLoading')) {
                    countRequests += 1;
                    loadingIndicatorService.startLoading();
                }
                return tokenService.setTokenForHeader(config);
            },
            // when request has an error while send process.
            requestError: function (result) {
                exception.requestError(result);
                if (!result.config.hasOwnProperty('excludeLoading')) {
                    countRequests -= 1;
                }
                !countRequests ? loadingIndicatorService.endLoading() : null;
                return $q.reject(result);
            },
            // after getting response
            response: function (result) {
                exception.response(result);
                if (!result.config.hasOwnProperty('excludeLoading')) {
                    countRequests -= 1;
                }
                !countRequests ? loadingIndicatorService.endLoading() : null;
                return result;
            },
            // when response has an error.
            responseError: function (result) {
                exception.responseError(result);
                if (!result.config.hasOwnProperty('excludeLoading')) {
                    countRequests -= 1;
                }
                !countRequests ? loadingIndicatorService.endLoading() : null;
                return $q.reject(result);
            }
        }
    })
};