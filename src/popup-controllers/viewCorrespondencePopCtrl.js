module.exports = function (app) {
    app.controller('viewCorrespondencePopCtrl', function ($mdSidenav,
                                                          dialog,
                                                          $element,
                                                          toast,
                                                          langService,
                                                          $timeout,
                                                          configurationService,
                                                          loadingIndicatorService,
                                                          correspondenceService,
                                                          attachmentService,
                                                          popupNumber,
                                                          employeeService,
                                                          cmsTemplate,
                                                          $q,
                                                          gridService,
                                                          $state,
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

        self.stickyActions = [];

        self.editMode = false;

        self.info = null;

        self.documentClassPermissionMap = {
            outgoing: 'EDIT_OUTGOING_CONTENT',
            incoming: 'EDIT_INCOMING’S_CONTENT',
            internal: 'EDIT_INTERNAL_CONTENT'
        };

        self.toggleCorrespondenceEditMode = function () {
            var employee = self.employeeService.getEmployee();

            switch (employee.defaultEditMode) {
                // application user both: desktop/web
                case 0 :
                    _defaultBehavior();
                    break;
                // Office online server
                case 1:
                    self.editMode = true;
                    break;
                // edit using desktop
                case 2:
                    _openInDesktop();
                    break;
                // application user both: desktop/web
                default:
                    _defaultBehavior();
            }

        };

        function _openInDesktop() {
            self.correspondence
                .editCorrespondenceInDesktop()
                .then(function () {
                    dialog.hide('editInDesktop');
                })
                .catch(function () {
                    self.editMode = false;
                    dialog.hide('editInDesktop');
                });
        }

        function _defaultBehavior() {
            var message, defer = $q.defer();
            message = langService.getConcatenated(['edit_in_desktop_confirmation_1', 'edit_in_desktop_confirmation_2', 'edit_in_desktop_confirmation_3']);

            if (!self.info.editByDeskTop) {
                self.editMode = true;
                return;
            }
            dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('edit-in-desktop-confirm-template'),
                    controller: function (dialog) {
                        'ngInject';
                        var ctrl = this;

                        ctrl.editInDesktopCallback = function () {
                            self.editMode = false;
                            _openInDesktop();
                        };

                        ctrl.editInOfficeOnlineCallback = function () {
                            self.editMode = true;
                            dialog.hide();
                        };

                        ctrl.cancelCallback = function () {
                            self.editMode = false;
                            dialog.cancel();
                        }
                    },
                    controllerAs: 'ctrl',
                    bindToController: true,
                    locals: {
                        content: message
                    }
                })
                .then(function (result) {
                    if (result && result === 'editInDesktop')
                        dialog.cancel();
                });
        }

        self.employeeCanEditContent = function () {
            var documentClass = (self.info.documentClass + '');
            return !self.info ? false : self.employeeService.hasPermissionTo(self.documentClassPermissionMap[documentClass]);
        };

        $timeout(function () {
            self.detailsReady = true;
            self.model = angular.copy(self.correspondence);
            // set action to review will enable edit of security level
            self.action = ($state.current.name.indexOf('review') !== -1) ? 'review' : null;
            // _checkIfFromEditInDesktop(self.correspondence);
            if (self.correspondence) {
                self.info = self.correspondence.getInfo();
                self.correspondence.openInEditMode ? self.toggleCorrespondenceEditMode() : null;
            }
        }, 100);

        self.selectedList = null;
        self.listIndex = null;

        self.sideNavId = "correspondence-details_" + popupNumber;

        function _checkIfFromEditInDesktop(correspondence) {
            var info = correspondence.getInfo(), message;
            if (info.needApprove() && info.editByDeskTop) {
                message = langService.getConcatenated(['edit_in_desktop_confirmation_1', 'edit_in_desktop_confirmation_2', 'edit_in_desktop_confirmation_3']);
                dialog
                    .confirmMessage(message, langService.get('grid_action_edit_in_desktop'))
                    .then(function () {
                        self.editMode = false;
                        correspondence
                            .editCorrespondenceInDesktop()
                            .then(function () {
                                dialog.cancel();
                            })
                            .catch(function () {
                                dialog.cancel();
                            });
                    })
                    .catch(function () {
                        self.editMode = true;
                    });
            }
        }

        /**
         * @description toggle correspondence details sidebar
         */
        self.toggleCorrespondenceDetails = function () {
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
            } else {
                dialog.hide(self.workItem);
            }
        };
        /**
         * @description save correspondence Changes for content.
         * @param $event
         * @param ignoreMessage
         * @returns {*}
         */
        self.saveCorrespondenceChanges = function ($event, ignoreMessage, saveBeforeApprove) {
            var info = self.correspondence.getInfo();
            var method = info.needToApprove() && self.editMode ? 'saveDocumentWithContent' : 'saveDocument';
            if (method === 'saveDocumentWithContent') {
                angular.element('iframe#iframe-main-document').remove();
                self.disableSaveTimeout = true;
                return $timeout(function () {
                    return self.correspondence[method](method === 'saveDocument' ? false : self.content)
                        .then(function () {
                            if (!ignoreMessage)
                                toast.success(langService.get('save_success'));
                            self.disableSaveTimeout = false;
                            if (saveBeforeApprove) {
                                return 'savedBeforeApprove';
                            }
                            dialog.hide(true);
                            return true;
                        })
                        .catch(function (error) {
                            toast.error(error);
                            self.disableSaveTimeout = false;
                            return $q.reject(error);
                        });
                }, configurationService.OFFICE_ONLINE_DELAY);
            } else {
                return self.correspondence[method](method === 'saveDocument' ? false : self.content)
                    .then(function () {
                        if (!ignoreMessage)
                            toast.success(langService.get('save_success'));
                        dialog.hide(true);
                        return true;
                    });
            }
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
                return !self.correspondence.site || self.disableSaveTimeout;
            } else if (self.correspondence.docClassName === 'Outgoing') {
                return !(self.correspondence.sitesInfoTo && self.correspondence.sitesInfoTo.length) || self.disableSaveTimeout;
            }
            return self.disableSaveTimeout || false;
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
            } else {
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
            var authorizeKeys = ['grid_action_electronic_approve_and_send', 'grid_action_electronic_approve'],
                additionalData;
            if (self.editMode && authorizeKeys.indexOf(action.text) > -1) {
                additionalData = {preApproveAction: self.saveCorrespondenceChanges};
            }
            if (action.hasOwnProperty('params') && action.params) {
                action.callback(self.workItem, action.params, $event, defer, additionalData);
            } else {
                action.callback(self.workItem, $event, defer, additionalData);
            }
        };

        $timeout(function () {
            self.stickyActions = gridService.getStickyActions(self.actions);
        })


    });
};
