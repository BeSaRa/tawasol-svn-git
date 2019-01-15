module.exports = function (app) {
    app.provider('cmsTemplate', function () {
        'ngInject';
        var provider = this;
        provider.getView = function (fileName, callback) {
            return 'views/' + fileName + '.html';
        };

        provider.getPopup = function (fileName, callback) {
            return 'views/popups/' + fileName + '-popup.html';
        };

        provider.getDirective = function (fileName, callback) {
            var hasHTML = (fileName.indexOf('.html') !== -1);
            return "views/directives/" + fileName + (hasHTML ? '' : '.html');
        };

        provider.$get = function () {
            'ngInject';
            return provider;
        }


    });
};
