module.exports = function (app) {
    app.factory('_', function () {
        'ngInject';
        return require('lodash');
    })
};
