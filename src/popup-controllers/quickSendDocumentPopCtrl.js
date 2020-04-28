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
                                                         DistributionWF) {
        'ngInject';
        var self = this;
        self.controllerName = 'quickSendDocumentPopCtrl';

        self.record = record;
        self.predefinedActions = predefinedActions;

        self.headerText = langService.get('quick_send') + ' : ' + self.record.getInfo().title;

        self.selectedPredefinedAction = null;

        self.includedMembers = [];
        self.excludedMembers = [];

        self.onChangePredefinedAction = function ($event) {
            self.includedMembers = [];
            self.excludedMembers = [];

            if (self.selectedPredefinedAction) {
                predefinedActionService.loadPredefinedActionById(self.selectedPredefinedAction)
                    .then(function (result) {
                        _.map(result.members, function (member) {
                            if (member.isUserMember()
                                || (member.isOrganizationMember() && !self.record.getInfo().needToApprove())
                                || (member.isGroupMailMember() && !self.record.isPrivateSecurityLevel())
                            ) {
                                self.includedMembers.push(member);
                            } else {
                                self.excludedMembers.push(member);
                            }
                            return member;
                        });
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
         *
         * @param $event
         */
        self.quickSend = function ($event) {
            if (!self.isValidMembers()) {
                return;
            }
            predefinedActionService.typeCastMembersToDistributionWFItems(self.includedMembers, true, true)
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
            self.record.launchWorkFlowFromPredefinedAction($event, 'forward', defaultTab, isDeptIncoming, isDeptSent, self.includedMembers)
                .then(function () {
                    dialog.hide();
                })
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
    });
};
