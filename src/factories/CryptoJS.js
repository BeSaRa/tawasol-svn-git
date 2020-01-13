module.exports = function (app) {
    app.factory('CryptoJS', function () {
        'ngInject';
        return require('crypto-js');
    });
};