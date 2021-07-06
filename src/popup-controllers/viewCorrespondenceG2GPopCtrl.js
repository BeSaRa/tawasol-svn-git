module.exports = function (app) {
    app.controller('viewCorrespondenceG2GPopCtrl', function ($mdSidenav,
                                                             dialog,
                                                             $element,
                                                             toast,
                                                             langService,
                                                             $timeout,
                                                             popupNumber,
                                                             loadingIndicatorService,
                                                             employeeService,
                                                             correspondenceService,
                                                             G2GMessagingHistory,
                                                             downloadService,
                                                             generator,
                                                             rootEntity) {
        'ngInject';
        var self = this;
        self.controllerName = 'viewCorrespondenceG2GPopCtrl';
        self.fullScreen = true;
        self.validation = false;
        self.detailsReady = false;
        self.employeeService = employeeService;
        self.loadingIndicatorService = loadingIndicatorService;

        $timeout(function () {
            self.detailsReady = true;
            self.model = angular.copy(self.correspondence);
            if (self.g2gItemCopy instanceof G2GMessagingHistory) {
                self.recordType = 'g2gmessaginghistory';
            } else {
                self.recordType = 'g2g';
            }
        }, 100);

        self.sideNavId = "correspondence-details_" + popupNumber;

        self.viewURL = '';

        self.psPDFViewerEnabled = rootEntity.hasPSPDFViewer();

        self.hideSlowModeToggleButton = false;

        var _getMainDocContentByVsId = function (vsId) {
            vsId = vsId || self.model.getInfo().vsId;
            downloadService.getMainDocumentContentAsPDF(vsId)
                .then(function (result) {
                    self.viewURL = generator.changeBlobToTrustedUrl(result);
                });
        };

        var _getMainDocContentByViewUrl = function () {
            correspondenceService.getBlobFromUrl(self.content.viewURL, true)
                .then(function (result) {
                    self.viewURL = result;
                })
        };

        var _getOriginalMainDocContent = function () {
            self.viewURL = angular.copy(self.content.viewURL);
        };

        /**
         * @description Set/Reset the slowConnectionMode
         * @param firstLoadOrReloadMainDoc
         * if true, check if slow connection enabled by user as default setting and set Url accordingly
         * @private
         */
        function _resetViewModeToggle(firstLoadOrReloadMainDoc) {
            self.slowConnectionEnabled = !!employeeService.getEmployee().isSlowConnectionMode();
            if (!rootEntity.getGlobalSettings().isSlowConnectionMode()) {
                return _getOriginalMainDocContent();
            }

            if (self.slowConnectionEnabled) {
                _getMainDocContentByViewUrl();
            } else {
                _getOriginalMainDocContent();
            }
        }

        // set the slowConnectionMode when popup opens
        _resetViewModeToggle(true);

        /**
         * @description Toggles the view mode for the document/attachment/linked doc
         */
        self.toggleSlowConnectionMode = function ($event) {
            if (self.slowConnectionEnabled) {
                _getMainDocContentByVsId(self.model.getInfo().vsId);
            } else {
                _getOriginalMainDocContent();
            }
        };

        /**
         * @description Checks if toggle slow connection is enabled for entity from global settings and for user from preferences to switch views
         * @returns {*|boolean}
         */
        self.isShowSlowConnectionVisible = function () {
            return rootEntity.getGlobalSettings() && rootEntity.getGlobalSettings().isSlowConnectionMode()
                && employeeService.getEmployee() && !employeeService.getEmployee().isSlowConnectionMode()
                && employeeService.hasPermissionTo('DOWNLOAD_MAIN_DOCUMENT') && employeeService.hasPermissionTo('PRINT_DOCUMENT')
                && !self.hideSlowModeToggleButton;
        };

        /**
         * @description toggle correspondence details sidebar
         */
        self.toggleCorrespondenceDetails = function () {
            // $mdSidenav('correspondence-details').toggle();
            $mdSidenav(self.sideNavId).toggle();
        };
        /**
         * @description toggle fullScreen dialog
         */
        self.toggleFullScreen = function () {
            self.fullScreen = !self.fullScreen;
        };
        self.closeCorrespondenceDialog = function () {
            dialog.hide(self.correspondence);
        };
        /**
         * @description save correspondence Changes for content.
         */
        self.saveCorrespondenceChanges = function () {
            var info = self.correspondence.getInfo();
            var method = info.documentClass !== 'incoming' ? 'saveDocumentWithContent' : 'saveDocument';
            self.correspondence[method](method === 'saveDocument' ? false : self.content)
                .then(function () {
                    toast.success(langService.get('save_success'));
                    dialog.hide();
                });
        };
        /**
         * @description to display correspondence site accordion item.
         * @returns {boolean}
         */
        self.hasCorrespondenceSite = function () {
            var className = self.correspondence.docClassName.toLowerCase();
            return className === 'incoming' || className === 'outgoing';
        };
        /**
         * in case if just view.
         */
        self.returnBackCorrespondenceInformation = function () {
            dialog.hide(self.correspondence);
        };

        self.openActionMenu = function () {
            console.log(self.actions);
        };

        self.checkDisabled = function () {
            if (self.correspondence.docClassName === 'Incoming') {
                return !self.correspondence.site;
            } else if (self.correspondence.docClassName === 'Outgoing') {
                return !(self.correspondence.sitesInfoTo && self.correspondence.sitesInfoTo.length);
            }
            return false;
        };

        self.displayMainIframeViewer = function () {
            return (!self.psPDFViewerEnabled || (self.psPDFViewerEnabled && self.isOfficeOnlineViewer(self.viewURL))) && !self.isLimitedCentralUnitAccess;
        };

        self.displayMainPSPDFViewer = function () {
            return self.psPDFViewerEnabled && !self.isOfficeOnlineViewer(self.viewURL) && !self.isLimitedCentralUnitAccess;
        };

        self.isOfficeOnlineViewer = function (url) {
            return url && url.$$unwrapTrustedValue().indexOf('.aspx') !== -1;
        };

        self.$onInit = function () {
            self.hideSlowModeToggleButton = self.psPDFViewerEnabled && self.correspondence && self.correspondence.mimeType === 'application/pdf';
            self.isLimitedCentralUnitAccess = correspondenceService.isLimitedCentralUnitAccess(self.correspondence);
        }


    });
};
