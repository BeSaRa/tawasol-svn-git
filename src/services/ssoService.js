module.exports = function (app) {
    app.service('ssoService', function ($q) {
        'ngInject';
        var self = this;
        self.defer = null;
        self.promise = null;

        self.initPromise = function () {
            self.defer = $q.defer();
            self.promise = self.defer.promise;
        }

        self.notify = function (value) {
            self.defer.notify(value);
        }

        self.resolve = function (value) {
            console.log(value);
            self.defer.resolve(value);
        }

        self.reject = function (value) {
            self.defer.reject(value);
        }

    });
};
