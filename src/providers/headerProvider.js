/**
 * @description to add specific header for urls
 * @name headerProvider
 */
module.exports = function (app) {

    app.provider('header', function () {
        'ngInject';
        var self = this;

        function _addHeader(url, header, callback) {

        }

        self.addHeader = function (url, header, callback) {

        };

        self.addHeaderToAll = function (header, callback) {

        };


        self.$get = function () {
            'ngInject';
            return self;
        }
    });
};