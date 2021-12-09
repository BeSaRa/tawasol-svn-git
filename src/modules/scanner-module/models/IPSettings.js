module.exports = function (app) {
    app.factory('IPSettings', function () {
        'ngInject';
        return function IPSettings(filters) {
            return {ImageOutput: {FileType: 0, Compression: 0}, Filters: filters};
        }
    })
};