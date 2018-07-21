module.exports = function (app) {
    app.provider('cmsTemplate', function () {
        'ngInject';
        var provider = this;

        function get(pathWithFileName, callback) {
            var template = require('./../' + pathWithFileName);
            return (callback || angular.identity)(template);
        }

        provider.getView = function (fileName, callback) {
            var file = 'views/' + fileName + '.html';
            return get(file, callback).replace(/..\/..\/assets/g,'assets');
        };

        provider.getPopup = function (fileName, callback) {
            var file = 'views/popups/' + fileName + '-popup.html';
            return get(file, callback).replace(/..\/..\/..\/..\/assets/g,'assets');
        };

        provider.getDirective = function (fileName, callback) {
            var file = "directives/" + fileName + '.html';
            return get(file, callback).replace(/..\/..\/..\/assets/g,'assets');
        };

        provider.getSpecialPopup = function (fileName, callback) {
            var file = 'views/special-popups/' + fileName + '.html';
            return get(file, callback);
        };

        provider.$get = function () {
            'ngInject';
            return provider;
        }


    });
};