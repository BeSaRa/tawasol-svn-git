module.exports = function (app) {
    app.controller('replySimplePopCtrl', function (rootEntity,
                                                   _,
                                                   comments,
                                                   record,
                                                   workflowActions,
                                                   dialogTitle,
                                                   employeeService,
                                                   generator,
                                                   dialog,
                                                   replyOn,
                                                   managers,
                                                   toast,
                                                   langService,
                                                   DistributionUserWFItem,
                                                   DistributionWF,
                                                   distributionWFService,
                                                   userCommentService) {
        'ngInject';
        var self = this;
        self.controllerName = 'replySimplePopCtrl';
        self.currentLangUCFirst = generator.ucFirst(langService.current);
        self.canSendToManagers = employeeService.getEmployee().canSendToManagers();
        // dialog title
        self.dialogTitle = dialogTitle || replyOn.getTranslatedName();
        // all comments
        self.comments = comments;
        // all workflow actions
        self.workflowActions = workflowActions;
        // the distWorkflowItem
        self.distWorkflowItem = angular.copy(replyOn);
        self.replyToText = replyOn['ou' + self.currentLangUCFirst + 'Name'] + ' - ' + replyOn.getTranslatedName();
        // current date minimum date for the due date.
        self.minDate = new Date();

        self.record = record;

        // selected comment
        self.comment = _getMatchedComment(self.distWorkflowItem);
        // selected managers
        self.selectedManagers = [];
        var approvedStatus = self.record.getInfo().needToApprove();
        if (_getApprovedStatus()) {
            // -1 is value of none option in manager ddl
            self.selectedManagers = -1;
        }
        // skip reply to user from managers list
        self.managers = _.filter(managers, function (manager) {
            return manager.id !== replyOn.id;
        });

        self.actionSearchText = '';
        self.commentSearchText = '';

        self.globalSettings = rootEntity.getGlobalSettings();

        if (self.globalSettings.allowSendWFRelatedBook) {
            self.distWorkflowItem.sendRelatedDocs = true;
        }

        /**
         * @description find matched comment if not edited.
         * @param distWorkflowItem
         * @private
         */
        function _getMatchedComment(distWorkflowItem) {
            return _.find(self.comments, function (item) {
                return item.getComment() === distWorkflowItem.comments;
            });
        }

        /**
         * @description when selected comment changed.
         */
        self.onCommentChange = function () {
            self.distWorkflowItem.comments = self.comment.getComment();
        };
        /**
         * @description save properties for distWorkItem
         */
        self.launch = function ($event) {
            var sendRelatedDocs = self.distWorkflowItem.sendRelatedDocs,
                user = (new DistributionUserWFItem()).mapFromWFUser(self.distWorkflowItem),
                managers = angular.copy(self.selectedManagers),
                allUsers = [],
                distributionWF = new DistributionWF();
            user.sendRelatedDocs = sendRelatedDocs;
            if (self.getApprovedStatus()) {
                if (managers === -1) {
                    managers = [];
                } else {
                    managers = [managers];
                }
            }
            managers = _.map(managers, function (manager) {
                return (new DistributionUserWFItem()).mapFromWFUser(manager);
            });

            if (managers && managers.length) {
                _setDistWorkflowItem(managers, self.distWorkflowItem);
                allUsers = allUsers.concat(managers);
            } else {
                _setDistWorkflowItem(user, self.distWorkflowItem);
                allUsers = allUsers.concat([user]);
            }
            distributionWF.setNormalUsers(allUsers);
            distributionWFService.startLaunchWorkflow(distributionWF, record)
                .then(function () {
                    toast.success(langService.get('launch_success_distribution_workflow'));
                    dialog.hide();
                })
        };

        function _setDistWorkflowItem(distWorkflowItem, result) {
            if (angular.isArray(distWorkflowItem) && distWorkflowItem.length) {
                for (var i = 0; i < distWorkflowItem.length; i++) {
                    distWorkflowItem[i]
                        .setDueDate(result.dueDate)
                        .setComments(result.comments)
                        .setAction(result.action)
                        .setSendSMS(result.sendSMS)
                        .setSendEmail(result.sendEmail)
                        .setSecureAction(result.isSecureAction);
                }
            } else {
                distWorkflowItem
                    .setDueDate(result.dueDate)
                    .setComments(result.comments)
                    .setAction(result.action)
                    .setSendSMS(result.sendSMS)
                    .setSendEmail(result.sendEmail)
                    .setSecureAction(result.isSecureAction);
            }
        }

        /**
         * @description Opens the main launch screen to reply
         * @param $event
         * @returns {*}
         */
        self.advancedReply = function ($event) {
            var sendRelatedDocs = self.distWorkflowItem.sendRelatedDocs,
                user = (new DistributionUserWFItem()).mapFromWFUser(self.distWorkflowItem);
            user.sendRelatedDocs = sendRelatedDocs;

            _setDistWorkflowItem(user, self.distWorkflowItem);

            return record.launchWorkFlow($event, 'reply', null, null, user)
                .then(function () {
                    toast.success(langService.get('launch_success_distribution_workflow'));
                    dialog.hide();
                })
        };

        self.onChangeManager = function () {
            var setReplyOn = false;
            if (self.getApprovedStatus()) {
                setReplyOn = (self.selectedManagers !== -1);
            } else {
                setReplyOn = !self.selectedManagers || !self.selectedManagers.length;
            }

            if (setReplyOn) {
                self.distWorkflowItem.sendSMS = replyOn.sendSMS;
                self.distWorkflowItem.sendEmail = replyOn.sendEmail;
            } else {
                self.distWorkflowItem.sendSMS = null;
                self.distWorkflowItem.sendEmail = null;
            }
        };

        /**
         * @description Gets the selected mangers text
         * @returns {*}
         */
        self.getSelectedManagersText = function () {
            if (self.getApprovedStatus() && self.selectedManagers) {
                if (self.selectedManagers === -1) {
                    return langService.get('none');
                }
                var manager = self.selectedManagers;
                return manager['ou' + self.currentLangUCFirst + 'Name'] + ' - ' + manager[langService.current + 'Name']
            } else if (self.selectedManagers && self.selectedManagers.length) {
                var map = _.map(self.selectedManagers, function (manager) {
                    return manager['ou' + self.currentLangUCFirst + 'Name'] + ' - ' + manager[langService.current + 'Name'];
                });
                return map.join(', ');
            }
            return langService.get('managers');
        };

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
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
         * @description Opens the add user comment(private and active)
         * @param record
         * @param $event
         */
        self.openAddUserCommentDialog = function (record, $event) {
            userCommentService.controllerMethod.userCommentAddDialog(employeeService.getEmployee().id, employeeService.getEmployee().getOUID(), $event)
                .then(function (userComment) {
                    self.comments.push(userComment);
                    self.comment = userComment;
                    self.onCommentChange();
                    // reload comments to use in user preference
                    userCommentService.loadUserComments();
                })
        };


        function _getApprovedStatus() {
            return approvedStatus;
        }

        /**
         * @description to get approved status for multi document or one document.
         */
        self.getApprovedStatus = function () {
            return _getApprovedStatus();
        };

        /**
         * @description close the dialog.
         */
        self.closeLaunchPopup = function () {
            dialog.cancel();
        };


    });
};
