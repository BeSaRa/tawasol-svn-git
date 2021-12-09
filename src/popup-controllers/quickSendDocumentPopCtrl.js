module.exports = function (app) {
    app.controller('quickSendDocumentPopCtrl', function (_,
                                                         toast,
                                                         generator,
                                                         dialog,
                                                         langService,
                                                         record,
                                                         defaultTab,
                                                         action,
                                                         isDeptIncoming,
                                                         isDeptSent,
                                                         predefinedActions,
                                                         predefinedActionService,
                                                         errorCode,
                                                         distributionWFService,
                                                         DistributionWF,
                                                         employeeService,
                                                         tableGeneratorService,
                                                         moment,
                                                         rootEntity,
                                                         fromLaunchPopup,
                                                         SentItemDepartmentInbox,
                                                         gridService,
                                                         manageLaunchWorkflowService,
                                                         lookupService) {
        'ngInject';
        var self = this;
        self.controllerName = 'quickSendDocumentPopCtrl';

        self.record = record;
        self.employeeService = employeeService;
        self.predefinedActions = predefinedActions;
        self.rootEntity = rootEntity;
        self.headerText = langService.get('quick_send') + ' : ' + self.record.getInfo().title;
        self.fromLaunchPopup = fromLaunchPopup;

        self.selectedPredefinedAction = null;
        self.canMinimize = false;

        self.includedMembers = [];
        self.excludedMembers = [];

        self.launchData = null;

        function _checkPermission(permission) {
            return employeeService.hasPermissionTo(permission);
        }

        function _isValidUser(member) {
            return (member.isUserMember() && _checkPermission('SEND_TO_USERS_'));
        }

        function _isValidOrganization(member) {
            return (member.isOrganizationMember()
                && _checkPermission('SEND_TO_ELECTRONIC_INCOMING_QUEUES')
                && self.record.getInfo().documentClass.toLowerCase() !== 'internal'
                && !self.record.isPrivateSecurityLevel()
                && !self.record.getInfo().needToApprove()
            );
        }

        function _isValidGroupMail(member) {
            return (member.isGroupMailMember() && !self.record.isPrivateSecurityLevel());
        }

        self.onChangePredefinedAction = function ($event, isMaximizePopup) {
            self.includedMembers = [];
            self.excludedMembers = [];
            var outOfOfficeUsers = [];

            if (self.selectedPredefinedAction) {
                predefinedActionService.loadPredefinedActionById(self.selectedPredefinedAction)
                    .then(function (result) {
                        _.map(result.members, function (member) {
                            if (_isValidUser(member) || _isValidOrganization(member) || _isValidGroupMail(member)) {
                                if (isMaximizePopup) {
                                    self.includedMembers = self.launchData.selectedItems;
                                } else {
                                    self.includedMembers.push(member);
                                }
                                if (member.isUserOutOfOffice()) {
                                    outOfOfficeUsers.push(member);
                                }
                            } else {
                                self.excludedMembers.push(member);
                            }
                            return member;
                        });
                        if (outOfOfficeUsers.length) {
                            // type cast to change to DistributionUserWFItem to access openOutOfOfficeDialog dialog
                            _typeCastToDistributionWFItems(outOfOfficeUsers, true, true)
                                .then(function (workflowUsers) {
                                    dialog.alertMessage(_prepareProxyMessage(workflowUsers));
                                });
                        }
                    })
            }
        };

        self.includedMembersGrid = {
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.includedMembers.length + 21);
                    }
                }
            ]
        };

        self.excludedMembersGrid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.excludedMembers.length + 21);
                    }
                }
            ]
        };

        /**
         * @description type cast given members to DistributionUserWFItem
         * @param members
         * @param fromLaunch
         * @param returnPromise
         * @returns {*}
         * @private
         */
        function _typeCastToDistributionWFItems(members, fromLaunch, returnPromise) {
            members = angular.isArray(members) ? members : [members];
            return predefinedActionService.typeCastMembersToDistributionWFItems(members, true, true);
        }

        /**
         * @description prepare proxy Message
         * @param proxyUsers
         * @private
         */
        function _prepareProxyMessage(proxyUsers) {
            if (!self.isDelegatedUsersHasDocumentSecurityLevel(proxyUsers)) {
                return langService.get('document_doesnot_have_security_level_as_delegated_user')
            } else {
                var titleTemplate = angular.element('<span class="validation-title">' + langService.get('proxy_user_message') + '</span> <br/>');
                titleTemplate.html(langService.get('proxy_user_message'));

                var tableRows = _.map(proxyUsers, function (user) {
                    return [user.arName, user.enName, user.proxyInfo.arName, user.proxyInfo.enName, user.proxyInfo.proxyDomain, moment(user.proxyInfo.proxyStartDate).format('YYYY-MM-DD'), moment(user.proxyInfo.proxyEndDate).format('YYYY-MM-DD'), user.proxyInfo.proxyMessage];
                });

                var table = tableGeneratorService.createTable([langService.get('arabic_name'), langService.get('english_name'), langService.get('proxy_arabic_name'), langService.get('proxy_english_name'), langService.get('proxy_domain'), langService.get('start_date'), langService.get('end_date'), langService.get('proxy_message')], 'error-table');
                table.createTableRows(tableRows);

                titleTemplate.append(table.getTable(true));

                return titleTemplate.html();
            }
        }

        self.isAnyOutOfOffice = function () {
            return _.some(self.includedMembers, function (item) {
                return item.isUserOutOfOffice();
            })
        };

        /**
         * @description Shows the out of office information for given user
         * @param member
         * @param $event
         */
        self.openWorkflowUserOutOfOffice = function (member, $event) {
            // type cast to change to DistributionUserWFItem to access openOutOfOfficeDialog dialog
            _typeCastToDistributionWFItems(member, true, true)
                .then(function (workflowUser) {
                    return workflowUser[0].openOutOfOfficeDialog($event);
                });
        };

        /**
         * @description Quick send the correspondence
         * @param $event
         */
        self.quickSend = function ($event) {
            if (!self.isValidMembers()) {
                return;
            }
            _typeCastToDistributionWFItems(self.includedMembers, true, true)
                .then(function (selectedWorkflowItems) {
                    self.distributionWF = new DistributionWF();
                    self.distributionWF.setNormalUsers(_.filter(selectedWorkflowItems, _filterWFUsers));
                    self.distributionWF.setReceivedOUs(_.filter(selectedWorkflowItems, _filterWFDepartmentsGroup));
                    self.distributionWF.setReceivedRegOUs(_.filter(selectedWorkflowItems, _filterWFRegDepartments));

                    distributionWFService.startLaunchWorkflow(self.distributionWF, self.record)
                        .then(function () {
                            toast.success(langService.get('launch_success_distribution_workflow'));
                            dialog.hide();
                        })
                        .catch(function (error) {
                            if (error && errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                                var info = self.record.getInfo();
                                dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: info.wobNumber}));
                                return false;
                            } else {
                                return errorCode.showErrorDialog(error, null, generator.getTranslatedError(error));
                            }
                        });
                })
        };

        self.isValidMembers = function () {
            return self.includedMembers.length > 0;
        };

        self.advanceLaunch = function ($event) {
            if (!self.isValidMembers()) {
                return;
            }
            dialog.cancel();
            self.record.launchWorkFlowFromPredefinedAction($event, 'forward', defaultTab, isDeptIncoming, isDeptSent, self.includedMembers)
                .then(function () {
                    dialog.hide();
                })
        };

        self.openSequentialWorkFlowPopup = function ($event) {
            if (!employeeService.hasPermissionTo('LAUNCH_SEQ_WF') || self.record.hasActiveSeqWF() || !rootEntity.hasPSPDFViewer() || self.record.isCorrespondenceApprovedBefore()) {
                return false;
            }
            dialog.cancel();
            self.record.openLaunchSequentialWorkflowDialog($event)
                .then(function (result) {
                    dialog.hide();
                })
        };

        self.canLaunchSeqWF = function () {
            if (self.record.recordGridName &&
                (self.record.recordGridName === gridService.grids.department.returned
                    || self.record.recordGridName === gridService.grids.department.sentItem
                    || self.record.recordGridName === gridService.grids.centralArchive.sentItem
                    || self.record.recordGridName === gridService.grids.outgoing.rejected
                    || self.record.recordGridName === gridService.grids.incoming.rejected
                    || self.record.recordGridName === gridService.grids.internal.rejected
                    || self.record.recordGridName === gridService.grids.outgoing.draft
                    || self.record.recordGridName === gridService.grids.internal.draft
                    || self.record.recordGridName === gridService.grids.search.general
                )) {
                return false;
            }
            return employeeService.hasPermissionTo('LAUNCH_SEQ_WF')
                && rootEntity.hasPSPDFViewer() && !self.record.hasActiveSeqWF()
                && !self.record.isCorrespondenceApprovedBefore()
                && !(self.record instanceof SentItemDepartmentInbox)
                && ((self.record.isWorkItem() && !self.record.isComposite()) ||
                    (!self.record.isWorkItem() && !self.record.isCompositeSites()));
        };

        function _setCanMinimize() {
            if (!self.record.hasOwnProperty('gridAction')) {
                self.canMinimize = false;
            } else {
                self.canMinimize = (self.record.gridAction.actionFrom === gridService.gridActionOptions.location.popup);
            }
        }

        /**
         * @description Minimizes the launch dialog
         * @param $event
         */
        self.minimizeLaunchDialog = function ($event) {
            var selectedItems = _.map(self.includedMembers, function (item) {
                item.comments = item.userComment;
                return item;
            });
            var launchData = {
                record: self.record,
                selectedItems: angular.copy(selectedItems),
                defaultTab: null,
                isDeptIncoming: isDeptIncoming,
                isDeptSent: isDeptSent,
                wfType: manageLaunchWorkflowService.workflowType.quickSend,
                selectedPredefinedAction: self.selectedPredefinedAction
            };
            manageLaunchWorkflowService.setLaunchData(launchData)
                .then(function (data) {
                    dialog.cancel('MINIMIZE');
                });
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        };

        function _filterWFUsers(item) {
            return item.isUser();
        }

        function _filterWFRegDepartments(item) {
            return item.gridName === 'OUReg';
        }

        function _filterWFDepartmentsGroup(item) {
            return item.gridName === 'OUGroup';
        }

        self.isDelegatedUsersHasDocumentSecurityLevel = function (proxyUsers) {
            var securityLevels = lookupService.returnLookups(lookupService.securityLevel);

            return _.some(proxyUsers, function (proxyUser) {
                var proxyInfoSecurityLevels = generator.getSelectedCollectionFromResult(securityLevels, proxyUser.proxyInfo.securityLevels, 'lookupKey');
                return _.some(proxyInfoSecurityLevels, function (proxyInfoSecurityLevel) {
                    return proxyInfoSecurityLevel.lookupKey === self.record.securityLevelLookup.lookupKey;
                });
            })
        }

        self.$onInit = function () {
            if (manageLaunchWorkflowService.isValidLaunchData()) {
                self.launchData = manageLaunchWorkflowService.getLaunchData();
                if (self.launchData) {
                    manageLaunchWorkflowService.clearLaunchData()
                        .then(function () {
                            self.launchData.selectedItems = _.map(self.launchData.selectedItems, function (item) {
                                item.userComment = item.comments;
                                return item;
                            });
                            self.selectedPredefinedAction = self.launchData.selectedPredefinedAction;
                            self.onChangePredefinedAction(null, true);
                        })
                }
            }
            _setCanMinimize();
        }
    });
};
