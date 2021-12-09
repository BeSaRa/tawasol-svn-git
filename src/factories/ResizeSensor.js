module.exports = function (app) {
    app.factory('ResizeSensor', function () {
        'ngInject';
        var factory = require('css-element-queries/src/ResizeSensor');
        return function ResizeSensor(ele, callback) {
            return factory(ele, callback);
        }
    })
};