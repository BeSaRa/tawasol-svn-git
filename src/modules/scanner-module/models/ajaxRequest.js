module.exports = function (app) {
    app.factory('ajaxRequest', function ($timeout, $rootScope, $sce) {
        'ngInject';
        return function ajaxRequest(param) {
            var successCallback = param.success;
            var errorCallback = param.error;
            if (!param.$ignore) {
                param.success = function (data) {
                    $rootScope.$apply(function () {
                        successCallback(data);
                    });
                };
                param.error = function (error) {
                    $rootScope.$apply(function () {
                        errorCallback(error);
                    });
                };
            }
            delete param.$ignore;

            $.ajax(param);
        }
    });
};
