module.exports = function (app) {
    app.provider('cmsTemplate', function () {
        'ngInject';
        var provider = this;

        // function get(pathWithFileName, callback) {
        //     var template = require('./../' + pathWithFileName);
        //     return (callback || angular.identity)(template);
        // }

        provider.getView = function (fileName, callback) {
            return 'views/' + fileName + '.html';
        };

        provider.getPopup = function (fileName, callback) {
            return 'views/popups/' + fileName + '-popup.html';
        };

        provider.getDirective = function (fileName, callback) {
            var hasHTML = (fileName.indexOf('.html') !== -1);
            var url = "views/directives/" + fileName + (hasHTML ? '' : '.html');
            if (fileName === 'sidebar-left-template') {
                console.log(hasHTML);
                console.log(url);
            }
            return url;
        };

        provider.$get = function () {
            'ngInject';
            return provider;
        }


    });
};
