module.exports = function (app) {
    app.factory('util', function () {
        'ngInject';
        return require('util');
    });

};