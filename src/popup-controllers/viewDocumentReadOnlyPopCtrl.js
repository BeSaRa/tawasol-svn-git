module.exports = function (app) {
    app.controller('viewDocumentReadOnlyPopCtrl', function ($mdSidenav,
                                                            dialog,
                                                            correspondenceService,
                                                            loadingIndicatorService,
                                                            employeeService,
                                                            downloadService,
                                                            $sce,
                                                            generator,
                                                            rootEntity) {
        'ngInject';
        var self = this;
        self.controllerName = 'viewDocumentReadOnlyPopCtrl';
        self.fullScreen = false;
        self.loadingIndicatorService = loadingIndicatorService;
        self.employeeService = employeeService;
        self.slowConnectionEnabled = false; // set it to false so that it will open normally.
        if (!(self.typeOfDoc === 'otp-doc' || self.typeOfDoc === 'external-import')) {
            self.slowConnectionEnabled = !!employeeService.getEmployee().isSlowConnectionMode();
        }

        self.viewURL = '';

        self.psPDFViewerEnabled = rootEntity.hasPSPDFViewer();

        self.hideSlowModeToggleButton = false;

        /**
         * @description Checks if toggle slow connection is enabled for entity from global settings and for user from preferences to switch views
         * @returns {*|boolean}
         */
        self.isShowSlowConnectionVisible = function () {
            if (self.typeOfDoc === 'otp-doc' || self.typeOfDoc === 'external-import') {
                return false;
            }
            return rootEntity.getGlobalSettings() && rootEntity.getGlobalSettings().isSlowConnectionMode()
                && employeeService.getEmployee() && !employeeService.getEmployee().isSlowConnectionMode()
                && employeeService.hasPermissionTo('DOWNLOAD_MAIN_DOCUMENT') && employeeService.hasPermissionTo('PRINT_DOCUMENT')
                && !self.hideSlowModeToggleButton;
        };

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
            if (self.typeOfDoc === 'otp-doc' || self.typeOfDoc === 'external-import' || !rootEntity.getGlobalSettings().isSlowConnectionMode()) {
                return _getOriginalMainDocContent();
            }

            if (self.slowConnectionEnabled) {
                if (self.typeOfDoc === 'attachment') {
                    _getAttachmentContentByVsId(self.document.vsId)
                } else if (self.typeOfDoc === 'linked-doc') {
                    _getLinkedDocContentByVsId(self.document.vsId);
                }
            } else {
                _getOriginalMainDocContent();
            }
        };
        _getOriginalMainDocContent();
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

        self.displayMainIframeViewer = function () {
            return (!self.psPDFViewerEnabled || (self.psPDFViewerEnabled && self.isOfficeOnlineViewer(self.viewURL)));
        };

        self.displayMainPSPDFViewer = function () {
            return self.psPDFViewerEnabled && !self.isOfficeOnlineViewer(self.viewURL);
        };

        self.isOfficeOnlineViewer = function (url) {
            return url && url.$$unwrapTrustedValue().indexOf('.aspx') !== -1;
        };

        self.$onInit = function () {
            self.hideSlowModeToggleButton = self.psPDFViewerEnabled && self.document && self.document.mimeType === 'application/pdf';
        }

    });
};
