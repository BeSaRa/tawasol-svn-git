module.exports = function (app) {
    app.controller('viewDocumentReadOnlyPopCtrl', function ($mdSidenav, dialog, $element) {
        'ngInject';
        var self = this;
        self.controllerName = 'viewDocumentReadOnlyPopCtrl';
        self.fullScreen = false;

        /**
         * @description toggle fullScreen dialog
         */
        self.toggleFullScreen = function () {
            self.fullScreen = !self.fullScreen;
        };
        self.closeDocumentReadOnlyDialog = function () {
            dialog.hide();
        };

    });
};