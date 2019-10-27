module.exports = function (app) {
    app.controller('viewDocumentReadOnlyPopCtrl', function ($mdSidenav, dialog, correspondenceService) {
        'ngInject';
        var self = this;
        self.controllerName = 'viewDocumentReadOnlyPopCtrl';
        self.fullScreen = false;

        self.viewURL = '';
        var _overrideViewUrl = function () {
            correspondenceService.overrideViewUrl(self.content.viewURL, true, self.escapeEmployeeCheck)
                .then(function (result) {
                    self.viewURL = result;
                })
        };
        _overrideViewUrl();

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
