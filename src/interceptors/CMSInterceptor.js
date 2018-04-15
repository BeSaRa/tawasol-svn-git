module.exports = function (app) {
    app.factory('CMSInterceptor', function (tokenService, loadingIndicatorService, exception, $q) {
        'ngInject';
        return {
            // to adjust the request before sending.
            request: function (config) {
                exception.request(config);
                if (config.hasOwnProperty('loading') && !config.loading) {

                } else {
                    loadingIndicatorService.startLoading();
                }
                return tokenService.setTokenForHeader(config);
            },
            // when request has an error while send process.
            requestError: function (reason) {
                //console.log("ASDAD", reason);
                exception.requestError(reason);
                loadingIndicatorService.endLoading();
                return $q.reject(reason);
            },
            // after getting response
            response: function (result) {
                // console.log("RESULT", result);
                exception.response(result);
                loadingIndicatorService.endLoading();
                return result;
            },
            // when response has an error.
            responseError: function (rejection) {
                exception.responseError(rejection);
                loadingIndicatorService.endLoading();
                return $q.reject(rejection);
            }
        }
    })
};