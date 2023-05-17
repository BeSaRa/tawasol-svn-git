module.exports = function (app) {
    app.controller('quickReplyDirectiveCtrl', function ($scope,
                                                        employeeService,
                                                        LangWatcher,
                                                        userCommentService,
                                                        distributionWFService,
                                                        DistributionUserWFItem,
                                                        $timeout,
                                                        DistributionWF,
                                                        langService,
                                                        DistributionOUWFItem,
                                                        dialog,
                                                        toast,
                                                        WFUser,
                                                        WFOrganization,
                                                        Information,
                                                        generator,
                                                        moment,
                                                        $q,
                                                        followUpUserService,
                                                        FollowupBook,
                                                        _) {
        'ngInject';
        var self = this;
        self.controllerName = 'quickReplyDirectiveCtrl';
        // watcher to make langService available for view
        LangWatcher($scope);

        self.users = [];

        // current employee
        self.employee = employeeService.getEmployee();
        self.actionSearchText = '';
        self.commentSearchText = '';
        self.inlineUserOUSearchText = '';
        self.userSearchText = '';

        self.disableReply = false;
        self.selectedUser = null;
        self.selectedOU = null;
        self.selectedOUCopy = null;
        self.selectedUserCopy = null;

        self.organizationGroups = [];
        self.workflowActions = [];
        self.comments = [];

        self.enableReminder = false;
        self.minDate = generator.getFutureDate(0);
        self.minDateString = moment(self.minDate).format(generator.defaultDateFormat);
        self.privateComment = null;
        self.followUpData = new FollowupBook();

        /**
         * @description save properties for distWorkItem
         */
        self.launch = function ($event) {
            self.disableReply = true;
            var sendRelatedDocs = self.distWorkflowItem.sendRelatedDocs,
                allUsers = [],
                distributionWF = new DistributionWF(),
                user;

            user = (new DistributionUserWFItem()).mapFromWFUser(self.selectedUser);
            user.sendRelatedDocs = sendRelatedDocs;
            _setDistWorkflowItem(user, self.distWorkflowItem);

            allUsers = allUsers.concat([user]);
            distributionWF.setNormalUsers(allUsers);

            distributionWFService.startLaunchWorkflow(distributionWF, self.workItem)
                .then(function (result) {
                    if (!result) {
                        self.disableReply = false;
                        return;
                    }
                    if (self.enableReminder) {
                        self.followUpData.followupDate = self.distWorkflowItem.dueDate
                        // add to my followup
                        followUpUserService.saveUserFollowUp(self.followUpData).then();
                    }

                    toast.success(langService.get('launch_success_distribution_workflow'));
                    dialog.hide();
                }).catch(function () {
                self.disableReply = false;
            });
        }

        function _setDistWorkflowItem(distWorkflowItem, result) {
            distWorkflowItem
                .setDueDate(result.dueDate)
                .setComments(result.comments)
                .setAction(result.action)
                .setSendSMS(result.sendSMS)
                .setSendEmail(result.sendEmail)
                .setSecureAction(result.isSecureAction)
                .setEscalationStatus(result.escalationStatus)
                .setEscalationUser(result.escalationUserId)
                .setEscalationUserOUId(result.escalationUserId);
        }


        self.onSearchUsers = function () {
            if (self.selectedOU.hasOwnProperty('canReplyToSender')) {
                self.users = [self.selectedUserCopy];
                return;
            }

            return distributionWFService
                .searchUsersByCriteria({ou: self.selectedOU.id}, self.selectedOU.hasRegistry)
                .then(function (result) {
                    self.users = [];
                    self.users = result;

                    if (self.distWorkflowItem && self.distWorkflowItem.ouId !== self.selectedOU.id) {
                        self.selectedUser = null;
                    }
                });
        };


        /**
         * @description
         * @param $event
         */
        self.loadOrganizationsActionsComments = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            if (!self.workflowActions.length) {
                $q.all([
                    distributionWFService.loadOrganizationsActionsComments(),
                    followUpUserService.prepareFollowUp(self.workItem)])
                    .then(function (result) {
                        self.organizationGroups = _mapOrganizationByType(result[0].organizationGroups);
                        // if user not have permission to send to replyOn ou
                        if (!self.organizationGroups.find(ou => ou.id === self.replyOn.ouId)) {
                            self.organizationGroups.push(self.selectedOUCopy);
                        }
                        self.workflowActions = result[0].workflowActions;
                        self.comments = result[0].comments;

                        // no need to set folder as folder will be set from ouApplicationUser
                        //folders && folders.length > 0 ? data.folderId = folders[0].id : null;
                        result[1].folderId = null;
                        result[1].followupDate = result[1].followupDate ? generator.getDateObjectFromTimeStamp(result[1].followupDate) : null;
                        self.followUpData = result[1];
                    });
            }
        }

        /**
         * @description when selected comment changed.
         */
        self.onCommentChange = function () {
            self.distWorkflowItem.comments = self.comment.getComment();
        };

        /**
         * @description Opens the add user comment(private and active)
         * @param record
         * @param $event
         */
        self.openAddUserCommentDialog = function (record, $event) {
            userCommentService.controllerMethod.userCommentAddDialog(self.employee.id, self.employee.getOUID(), $event)
                .then(function (userComment) {
                    self.comments.push(userComment);
                    self.comment = userComment;
                    self.onCommentChange();
                    // reload comments to use in user preference
                    userCommentService.loadUserComments();
                })
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


        function _mapOrganizationByType(organizations, replyOnRegisteryOu) {
            if (replyOnRegisteryOu) {
                return _.map(organizations, function (selectedOu) {
                    selectedOu.arName = replyOnRegisteryOu.id === selectedOu.id ? selectedOu.arName : replyOnRegisteryOu.arName + ' - ' + selectedOu.arName;
                    selectedOu.enName = replyOnRegisteryOu.id === selectedOu.id ? selectedOu.enName : replyOnRegisteryOu.enName + ' - ' + selectedOu.enName;
                    return selectedOu;
                });
            }

            // filter all regOU (has registry)
            var regOus = _.filter(organizations, function (item) {
                    return item.hasRegistry;
                }),
                // filter all sections (no registry)
                sections = _.filter(organizations, function (ou) {
                    return !ou.hasRegistry;
                }),
                // registry parent organization
                parentRegistryOu;

            // To show (regou - section), append the dummy property "tempRegOUSection"
            regOus = _.map(regOus, function (regOu) {
                regOu.tempRegOUSection = new Information({
                    arName: regOu.arName,
                    enName: regOu.enName
                });
                return regOu;
            });
            sections = _.map(sections, function (section) {
                parentRegistryOu = (section.regouId || section.regOuId);
                if (typeof parentRegistryOu === 'number') {
                    parentRegistryOu = _.find(organizations, function (ou) {
                        return ou.id === parentRegistryOu;
                    })
                }

                section.tempRegOUSection = new Information({
                    arName: ((parentRegistryOu) ? parentRegistryOu.arName + ' - ' : '') + section.arName,
                    enName: ((parentRegistryOu) ? parentRegistryOu.enName + ' - ' : '') + section.enName
                });
                return section;
            });

            // sorting from BE based on user selection (alphabetical or by org structure)
            return [].concat(regOus, sections);
        }


        self.$onInit = function () {
            $timeout(function () {
                if (self.replyOn) {
                    self.selectedUser = self.replyOn;
                    self.users.push(self.selectedUser);
                    self.selectedUserCopy = angular.copy(self.selectedUser);

                    self.selectedOU = new WFOrganization({
                        id: self.replyOn.ouId,
                        arName: self.replyOn.ouArName,
                        enName: self.replyOn.ouEnName,
                        parent: self.replyOn.parentId
                    });

                    self.organizationGroups.push(self.selectedOU);
                    self.organizationGroups = _mapOrganizationByType(self.organizationGroups, self.replyOn.registeryOu);

                    // onlyReply indicator to allow reply for no accessible user in ReplyOn
                    self.selectedOUCopy = angular.copy(self.organizationGroups[0]);
                    self.selectedOUCopy.canReplyToSender = true;

                    self.distWorkflowItem = angular.copy(self.replyOn);
                }
            });
        }

        /**
         * @description on reminder option changed
         */
        self.onReminderChanged = function () {
            if (self.enableReminder) {
                self.distWorkflowItem.dueDate = self.minDate;
            } else {
                // reset
                self.distWorkflowItem.dueDate = null;
                self.followUpData.privateComment = null;
            }
        }

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };
    });
};
