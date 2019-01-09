module.exports = function (app) {
    app.factory('ajaxRequest', function ($timeout, $http, $rootScope, $sce) {
        'ngInject';
        return function ajaxRequest(param) {
            var method = param.type === 'GET' ? 'jsonp' : 'post';
            var successCallback = param.success;
            var errorCallback = param.error;


            $http[method]($sce.trustAsResourceUrl(param.url), (method === 'jsonp' ? {
                jsonpCallbackParam: 'method',
                params: {
                    _: Math.random()
                }
            } : param.data)).then(function (data) {
                successCallback(data.data);
            }, function (data) {
                errorCallback(data.data);
            });
        }
    });
};
