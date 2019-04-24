module.exports = function (app) {
    app.controller('replySimplePopCtrl', function (rootEntity,
                                                   _,
                                                   comments,
                                                   record,
                                                   workflowActions,
                                                   dialogTitle,
                                                   dialog,
                                                   replyOn,
                                                   toast,
                                                   langService,
                                                   DistributionUserWFItem,
                                                   DistributionWF,
                                                   distributionWFService) {
        'ngInject';
        var self = this;
        self.controllerName = 'replySimplePopCtrl';
        // dialog title
        self.dialogTitle = dialogTitle || replyOn.getTranslatedName();
        // all comments
        self.comments = comments;
        // all workflow actions
        self.workflowActions = workflowActions;
        // the distWorkflowItem
        self.distWorkflowItem = angular.copy(replyOn);
        // current date minimum date for the due date.
        self.minDate = new Date();
        // selected comment
        self.comment = _getMatchedComment(self.distWorkflowItem);
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
                user = (new DistributionUserWFItem()).mapFromWFUser(self.distWorkflowItem);
            user.sendRelatedDocs = sendRelatedDocs;

            _setDistWorkflowItem(user, self.distWorkflowItem);

            var distributionWF = new DistributionWF();
            distributionWF.setNormalUsers([user]);

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
            distWorkflowItem
                .setDueDate(result.dueDate)
                .setComments(result.comments)
                .setAction(result.action)
                .setSendSMS(result.sendSMS)
                .setSendEmail(result.sendEmail);
        }

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
        }

    });
};
