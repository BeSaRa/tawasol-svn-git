module.exports = function (app) {
    app.controller('documentEditorPopCtrl', function (dialog) {
        'ngInject';
        var self = this;
        self.controllerName = 'documentEditorPopCtrl';

        function _currentFrame() {
            return angular.element('#document-viewer')[0];
        }

        self.fullScreen = function () {
            var iframe = _currentFrame();
            var requestFullScreen = iframe.requestFullscreen || iframe.msRequestFullscreen || iframe.mozRequestFullScreen || iframe.webkitRequestFullscreen;
            if (requestFullScreen) {
                requestFullScreen.bind(iframe)();
            }
        };

        self.savePreparedDocument = function () {
            dialog.hide(true);
        };

        self.closeEditor = function () {
            dialog.hide(false);
        };
    });
};