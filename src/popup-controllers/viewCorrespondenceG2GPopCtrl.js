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
                                                             G2G) {
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
        var _overrideViewUrl = function () {
            correspondenceService.overrideViewUrl(self.content.viewURL, true)
                .then(function (result) {
                    self.viewURL = result;
                })
        };
        _overrideViewUrl();

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


    });
};
