module.exports = function (app) {
    app.factory('d3', function () {
        'ngInject';
        return require('d3');
    });
};
