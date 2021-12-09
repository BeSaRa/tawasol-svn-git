module.exports = function (app) {
    app.factory('Filter', function () {
        'ngInject';
        return function Filter(name, properties) {
            return {Name: name, Properties: properties};
        }
    })
};
