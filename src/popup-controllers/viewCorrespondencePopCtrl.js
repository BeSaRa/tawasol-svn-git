module.exports = function (app) {
    app.controller('viewCorrespondencePopCtrl', function ($mdSidenav,
                                                          dialog,
                                                          $element,
                                                          toast,
                                                          langService,
                                                          $timeout,
                                                          popupNumber,
                                                          employeeService,
                                                          generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'viewCorrespondencePopCtrl';
        self.fullScreen = false;
        self.validation = false;
        self.detailsReady = false;
        self.employeeService = employeeService;
        $timeout(function () {
            self.detailsReady = true;
            self.model = angular.copy(self.correspondence);
        }, 100);

        //var mainInfo = self.correspondence.getInfo();
        //self.sideNavId = "correspondence-details_" + mainInfo.vsId;
        self.sideNavId = "correspondence-details_" + popupNumber;
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
            dialog.hide();
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
            //console.log(self.correspondence);
            return className === 'incoming' || className === 'outgoing';
        };
        /**
         * in case if just view.
         */
        self.returnBackCorrespondenceInformation = function () {
            dialog.hide(self.content);
        };

        self.openActionMenu = function () {
            console.log(self.actions);
        };

        self.checkDisabled = function () {
            if (self.correspondence.docClassName === 'Incoming') {
                return !self.correspondence.site;
            }
            else if (self.correspondence.docClassName === 'Outgoing') {
                return !(self.correspondence.sitesInfoTo && self.correspondence.sitesInfoTo.length);
            }
            return false;
        };


    });
};