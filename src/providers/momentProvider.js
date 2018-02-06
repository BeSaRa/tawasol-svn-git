module.exports = function (app) {
    var moment =  require('moment');
    app.provider('moment', function () {
        'ngInject';
        this.$get = function () {
            'ngInject';
            return moment;
        };
    });
};