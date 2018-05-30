module.exports = function (app) {
    app.controller('viewCorrespondencePopCtrl', function ($mdSidenav,
                                                          dialog,
                                                          $element,
                                                          toast,
                                                          langService,
                                                          $timeout,
                                                          loadingIndicatorService,
                                                          correspondenceService,
                                                          popupNumber,
                                                          employeeService,
                                                          generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'viewCorrespondencePopCtrl';
        self.fullScreen = true;
        self.validation = false;
        self.detailsReady = false;
        self.employeeService = employeeService;
        self.mainDocument = true;
        self.secondURL = null;
        self.loadingIndicatorService = loadingIndicatorService;
        $timeout(function () {
            self.detailsReady = true;
            self.model = angular.copy(self.correspondence);
        }, 100);

        self.selectedList = null;
        self.listIndex = null;

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
            dialog.hide(self.workItem);
        };
        /**
         * @description save correspondence Changes for content.
         */
        self.saveCorrespondenceChanges = function () {
            var info = self.correspondence.getInfo();
            var method = info.documentClass !== 'incoming' ? 'saveDocumentWithContent' : 'saveDocument';
            if (method === 'saveDocumentWithContent') {
                angular.element('iframe#iframe-main-document').remove();
                $timeout(function () {
                    self.correspondence[method](method === 'saveDocument' ? false : self.content)
                        .then(function () {
                            toast.success(langService.get('save_success'));
                            dialog.hide();
                        });
                }, 1000);
            } else
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

        self.checkDisabled = function () {
            if (self.correspondence.docClassName === 'Incoming') {
                return !self.correspondence.site;
            }
            else if (self.correspondence.docClassName === 'Outgoing') {
                return !(self.correspondence.sitesInfoTo && self.correspondence.sitesInfoTo.length);
            }
            return false;
        };

        self.backToCorrespondence = function ($event) {
            self.mainDocument = true;
            self.secondURL = null;
        };

        function _changeSecondURL(url, listName, index) {
            self.secondURL = url;
            self.mainDocument = false;
            self.selectedList = listName;
            self.listIndex = index;
        }

        self.showAttachment = function (attachment, $index, $event) {
            $event && $event.preventDefault();
            self.listIndex = $index;
            correspondenceService
                .viewAttachment(attachment, self.correspondence.classDescription, true)
                .then(function (result) {
                    _changeSecondURL(result, 'attachments', $index);
                });
        };

        self.showLinkedDocument = function (linkedDoc, $index, $event) {
            $event && $event.preventDefault();
            self.listIndex = $index;
            correspondenceService
                .getLinkedDocumentViewURL(linkedDoc)
                .then(function (result) {
                    _changeSecondURL(result, 'linkedDocs', $index);
                })

        };

        self.checkSelected = function (index, selectedList) {
            return index === self.listIndex && selectedList === self.selectedList;
        };

        self.loadListItem = function (item, index) {
            if (item.hasOwnProperty('attachmentType')) {
                self.showAttachment(item, index);
            } else {
                self.showLinkedDocument(item, index);
            }
        };

        self.nextItemList = function () {
            var index = (self.listIndex + 1);
            self.loadListItem(self.correspondence[self.selectedList][index], index);
        };

        self.prevItemList = function () {
            var index = (self.listIndex - 1);
            self.loadListItem(self.correspondence[self.selectedList][index], index);
        };

        self.hasMoreThanOne = function () {
            return self.selectedList && self.correspondence[self.selectedList].length > 1;
        };

        self.hasNext = function () {
            console.log('NEXT', self.hasMoreThanOne() && self.listIndex !== (self.correspondence[self.selectedList].length - 1));
            return self.hasMoreThanOne() && self.listIndex !== (self.correspondence[self.selectedList].length - 1)
        };

        self.hasPrevious = function () {
            console.log('PREV', self.hasMoreThanOne() && self.listIndex !== 0);
            return self.hasMoreThanOne() && self.listIndex !== 0;
        }

    });
};