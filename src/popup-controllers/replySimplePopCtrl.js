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
                                                   distributionWFService) {
        'ngInject';
        var self = this;
        self.controllerName = 'replySimplePopCtrl';
        self.currentLangUCFirst = generator.ucFirst(langService.current);
        self.canSendToManagers = employeeService.getEmployee().canSendToManagers();
        // skip reply to user from managers list
        self.managers = _.filter(managers, function (manager) {
            return manager.id !== replyOn.id;
        });

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
        // selected comment
        self.comment = _getMatchedComment(self.distWorkflowItem);
        // selected managers
        self.selectedManagers = [];

        self.record = record;

        self.globalSettings = rootEntity.getGlobalSettings();

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
                managers = _.map(self.selectedManagers, function (manager) {
                    return (new DistributionUserWFItem()).mapFromWFUser(manager);
                }),
                allUsers = [],
                distributionWF = new DistributionWF();
            user.sendRelatedDocs = sendRelatedDocs;

            _setDistWorkflowItem(user, self.distWorkflowItem);
            allUsers = allUsers.concat([user]);
            if (managers && managers.length) {
                _setDistWorkflowItem(managers, self.distWorkflowItem);
                allUsers = allUsers.concat(managers);
            }
            distributionWF.setNormalUsers(allUsers);
            distributionWFService.startLaunchWorkflow(distributionWF, record)
                .then(function () {
                    toast.success(langService.get('launch_success_distribution_workflow'));
                    dialog.hide();
                })
        };
        /**
         * @description close the dialog.
         */
        self.closeLaunchPopup = function () {
            dialog.cancel();
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

        self.resetNotifications = function(){
            if (!self.selectedManagers || !self.selectedManagers.length){
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
            if (self.selectedManagers && self.selectedManagers.length) {
                var map = _.map(self.selectedManagers, function (manager) {
                    return manager['ou' + self.currentLangUCFirst + 'Name'];
                });
                return map.join(', ');
            }
            return langService.get('managers');
        }

    });
};
