module.exports = function (app) {
    app.factory('ResolveDefer', function () {
        'ngInject';
        return function ResolveDefer(defer, data) {
            if (defer)
                defer.resolve(data || true);
        }
    })
};