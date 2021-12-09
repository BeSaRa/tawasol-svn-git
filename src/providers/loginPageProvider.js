module.exports = function (app) {
    app.provider('loginPage', function () {
        'ngInject';
        var self = this;
        self.flip = false;
        self.flipLoginBackground = function (value) {
            self.flip = value;
        };
        self.$get = function () {
            "ngInject";
            return self;
        }
    })
};