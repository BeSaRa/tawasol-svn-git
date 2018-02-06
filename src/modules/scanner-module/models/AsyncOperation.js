module.exports = function (app) {
    app.factory('AsyncOperation', function (TaskStatus , getDefaultRequest , ajaxRequest) {
        'ngInject';
        return function AsyncOperation(service, session, request, progressCallback, finishedCallback) {

            var _serviceUrl = service;
            var _sessionId = session;
            var self = this;
            request.success = function (data) {
                _asynOperationcCallback.call(self, data, progressCallback, finishedCallback)
            };
            ajaxRequest(request);

            var _asynOperationcCallback = function (data, pCallback, callback) {
                var self = this;
                if (data.Status === 0 && data.StatusCode === TaskStatus.InProgress) {
                    window.setTimeout(function () {
                        _pollSession.call(self, data.TokenID, pCallback, callback);
                    }, 1000);
                } else {
                    callback(data);
                }
            };

            var _pollSession = function (tokenID, progressCallback, finishedCallback) {
                var self = this;
                var request = getDefaultRequest();
                var pollSessionCallback = function (data) {
                    if (data.Status === 0 && data.StatusCode === TaskStatus.InProgress) {
                        if (progressCallback) {
                            progressCallback(data);
                        }
                        window.setTimeout(function () {
                            _pollSession.call(self, data.TokenID, progressCallback, finishedCallback);
                        }, 1000);
                    } else {
                        finishedCallback(data);
                    }
                };
                request.url = _serviceUrl + "getstatus?session=" + _sessionId + "&tokenid=" + tokenID;
                request.success = pollSessionCallback;
                ajaxRequest(request);
            };
        };
    })
};