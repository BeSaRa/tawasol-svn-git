module.exports = function (app) {
    app.factory('getFilterProperty', function () {
        'ngInject';
        return function getFilterProperty(filters, filterName, propName) {
            for (var i in filters) {
                if (filters[i].Name === filterName) {
                    for (var y in filters[i].Properties) {
                        if (filters[i].Properties[y].Name === propName) {
                            return filters[i].Properties[y].Value;
                        }
                    }
                }
            }
            return null;
        }
    })
};