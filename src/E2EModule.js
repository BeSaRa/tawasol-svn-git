module.exports = function () {
    var app = angular.module('E2EModule', [
        require('angular-mocks/ngMockE2E')
    ]);
    require('./E2E/01-index')(app);
    require('./E2E/passThrough')(app);
};