module.exports = function (app) {
    app.factory('getDefaultRequest', function (networkErrorCallback) {
        'ngInject';
        return function getDefaultRequest() {
            return {
                type: 'GET',
                contentType: 'application/json; charset=utf-8',
                dataType: 'jsonp',
                jsonp: 'method',
                timeout: 30000,
                error: networkErrorCallback,
                cache: false,
                url: '',
                success: null
            };
        }
    })
};
