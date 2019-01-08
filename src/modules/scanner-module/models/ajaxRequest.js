module.exports = function (app) {
    app.factory('ajaxRequest', function ($timeout, $http, $rootScope, $sce) {
        'ngInject';
        return function ajaxRequest(param) {
            var successCallback = param.success;
            var errorCallback = param.error;
            $http.jsonp($sce.trustAsResourceUrl(param.url), {
                jsonpCallbackParam: 'method',
                params: {
                    _: Math.random()
                }
            }).then(function (data) {
                successCallback(data.data);
            }, function (data) {
                errorCallback(data.data);
            });
        }
    });
}
