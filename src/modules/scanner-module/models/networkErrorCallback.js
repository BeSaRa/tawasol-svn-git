module.exports = function (app) {
    app.factory('networkErrorCallback', function () {
        'ngInject';
        return function networkErrorCallback(error) {
            console.log("NETWORK ERROR ", error);
        }
    })
};