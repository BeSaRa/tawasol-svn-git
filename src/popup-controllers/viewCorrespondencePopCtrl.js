module.exports = function (app) {
    app.controller('viewCorrespondencePopCtrl', function ($mdSidenav,
                                                          dialog,
                                                          $element,
                                                          toast,
                                                          langService,
                                                          $timeout,
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
            console.log(self.model);
        }, 100);

        /**
         * @description toggle correspondence details sidebar
         */
        self.toggleCorrespondenceDetails = function () {
            $mdSidenav('correspondence-details').toggle();
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

        self.checkDisabled = function(){
            if(self.correspondence.docClassName == 'Incoming'){
                return !self.correspondence.site;
            }
            else if(self.correspondence.docClassName == 'Outgoing'){
                return !(self.correspondence.sitesInfoTo && self.correspondence.sitesInfoTo.length);
            }
            return false;
        }

/*
        /!**
         * @description Check if the document is approved. If yes, don't allow to change properties and correspondence sites
         * @param document
         * @returns {boolean}
         *!/
        self.checkIfEditDisabled = function (document) {
            if (!document)
                return true;
            /!*If document is approved, don't allow to edit whether it is any document*!/
            /!*If electronic outgoing/electronic internal and approved, don't allow to edit*!/
            /!*If incoming, allow to edit*!/
            /!*If not approved, allow to edit will depend on permission*!/

            /!*FROM SRS*!/
            /!*Outgoing properties can be editable at any time in department ready to export *!/
            /!*Outgoing content can be available if paper outgoing*!/
            /!*Correspondence Sites can be editable if document is unapproved*!/
            var info = document.getInfo();
            var isApproved = info.docStatus >= 24;
            if (isApproved)
                return true;

            var hasPermission = false;
            if (info.documentClass === "outgoing")
                hasPermission = (employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES") || employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
            else if (info.documentClass === "internal")
                hasPermission = (employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES") || employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT"));
            else if (info.documentClass === "incoming")
                hasPermission = (employeeService.hasPermissionTo("EDIT_INCOMING'S_PROPERTIES") || employeeService.hasPermissionTo("EDIT_INCOMING'S_CONTENT"));
            return (isApproved && hasPermission);
            //return (isApproved && ((info.documentClass === "outgoing" || info.documentClass === "internal") && !info.isPaper) && hasPermission);
        };

        $timeout(function () {
            self.approved = self.checkIfEditDisabled(self.correspondence);
        });*/
    });
};