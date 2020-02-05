module.exports = function (app) {
    app.controller('workflowItemSettingPopCtrl', function (distWorkflowItem,
                                                           rootEntity,
                                                           _,
                                                           comments,
                                                           workflowActions,
                                                           dialogTitle,
                                                           dialog,
                                                           DistributionOUWFItem,
                                                           userCommentService,
                                                           lookupService,
                                                           cmsTemplate,
                                                           UserSearchCriteria,
                                                           Lookup,
                                                           langService,
                                                           distributionWFService,
                                                           employeeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'workflowItemSettingPopCtrl';
        // dialog title
        self.dialogTitle = dialogTitle;
        // all comments
        self.comments = comments;
        // all workflow actions
        self.workflowActions = workflowActions;
        // the distWorkflowItem
        self.distWorkflowItem = angular.copy(distWorkflowItem);
        // current date minimum date for the due date.
        self.minDate = new Date();
        // selected comment
        self.comment = _getMatchedComment(self.distWorkflowItem);

        self.globalSettings = rootEntity.getGlobalSettings();
        self.currentUserOrg = employeeService.getEmployee().userOrganization;

        self.actionSearchText = '';
        self.commentSearchText = '';

        // all escalation process
        self.escalationProcess = lookupService.returnLookups(lookupService.escalationProcess);
        self.escalationProcessCopy = angular.copy(self.escalationProcess);

        var noneLookup = new Lookup({
            id: -1,
            defaultEnName: langService.getByLangKey('none', 'en'),
            defaultArName: langService.getByLangKey('none', 'ar'),
            lookupKey: -1
        });
        self.escalationProcessCopy.unshift(noneLookup);


        var _setEscalationProcess = function () {
            var currentOUEscalationProcess = self.currentUserOrg.escalationProcess || noneLookup;

            // check if initial open WF dialog
            if (self.distWorkflowItem.escalationStatus) {
                if (self.distWorkflowItem.escalationStatus.hasOwnProperty('lookupKey') && distWorkflowItem.escalationStatus.lookupKey === -1) {
                    self.distWorkflowItem.escalationStatus = noneLookup;
                } else {
                    self.distWorkflowItem.escalationStatus = lookupService.getLookupByLookupKey(lookupService.escalationProcess, self.distWorkflowItem.escalationStatus);
                }
            } else {
                self.distWorkflowItem.escalationStatus = currentOUEscalationProcess;
            }
        };
        _setEscalationProcess();


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
        self.setDistWorkflowItemProperties = function () {
            dialog.hide(self.distWorkflowItem);
        };
        /**
         * @description close the dialog.
         */
        self.closeDistWorkflowItemProperties = function () {
            dialog.cancel();
        };

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };

        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of dropdown
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
         * @param $event
         */
        self.openAddUserCommentDialog = function ($event) {
            userCommentService.controllerMethod.userCommentAddDialog(employeeService.getEmployee().id, employeeService.getEmployee().getOUID(), $event)
                .then(function (userComment) {
                    self.comments.push(userComment);
                    self.comment = userComment;
                    self.onCommentChange();
                    // reload comments to use in user preference
                    userCommentService.loadUserComments();
                })
        };

        /**
         * @description escalation will be only available in case of Users, Group Mail, Workflow Groups but not organization unit
         * @returns {*|boolean}
         */
       /* self.isEscalationHidden = function () {
            return self.gridName && (
                (self.gridName.toLowerCase() === 'ous' && self.distWorkflowItem.getWorkflowItemType().toLowerCase() === 'organization' && self.distWorkflowItem.gridName.toLowerCase() === 'oureg') ||
                (self.gridName.toLowerCase() === 'selectedgrid' && self.distWorkflowItem.getWorkflowItemType().toLowerCase() === 'organization' && self.distWorkflowItem.gridName.toLowerCase() === 'oureg') ||
                (self.gridName.toLowerCase() === 'ous' && distWorkflowItem.getWorkflowItemType().toLowerCase() === 'bulksettings') ||
                self.gridName.toLowerCase() === 'favoriteous');
        };*/

        /**
         * @desc open dialog to select escalation user
         * @param $event
         * @returns {promise}
         */
        self.openEscalationUserDialog = function ($event) {
            distributionWFService.openEscalationUserDialog(self.distWorkflowItem, $event)
                .then(function (result) {
                    self.distWorkflowItem.escalationUserId = result;
                    self.distWorkflowItem.escalationUserOUId = result;
                });
        };


        /**
         * @description delete selected escalation user
         */
        self.deleteEscalationUser = function ($event) {
            dialog
                .confirmMessage(langService.get('confirm_delete').change({name: self.distWorkflowItem.escalationUserId.getTranslatedName()}), null, null, $event)
                .then(function () {
                    self.distWorkflowItem.escalationUserId = null;
                    self.distWorkflowItem.escalationUserOUId = null;
                });
        };

        /**
         * @description reset escalation uer
         * @param $event
         */
        self.onEscalationStatusChange = function ($event) {
            self.distWorkflowItem.escalationUserId = null;
            self.distWorkflowItem.escalationUserOUId = null;
        };

        /**
         * @description check if any escalation status selected
         * @returns {Lookup|*|boolean}
         */
        self.isEscalationStatusSelected = function () {
            return self.distWorkflowItem.escalationStatus && self.distWorkflowItem.escalationStatus.hasOwnProperty('lookupKey') && self.distWorkflowItem.escalationStatus.lookupKey !== -1
        };

    });
};
