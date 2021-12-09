module.exports = function (app) {
    app.factory('FilterProperty', function () {
        'ngInject';
        return function FilterProperty(name, value) {
            return {Name: name, Value: value};
        }
    })
};
