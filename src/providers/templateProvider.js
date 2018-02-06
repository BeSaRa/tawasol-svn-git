module.exports = function (app) {
    app.provider('cmsTemplate', function () {
        'ngInject';
        var provider = this;
        var imagePath = '';
        /**
         * @description change image path of dialog for production.
         * @param path
         * @returns {*}
         */
        provider.changeImagePath = function (path) {
            imagePath = path;
            return provider;
        };
        /**
         * @description retrieve image path for dialog to use it on configuration url file.
         * @returns {string}
         */
        provider.getImagePath = function(){
            return imagePath;
        };

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