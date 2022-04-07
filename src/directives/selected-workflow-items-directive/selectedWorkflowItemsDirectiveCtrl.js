module.exports = function (app) {
    app.controller('selectedWorkflowItemsDirectiveCtrl', function ($scope,
                                                                   _,
                                                                   $q,
                                                                   $timeout,
                                                                   rootEntity,
                                                                   dialog,
                                                                   cmsTemplate,
                                                                   langService,
                                                                   DistributionWFItem,
                                                                   LangWatcher,
                                                                   $filter,
                                                                   userCommentService,
                                                                   employeeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'selectedWorkflowItemsDirectiveCtrl';
        LangWatcher($scope);
        self.globalSettings = rootEntity.getGlobalSettings();
        // workflowItems users , organizations , workflowGroups
        self.workflowItems = [];
        // selected workflow items
        self.selectedWorkflowItems = [];
        self.isMultiCorrespondence = false;

        self.gridName = 'selectedGrid';

        self.defaultWorkflowItemsSettings = new DistributionWFItem();
        self.sendRelatedDocsBulk = false;
        self.forwardSenderActionAndCommentBulk = false;
        self.isWorkItem = false;
        self.action = null;
        self.actionSearchText = '';

        $timeout(function () {
            if (self.item) {
                self.isWorkItem = angular.isArray(self.item) ? false : self.item.isWorkItem();
                self.isMultiCorrespondence = angular.isArray(self.item);
            }
        });

        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.workflowItems.length + 21);
                    }
                }
            ]
        };

        /**
         * @description to check all items has actions
         * @param items
         * @returns {boolean}
         * @private
         */
        function _allActionsSelected(items) {
            return !_.some(items, function (item) {
                return !item.isWFComplete() || !item.isEscalationComplete(self.fromPredefined);
            });
        }

        /**
         * @description Checks if SLA Due date is disabled
         * @returns {boolean}
         */
        self.isSLADueDateDisabled = function (distWorkflowItem) {
            return distWorkflowItem.getWorkflowItemType().toLowerCase() === 'groupmail';
        };

        function _setDistWorkflowItem(distWorkflowItem, result) {
            distWorkflowItem
                .setDueDate(result.dueDate)
                .setComments(result.comments)
                .setAction(result.action)
                .setSendEmail(result.sendEmail)
                .setSendSMS(result.sendSMS)
                .setSecureAction(result.isSecureAction)
                .setEscalationStatus(result.escalationStatus)
                .setEscalationUser(result.escalationUserId)
                .setEscalationUserOUId(result.escalationUserId)
                .setForwardSenderActionAndComment(result.forwardSenderActionAndComment);

            if (distWorkflowItem.isUser() && self.actionKey === 'forward' && !self.isMultiCorrespondence) {
                distWorkflowItem.setReadyForApproval(!!result.isReadyForApproval);
            }

            if (self.fromPredefined) {
                if (!self.isSLADueDateDisabled(distWorkflowItem)) {
                    distWorkflowItem.setSLADueDate(result.sLADueDate);
                }
            }

            // hide the comment dropdown
            distWorkflowItem.showCommentDropdown = false;
        }

        /**
         * @description just for apply notifications settings
         * @param distWorkflowItem
         * @param result
         * @private
         */
        function _applyNotificationSettings(distWorkflowItem, result) {
            distWorkflowItem
                .setSendSMS(result.sendSMS)
                .setSendEmail(result.sendEmail);
        }

        /**
         * @description get translated key name to use it in orderBy.
         * @returns {string}
         */
        self.getTranslatedKey = function () {
            return langService.current === 'ar' ? 'arName' : 'enName';
        };
        /**
         * check all items complete
         * @returns {number|*}
         */
        self.checkAllComplete = function () {
            return self.workflowItems.length && _allActionsSelected(self.workflowItems);
        };

        /**
         * @description Toggle the selection for options in dropdown
         * @param $event
         */
        self.toggleAll = function ($event) {
            if (self.documentType.lookupStrKey) {
                if (self.documentType.lookupStrKey.length === self.documentClasses.length) {
                    self.documentType.lookupStrKey = null;
                } else {
                    self.documentType.lookupStrKey = self.documentClasses;
                }
            } else {
                self.documentType.lookupStrKey = self.documentClasses;
            }
        };

        var _getWorkflowItemsWithSendRelatedDocs = function () {
            return _.filter(self.workflowItems, function (workflowItem) {
                return !!workflowItem.sendRelatedDocs;
            });
        };

        var _toggleAllSendRelatedDocs = function (value) {
            self.workflowItems = _.map(self.workflowItems, function (workflowItem) {
                workflowItem.sendRelatedDocs = value;
                return workflowItem;
            });
        };
        /**
         * @description Toggle the sendRelatedDocs checkbox for all added items
         * @param $event
         */
        self.toggleBulkSendRelatedDocs = function ($event) {
            if (self.sendRelatedDocsBulk) {
                if (_getWorkflowItemsWithSendRelatedDocs().length === self.workflowItems.length) {
                    _toggleAllSendRelatedDocs(false);
                } else {
                    _toggleAllSendRelatedDocs(true);
                }
            } else {
                _toggleAllSendRelatedDocs(true);
            }
        };

        self.isCheckedSendRelatedDocs = function () {
            return !!(self.workflowItems.length && _getWorkflowItemsWithSendRelatedDocs().length === self.workflowItems.length);
        };

        self.isIndeterminateSendRelatedDocs = function () {
            return !!(_getWorkflowItemsWithSendRelatedDocs().length && _getWorkflowItemsWithSendRelatedDocs().length < self.workflowItems.length);
        };

        /**
         * delete workflowItem
         * @param workflowItem
         * @param $event
         */
        self.deleteWorkflowItem = function (workflowItem, $event) {
            self.workflowItems = _.filter(self.workflowItems, function (item) {
                return !workflowItem.isSameWorkflowItem(item)
            });
        };
        /**
         * @description delete bulk selected
         * @param $event
         */
        self.deleteSelectedBulk = function ($event) {
            _.map(self.selectedWorkflowItems, function (item) {
                self.deleteWorkflowItem(item);
            });
            // make selected again empty array.
            self.selectedWorkflowItems = [];
        };
        self.workflowItemSettingDialog = function (dialogTitle, distWorkflowItem, $event) {
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('workflow-item-settings'),
                controller: 'workflowItemSettingPopCtrl',
                controllerAs: 'ctrl',
                targetEvent: $event,
                bindToController: true,
                locals: {
                    comments: self.workflowComments,
                    workflowActions: self.workflowActions,
                    dialogTitle: dialogTitle,
                    distWorkflowItem: distWorkflowItem,
                    gridName: self.gridName,
                    organizationGroups: self.organizationGroups,
                    fromPredefined: self.fromPredefined,
                    item: self.item,
                    isWorkItem: self.isWorkItem,
                    hiddenForwardSenderInfo: self.hiddenForwardSenderInfo,
                    actionKey: self.actionKey,
                    isMultiCorrespondence: self.isMultiCorrespondence
                }
            })
        };
        self.setBulkWorkflowItemSettings = function ($event) {
            return self
                .workflowItemSettingDialog(langService.get('set_default_workflow_attributes'), self.defaultWorkflowItemsSettings, $event)
                .then(function (result) {
                    _setDistWorkflowItem(self.defaultWorkflowItemsSettings, result);
                    _.map(self.workflowItems, function (item, index) {
                        _setDistWorkflowItem(self.workflowItems[index], result);
                    });
                });
        };

        self.applyNotificationSettings = function ($event) {
            _.map(self.workflowItems, function (item, index) {
                _applyNotificationSettings(self.workflowItems[index], self.defaultWorkflowItemsSettings);
            });
        };

        self.setBulkSenderActionAndComment = function ($event) {
            if (self.isWorkItem && !self.hiddenForwardSenderInfo) {
                _.map(self.workflowItems, function (workflowItem, index) {
                    workflowItem
                        .setComments(workflowItem.forwardSenderActionAndComment ? self.item.generalStepElm.comments : null)
                        .setAction(workflowItem.forwardSenderActionAndComment ? self.item.action : null)
                });
            }
        };

        self.setSenderActionAndComment = function (workflowItem) {
            if (self.isWorkItem && !self.hiddenForwardSenderInfo) {
                workflowItem.setComments(workflowItem.forwardSenderActionAndComment ? self.item.generalStepElm.comments : null)
                    .setAction(workflowItem.forwardSenderActionAndComment ? self.item.action : null);
            }
        };

        var _getWorkflowItemsWithForwardSenderActionAndComment = function () {
            return _.filter(self.workflowItems, function (workflowItem) {
                return !!workflowItem.forwardSenderActionAndComment;
            });
        };

        var _toggleAllForwardSenderActionAndComment = function (value) {
            self.workflowItems = _.map(self.workflowItems, function (workflowItem) {
                workflowItem.forwardSenderActionAndComment = value;
                return workflowItem;
            });
        };

        /**
         * @description Toggle the forwardSenderActionAndComment checkbox for all added items
         * @param $event
         */
        self.toggleBulkForwardSenderActionAndComment = function ($event) {
            if (self.forwardSenderActionAndCommentBulk) {
                if (_getWorkflowItemsWithForwardSenderActionAndComment().length === self.workflowItems.length) {
                    _toggleAllForwardSenderActionAndComment(false);
                } else {
                    _toggleAllForwardSenderActionAndComment(true);
                }
            } else {
                _toggleAllForwardSenderActionAndComment(true);
            }

            self.setBulkSenderActionAndComment($event);
        };

        self.isCheckedForwardSenderActionAndComment = function () {
            return !!(self.workflowItems.length && _getWorkflowItemsWithForwardSenderActionAndComment().length === self.workflowItems.length);
        };

        self.isIndeterminateForwardSenderActionAndComments = function () {
            return !!(_getWorkflowItemsWithForwardSenderActionAndComment().length && _getWorkflowItemsWithForwardSenderActionAndComment().length < self.workflowItems.length);
        };

        self.setWorkflowItemSettings = function (workflowItem, $event, currentGridName) {
            return self
                .workflowItemSettingDialog((langService.get('workflow_properties') + ' ' + workflowItem.getTranslatedName()), workflowItem, $event, currentGridName)
                .then(function (result) {
                    _setDistWorkflowItem(workflowItem, result);
                });
        };

        // /**
        //  * @description Sets the workflow action
        //  * @param workflowItem
        //  * @param $event
        //  */
        // self.setWFAction = function (workflowItem, $event) {
        //     workflowItem.setAction(workflowItem.selectedWFAction);
        // };

        /**
         * @description Sets the workflow comment
         * @param workflowItem
         * @param $event
         */
        self.setWFComment = function (workflowItem, $event) {
            workflowItem.setComments(workflowItem.selectedWFComment);
        };

        /**
         * @description Toggle the dropdown and label for comment
         * @param record
         * @param $event
         */
        self.toggleCommentDropdown = function (record, $event) {
            record.showCommentDropdown = !record.showCommentDropdown;
        };

        /**
         * @description Clear the text and toggle dropdown on close of comment dropdown
         * @param record
         * @param $event
         */
        self.onCloseCommentsDropdown = function (record, $event) {
            record.clearWFCommentSearchText();
            self.toggleCommentDropdown(record);
        };

        /**
         * @description Get the placeholder text for comment dropdown
         * @param workflowItem
         * @returns {*}
         */
        self.getCommentText = function (workflowItem) {
            return workflowItem.getComments() || workflowItem.getCommentMessage();
        };

        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of workflow action dropdown
         * @param $event
         */
        self.preventSearchKeyDown = function ($event) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                if (code !== 38 && code !== 40)
                    $event.stopPropagation();
            }
        };


        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.workflowItems = $filter('orderBy')(self.workflowItems, self.grid.order);
        };

        /**
         * @description Opens the add user comment(private and active)
         * @param record
         * @param $event
         */
        self.openAddUserCommentDialog = function (record, $event) {
            userCommentService.controllerMethod.userCommentAddDialog(employeeService.getEmployee().id, employeeService.getEmployee().getOUID(), $event)
                .then(function (userComment) {
                    self.workflowComments.push(userComment);
                    record.selectedWFComment = userComment;
                    self.setWFComment(record);
                    // reload comments to use in user preference
                    userCommentService.loadUserComments();
                })
        };

        self.isReadyForApprovalAvailable = function (workflowItem) {
            if (self.isMultiCorrespondence || self.fromPredefined) {
                return false;
            }
            self.info = self.item.getInfo();
            if (!self.info || !self.actionKey || self.actionKey !== 'forward' || !workflowItem.isUser()) {
                return false;
            }
            return self.info.needToApprove() && !self.info.hasActiveSeqWF && self.globalSettings.externalAuthorization;
        };

        /**
         *
         * @param selectedAction set action all selected workflow
         * @param $event
         */
        self.setBulkWorkflowAction = function (selectedAction, $event) {
            _.map(self.workflowItems, function (item) {
                var result = {action: selectedAction};
                _setDistWorkflowItem(item, result);
            });
        }
    });
};
