module.exports = function (app) {
    app.factory('Response', function () {
        'ngInject';
        return function Response(response) {
            var self = this;
            self.count = 0;
            self.ec = null;
            self.rs = null;
            self.sc = null;

            if (response)
                self.rs = response;

            Response.prototype.setResponse = function (response) {
                this.rs = response;
                return this;
            }
        }
    })
};