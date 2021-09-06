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
                                                            toast,
                                                            langService,
                                                            configurationService) {
        'ngInject';
        var self = this;
        self.controllerName = 'viewDocumentSideViewPopCtrl';
        self.fullScreen = true;
        self.loadingIndicatorService = loadingIndicatorService;
        self.employeeService = employeeService;
        self.replyToViewURL = '';
        self.psPDFViewerEnabled = rootEntity.hasPSPDFViewer();
        self.hideSlowModeToggleButton = false;

        var _getOriginalMainDocContent = function () {
            self.replyToViewURL = angular.copy(self.content.viewURL);
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

        var _getMainDocContentByVsId = function (vsId) {
            vsId = vsId || self.document.getInfo().vsId;
            downloadService.getMainDocumentContentAsPDF(vsId)
                .then(function (result) {
                    self.replyToViewURL = generator.changeBlobToTrustedUrl(result);
                });
        };

        var _getMainDocContentByViewUrl = function () {
            correspondenceService.getBlobFromUrl(self.content.viewURL, true)
                .then(function (result) {
                    self.replyToViewURL = result;
                })
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

        /**
         * @description Set/Reset the slowConnectionMode
         * @param firstLoadOrReloadMainDoc
         * if true, check if slow connection enabled by user as default setting and set Url accordingly
         * @private
         */
        function _resetViewModeToggle(firstLoadOrReloadMainDoc) {
            self.slowConnectionEnabled = !!employeeService.getEmployee().isSlowConnectionMode();

            if (firstLoadOrReloadMainDoc) {
                if (!rootEntity.getGlobalSettings().isSlowConnectionMode()) {
                    return _getOriginalMainDocContent();
                }

                if (self.slowConnectionEnabled) {
                    _getMainDocContentByViewUrl();
                } else {
                    self.isOfficeOnlineViewer(self.replyToViewURL) ? _getOriginalMainDocContent() : _getMainDocContentByViewUrl();
                }
            }
        }

        /**
         * @description Checks if toggle slow connection is enabled for entity from global settings and for user from preferences to switch views
         * @returns {*|boolean}
         */
        self.isShowSlowConnectionVisible = function () {
            return rootEntity.getGlobalSettings() && rootEntity.getGlobalSettings().isSlowConnectionMode()
                && employeeService.getEmployee() && !employeeService.getEmployee().isSlowConnectionMode()
                && employeeService.hasPermissionTo('DOWNLOAD_MAIN_DOCUMENT') && employeeService.hasPermissionTo('PRINT_DOCUMENT')
                && self.document && !self.hideSlowModeToggleButton;
        };

        /**
         * @description Toggles the view mode for the document/attachment/linked doc
         */
        self.toggleSlowConnectionMode = function ($event) {
            if (self.slowConnectionEnabled) {
                if (self.typeOfDoc === 'attachment') {
                    _getAttachmentContentByVsId(self.document.vsId)
                } else if (self.typeOfDoc === 'linked-doc') {
                    _getLinkedDocContentByVsId(self.document.vsId);
                } else {
                    _getMainDocContentByVsId(self.document.getInfo().vsId);
                }
            } else {
                _getOriginalMainDocContent();
            }

        };

        self.$onInit = function () {
            self.isLimitedCentralUnitAccess = correspondenceService.isLimitedCentralUnitAccess(self.document);

            // set the slowConnectionMode when popup opens
            _resetViewModeToggle(true);
            self.hideSlowModeToggleButton = self.psPDFViewerEnabled && self.document && self.document.mimeType === 'application/pdf';
        }
    });
};
