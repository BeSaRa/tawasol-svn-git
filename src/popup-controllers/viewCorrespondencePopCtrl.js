module.exports = function (app) {
    app.controller('viewCorrespondencePopCtrl', function ($mdSidenav,
                                                          dialog,
                                                          $element,
                                                          toast,
                                                          langService,
                                                          $timeout,
                                                          loadingIndicatorService,
                                                          correspondenceService,
                                                          attachmentService,
                                                          popupNumber,
                                                          employeeService,
                                                          $q,
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
            if (self.workItem) {
                correspondenceService.unlockWorkItem(self.workItem, true)
                    .then(function () {
                        dialog.hide(self.workItem);
                    });
            }
            else {
                dialog.hide(self.workItem);
            }
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
            self.listIndex = null;
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
            attachmentService
                .viewAttachment(attachment, self.correspondence.classDescription, true)
                .then(function (result) {
                    _changeSecondURL(result, 'attachments', $index);
                });
        };

        self.showLinkedDocument = function (linkedDoc, $index, $event, popup) {
            $event && $event.preventDefault();
            self.listIndex = $index;

            // view linked document in popup.
            if (popup) {
                return linkedDoc.viewFromQueue([], 'g2gReturned', $event);
            }

            return correspondenceService
                .getLinkedDocumentViewURL(linkedDoc)
                .then(function (result) {
                    _changeSecondURL(result, 'linkedDocs', $index);
                });

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
            return self.hasMoreThanOne() && self.listIndex !== (self.correspondence[self.selectedList].length - 1)
        };

        self.hasPrevious = function () {
            return self.hasMoreThanOne() && self.listIndex !== 0;
        };

        /**
         * @description Checks whether to show the quick action or not
         * @param action
         * @returns {*}
         */
        self.isShowViewerAction = function (action) {
            if (action.hasOwnProperty('checkAnyPermission')) {
                return action.checkShow(action, self.workItem, action.checkAnyPermission);
            }
            return action.checkShow(action, self.workItem);
        };

        /**
         * @description Get the text of action according to selected language
         * @param action
         * @param isShortcutRequest
         */
        self.getViewerActionText = function (action, isShortcutRequest) {
            var langKey = "";
            if (action.hasOwnProperty('textCallback') && angular.isFunction(action.textCallback)) {
                return langService.get(action.textCallback(self.workItem));
            }

            if (angular.isFunction(action.text)) {
                if (isShortcutRequest)
                    langKey = action.text().shortcutText;
                else
                    langKey = action.text().contextText;
            }
            else {
                langKey = action.text;
            }
            return langService.get(langKey);
        };

        /**
         * @description Process the callback for the action button
         * @param action
         * @param $event
         */
        self.callbackViewerAction = function (action, $event) {
            var defer = $q.defer();
            defer.promise.then(function () {
                dialog.cancel();
            });
            if (action.hasOwnProperty('params') && action.params) {
                action.callback(self.workItem, action.params, $event, defer);
            }
            else {
                action.callback(self.workItem, $event, defer);
            }
        };

        /**
         * @description Filters the action buttons for showing/hiding shortcut actions
         * It will skip the separators
         * @returns {Array}
         */
        self.filterActionsByProperty = function (model, actions, propertyKey, propertyValue, listOfActions) {
            var flatActions = listOfActions ? listOfActions : [];
            for (var i = 0; i < actions.length; i++) {
                var mainAction = actions[i];
                if (mainAction.hasOwnProperty(propertyKey) && mainAction[propertyKey] === propertyValue && mainAction.checkShow(mainAction, model)) {
                    flatActions.push(mainAction);
                }
                if (mainAction.hasOwnProperty('subMenu') && mainAction.subMenu.length && mainAction.checkShow(mainAction, model)) {
                    self.filterActionsByProperty(model, mainAction.subMenu, propertyKey, propertyValue, flatActions);
                }
            }
            // the returned flat actions for the viewer
            return flatActions;
        };

    });
};