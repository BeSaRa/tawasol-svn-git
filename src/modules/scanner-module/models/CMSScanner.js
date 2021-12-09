module.exports = function () {
    var app = angular.module('CMSScanner', []);
    require('../01-index')(app);
};