module.exports = function (app) {
    app.controller('viewDocumentSideViewPopCtrl', function ($mdSidenav,
                                                            dialog,
                                                            correspondenceService,
                                                            loadingIndicatorService,
                                                            employeeService,
                                                            downloadService,
                                                            $sce,
                                                            generator,
                                                            rootEntity,
                                                            $timeout,
                                                            $q,
                                                            configurationService) {
        'ngInject';
        var self = this;
        self.controllerName = 'viewDocumentSideViewPopCtrl';
        self.fullScreen = true;
        self.loadingIndicatorService = loadingIndicatorService;
        self.employeeService = employeeService;
        self.replyToViewURL = '';
        self.psPDFViewerEnabled = rootEntity.hasPSPDFViewer();

        var _getOriginalMainDocContent = function () {
            if (self.psPDFViewerEnabled) {
                self.replyToViewURL = angular.copy(self.content.viewURL);
            } else {
                if (self.typeOfDoc === 'attachment') {
                    _getAttachmentContentByVsId(self.document.vsId)
                } else if (self.typeOfDoc === 'linked-doc') {
                    _getLinkedDocContentByVsId(self.document.vsId);
                }
            }
        };

        var _getAttachmentContentByVsId = function (vsId) {
            downloadService.getAttachmentContentAsPDF(vsId)
                .then(function (result) {
                    self.replyToViewURL = generator.changeBlobToTrustedUrl(result);
                });
        };

        var _getLinkedDocContentByVsId = function (vsId) {
            downloadService.getMainDocumentContentAsPDF(vsId)
                .then(function (result) {
                    self.replyToViewURL = generator.changeBlobToTrustedUrl(result);
                });
        };

        _getOriginalMainDocContent();

        /**
         * @description toggle fullScreen dialog
         */
        self.toggleFullScreen = function () {
            self.fullScreen = !self.fullScreen;
        };
        self.closeDocumentSideViewDialog = function () {
            self.loadingIndicatorService.loading = true;
            var defer = $q.defer();
            $timeout(function () {
                angular.element('iframe#main-document-viewer').remove();
                dialog.hide();
                defer.resolve(true);
            }, configurationService.OFFICE_ONLINE_DELAY);
        };

        self.displayMainIframeViewer = function () {
            return (!self.psPDFViewerEnabled || (self.psPDFViewerEnabled && self.isOfficeOnlineViewer(self.replyToViewURL))) && !self.isLimitedCentralUnitAccess;
        };

        self.displayMainPSPDFViewer = function () {
            return self.psPDFViewerEnabled && !self.isOfficeOnlineViewer(self.replyToViewURL) && !self.isLimitedCentralUnitAccess;
        };

        self.isOfficeOnlineViewer = function (url) {
            return url && url.$$unwrapTrustedValue().indexOf('.aspx') !== -1;
        };

        self.$onInit = function () {
            self.isLimitedCentralUnitAccess = correspondenceService.isLimitedCentralUnitAccess(self.document);
        }

    });
};
