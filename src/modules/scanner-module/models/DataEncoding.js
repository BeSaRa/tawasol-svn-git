module.exports = function (app) {
    app.factory('DataEncoding', function () {
        'ngInject';
        this.Base16 = 0;
        this.Base64 = 1;
        return this;
    })
};
