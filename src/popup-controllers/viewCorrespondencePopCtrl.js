module.exports = function (app) {
    app.controller('viewCorrespondencePopCtrl', function ($mdSidenav,
                                                          dialog,
                                                          $element,
                                                          $rootScope,
                                                          toast,
                                                          $scope,
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
                                                          viewTrackingSheetService,
                                                          errorCode,
                                                          $compile,
                                                          _,
                                                          G2GMessagingHistory,
                                                          downloadService,
                                                          $sce,
                                                          generator,
                                                          rootEntity,
                                                          $filter,
                                                          manageLaunchWorkflowService,
                                                          documentTagService) {
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
        self.manageLaunchWorkflowService = manageLaunchWorkflowService;

        self.stickyActions = [];

        self.info = null;
        self.editContentFrom = null;

        self.psPDFViewerEnabled = rootEntity.hasPSPDFViewer();

        self.hideSlowModeToggleButton = false;

        self.excludedManagePopupsFromGrids = [
            // 'departmentIncoming',
            'g2gIncoming',
            'deletedOutgoing',
            'deletedIncoming',
            'deletedInternal'
        ];

        self.viewURL = '';


        self.isOfficeOnlineViewer = function (url) {
            return url && url.$$unwrapTrustedValue().indexOf('.aspx') !== -1;
        };

        var _getMainDocContentByVsId = function (vsId) {
            vsId = vsId || self.info.vsId;
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

        var _getAttachmentContentByVsId = function (vsId) {
            return downloadService.getAttachmentContentAsPDF(vsId)
                .then(function (result) {
                    return generator.changeBlobToTrustedUrl(result);
                });
        };

        var _getLinkedDocContentByVsId = function (vsId) {
            return downloadService.getMainDocumentContentAsPDF(vsId)
                .then(function (result) {
                    return generator.changeBlobToTrustedUrl(result);
                });
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
                    self.isOfficeOnlineViewer(self.content.viewURL) ? _getOriginalMainDocContent() : _getMainDocContentByViewUrl();
                }
            }
        }

        // set the slowConnectionMode when popup opens
        _resetViewModeToggle(true);

        /**
         * @description Checks if toggle slow connection is enabled for entity from global settings and for user from preferences to switch views
         * @returns {*|boolean}
         */
        self.isShowSlowConnectionVisible = function () {
            return rootEntity.getGlobalSettings() && rootEntity.getGlobalSettings().isSlowConnectionMode()
                && employeeService.getEmployee() && !employeeService.getEmployee().isSlowConnectionMode()
                && employeeService.hasPermissionTo('DOWNLOAD_MAIN_DOCUMENT') && employeeService.hasPermissionTo('PRINT_DOCUMENT')
                && self.correspondence && !self.hideSlowModeToggleButton;
        };

        self.isTheMainDocumentInView = function () {
            return self.mainDocument && !self.editMode && self.viewURL;
        };

        self.displayMainIframeViewer = function () {
            return ((self.isTheMainDocumentInView() && !self.psPDFViewerEnabled) || (self.isTheMainDocumentInView() && self.psPDFViewerEnabled && self.isOfficeOnlineViewer(self.viewURL))) && self.correspondence;
        };

        self.displayMainPSPDFViewer = function () {
            return self.isTheMainDocumentInView() && self.psPDFViewerEnabled && !self.isOfficeOnlineViewer(self.viewURL) && self.correspondence;
        };

        self.displaySecondIframeViewer = function () {
            return (!self.mainDocument && !self.psPDFViewerEnabled) || (!self.mainDocument && self.psPDFViewerEnabled && self.isOfficeOnlineViewer(self.secondURL));
        };

        self.displaySecondPSPDFViewer = function () {
            return !self.mainDocument && self.psPDFViewerEnabled && !self.isOfficeOnlineViewer(self.secondURL);
        };
        /**
         * @description Toggles the view mode for the document/attachment/linked doc
         */
        self.toggleSlowConnectionMode = function ($event) {
            if (self.selectedList === 'attachments') {
                self.showAttachment(self.correspondence[self.selectedList][self.listIndex], self.listIndex, $event, true);
            } else if (self.selectedList === 'linkedDocs') {
                self.showLinkedDocument(self.correspondence[self.selectedList][self.listIndex], self.listIndex, $event, false, true);
            } else {
                if (self.slowConnectionEnabled) {
                    _getMainDocContentByVsId(self.info.vsId);
                } else {
                    _getOriginalMainDocContent();
                }
            }
        };

        self.documentClassPermissionMap = {
            outgoing: function (isPaper) {
                return isPaper ? 'EDIT_OUTGOING_PAPER' : 'EDIT_OUTGOING_CONTENT';
            },
            incoming: 'EDIT_INCOMING’S_CONTENT',
            internal: 'EDIT_INTERNAL_CONTENT'
        };

        self.toggleCorrespondenceEditMode = function (forcedDefaultMode, $event) {
            if (typeof forcedDefaultMode !== 'undefined' && forcedDefaultMode !== null && forcedDefaultMode === correspondenceService.documentEditModes.officeOnline) {
                _editInOfficeOnline();
            } else {
                var employee = self.employeeService.getEmployee();

                switch (employee.defaultEditMode) {
                    // both: desktop/web (0)
                    case correspondenceService.documentEditModes.desktopOfficeOnline :
                        _defaultBehavior();
                        break;
                    // Office online server (1)
                    case correspondenceService.documentEditModes.officeOnline:
                        _editInOfficeOnline();
                        break;
                    // edit using desktop (2)
                    case correspondenceService.documentEditModes.desktop:
                        _openInDesktop();
                        break;
                    // application user both: desktop/web
                    default:
                        _defaultBehavior();
                }
            }
        };

        function _editInOfficeOnline() {
            self.editMode = true;
            if (self.content.desktop) {
                self.content.desktop.overlay = false;
            }
        }

        function _openInDesktop() {
            if (self.content.desktop) {
                self.content.desktop.overlay = true;
                self.editMode = true;
            } else {
                dialog.hide('editInDesktop');
            }
            self.correspondence
                .editCorrespondenceInDesktop(_editInOfficeOnline);
        }

        function _defaultBehavior() {
            var message, defer = $q.defer();
            // message = langService.getConcatenated(['edit_in_desktop_confirmation_1', 'edit_in_desktop_confirmation_2', 'edit_in_desktop_confirmation_3']);
            message = langService.getConcatenated(['short_edit_in_desktop_confirmation_1', 'short_edit_in_desktop_confirmation_2']);

            dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('edit-in-desktop-confirm-template'),
                    controller: function (dialog) {
                        'ngInject';
                        var ctrl = this;

                        ctrl.editInDesktopCallback = function () {
                            self.editMode = false;
                            dialog.hide();
                            _openInDesktop();
                        };

                        ctrl.editInOfficeOnlineCallback = function () {
                            self.editMode = true;
                            dialog.hide();
                        };

                        ctrl.cancelCallback = function () {
                            self.editMode = false;
                            dialog.cancel();
                            if (self.editContentFrom === 'editContentFromGrid') {
                                dialog.cancel();
                                self.editContentFrom = null;
                            }
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
            if (!self.info) {
                return false;
            }
            var documentClass = (self.info.documentClass + ''),
                permissionName = self.documentClassPermissionMap[documentClass];
            if (typeof permissionName === 'function') {
                permissionName = permissionName(self.info.isPaper);
            }
            return self.employeeService.hasPermissionTo(permissionName)
                && self.pageName !== 'g2gReturned'
                && !self.correspondence.viewVersion
                && !self.correspondence.hasActiveSeqWF()
                && self.info.needToApprove();
        };

        self.isEditContentDisabled = function () {
            if (self.editMode) {
                return true;
            } else if (!self.correspondence.isCorrespondenceApprovedBefore()) {
                return false;
            }
            return !rootEntity.getGlobalSettings().isAllowEditAfterFirstApprove();
        };

        $timeout(function () {
            manageLaunchWorkflowService.clearLaunchData();
            self.detailsReady = true;
            self.model = angular.copy(self.correspondence);
            // set action to review/user-inbox/search will enable edit of security level
            self.action = correspondenceService.getSecurityLevelEnabledActionByScreenName();

            if (self.correspondence) {
                self.info = self.correspondence.getInfo();
                if (self.correspondence.defaultModeIfEditing === correspondenceService.documentEditModes.officeOnline) {
                    self.editContentFrom = 'editContentFromGrid';
                    self.toggleCorrespondenceEditMode(correspondenceService.documentEditModes.officeOnline);
                } else if (self.correspondence.openInEditMode) {
                    self.editContentFrom = 'editContentFromGrid';
                    self.toggleCorrespondenceEditMode();
                }
            }

            self.recordType = 'normalDocument';

            if (self.g2gItemCopy) {
                if (self.g2gItemCopy instanceof G2GMessagingHistory) {
                    self.recordType = 'g2gmessaginghistory';
                } else {
                    self.recordType = 'g2g';
                }
            }

            // exclude manage attachments/linked doc if not transferred books in department incoming
            if (self.workItem && !self.workItem.isTransferredDocument()) {
                self.excludedManagePopupsFromGrids.push("departmentIncoming");
            }
            filterStickyActions();
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
         * @param saveBeforeApprove
         * @param skipCheck
         * @returns {*}
         */
        self.saveCorrespondenceChanges = function ($event, ignoreMessage, saveBeforeApprove, skipCheck) {
            var info = self.correspondence.getInfo();
            var method = info.needToApprove() && self.editMode ? 'saveDocumentWithContent' : 'saveDocument';
            if (method === 'saveDocumentWithContent') {
                angular.element('iframe#iframe-main-document').remove();
                self.disableSaveTimeout = true;
                return $timeout(function () {
                    return self.correspondence[method](self.content)
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
                            if (typeof error === 'string') {
                                toast.error(error);
                            } else {
                                if (errorCode.checkIf(error, 'ERROR_MISSING_REQUIRED_TEMPLATE_FIELDS') === true) {
                                    var iframe = '<iframe ng-if="ctrl.mainDocument && ctrl.editMode" id="iframe-main-document"\n' +
                                        '                        class="iframe-main-document"\n' +
                                        '                        ng-src="{{ctrl.content.editURL}}" flex\n' +
                                        '                        frameborder="0"></iframe>';
                                    var newScope = $rootScope.$new(true);
                                    newScope.ctrl = self;
                                    var element = $compile(iframe)(newScope);
                                    angular.element('#iframe-parent').prepend(element);
                                }
                            }
                            self.disableSaveTimeout = false;
                            return $q.reject(error);
                        });
                }, configurationService.OFFICE_ONLINE_DELAY);
            } else {
                return self.correspondence[method](false, skipCheck)
                    .then(function () {
                        if (!ignoreMessage)
                            toast.success(langService.get('save_success'));
                        dialog.hide(true);
                        return true;
                    })
                    .catch(function (error) {
                        if (errorCode.checkIf(error, 'ALREADY_EXISTS_INCOMING_BOOK_WITH_SAME_REFERENCE_NUMBER') === true) {
                            dialog.confirmMessage(langService.get('incoming_book_exists_same_number_site_year') + "<br/>" + langService.get('confirm_continue_message'))
                                .then(function () {
                                    return self.saveCorrespondenceChanges($event, ignoreMessage, saveBeforeApprove, true);
                                }).catch(function () {
                                return $q.reject(error);
                            });
                        }
                    });
            }
        };

        self.saveAndSend = function ($event) {
            return self.saveCorrespondenceChanges($event, false)
                .then(function (result) {
                    dialog.hide(true);
                    self.workItem.launchWorkFlow($event, 'forward', 'favorites');
                })
        };

        function _rebuildEditIframe() {
            var iframe = '<iframe ng-if="ctrl.mainDocument && ctrl.editMode" id="iframe-main-document"\n' +
                '                        class="iframe-main-document"\n' +
                '                        ng-src="{{ctrl.content.editURL}}" flex\n' +
                '                        frameborder="0"></iframe>';
            var newScope = $rootScope.$new(true);
            newScope.ctrl = self;
            var element = $compile(iframe)(newScope);
            angular.element('#iframe-parent').prepend(element);
        }

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
            self.selectedList = null;
            _resetViewModeToggle(true);
        };

        self.reloadMainDocument = function ($event) {
            if ($event) {
                $event.preventDefault();
                $event.stopPropagation();
            }
            self.content
                .desktop
                .reloadContent(true)
                .then(function (result) {
                    // if response contains stepElm property, its workitem, not normal document
                    var isWorkItem = result.hasOwnProperty('stepElm'),
                        updatedContent = isWorkItem ? result.documentViewInfo : result.content,
                        updatedDocument = isWorkItem ? result.correspondence : result.metaData;

                    angular.extend(self.content, updatedContent);

                    // update the document version
                    self.correspondence.setMajorVersionNumber(updatedDocument.majorVersionNumber);
                    self.correspondence.setMinorVersionNumber(updatedDocument.minorVersionNumber);

                    self.content.desktop.overlay = false;
                    self.editMode = false;
                    self.backToCorrespondence();
                })
        };

        function _changeSecondURL(url, listName, index) {
            var defer = $q.defer();
            if (self.slowConnectionEnabled) {
                defer.resolve(url);
            } else {
                correspondenceService.overrideViewUrl(url, true).then(function (result) {
                    defer.resolve(result)
                });
            }
            defer.promise.then(function (resultUrl) {
                self.secondURL = resultUrl;
                self.mainDocument = false;
                self.selectedList = listName;
                self.listIndex = index;
            });
        }

        self.showAttachment = function (attachment, $index, $event, slowConnectionToggledByUser) {
            if (!slowConnectionToggledByUser) {
                _resetViewModeToggle();
            }

            $event && $event.preventDefault();
            self.listIndex = $index;
            if (self.slowConnectionEnabled) {
                _getAttachmentContentByVsId(attachment.vsId)
                    .then(function (result) {
                        _changeSecondURL(result, 'attachments', $index);
                    });
            } else {
                attachmentService
                    .viewAttachment(attachment, self.correspondence.classDescription, true)
                    .then(function (result) {
                        _changeSecondURL(result, 'attachments', $index);
                    });
            }
        };

        // to check if the current page exists in excluded grids to remove the manage attachment/linked document from view.
        self.showManagePopups = function () {
            return self.excludedManagePopupsFromGrids.indexOf(self.pageName) === -1;
        };

        self.showLinkedDocument = function (linkedDoc, $index, $event, popup, slowConnectionToggledByUser) {
            if (!slowConnectionToggledByUser) {
                _resetViewModeToggle();
            }

            $event && $event.preventDefault();
            self.listIndex = $index;

            // view linked document in popup.
            if (popup) {
                return linkedDoc.viewFromQueue([], 'g2gReturned', $event);
            }

            if (self.slowConnectionEnabled) {
                _getLinkedDocContentByVsId(linkedDoc.getInfo().vsId)
                    .then(function (result) {
                        _changeSecondURL(result, 'linkedDocs', $index);
                    });
            } else {
                return correspondenceService
                    .getLinkedDocumentViewURL(linkedDoc)
                    .then(function (result) {
                        _changeSecondURL(result, 'linkedDocs', $index);
                    });
            }
        };

        /**
         * @description show tracking sheet
         * @param linkedDoc
         * @param $index
         * @param $event
         */
        self.viewTrackingSheet = function (linkedDoc, $index, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(linkedDoc, ['view_tracking_sheet', 'tabs', gridService.grids.others.linkedDoc], $event).then(function (result) {
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
            if (action.showAlways) {
                if (action.hasOwnProperty('checkAnyPermission')) {
                    return action.checkShow(action, self.workItem, {g2gItem: self.g2gItemCopy});
                }
                return action.checkShow(action, self.workItem, {g2gItem: self.g2gItemCopy});
            } else {
                if (!self.workItem)
                    return false;
                if (action.hasOwnProperty('checkAnyPermission')) {
                    return action.checkShow(action, self.workItem, {g2gItem: self.g2gItemCopy});
                }
                return action.checkShow(action, self.workItem, {g2gItem: self.g2gItemCopy});
            }
        };

        self.isShowActionCount = function (action) {
            var record = self.workItem || self.correspondence;
            if (record.getInfo().documentClass !== 'outgoing') {
                return false;
            } else if (action.hasOwnProperty('count')) {
                return true;
            }
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
            manageLaunchWorkflowService.clearLaunchData()
                .then(function () {
                    var defer = $q.defer();
                    defer.promise.then(function () {
                        dialog.cancel();
                    });
                    var authorizeKeys = ['grid_action_electronic_approve_and_send', 'grid_action_electronic_approve'],
                        additionalData;
                    if (self.editMode && authorizeKeys.indexOf(action.text) > -1) {
                        additionalData = {preApproveAction: self.saveCorrespondenceChanges};
                    }
                    var record = (self.workItem || self.correspondence);
                    record.gridAction = action;

                    if (action.hasOwnProperty('params') && action.params) {
                        action.callback(record, action.params, $event, defer, additionalData);
                    } else {
                        action.callback(record, $event, defer, additionalData);
                    }
                });
        };

        /**
         * @description Manage Attachments from sticky actions
         * @param $event
         */
        self.manageAttachments = function ($event) {
            if (!employeeService.hasPermissionTo("MANAGE_ATTACHMENTS")) {
                return;
            }
            self.correspondence.manageDocumentAttachments($event)
                .then(function (attachments) {
                    self.correspondence.attachments = angular.copy(attachments);
                })
                .catch(function (attachments) {
                    self.correspondence.attachments = angular.copy(attachments);
                });
        };

        /**
         * @description Manage Linked Docs from sticky actions
         * @param $event
         */
        self.manageLinkedDocuments = function ($event) {
            if (!employeeService.hasPermissionTo("MANAGE_LINKED_DOCUMENTS")) {
                return;
            }
            self.correspondence.manageDocumentLinkedDocuments($event)
                .then(function (linkedDocs) {
                    self.correspondence.linkedDocs = angular.copy(linkedDocs);
                })
                .catch(function (linkedDocs) {
                    self.correspondence.linkedDocs = angular.copy(linkedDocs);
                });
        };

        /**
         * @description Show readonly correspondence sites from sticky actions
         * @param record
         * @param $event
         */
        self.viewCorrespondenceSites = function (record, $event) {
            if (self.recordType === 'g2g' || self.recordType === 'g2gmessaginghistory') {
                return false;
            }
            correspondenceService.viewCorrespondenceSites(record, self.recordType, $event);
        };

        var filterStickyActions = function () {
            self.stickyActions = gridService.getStickyActions(self.actions);
            // show readonly manage destinations for outgoing only
            var record = self.workItem || self.correspondence;
            if (typeof record.getInfo !== 'undefined' && record.getInfo().documentClass === 'outgoing') {
                self.stickyActions.push(
                    {
                        type: 'action',
                        icon: 'arrange-send-backward',
                        text: 'grid_action_destinations',
                        callback: self.viewCorrespondenceSites,
                        actionFrom: gridService.gridActionOptions.location.sticky,
                        //permissionKey: "MANAGE_DESTINATIONS",
                        class: "action-green",
                        checkShow: function (action, model) {
                            var record = self.workItem || self.correspondence;
                            if (self.recordType === 'g2g' || self.recordType === 'g2gmessaginghistory') {
                                return false;
                            }
                            return record.getInfo().documentClass === 'outgoing';
                        },
                        count: function () {
                            var record = self.workItem || self.correspondence;
                            if (self.recordType === 'g2g' || self.recordType === 'g2gmessaginghistory') {
                                return false;
                            }
                            return record.getCorrespondenceSitesCount();
                        },
                        showAlways: true
                    }
                );
            }

            self.stickyActions = _.filter(self.stickyActions, function (action) {
                if (!self.isShowViewerAction(action)) {
                    return false;
                }
                // change the action location to popup to make it similar with actions directive in popup
                action.actionFrom = gridService.gridActionOptions.location.popup;
                return true;
            });
            self.stickyActions = $filter('orderBy')(self.stickyActions, 'stickyIndex');
            self.stickyActionsChunk = _.chunk(self.stickyActions, 6);
        };


        /**
         * @description Checks if linked docs section can be shown under quick actions in view popup
         * @returns {boolean|boolean|*}
         */
        self.canShowLinkedDocs = function () {
            if ($state.current.name === 'app.department-inbox.incoming') {
                return self.workItem.isTransferredDocument();
            }
            return true;
        };

        /**
         * @description Checks if manage launch comments can be show or not
         * @returns {boolean}
         */
        self.canShowManageLaunchComments = function () {
            return !!manageLaunchWorkflowService.isValidLaunchData();
        };

        /**
         * @description Opens the minimized launch popup
         * @param $event
         */
        self.maximizeLaunchDialog = function ($event) {
            $event.preventDefault();
            var launchData = angular.copy(manageLaunchWorkflowService.getLaunchData());
            if (!launchData) {
                return;
            }

            var record = (self.workItem || self.correspondence);

            if (launchData.wfType === manageLaunchWorkflowService.workflowType.simpleReply) {
                record.replySimple($event, 'reply')
                    .then(function () {
                        dialog.hide();
                    });
            } else if (launchData.wfType === manageLaunchWorkflowService.workflowType.reply) {
                record.launchWorkFlow($event, 'reply', null, null)
                    .then(function () {
                        dialog.hide();
                    });
            } else if (launchData.wfType === manageLaunchWorkflowService.workflowType.forward || launchData.wfType === manageLaunchWorkflowService.workflowType.launch) {
                record.launchWorkFlow($event, launchData.wfType, launchData.defaultTab, launchData.isDeptIncoming)
                    .then(function () {
                        dialog.hide();
                    });
            } else if (launchData.wfType === manageLaunchWorkflowService.workflowType.quickSend) {
                record.quickSendLaunchWorkflow($event, 'favorites', null, launchData.isDeptIncoming)
                    .then(function (result) {
                        dialog.hide();
                    })
            }
        };

        self.correspondenceSitesChanged = function (event) {
            self.document_properties.$dirty = true;
        };

        self.$onInit = function () {
            self.hideSlowModeToggleButton = self.psPDFViewerEnabled && self.correspondence && self.correspondence.mimeType === 'application/pdf';
        }

        self.saveTags = function () {
            documentTagService
                .saveDocumentTags(self.correspondence.getInfo().documentClass, self.correspondence.vsId, self.correspondence.tags)
                .then(function (tags) {
                    toast.success(langService.get('tags_saved_success'));
                });
        };

    });
};
