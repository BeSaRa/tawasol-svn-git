module.exports = function (app) {
    app.factory('uuidv4', function () {
        return require('uuid/dist/v4').default;
    })
};
