module.exports = function (app) {
    app.controller('distributionWorkflowAddOUPopCtrl', function (organizations,
                                                                 //ouWithoutReg,
                                                                 flatArrayRegOU,
                                                                 lookupService,
                                                                 $q,
                                                                 langService,
                                                                 toast,
                                                                 DistributionWorkflow,
                                                                 actions,
                                                                 enableSMSNotification,
                                                                 enableEmailNotification,
                                                                 minDate,
                                                                 escalationProcessList,
                                                                 //allSelectedDistributionWorkflows,
                                                                 $timeout,
                                                                 //Organization,
                                                                 dialog) {
        'ngInject';
        var self = this;

        self.controllerName = 'distributionWorkflowAddOUPopCtrl';

        self.progress = null;
        //self.selectedOrganizations = [];
        self.organizations = organizations;
        self.organizationsCopy = angular.copy(organizations);

        self.selectedOrganizations = [];
        self.userActions = actions;
        self.minDate = minDate;
        self.enableSMSNotification = enableSMSNotification;
        self.enableEmailNotification = enableEmailNotification;
        self.escalationProcessList = escalationProcessList;
        //self.allSelectedDistributionWorkflows = allSelectedDistributionWorkflows;
        //self.ouWithoutReg = ouWithoutReg;
        self.flatArrayRegOU = flatArrayRegOU;
        self.selectedFilterOrganization = null;
        self.selectedDistributionWorkflowsOUs = [];
        self.ouApplicationUsers = [];
        self.selectedOUApplicationUsers = [];

        self.selectedOUToSend = [];
        self.ouDistributionWorkflow = new DistributionWorkflow();

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            order: 'arName', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.selectedOUToSend.length + 21);
                    }
                }
            ]
        };

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.gridOUApplicationUsers = {
            limit: 5, // default limit
            page: 1, // first page
            order: 'arFullName', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.ouApplicationUsers.length + 21);
                    }
                }
            ]
        };

        self.addOrganizationsToSendDistributionWorkflow = function (distributionWorkflowOUForm) {
            var i;
            for (i = 0; i < self.selectedOrganizations.length; i++) {
                var isOUExist = _.filter(self.selectedOUToSend, function (organization) {
                    return organization.id === self.selectedOrganizations[i].id && !organization.ouId && organization.workflowUserType === "receivedOUs";
                })[0];
                if (!isOUExist) {
                    /* self.selectedOrganizations[i].action = self.ouDistributionWorkflow.action;
                     self.selectedOrganizations[i].escalationProcess = self.ouDistributionWorkflow.escalationProcess;
                     self.selectedOrganizations[i].dueDate = self.ouDistributionWorkflow.dueDate;
                     self.selectedOrganizations[i].smsNotification = self.ouDistributionWorkflow.smsNotification;
                     self.selectedOrganizations[i].emailNotification = self.ouDistributionWorkflow.emailNotification;
                     self.selectedOrganizations[i].workflowUserType = "receivedOUs";
                     self.ouCopy = angular.copy(self.selectedOrganizations[i]);
                     self.selectedOUToSend.push(self.ouCopy);*/

                    var addOUs = new DistributionWorkflow();
                    addOUs.id = self.selectedOrganizations[i].id;
                    addOUs.ouArName = self.selectedOrganizations[i].arName;
                    addOUs.ouEnName = self.selectedOrganizations[i].enName;
                    addOUs.action = self.ouDistributionWorkflow.action;
                    addOUs.escalationProcess = self.ouDistributionWorkflow.escalationProcess;
                    addOUs.dueDate = self.ouDistributionWorkflow.dueDate;
                    addOUs.smsNotification = self.ouDistributionWorkflow.smsNotification;
                    addOUs.emailNotification = self.ouDistributionWorkflow.emailNotification;
                    addOUs.workflowUserType = "receivedOUs";
                    self.selectedOUToSend.push(addOUs);
                }
            }

            for (i = 0; i < self.selectedOUApplicationUsers.length; i++) {
                var isUserExist = _.filter(self.selectedOUToSend, function (user) {
                    return user.id === self.selectedOUApplicationUsers[i].applicationUser.id && user.workflowUserType === "AllApplicationUser";
                })[0];
                if (!isUserExist) {
                    var addUsers = new DistributionWorkflow();
                    addUsers.id = self.selectedOUApplicationUsers[i].applicationUser.id;
                    addUsers.arName = self.selectedOUApplicationUsers[i].applicationUser.arFullName;
                    addUsers.enName = self.selectedOUApplicationUsers[i].applicationUser.enFullName;
                    addUsers.action = self.ouDistributionWorkflow.action;
                    addUsers.escalationProcess = self.ouDistributionWorkflow.escalationProcess;
                    addUsers.dueDate = self.ouDistributionWorkflow.dueDate;
                    addUsers.smsNotification = self.ouDistributionWorkflow.smsNotification;
                    addUsers.emailNotification = self.ouDistributionWorkflow.emailNotification;
                    addUsers.ouArName = self.selectedOUApplicationUsers[i].ouid.arName;
                    addUsers.ouEnName = self.selectedOUApplicationUsers[i].ouid.enName;
                    addUsers.ouId = self.selectedOUApplicationUsers[i].ouid.id;
                    addUsers.toUserDomain = self.selectedOUApplicationUsers[i].applicationUser.domainName;
                    addUsers.workflowUserType = "AllApplicationUser";

                    /*self.ouApplicationUsers[i].action = self.ouDistributionWorkflow.action;
                    self.ouApplicationUsers[i].escalationProcess = self.ouDistributionWorkflow.escalationProcess;
                    self.ouApplicationUsers[i].dueDate = self.ouDistributionWorkflow.dueDate;
                    self.ouApplicationUsers[i].smsNotification = self.ouDistributionWorkflow.smsNotification;
                    self.ouApplicationUsers[i].emailNotification = self.ouDistributionWorkflow.emailNotification;
                    self.ouApplicationUsers[i].workflowUserType = "AllApplicationUser";
                    self.ouApplicationUsers[i].arName = self.ouApplicationUsers[i].arFullName;
                    self.ouApplicationUsers[i].enName = self.ouApplicationUsers[i].enFullName;
                    self.ouApplicationUsers[i].ouArName = self.ouApplicationUsers[i].ouid.arName;
                    self.ouApplicationUsers[i].ouEnName = self.ouApplicationUsers[i].ouid.enName;
                    self.ouApplicationUserCopy = angular.copy(self.ouApplicationUsers[i]);
                    self.selectedOUToSend.push(self.ouApplicationUserCopy);*/

                    self.selectedOUToSend.push(addUsers);
                }
            }

            self.ouDistributionWorkflow = new DistributionWorkflow();
            self.selectedOrganizations = [];
            self.selectedOUApplicationUsers = [];
            //dialog.hide(self.selectedOUToSend);
            distributionWorkflowOUForm.$setUntouched();
        };
        /**
         * @description add the selected ou and users to main grid on close of popup
         */
        self.addSelectedOrganizationsToSendGrid = function () {
            dialog.hide(self.selectedOUToSend);
        };

        self.filterOrganizationTree = function () {
            if (self.selectedFilterOrganization) {
                self.selectedOrganizations = [];
                self.organizations = [self.selectedFilterOrganization];
                return;
            }
            self.organizations = self.organizationsCopy;
        };

        self.querySearch = function (query) {
            return query ? self.flatArrayRegOU.filter(createFilterFor(query)) : self.flatArrayRegOU;
            /*var results = query ? self.flatArrayRegOU.filter(createFilterFor(query)) : self.flatArrayRegOU;
            var deferred = $q.defer();
            $timeout(function () {
                deferred.resolve(results);
            }, Math.random() * 1000, false);
            return deferred.promise;*/
        };

        /**
         * filter the query
         * @param query
         * @return {Function}
         */
        function createFilterFor(query) {
            query = query.toLowerCase();
            var propToSearch = langService.current === 'ar' ? "arName" : "enName";
            return function (item) {
                return item[propToSearch].toLowerCase().indexOf(query) !== -1;
            }
        }

        self.removeAllDistributionWorkflowOUs = function () {
            self.selectedOUToSend = [];
            self.selectedDistributionWorkflowsOUs = [];
        };

        self.removeSingleDistributionWorkflowOU = function (organization) {
            var isOUExist = _.filter(self.selectedOUToSend, function (ou) {
                return organization.id === ou.id;
            })[0];
            if (isOUExist) {
                var indexOfOU = _.findIndex(self.selectedOUToSend, function (organization) {
                    return organization.id === isOUExist.id;
                });
                self.selectedOUToSend.splice(indexOfOU, 1);

                if (self.selectedOUToSend.length === 0)
                    self.selectedDistributionWorkflowsOUs = [];
            }
        };

        self.showDistributionWorkflowAddedOUs = false;
        /**
         * @description show/hide Distribution Workflow OUs grid
         */
        self.toggleDistributionWorkflowAddedOUs = function () {
            self.showDistributionWorkflowAddedOUs = !self.showDistributionWorkflowAddedOUs;
        };

        /*self.filterOrganizationTree = function () {
            self.selectedFilterOrganization.parent = null;
            self.organizations = self.separateParentFromChildren().getChildrenForParents([self.selectedFilterOrganization]);

        };

        self.getChildrenForParents = function (parentOUs) {
            for (var i = 0; i < parentOUs.length; i++) {
                if (self.childrenOUs.hasOwnProperty(parentOUs[i].id)) {
                    parentOUs[i].children = self.childrenOUs[parentOUs[i].id];
                } else {
                    parentOUs[i].children = [];
                }
                if (parentOUs[i].children) {
                    self.getChildrenForParents(parentOUs[i].children);
                }
            }
            return parentOUs;
        };

        self.separateParentFromChildren = function () {
            self.parentOUs = [];
            self.childrenOUs = {};
            _.map(self.flatArrayRegOU, function (ou) {
                if (!ou.parent) {
                    self.parentOUs.push(ou);
                } else {
                    if (!self.childrenOUs.hasOwnProperty(ou.parent)) {
                        self.childrenOUs[ou.parent] = [];
                    }
                    self.childrenOUs[ou.parent].push(ou);
                }
            });
            return self;
        };*/

        /* self.getTranslatedNotification = function (notification) {
             return notification ? langService.get('yes') : langService.get('no');
         };
         self.getTranslatedEmailNotification = function (notification) {
             return notification ? langService.get('yes') : langService.get('no');
         };*/

        self.closeOUDistributionListPopupFromCtrl = function () {
            dialog.cancel();
        };
    });
};