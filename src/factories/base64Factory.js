module.exports = function (app) {
    app.factory('base64Factory', function () {
        'ngInject';
        return require('js-base64/base64.min').Base64;
    })
};