module.exports = function (app) {
    app.provider('cmsTemplate', function () {
        'ngInject';
        var provider = this;
        provider.getView = function (fileName, callback) {
            return 'views/' + fileName + '.html?version=' + encodeURIComponent(app.$_privateBuildNumber);
        };

        provider.getPopup = function (fileName, callback) {
            return 'views/popups/' + fileName + '-popup.html?version=' + encodeURIComponent(app.$_privateBuildNumber);
        };

        provider.getDirective = function (fileName, callback) {
            var hasHTML = (fileName.indexOf('.html') !== -1);
            return "views/directives/" + fileName + ((hasHTML ? '' : '.html') + '?version=' + encodeURIComponent(app.$_privateBuildNumber));
        };

        provider.$get = function () {
            'ngInject';
            return provider;
        }


    });
};
