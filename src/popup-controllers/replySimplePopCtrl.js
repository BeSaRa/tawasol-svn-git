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
                                                   Information,
                                                   centralArchiveOUs,
                                                   organizationGroups,
                                                   Lookup,
                                                   lookupService,
                                                   userCommentService,
                                                   DistributionOUWFItem,
                                                   defaultReplyToIdentifier,
                                                   gridService,
                                                   manageLaunchWorkflowService) {
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
        self.launchData = null;
        self.canMinimize = false;

        self.replyToText = replyOn['ou' + self.currentLangUCFirst + 'Name'] + ' - ' + replyOn.getTranslatedName();
        // current date minimum date for the due date.
        self.minDate = new Date();

        self.record = record;
        self.organizationGroups = _mapOrganizationByType(distributionWFService.organizationGroups, true, true);

        // selected comment
        self.comment = _getMatchedComment(self.distWorkflowItem);
        // selected managers
        self.selectedManagers = [];
        // selected receivedRegOu(sender department)
        self.selectedReceivedRegOu = [];

        self.globalSettings = rootEntity.getGlobalSettings();
        self.disableReply = false;
        var approvedStatus = self.record.getInfo().needToApprove();
        if (_getApprovedStatus()) {
            // -1 is value of none option in manager ddl
            self.selectedManagers = -1;
        }
        // skip reply to user from managers list
        self.managers = _.filter(managers, function (manager) {
            return manager.id !== replyOn.id;
        });

        self.replyToOptions = [
            {
                id: 1,
                key: 'sender',
                show: true,
                identifier: 'sender'
            },
            {
                id: 2,
                key: _getApprovedStatus() ? 'manager' : 'managers',
                show: self.canSendToManagers,
                identifier: 'manager'
            },
            {
                id: 3,
                key: 'sender_department',
                show: !_getApprovedStatus() && employeeService.hasPermissionTo('SEND_TO_ELECTRONIC_INCOMING_QUEUES') && !isInternal(),
                identifier: 'senderDepartment'
            }
        ];

        self.actionSearchText = '';
        self.commentSearchText = '';

        // all escalation process
        self.escalationProcess = lookupService.returnLookups(lookupService.escalationProcess);
        self.escalationProcessCopy = angular.copy(self.escalationProcess);
        self.currentUserOrg = employeeService.getEmployee().userOrganization;

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
            (self.distWorkflowItem.escalationStatus) ?
                self.distWorkflowItem.escalationStatus = lookupService.getLookupByLookupKey(lookupService.escalationProcess, self.distWorkflowItem.escalationStatus) :
                self.distWorkflowItem.escalationStatus = currentOUEscalationProcess;

        };
        _setEscalationProcess();

        if (self.globalSettings.allowSendWFRelatedBook) {
            self.distWorkflowItem.sendRelatedDocs = true;
        }

        self.onChangeReplyTo = function ($event) {
            if (_getApprovedStatus()) {
                self.selectedManagers = -1;
            } else {
                if (self.launchData) {
                    self.selectedManagers = self.launchData.selectedManagers;
                } else {
                    self.selectedManagers = [];
                }
            }

            if (self.selectedReplyTo === 1) {
                self.replyToText = replyOn['ou' + self.currentLangUCFirst + 'Name'] + ' - ' + replyOn.getTranslatedName();
            } else if (self.selectedReplyTo === 3) {
                self.distWorkflowItem.isSecureAction = false;
                self.replyToText = replyOn.registeryOu[langService.current + 'Name'];

                self.distWorkflowItem.sendSMS = angular.copy(replyOn.registeryOu.sendSMS);
                self.distWorkflowItem.sendEmail = angular.copy(replyOn.registeryOu.sendEmail);
            } else {
                self.replyToText = '';
            }
        };

        var _setDefaultReplyTo = function () {
            if (defaultReplyToIdentifier) {
                var selectedReplyTo = _.find(self.replyToOptions, function (replyToOption) {
                    return replyToOption.identifier === defaultReplyToIdentifier;
                });
                if (selectedReplyTo) {
                    self.selectedReplyTo = selectedReplyTo.id;
                    self.onChangeReplyTo();
                } else {
                    self.selectedReplyTo = 1;
                }
            } else {
                self.selectedReplyTo = 1;
            }
        };

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

        self.isLaunchEnabled = function (form) {
            var isValid = false;
            if (self.selectedReplyTo === 1 || self.selectedReplyTo === 3) {
                isValid = true;
            } else if (self.selectedReplyTo === 2) {
                if (_getApprovedStatus()) {
                    isValid = !!self.selectedManagers && self.selectedManagers !== -1;
                } else {
                    isValid = self.selectedManagers.length;
                }
            }
            return !form.$invalid && isValid;
        };

        /**
         * @description save properties for distWorkItem
         */
        self.launch = function ($event) {
            self.disableReply = true;
            var sendRelatedDocs = self.distWorkflowItem.sendRelatedDocs,
                selectedManagers = angular.copy(self.selectedManagers),
                allUsers = [], regOus = [],
                distributionWF = new DistributionWF(),
                user, ou;

            if (self.selectedReplyTo !== 3) {
                user = (new DistributionUserWFItem()).mapFromWFUser(self.distWorkflowItem);
                user.sendRelatedDocs = sendRelatedDocs;
            } else {
                ou = (new DistributionOUWFItem())
                    .setArName(replyOn.registeryOu.ouArName)
                    .setEnName(replyOn.registeryOu.ouEnName)
                    .setToOUId(replyOn.registeryOu.id)
                    .setRelationId(replyOn.registeryOu.relationId)
                    .setSendSMS(self.distWorkflowItem.sendSMS)
                    .setSendEmail(self.distWorkflowItem.sendEmail)
                    .setHasRegistry(replyOn.registeryOu.hasRegistry);

                ou.sendRelatedDocs = sendRelatedDocs;
            }

            if (self.getApprovedStatus()) {
                if (selectedManagers === -1) {
                    selectedManagers = [];
                } else {
                    selectedManagers = [selectedManagers];
                }
            }
            selectedManagers = _.map(selectedManagers, function (manager) {
                return (new DistributionUserWFItem()).mapFromWFUser(manager);
            });

            if (self.selectedReplyTo === 2 && selectedManagers && selectedManagers.length) {
                _setDistWorkflowItem(selectedManagers, self.distWorkflowItem);
                allUsers = allUsers.concat(selectedManagers);
                distributionWF.setNormalUsers(allUsers);
            } else if (self.selectedReplyTo === 1) {
                _setDistWorkflowItem(user, self.distWorkflowItem);
                allUsers = allUsers.concat([user]);
                distributionWF.setNormalUsers(allUsers);
            } else {
                _setDistWorkflowItem(ou, self.distWorkflowItem);
                regOus = regOus.concat([ou]);
                distributionWF.setReceivedRegOUs(regOus);
            }
            distributionWFService.startLaunchWorkflow(distributionWF, record)
                .then(function (result) {
                    if (!result) {
                        self.disableReply = false;
                        return;
                    }
                    toast.success(langService.get('launch_success_distribution_workflow'));
                    dialog.hide();
                }).catch(function () {
                self.disableReply = false;
            });
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
                        .setSecureAction(result.isSecureAction)
                        .setEscalationStatus(result.escalationStatus)
                        .setEscalationUser(result.escalationUserId)
                        .setEscalationUserOUId(result.escalationUserId);
                }
            } else {
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
            dialog.cancel('ADVANCE_LAUNCH');
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

        function isInternal() {
            var info = self.record.getInfo();
            return info.documentClass === 'internal';
        }

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
         * @desc open dialog to select escalation user
         * @param $event
         * @returns {promise}
         */
        self.openEscalationUserDialog = function ($event) {
            distributionWFService.openEscalationUserDialog(self.distWorkflowItem, $event, self.organizationGroups)
                .then(function (result) {
                    self.distWorkflowItem.escalationUserId = result;
                    self.distWorkflowItem.escalationUserOUId = result;
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

        /**
         * @description check if send to custom escalation status selected
         * @returns {Lookup|*|boolean}
         */
        self.isCustomEscalationStatusSelected = function () {
            return self.distWorkflowItem.escalationStatus && self.distWorkflowItem.escalationStatus.hasOwnProperty('lookupKey') && self.distWorkflowItem.escalationStatus.lookupKey === 3;
        };

        function _mapOrganizationByType(organizations, includeCentralArchive, allOuGroup) {
            // filter all regOU (has registry)
            var regOus = _.filter(organizations, function (ou) {
                    return ou.hasRegistry;
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
                    });
                }

                section.tempRegOUSection = new Information({
                    arName: ((parentRegistryOu) ? parentRegistryOu.arName + ' - ' : '') + section.arName,
                    enName: ((parentRegistryOu) ? parentRegistryOu.enName + ' - ' : '') + section.enName
                });
                return section;
            });

            sections = _mapWFOrganization(sections, 'OUGroup');
            regOus = _mapWFOrganization(regOus, allOuGroup ? 'OUGroup' : 'OUReg');
            if (includeCentralArchive) {
                centralArchiveOUs = _.map(centralArchiveOUs, function (ou) {
                    ou.tempRegOUSection = new Information({
                        arName: ou.arName,
                        enName: ou.enName
                    });
                    return ou;
                });
                centralArchiveOUs = _mapWFOrganization(centralArchiveOUs, 'OUGroup');
                sections = sections.concat(centralArchiveOUs);
            }

            // sorting from BE based on user selection (alphabetical or by org structure)
            return [].concat(regOus, sections);
        }

        /**
         * @description map workflow item to WFOrganization
         * @param collection
         * @param gridName
         * @returns {Array}
         * @private
         */
        function _mapWFOrganization(collection, gridName) {
            return _.map(collection, function (workflowOrganization) {
                return (new DistributionOUWFItem()).mapFromWFOrganization(workflowOrganization).setGridName(gridName || null);
            });
        }

        self.minimizeLaunchDialog = function ($event) {
            var launchData = {
                record: self.record,
                selectedItems: angular.copy([self.distWorkflowItem]),
                defaultTab: null,
                isDeptIncoming: false,
                isDeptSent: false,
                wfType: manageLaunchWorkflowService.workflowType.simpleReply,
                selectedReplyTo: self.selectedReplyTo,
                selectedManagers: self.selectedManagers
            };
            manageLaunchWorkflowService.setLaunchData(launchData)
                .then(function (data) {
                    dialog.cancel('MINIMIZE');
                });
        };


        /**
         * @description close the dialog.
         */
        self.closeLaunchPopup = function () {
            dialog.cancel();
        };

        function _setCanMinimize() {
            if (!self.record.hasOwnProperty('gridAction')) {
                self.canMinimize = false;
            } else {
                self.canMinimize = (self.record.gridAction.actionFrom === gridService.gridActionOptions.location.popup);
            }
        }

        self.$onInit = function () {
            _setCanMinimize();
            if (manageLaunchWorkflowService.isValidLaunchData()) {
                self.launchData = angular.copy(manageLaunchWorkflowService.getLaunchData());
                if (self.launchData) {
                    manageLaunchWorkflowService.clearLaunchData()
                        .then(function () {
                            self.selectedReplyTo = self.launchData.selectedReplyTo;
                            self.onChangeReplyTo();
                        });
                }
            } else {
                _setDefaultReplyTo();
            }
        };


    });
};
