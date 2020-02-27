module.exports = function (app) {
    app.controller('viewDocumentReadOnlyPopCtrl', function ($mdSidenav,
                                                            dialog,
                                                            correspondenceService,
                                                            loadingIndicatorService,
                                                            employeeService,
                                                            downloadService,
                                                            $sce,
                                                            generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'viewDocumentReadOnlyPopCtrl';
        self.fullScreen = false;
        self.loadingIndicatorService = loadingIndicatorService;
        self.employeeService = employeeService;
        self.slowConnectionEnabled = !!employeeService.getEmployee().isSlowConnectionMode();
        if (self.typeOfDoc === 'otp-doc') {
            // set it to false so that it will open normally.
            self.slowConnectionEnabled = false;
        }

        self.viewURL = '';

        var _getOriginalMainDocContent = function () {
            self.viewURL = angular.copy(self.content.viewURL);
        };

        var _getAttachmentContentByVsId = function (vsId) {
            downloadService.getAttachmentContentAsPDF(vsId)
                .then(function (result) {
                    self.viewURL = generator.changeBlobToTrustedUrl(result);
                });
        };

        var _getLinkedDocContentByVsId = function (vsId) {
            downloadService.getMainDocumentContentAsPDF(vsId)
                .then(function (result) {
                    self.viewURL = generator.changeBlobToTrustedUrl(result);
                });
        };

        /**
         * @description Toggles the view mode for the attachment
         */
        self.toggleSlowConnectionMode = function ($event) {
            if (self.slowConnectionEnabled) {
                if (self.typeOfDoc === 'attachment') {
                    _getAttachmentContentByVsId(self.document.vsId)
                } else if (self.typeOfDoc === 'linked-doc'){
                    _getLinkedDocContentByVsId(self.document.vsId);
                }
            } else {
                _getOriginalMainDocContent();
            }
        };
        // toggle first time by checking if slow connection enabled by user as default setting and set Url accordingly
        self.toggleSlowConnectionMode();

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
