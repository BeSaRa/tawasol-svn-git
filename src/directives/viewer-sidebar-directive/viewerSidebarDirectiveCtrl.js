module.exports = function (app) {
    app.controller('viewerSidebarDirectiveCtrl', function ($scope, AnnotationType, $state, viewTrackingSheetService, correspondenceService, attachmentService, employeeService, $q, dialog, manageLaunchWorkflowService, LangWatcher, $filter, langService, gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'viewerSidebarDirectiveCtrl';
        LangWatcher($scope);
        self.workItem = null;
        self.correspondence = null;
        self.actions = [];
        self.g2gItemCopy = null;
        self.employeeService = employeeService;

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

        self.recordType = 'normalDocument';

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


        self.isShowActionCount = function (action) {
            var record = self.workItem || self.correspondence;
            if (record.getInfo().documentClass !== 'outgoing') {
                return false;
            } else if (action.hasOwnProperty('count')) {
                return true;
            }
        };

        self.showAttachment = function (attachment, $index, $event, slowConnectionToggledByUser) {
            $event && $event.preventDefault();
            attachmentService
                .viewAttachment(attachment, self.correspondence.classDescription);
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

        self.showLinkedDocument = function (linkedDoc, $index, $event, popup, slowConnectionToggledByUser) {
            $event && $event.preventDefault();
            return linkedDoc.viewFromQueue([], 'g2gReturned', $event);
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

        self.openAnnotateAttachment = function (attachment, $event) {
            return correspondenceService
                .annotateCorrespondence(attachment, AnnotationType.ANNOTATION, self.correspondence);
        }

        self.$onInit = function () {
            filterStickyActions();
        }
    });
};
