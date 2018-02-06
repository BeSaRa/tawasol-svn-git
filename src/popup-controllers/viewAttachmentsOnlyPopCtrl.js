module.exports = function (app) {
    app.controller('viewAttachmentsOnlyPopCtrl', function ($mdSidenav, dialog, $element) {
        'ngInject';
        var self = this;
        self.controllerName = 'viewAttachmentsOnlyPopCtrl';
        self.fullScreen = false;

        /**
         * @description toggle fullScreen dialog
         */
        self.toggleFullScreen = function () {
            self.fullScreen = !self.fullScreen;
        };
        self.closeViewAttachmentsOnlyDialog = function () {
            dialog.hide();
        };

    });
};