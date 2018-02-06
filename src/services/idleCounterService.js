module.exports = function (app) {
    app.service('idleCounterService', function ($rootScope) {
        'ngInject';
        var self = this;
        self.count = 0;

        self.setCounter = function (count) {
            self.count = count;
        };
        self.getCount = function () {
            return self.count;
        };
        self.restCounter = function () {
            self.count = 0;
        };
    })
};