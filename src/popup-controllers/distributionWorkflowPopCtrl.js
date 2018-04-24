module.exports = function (app) {
    app.controller('distributionWorkflowPopCtrl', function (lookupService,
                                                            $q,
                                                            langService,
                                                            applicationUserService,
                                                            $timeout,
                                                            moment,
                                                            distributionWorkflowService,
                                                            organizations,
                                                            DistributionWorkflowManager,
                                                            DistributionWorkflowOU,
                                                            DistributionWorkflowPrivateUser,
                                                            DistributionWorkflowApplicationUser,
                                                            FavoriteUser,
                                                            FavoriteOU,
                                                            favoriteUsers,
                                                            favoriteOUs,
                                                            actions,
                                                            workflowGroups,
                                                            WorkflowGroupMembers,
                                                            workflowGroupService,
                                                            UserWorkflowGroup,
                                                            userWorkflowGroupService,
                                                            _,
                                                            rootEntity,
                                                            isForwardButton,
                                                            isReplyButton,
                                                            senderForReply,
                                                            toast,
                                                            SendDistributionWorkflow,
                                                            DistributionWorkflow,
                                                            tableGeneratorService,
                                                            employeeService,
                                                            userPreferences,
                                                            selectedBooks,
                                                            DistributionWorkflowBulk,
                                                            model,
                                                            generator,
                                                            docClassName,
                                                            $interval,
                                                            dialog,
                                                            mailNotificationService) {
        'ngInject';
        var self = this;
        /*
        * If document is unapproved and electronic, don't allow to send to more than one user and don't allow to send to workflowgroups
        *
        * */
        self.controllerName = 'distributionWorkflowPopCtrl';

        self.progress = null;
        self.organizations = organizations;
        self.organizationsManager = null;
        self.vsId = (model && model.hasOwnProperty('vsId')) ? model.vsId : model;
        self.workflowGroups = workflowGroups;
        self.allWorkflowGroupMembers = [];
        self.selectWorkflowGroup = null;
        self.isForwardButton = isForwardButton;

        self.workObjectNumber = (model && model.hasOwnProperty('workObjectNumber')) ? model.workObjectNumber : model;
        self.selectedBooks = selectedBooks;

        self.workflowUserTypes = {
            NORMAL_USER: 'AllApplicationUser',
            PRIVATE_USER: 'PrivateUser',
            MANAGER: 'AllManager',
            FAVORITE_USER: 'AllFavoriteUser',
            OU: 'OU',
            GOVERNMENT_ENTITY_USER: 'GovernmentEntityUser'
        };

        // check if is document is unapproved and electronic, don't allow to send to more than one user
        self._canNotSendToMultiUsers = function () {
            // && !model.approvers && model.getInfo().documentClass === 'outgoing' &&
            return typeof model.getInfo === 'function' && model.getInfo().docStatus < 24 && !model.getInfo().isPaper;
        };

        self.disableAdd = function () {
            if (self._canNotSendToMultiUsers())
                return self.allSelectedDistributionWorkflows.length;
            return false;
        };
        var currentDate = new Date();
        currentDate.setDate((currentDate.getDate() + 1));

        self.classDescription = docClassName;
        self.isReplyButton = isReplyButton;
        self.senderForReply = senderForReply;
        self.selectedSenderUser = [];
        self.userDistributionWorkflow = new DistributionWorkflow({
            dueDate: currentDate
        });
        self.managerDistributionWorkflow = new DistributionWorkflow({
            dueDate: currentDate
        });
        self.mainOUDistributionWorkflow = new DistributionWorkflow({
            dueDate: currentDate
        });
        self.workflowGroupDistributionWorkflow = new DistributionWorkflow({
            dueDate: currentDate
        });
        self.privateUserDistributionWorkflow = new DistributionWorkflow({
            dueDate: currentDate
        });
        self.governmentEntityDistributionWorkflow = new DistributionWorkflow({
            dueDate: currentDate
        });
        self.favoriteUserOUDistributionWorkflow = new DistributionWorkflow({
            dueDate: currentDate
        });

        self.allSelectedDistributionWorkflows = [];//list of all selected user to send Distribution workflow
        self.selectedDistributionWorkflows = [];

        self.users = new DistributionWorkflowApplicationUser();
        self.selectedAppUsers = [];//selected users to add after searching in users tab

        self.managers = new DistributionWorkflowManager();
        self.selectedManagers = [];//selected managers to add after searching in manager tab

        self.ouGroups = new DistributionWorkflowOU();
        self.selectedOUGroups = [];

        self.allGovernmentEntities = [];
        self.selectedGovernmentEntities = [];

        self.privateUsers = new DistributionWorkflowPrivateUser();
        self.selectedPrivateUsers = [];//selected Private Users to add after searching in Private Users tab

        self.favoriteUsers = new FavoriteUser();
        self.selectedFavoriteUsers = [];//selected favorite Users to add
        self.selectedFavoriteOUs = [];//selected favorite Users to add
        self.selectedWorkflowMembers = [];

        self.globalSetting = rootEntity.returnRootEntity().settings;
        self.userPreferences = userPreferences;

        self.enableSMSNotification = !self.globalSetting.enableSMSNotification ? false : (!!self.userPreferences.subscriptionsmsNotify);
        self.enableEmailNotification = !self.globalSetting.enableEmailNotification ? false : (!!self.userPreferences.subscriptionEmailNotify);

        self.tabsToShow = [
            'users',
            'favourite_users',
            'managers',
            'organization_units',
            'my_workflow_groups',
            'private_users',
            'head_of_government_entities'
        ];
        self.showTab = function (tabName) {
            return (self.tabsToShow.indexOf(tabName) > -1);
        };

        self.userActions = actions;
        self.escalationProcessList = [
            {
                "id": 1,
                "arName": "اعاده للمرسل",
                "enName": "Reassign the work item to the sender"
            },
            {
                "id": 2,
                "arName": "اعاده للمدير",
                "enName": "Reassign the work item to the direct manager"
            },
            {
                "id": 3,
                "arName": "اعاده لمستخدم اخر",
                "enName": "Reassign the work item to another user"
            }];
        self.workflowGroupList = [
            {
                "id": 1,
                "arName": "Workflow Group 1",
                "enName": "Workflow Group 1"
            },
            {
                "id": 2,
                "arName": "Workflow Group 2",
                "enName": "Workflow Group 2"
            },
            {
                "id": 3,
                "arName": "Workflow Group 3",
                "enName": "Workflow Group 3"
            }];
        // all available search criteria
        self.availableSearchCriteria = [
            {key: 'loginName', value: 'login_name'},
            {key: 'arFullName', value: 'arabic_name'},
            {key: 'enFullName', value: 'english_name'}
        ];
        self.availableSearchCriteriaOU = [
            {key: 'ouArName', value: 'arabic_name'},
            {key: 'ouEnName', value: 'english_name'}
        ];
        // all available search criteria for Private Users
        self.availableSearchCriteriaPrivateUsers = [
            {key: 'arName', value: 'arabic_name'},
            {key: 'enName', value: 'english_name'}
        ];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.gridAllUser = {
            limit: 5, // default limit
            page: 1, // first page
            order: langService.current + "Name", // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.applicationUsers.length + 21);
                    }
                }
            ]
        };
        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.gridAllManager = {
            limit: 5, // default limit
            page: 1, // first page
            order: langService.current + "Name", // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.allManagers.length + 21);
                    }
                }
            ]
        };
        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.gridOUGroup = {
            limit: 5, // default limit
            page: 1, // first page
            order: "ou" + langService.current.charAt(0).toUpperCase() + langService.current.substr(1) + "Name", // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.allOUGroups.length + 21);
                    }
                }
            ]
        };
        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.gridPrivateUser = {
            limit: 5, // default limit
            page: 1, // first page
            order: langService.current + "Name", // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.allPrivateUsers.length + 21);
                    }
                }
            ]
        };
        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.gridGE = {
            limit: 5, // default limit
            page: 1, // first page
            order: langService.current + "Name", // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.allGovernmentEntities.length + 21);
                    }
                }
            ]
        };
        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.gridFavoriteOU = {
            limit: 5, // default limit
            page: 1, // first page
            order: "ou" + langService.current.charAt(0).toUpperCase() + langService.current.substr(1) + "Name", // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.allFavoriteOUs.length + 21);
                    }
                }
            ]
        };
        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.gridFavoriteUser = {
            limit: 5, // default limit
            page: 1, // first page
            order: langService.current + "Name", // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.allFavoriteUsers.length + 21);
                    }
                }
            ]
        };
        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.gridSendDistributionWorkflow = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.allSelectedDistributionWorkflows.length + 21);
                    }
                }
            ]
        };
        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.gridWorkflowGroupMember = {
            limit: 5, // default limit
            page: 1, // first page
            order: langService.current + "Name", // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.allWorkflowGroupMembers.length + 21);
                    }
                }
            ]
        };

        self.usersSearchText = "";
        self.applicationUsers = [];//to bind application users returned after search

        self.managerSearchText = "";
        self.allManagers = [];//to bind managers returned after search

        self.privateUsersSearchText = "";
        self.allPrivateUsers = [];//to bind private users returned after search

        self.ouSearchText = "";
        self.allOUGroups = [];//to bind ou groups returned after search

        self.allFavoriteUsers = favoriteUsers;
        self.allFavoriteOUs = favoriteOUs;

        self.searchBy = self.availableSearchCriteria[0]; // login name by default.
        self.managerSearchBy = self.availableSearchCriteria[0]; // login name by default.
        self.privateUsersSearchBy = self.availableSearchCriteriaPrivateUsers[0]; // login name by default.
        self.ouSearchBy = self.availableSearchCriteriaOU[0]; // login name by default.

        // some variables to debounce the search text
        var pendingSearchUser, cancelSearchUser = angular.noop, lastSearchUser;

        function refreshDebounceUser() {
            lastSearchUser = 0;
            pendingSearchUser = null;
            cancelSearchUser = angular.noop;
        }

        /**
         * Debounce if querying faster than 300ms
         */
        function debounceSearchUser() {
            var now = new Date().getMilliseconds();
            lastSearchUser = lastSearchUser || now;
            return ((now - lastSearchUser) < 300);
        }

        // some variables to debounce the search text
        var pendingSearchOU, cancelSearchOU = angular.noop, lastSearchOU;

        function refreshDebounceOU() {
            lastSearchOU = 0;
            pendingSearchOU = null;
            cancelSearchOU = angular.noop;
        }

        /**
         * Debounce if querying faster than 300ms
         */
        function debounceSearchOU() {
            var now = new Date().getMilliseconds();
            lastSearchOU = lastSearchOU || now;
            return ((now - lastSearchOU) < 300);
        }

        // some variables to debounce the search text
        var pendingSearchPrivateUser, cancelSearchPrivateUser = angular.noop, lastSearchPrivateUser;

        function refreshDebouncePrivateUser() {
            lastSearchPrivateUser = 0;
            pendingSearchPrivateUser = null;
            cancelSearchPrivateUser = angular.noop;
        }

        /**
         * Debounce if querying faster than 300ms
         */
        function debounceSearchPrivateUser() {
            var now = new Date().getMilliseconds();
            lastSearchPrivateUser = lastSearchPrivateUser || now;
            return ((now - lastSearchPrivateUser) < 300);
        }

        /**
         * check if user exist in application users list when searching
         * @param applicationUser
         */
        self.userExists = function (applicationUser) {
            return _.find(self.applicationUsers, function (appUser) {
                return (applicationUser.id === (appUser ? appUser.id : null)) && (applicationUser.ouId === appUser.ouId);
            });
        };
        /**
         * check if manager already exist in manager list or not when searching
         * @param applicationUser
         */
        self.managerExists = function (applicationUser) {
            return _.find(self.allManagers, function (appUser) {
                return applicationUser.id === (appUser ? appUser.id : null);
            });
        };
        /**
         * check if private user already exist in private user list or not when searching
         * @param applicationUser
         */
        self.privateUserExists = function (applicationUser) {
            return _.find(self.allPrivateUsers, function (appUser) {
                return applicationUser.id === (appUser ? appUser.id : null);
            });
        };
        /**
         * check if ou group already exist in private user list or not when searching
         * @param ouGroup
         */
        self.ouGroupExists = function (ouGroup) {
            return _.find(self.allOUGroups, function (ou) {
                return ouGroup.id === (ou ? ou.id : null);
            });
        };
        /**
         * check if user exist in all selected users list to restrict in list when searching
         * @param applicationUser
         */
        self.userExistsInAllSelectedUsers = function (applicationUser) {
            return _.find(self.allSelectedDistributionWorkflows, function (appUser) {
                return applicationUser.id === (appUser ? appUser.userId : null);
            });
        };
        /**
         * @description load application users from server for grid on popup load
         */
        self.loadAllApplicationUsers = function () {
            distributionWorkflowService.loadAllApplicationUsers().then(function (result) {
                for (var i = 0; i < result.length; i++) {
                    var isFavoriteUserExist = _.find(self.allFavoriteUsers, function (FavoriteUser) {
                        return FavoriteUser.id === result[i].id && FavoriteUser.ouId === result[i].ouId;
                    });
                    result[i].setSelected(isFavoriteUserExist);
                }

                self.applicationUsers = result;
                //select heading for favorite
                self.selectedAllFavoriteUsers = true;
                var isSelected = _.find(self.applicationUsers, function (user) {
                    return user.selected === false && user.ouId === user.ouId;
                });
                if (isSelected) {
                    self.selectedAllFavoriteUsers = false;
                }
            });
        };
        self.loadAllApplicationUsers();

        self.isUserSearch = false;
        /**
         * @description search for application users.
         */
        self.querySearchApplicationUsers = function () {
            self.isUserSearch = true;
            self.selectedSenderUser = [];

            self.selectedAppUsers = [];
            self.applicationUsers = [];

            if (!self.usersSearchText) {
                if (!self.isReplyButton)
                    return self.loadAllApplicationUsers();
                else {
                    self.isUserSearch = false;
                    return false;
                }

            }
            if (!pendingSearchUser || !debounceSearchUser()) {
                cancelSearchUser();

                return pendingSearchUser = $q(function (resolve, reject) {
                    cancelSearchUser = reject;
                    $timeout(function () {
                        distributionWorkflowService
                            .searchApplicationUsersByText(self.usersSearchText, self.searchBy).then(function (result) {
                            self.applicationUsers = [];
                            refreshDebounceUser();
                            resolve(_.filter(result, function (ApplicationUser) {
                                var isFavoriteUserExist = _.find(self.allFavoriteUsers, function (FavoriteUser) {
                                    return FavoriteUser.id === ApplicationUser.id && FavoriteUser.ouId === ApplicationUser.ouId;
                                });
                                ApplicationUser.setSelected(isFavoriteUserExist);

                                if (!self.userExists(ApplicationUser)) {
                                    self.applicationUsers.push(ApplicationUser);
                                }
                            }));

                            //self.isUserSearch = true;

                            //select heading for favorite
                            self.selectedAllFavoriteUsers = true;
                            var isSelected = _.find(self.applicationUsers, function (user) {
                                return user.selected === false && user.ouId === user.ouId;
                            });

                            if (isSelected) {
                                self.selectedAllFavoriteUsers = false;
                            }
                        });
                    });
                })
            }
            return pendingSearchUser;
        };
        /**
         * @description add users to All distribution Workflow users list
         * @param distributionWorkflowUsersForm
         */
        self.addUserToSendDistributionWorkflow = function (distributionWorkflowUsersForm) {


            if (self._canNotSendToMultiUsers() && (self.selectedSenderUser.length > 1 || self.allSelectedDistributionWorkflows.length)) {
                dialog.errorMessage(langService.get('cannot_send_unapproved_document_to_multi_users'));
                return false;
            }
            else if (self._canNotSendToMultiUsers() && (self.selectedAppUsers.length > 1 || self.allSelectedDistributionWorkflows.length)) {
                dialog.errorMessage(langService.get('cannot_send_unapproved_document_to_multi_users'));
                return false;
            }
            else {
                var proxyUsers = [];
                if (self.selectedSenderUser.length > 0) {
                    proxyUsers = _.filter(self.selectedSenderUser, function (user) {
                        return user.proxyInfo !== null && user.proxyInfo.outOfOffice;
                    });
                }
                if (self.selectedAppUsers.length > 0) {
                    proxyUsers = _.filter(self.selectedAppUsers, function (user) {
                        return user.proxyInfo !== null && user.proxyInfo.outOfOffice;
                    });
                }

                if (proxyUsers.length > 0) {
                    dialog.alertMessage(self.getProxyUsersTemplate(proxyUsers))
                        .then(function () {
                            var i;
                            for (i = 0; i < self.selectedAppUsers.length; i++) {
                                var isDistributionWorkflowUserExist = _.find(self.allSelectedDistributionWorkflows, function (distributionWorkflowUser) {
                                    return distributionWorkflowUser.id === self.selectedAppUsers[i].id && distributionWorkflowUser.ouId === self.selectedAppUsers[i].ouId;
                                });
                                if (!isDistributionWorkflowUserExist) {

                                    self.selectedAppUsers[i].action = self.userDistributionWorkflow.action;
                                    self.selectedAppUsers[i].escalationProcess = self.userDistributionWorkflow.escalationProcess;
                                    self.selectedAppUsers[i].dueDate = self.userDistributionWorkflow.dueDate;
                                    self.selectedAppUsers[i].smsNotification = self.userDistributionWorkflow.smsNotification;
                                    self.selectedAppUsers[i].emailNotification = self.userDistributionWorkflow.emailNotification;

                                    self.selectedAppUsers[i].toUserDomain = self.selectedAppUsers[i].domainName;
                                    self.selectedAppUsers[i].appUserOUID = self.selectedAppUsers[i].ouId;

                                    self.usersCopy = angular.copy(self.selectedAppUsers[i]);

                                    self.allSelectedDistributionWorkflows.push(self.usersCopy);
                                }
                            }

                            for (i = 0; i < self.selectedSenderUser.length; i++) {
                                var isDistributionWorkflowUserExist = _.find(self.allSelectedDistributionWorkflows, function (distributionWorkflowUser) {
                                    return distributionWorkflowUser.id === self.selectedSenderUser[i].id && distributionWorkflowUser.ouId === self.selectedSenderUser[i].ouId;
                                });
                                if (!isDistributionWorkflowUserExist) {

                                    self.selectedSenderUser[i].action = self.userDistributionWorkflow.action;
                                    self.selectedSenderUser[i].escalationProcess = self.userDistributionWorkflow.escalationProcess;
                                    self.selectedSenderUser[i].dueDate = self.userDistributionWorkflow.dueDate;
                                    self.selectedSenderUser[i].smsNotification = self.userDistributionWorkflow.smsNotification;
                                    self.selectedSenderUser[i].emailNotification = self.userDistributionWorkflow.emailNotification;

                                    self.selectedSenderUser[i].toUserDomain = self.selectedSenderUser[i].domainName;
                                    self.selectedSenderUser[i].appUserOUID = self.selectedSenderUser[i].ouId;

                                    self.usersCopy = angular.copy(self.selectedSenderUser[i]);

                                    self.allSelectedDistributionWorkflows.push(self.usersCopy);
                                }
                            }

                            self.selectedAppUsers = [];
                            self.selectedSenderUser = [];

                            self.userDistributionWorkflow = new DistributionWorkflow();

                            distributionWorkflowUsersForm.$setUntouched();

                        });
                }
                else {
                    var i;
                    for (i = 0; i < self.selectedAppUsers.length; i++) {
                        var isDistributionWorkflowUserExist = _.find(self.allSelectedDistributionWorkflows, function (distributionWorkflowUser) {
                            return distributionWorkflowUser.id === self.selectedAppUsers[i].id && distributionWorkflowUser.ouId === self.selectedAppUsers[i].ouId;
                        });
                        if (!isDistributionWorkflowUserExist) {

                            self.selectedAppUsers[i].action = self.userDistributionWorkflow.action;
                            self.selectedAppUsers[i].escalationProcess = self.userDistributionWorkflow.escalationProcess;
                            self.selectedAppUsers[i].dueDate = self.userDistributionWorkflow.dueDate;
                            self.selectedAppUsers[i].smsNotification = self.userDistributionWorkflow.smsNotification;
                            self.selectedAppUsers[i].emailNotification = self.userDistributionWorkflow.emailNotification;

                            self.selectedAppUsers[i].toUserDomain = self.selectedAppUsers[i].domainName;
                            self.selectedAppUsers[i].appUserOUID = self.selectedAppUsers[i].ouId;

                            self.usersCopy = angular.copy(self.selectedAppUsers[i]);

                            self.allSelectedDistributionWorkflows.push(self.usersCopy);
                        }
                    }

                    for (i = 0; i < self.selectedSenderUser.length; i++) {
                        var isDistributionWorkflowUserExist = _.find(self.allSelectedDistributionWorkflows, function (distributionWorkflowUser) {
                            return distributionWorkflowUser.id === self.selectedSenderUser[i].id && distributionWorkflowUser.ouId === self.selectedSenderUser[i].ouId;
                        });
                        if (!isDistributionWorkflowUserExist) {

                            self.selectedSenderUser[i].action = self.userDistributionWorkflow.action;
                            self.selectedSenderUser[i].escalationProcess = self.userDistributionWorkflow.escalationProcess;
                            self.selectedSenderUser[i].dueDate = self.userDistributionWorkflow.dueDate;
                            self.selectedSenderUser[i].smsNotification = self.userDistributionWorkflow.smsNotification;
                            self.selectedSenderUser[i].emailNotification = self.userDistributionWorkflow.emailNotification;

                            self.selectedSenderUser[i].toUserDomain = self.selectedSenderUser[i].domainName;
                            self.selectedSenderUser[i].appUserOUID = self.selectedSenderUser[i].ouId;

                            self.usersCopy = angular.copy(self.selectedSenderUser[i]);

                            self.allSelectedDistributionWorkflows.push(self.usersCopy);
                        }
                    }

                    self.selectedAppUsers = [];
                    self.selectedSenderUser = [];

                    self.userDistributionWorkflow = new DistributionWorkflow();

                    distributionWorkflowUsersForm.$setUntouched();
                }
            }
        };
        /**
         * @description load managers for OU
         */
        self.getManagersForOU = function () {
            self.selectedManagers = [];
            self.allManagers = [];

            return distributionWorkflowService.getManagersForOU(self.organizationsManager.id).then(function (result) {
                for (var i = 0; i < result.length; i++) {
                    var isFavoriteUserExist = _.find(self.allFavoriteUsers, function (FavoriteManager) {
                        return FavoriteManager.id === result[i].id && FavoriteManager.ouId === result[i].ouId;
                    });
                    result[i].setSelected(isFavoriteUserExist);
                }

                //select heading for favorite Managers
                self.selectedAllFavoriteManagers = true;
                var isSelected = _.find(result, function (managerUser) {
                    return managerUser.selected === false && managerUser.ouId === managerUser.ouId;
                });

                if (isSelected) {
                    self.selectedAllFavoriteManagers = false;
                }

                self.allManagers = result;
            })
        };
        self.addManagersToSendDistributionWorkflow = function (distributionWorkflowManagersForm) {
            if (self._canNotSendToMultiUsers() && (self.selectedManagers.length > 1 || self.allSelectedDistributionWorkflows.length)) {
                dialog.errorMessage(langService.get('cannot_send_unapproved_document_to_multi_users'));
                return false;
            }
            else {
                var proxyUsers = [];

                if (self.selectedManagers.length > 0) {
                    proxyUsers = _.filter(self.selectedManagers, function (manager) {
                        return manager.proxyInfo !== null;
                    });
                }

                if (proxyUsers.length > 0) {
                    dialog.alertMessage(self.getProxyUsersTemplate(proxyUsers))
                        .then(function () {
                            for (var i = 0; i < self.selectedManagers.length; i++) {
                                var isDistributionWorkflowUserExist = _.find(self.allSelectedDistributionWorkflows, function (distributionWorkflowUser) {
                                    return distributionWorkflowUser.id === self.selectedManagers[i].id && distributionWorkflowUser.ouId === self.selectedManagers[i].ouId;
                                });
                                if (!isDistributionWorkflowUserExist) {

                                    self.selectedManagers[i].action = self.managerDistributionWorkflow.action;
                                    self.selectedManagers[i].escalationProcess = self.managerDistributionWorkflow.escalationProcess;
                                    self.selectedManagers[i].dueDate = self.managerDistributionWorkflow.dueDate;
                                    self.selectedManagers[i].smsNotification = self.managerDistributionWorkflow.smsNotification;
                                    self.selectedManagers[i].emailNotification = self.managerDistributionWorkflow.emailNotification;

                                    self.selectedManagers[i].toUserDomain = self.selectedManagers[i].domainName;
                                    self.selectedManagers[i].appUserOUID = self.selectedManagers[i].ouId;

                                    self.managersCopy = angular.copy(self.selectedManagers[i]);

                                    self.allSelectedDistributionWorkflows.push(self.managersCopy);
                                }
                            }

                            self.selectedManagers = [];

                            self.managerDistributionWorkflow = new DistributionWorkflow();
                            distributionWorkflowManagersForm.$setUntouched();
                        });
                }
                else {
                    for (var i = 0; i < self.selectedManagers.length; i++) {
                        var isDistributionWorkflowUserExist = _.find(self.allSelectedDistributionWorkflows, function (distributionWorkflowUser) {
                            return distributionWorkflowUser.id === self.selectedManagers[i].id && distributionWorkflowUser.ouId === self.selectedManagers[i].ouId;
                        });
                        if (!isDistributionWorkflowUserExist) {
                            self.selectedManagers[i].action = self.managerDistributionWorkflow.action;
                            self.selectedManagers[i].escalationProcess = self.managerDistributionWorkflow.escalationProcess;
                            self.selectedManagers[i].dueDate = self.managerDistributionWorkflow.dueDate;
                            self.selectedManagers[i].smsNotification = self.managerDistributionWorkflow.smsNotification;
                            self.selectedManagers[i].emailNotification = self.managerDistributionWorkflow.emailNotification;
                            self.selectedManagers[i].toUserDomain = self.selectedManagers[i].domainName;
                            self.selectedManagers[i].appUserOUID = self.selectedManagers[i].ouId;

                            self.managersCopy = angular.copy(self.selectedManagers[i]);
                            self.allSelectedDistributionWorkflows.push(self.managersCopy);
                        }
                    }

                    self.selectedManagers = [];
                    self.managerDistributionWorkflow = new DistributionWorkflow();

                    distributionWorkflowManagersForm.$setUntouched();
                }
            }
        };

        /* /!**
         * @description search for private users.
         *!/
         self.querySearchPrivateUsers = function () {
         self.selectedPrivateUsers = [];
         if (!self.privateUsersSearchText) {
         self.allPrivateUsers = [];
         return pendingSearchPrivateUser;
         }
         if (!pendingSearchPrivateUser || !debounceSearchPrivateUser()) {
         cancelSearchPrivateUser();

         return pendingSearchPrivateUser = $q(function (resolve, reject) {
         cancelSearchPrivateUser = reject;
         $timeout(function () {
         distributionWorkflowService
         .findPrivateUsersByText(self.privateUsersSearchText, self.privateUsersSearchBy).then(function (result) {
         self.allPrivateUsers = [];
         refreshDebouncePrivateUser();
         resolve(_.filter(result, function (PrivateUser) {
         // if (!self.userExists(PrivateUser) && !self.userExistsInAllSelectedUsers(PrivateUser)) {
         if (!self.privateUserExists(PrivateUser)) {
         self.allPrivateUsers.push(PrivateUser);
         }
         }));
         });
         });
         })
         }
         return pendingSearchPrivateUser;
         };*/

        /**
         * @description load private users from server
         * @returns {*|Promise<U>}
         */
        self.loadPrivateUsers = function () {
            return distributionWorkflowService.loadPrivateUsers().then(function (result) {
                for (var i = 0; i < result.length; i++) {
                    var isFavoritePrivateUserExist = _.find(self.allFavoriteUsers, function (FavoritePrivateUser) {
                        return FavoritePrivateUser.id === result[i].id && FavoritePrivateUser.ouId === result[i].ouId;
                    });
                    result[i].setSelected(isFavoritePrivateUserExist);
                }

                //select heading for favorite Private users
                self.selectedAllFavoritePrivateUsers = true;
                var isSelected = _.find(result, function (privateUser) {
                    return privateUser.selected === false && privateUser.ouId === privateUser.ouId;
                });

                if (isSelected) {
                    self.selectedAllFavoritePrivateUsers = false;
                }

                self.allPrivateUsers = result;
            })
        };
        /**
         * @description call to load private users on popup load
         */
        self.loadPrivateUsers();
        self.addPrivateUserToSendDistributionWorkflow = function (distributionWorkflowPrivateUsersForm) {
            if (self._canNotSendToMultiUsers() && (self.selectedPrivateUsers.length > 1 || self.allSelectedDistributionWorkflows.length)) {
                dialog.errorMessage(langService.get('cannot_send_unapproved_document_to_multi_users'));
                return false;
            }
            else {
                for (var i = 0; i < self.selectedPrivateUsers.length; i++) {
                    var isDistributionWorkflowUserExist = _.find(self.allSelectedDistributionWorkflows, function (distributionWorkflowUser) {
                        return distributionWorkflowUser.id === self.selectedPrivateUsers[i].id && distributionWorkflowUser.ouId === self.selectedPrivateUsers[i].ouId;
                    });
                    if (!isDistributionWorkflowUserExist) {
                        self.selectedPrivateUsers[i].action = self.privateUserDistributionWorkflow.action;
                        self.selectedPrivateUsers[i].escalationProcess = self.privateUserDistributionWorkflow.escalationProcess;
                        self.selectedPrivateUsers[i].dueDate = self.privateUserDistributionWorkflow.dueDate;
                        self.selectedPrivateUsers[i].smsNotification = self.privateUserDistributionWorkflow.smsNotification;
                        self.selectedPrivateUsers[i].emailNotification = self.privateUserDistributionWorkflow.emailNotification;

                        self.selectedPrivateUsers[i].toUserDomain = self.selectedPrivateUsers[i].domainName;
                        self.selectedPrivateUsers[i].appUserOUID = self.selectedPrivateUsers[i].ouId;

                        self.privateUsersCopy = angular.copy(self.selectedPrivateUsers[i]);

                        self.allSelectedDistributionWorkflows.push(self.privateUsersCopy);
                    }
                }

                self.selectedPrivateUsers = [];
                self.privateUserDistributionWorkflow = new DistributionWorkflow();

                distributionWorkflowPrivateUsersForm.$setUntouched();
            }
        };
        /**
         * @description search for OU groups.
         */
        self.querySearchOrganizationGroup = function () {
            self.selectedOUGroups = [];
            if (!self.ouSearchText) {
                self.allOUGroups = [];
                return pendingSearchOU;
            }
            if (!pendingSearchOU || !debounceSearchOU()) {
                cancelSearchOU();

                return pendingSearchOU = $q(function (resolve, reject) {
                    cancelSearchOU = reject;
                    $timeout(function () {
                        distributionWorkflowService
                            .findOrganizationGroupsByText(self.ouSearchText, self.ouSearchBy).then(function (result) {
                            self.allOUGroups = [];
                            refreshDebounceOU();
                            resolve(_.filter(result, function (ouGroup) {
                                var isFavoriteOUExist = _.find(self.allFavoriteOUs, function (FavoriteOU) {
                                    return FavoriteOU.id === ouGroup.id;
                                });
                                ouGroup['selected'] = !!isFavoriteOUExist;

                                if (!self.ouGroupExists(ouGroup)) {
                                    self.allOUGroups.push(ouGroup);
                                }

                            }));

                            //to select ou for favorite
                            self.selectedAllFavoriteOUs = true;
                            var isSelected = _.find(self.allOUGroups, function (ou) {
                                return ou.selected === false;
                            });

                            if (isSelected) {
                                self.selectedAllFavoriteOUs = false;
                            }
                        });
                    });
                })
            }
            return pendingSearchOU;
        };
        self.addOUGroupsToSendDistributionWorkflow = function (distributionWorkflowOUForm) {
            if (self._canNotSendToMultiUsers() && (self.selectedOUGroups.length > 1 || self.allSelectedDistributionWorkflows.length)) {
                dialog.errorMessage(langService.get('cannot_send_unapproved_document_to_multi_users'));
                return false;
            }
            else {
                for (var i = 0; i < self.selectedOUGroups.length; i++) {
                    var isOUGroupExist = _.find(self.allSelectedDistributionWorkflows, function (ouGroup) {
                        return ouGroup.id === self.selectedOUGroups[i].id && !ouGroup.ouId && ouGroup.workflowUserType === self.workflowUserTypes.OU;
                    });
                    if (!isOUGroupExist) {
                        self.selectedOUGroups[i].action = self.mainOUDistributionWorkflow.action;
                        self.selectedOUGroups[i].escalationProcess = self.mainOUDistributionWorkflow.escalationProcess;
                        self.selectedOUGroups[i].dueDate = self.mainOUDistributionWorkflow.dueDate;
                        self.selectedOUGroups[i].smsNotification = self.mainOUDistributionWorkflow.smsNotification;
                        self.selectedOUGroups[i].emailNotification = self.mainOUDistributionWorkflow.emailNotification;
                        self.selectedOUGroups[i].toOUId = self.selectedOUGroups[i].id;

                        self.ouGroupsCopy = angular.copy(self.selectedOUGroups[i]);

                        self.allSelectedDistributionWorkflows.push(self.ouGroupsCopy);
                    }
                }

                self.mainOUDistributionWorkflow = new DistributionWorkflow();
                self.selectedOUGroups = [];
                distributionWorkflowOUForm.$setUntouched();
            }
        };
        /**
         * @description Load the favorite users from server.
         */
        self.loadFavoriteUsers = function () {
            var defer = $q.defer();
            self.progressFavoriteUsers = defer.promise;
            return distributionWorkflowService.loadFavoriteUsers().then(function (result) {
                self.allFavoriteUsers = [];
                self.allFavoriteUsers = result;
                defer.resolve(true);

                return result;
            });
        };
        /**
         * @description Load the favorite OUs from server.
         */
        self.loadFavoriteOUs = function () {
            var defer = $q.defer();
            self.progressFavoriteOUs = defer.promise;
            return distributionWorkflowService.loadFavoriteOUs().then(function (result) {
                self.allFavoriteOUs = [];
                self.allFavoriteOUs = result;
                defer.resolve(true);

                return result;
            });
        };
        self.addFavoriteUsersToSendDistributionWorkflow = function (favoriteUsersOUForm) {
            if (self._canNotSendToMultiUsers() && (self.selectedFavoriteUsers.length > 1 || self.allSelectedDistributionWorkflows.length)) {
                dialog.errorMessage(langService.get('cannot_send_unapproved_document_to_multi_users'));
                return false;
            }
            else {
                var i;
                for (i = 0; i < self.selectedFavoriteUsers.length; i++) {
                    var isDistributionWorkflowFavoriteUserExist = _.find(self.allSelectedDistributionWorkflows, function (distributionWorkflowUser) {
                        return distributionWorkflowUser.id === self.selectedFavoriteUsers[i].id && distributionWorkflowUser.ouId === self.selectedFavoriteUsers[i].ouId;
                    });
                    if (!isDistributionWorkflowFavoriteUserExist) {
                        self.selectedFavoriteUsers[i].action = self.favoriteUserOUDistributionWorkflow.action;
                        self.selectedFavoriteUsers[i].escalationProcess = self.favoriteUserOUDistributionWorkflow.escalationProcess;
                        self.selectedFavoriteUsers[i].dueDate = self.favoriteUserOUDistributionWorkflow.dueDate;
                        self.selectedFavoriteUsers[i].smsNotification = self.favoriteUserOUDistributionWorkflow.smsNotification;
                        self.selectedFavoriteUsers[i].emailNotification = self.favoriteUserOUDistributionWorkflow.emailNotification;

                        self.selectedFavoriteUsers[i].toUserDomain = self.selectedFavoriteUsers[i].domainName;
                        self.selectedFavoriteUsers[i].appUserOUID = self.selectedFavoriteUsers[i].ouId;

                        self.favoriteUsersCopy = angular.copy(self.selectedFavoriteUsers[i]);

                        self.allSelectedDistributionWorkflows.push(self.favoriteUsersCopy);
                    }
                }
                for (i = 0; i < self.selectedFavoriteOUs.length; i++) {

                    var isDistributionWorkflowFavoriteOUExist = _.find(self.allSelectedDistributionWorkflows, function (distributionWorkflowOU) {
                        return distributionWorkflowOU.id === self.selectedFavoriteOUs[i].id && !distributionWorkflowOU.ouId;
                    });
                    if (!isDistributionWorkflowFavoriteOUExist) {
                        self.selectedFavoriteOUs[i].action = self.favoriteUserOUDistributionWorkflow.action;
                        self.selectedFavoriteOUs[i].escalationProcess = self.favoriteUserOUDistributionWorkflow.escalationProcess;
                        self.selectedFavoriteOUs[i].dueDate = self.favoriteUserOUDistributionWorkflow.dueDate;
                        self.selectedFavoriteOUs[i].smsNotification = self.favoriteUserOUDistributionWorkflow.smsNotification;
                        self.selectedFavoriteOUs[i].emailNotification = self.favoriteUserOUDistributionWorkflow.emailNotification;

                        self.favoriteOUsCopy = angular.copy(self.selectedFavoriteOUs[i]);
                        self.allSelectedDistributionWorkflows.push(self.favoriteOUsCopy);
                    }
                }

                self.selectedFavoriteUsers = [];
                self.selectedFavoriteOUs = [];

                self.favoriteUserOUDistributionWorkflow = new DistributionWorkflow();
                favoriteUsersOUForm.$setUntouched();
            }
        };
        /**
         * @description get all workflow group members from list of workflow group
         */
        self.loadWorkflowGroupMembers = function (workflowGroup) {
            var groupMembers = _.find(self.workflowGroups, function (wfGroup) {
                return workflowGroup.id === wfGroup.id;
            });

            var getGroupMembers = [];
            for (var i = 0; i < groupMembers.groupMembers.length; i++) {
                var workflowGroupMember = new WorkflowGroupMembers();
                if (groupMembers.groupMembers.length > 0) {
                    if (groupMembers.groupMembers[i].member) {
                        workflowGroupMember.id = groupMembers.groupMembers[i].member.id;
                        workflowGroupMember.arName = groupMembers.groupMembers[i].member.arFullName;
                        workflowGroupMember.enName = groupMembers.groupMembers[i].member.enFullName;
                        workflowGroupMember.domainName = groupMembers.groupMembers[i].member.domainName;
                        workflowGroupMember.ouArName = groupMembers.groupMembers[i].relatedOU.arName;
                        workflowGroupMember.ouEnName = groupMembers.groupMembers[i].relatedOU.enName;
                        workflowGroupMember.ouId = groupMembers.groupMembers[i].memberOuId;
                    }
                }
                getGroupMembers.push(workflowGroupMember);
            }
            self.allWorkflowGroupMembers = getGroupMembers;
            //return getGroupMembers;
        };
        self.addWorkflowMembersToSendDistributionWorkflow = function (workflowGroupsForm) {
            if (self._canNotSendToMultiUsers() && (self.selectedWorkflowMembers.length > 1 || self.allSelectedDistributionWorkflows.length)) {
                dialog.errorMessage(langService.get('cannot_send_unapproved_document_to_multi_users'));
                return false;
            }
            else {
                for (var i = 0; i < self.selectedWorkflowMembers.length; i++) {
                    var isWorkflowGroupMemberExist = _.find(self.allSelectedDistributionWorkflows, function (groupMember) {
                        return groupMember.id === self.selectedWorkflowMembers[i].id && groupMember.ouId === self.selectedWorkflowMembers[i].ouId;
                    });
                    if (!isWorkflowGroupMemberExist) {

                        self.selectedWorkflowMembers[i].action = self.workflowGroupDistributionWorkflow.action;
                        self.selectedWorkflowMembers[i].escalationProcess = self.workflowGroupDistributionWorkflow.escalationProcess;
                        self.selectedWorkflowMembers[i].dueDate = self.workflowGroupDistributionWorkflow.dueDate;
                        self.selectedWorkflowMembers[i].smsNotification = self.workflowGroupDistributionWorkflow.smsNotification;
                        self.selectedWorkflowMembers[i].emailNotification = self.workflowGroupDistributionWorkflow.emailNotification;

                        self.selectedWorkflowMembers[i].toUserDomain = self.selectedWorkflowMembers[i].domainName;
                        self.selectedWorkflowMembers[i].appUserOUID = self.selectedWorkflowMembers[i].ouId;

                        self.workflowGroupMemberCopy = angular.copy(self.selectedWorkflowMembers[i]);

                        self.allSelectedDistributionWorkflows.push(self.workflowGroupMemberCopy);
                    }
                }

                self.selectedWorkflowMembers = [];
                self.workflowGroupDistributionWorkflow = new DistributionWorkflow();
                workflowGroupsForm.$setUntouched();
            }
        };
        /**
         * @description Opens the popup to add new workflow group and related to user
         * @param $event
         */
        self.openAddWorkflowGroupDialog = function ($event) {
            workflowGroupService
                .controllerMethod
                .workflowGroupAdd(true, $event)
                .then(function (result) {
                    var applicationUserId = employeeService.getEmployee().id;

                    var userWorkflowGroup = new UserWorkflowGroup({
                        applicationUser: {id: applicationUserId},
                        wfgroup: {id: result.id}
                    });
                    return userWorkflowGroupService
                        .addUserWorkflowGroup(userWorkflowGroup)
                        .then(function () {
                            distributionWorkflowService.loadWorkflowGroups().then(function (result) {
                                var wfGroups = [];
                                for (var i = 0; i < result.length; i++) {
                                    var tempArr = _.pick(result[i], ['wfgroup']);
                                    wfGroups.push(tempArr.wfgroup);
                                }
                                self.workflowGroups = wfGroups;
                            });
                        });
                });
        };
        /**
         * @description load Government Entity Users from server
         */
        self.loadGovernmentEntityUsers = function () {
            distributionWorkflowService.loadGovernmentEntityUsers().then(function (result) {
                self.allGovernmentEntities = result;
            });
        };
        self.loadGovernmentEntityUsers();
        self.addGEToSendDistributionWorkflow = function (governmentEntityForm) {
            if (self._canNotSendToMultiUsers() && (self.selectedGovernmentEntities.length > 1 || self.allSelectedDistributionWorkflows.length)) {
                dialog.errorMessage(langService.get('cannot_send_unapproved_document_to_multi_users'));
                return false;
            }
            else {
                for (var i = 0; i < self.selectedGovernmentEntities.length; i++) {
                    var isGovernmentEntityExist = _.find(self.allSelectedDistributionWorkflows, function (governmentEntity) {
                        return governmentEntity.id === self.selectedGovernmentEntities[i].id && governmentEntity.ouId === self.selectedGovernmentEntities[i].ouId;
                    });
                    if (!isGovernmentEntityExist) {

                        self.selectedGovernmentEntities[i].action = self.governmentEntityDistributionWorkflow.action;
                        self.selectedGovernmentEntities[i].escalationProcess = self.governmentEntityDistributionWorkflow.escalationProcess;
                        self.selectedGovernmentEntities[i].dueDate = self.governmentEntityDistributionWorkflow.dueDate;
                        self.selectedGovernmentEntities[i].smsNotification = self.governmentEntityDistributionWorkflow.smsNotification;
                        self.selectedGovernmentEntities[i].emailNotification = self.governmentEntityDistributionWorkflow.emailNotification;
                        self.selectedGovernmentEntities[i].toUserDomain = self.selectedGovernmentEntities[i].domainName;
                        self.selectedGovernmentEntities[i].appUserOUID = self.selectedGovernmentEntities[i].ouId;

                        self.governmentEntityCopy = angular.copy(self.selectedGovernmentEntities[i]);

                        self.allSelectedDistributionWorkflows.push(self.governmentEntityCopy);
                    }
                }

                self.selectedGovernmentEntities = [];
                self.governmentEntityDistributionWorkflow = new DistributionWorkflow();
                governmentEntityForm.$setUntouched();
            }
        };

        //if reply button is clicked
        if (self.isReplyButton) {
            self.senderUser = new DistributionWorkflowApplicationUser();

            self.senderUser.id = self.senderForReply.sender.id;
            self.senderUser.arName = self.senderForReply.sender.arName;
            self.senderUser.enName = self.senderForReply.sender.enName;
            self.senderUser.domainName = self.senderForReply.domain;
            self.senderUser.ouArName = self.senderForReply.senderOuInfo.arName;
            self.senderUser.ouEnName = self.senderForReply.senderOuInfo.enName;
            self.senderUser.ouId = self.senderForReply.senderOuInfo.id;//self.senderForReply.defaultOUID;
            self.senderUser.appUserOUID = self.senderForReply.senderOuInfo.id;
            self.senderUser.toUserDomain = self.senderForReply.domain;
            self.selectedSenderUser.push(self.senderUser);
            self.senderUser = [self.senderUser];
        }

        /**
         * remove user from Send distribution workflow users list
         * @param distributionWorkflow
         * @param $event
         */
        self.removeSingleDistributionWorkflowUser = function (distributionWorkflow, $event) {
            if (distributionWorkflow.workflowUserType !== self.workflowUserTypes.OU && distributionWorkflow.workflowUserType !== "FavoriteOU" && distributionWorkflow.workflowUserType !== "receivedOUs") {
                _.remove(self.allSelectedDistributionWorkflows, function (n) {
                    return distributionWorkflow.id === n.id && distributionWorkflow.ouId === n.ouId;
                });
            } else if (distributionWorkflow.workflowUserType === self.workflowUserTypes.OU || distributionWorkflow.workflowUserType === "FavoriteOU") {
                _.remove(self.allSelectedDistributionWorkflows, function (n) {
                    return distributionWorkflow.id === n.id && (n.workflowUserType === self.workflowUserTypes.OU || n.workflowUserType === "FavoriteOU");
                });
            } else {
                _.remove(self.allSelectedDistributionWorkflows, function (n) {
                    return distributionWorkflow.id === n.id && (n.workflowUserType === "receivedOUs");
                });
            }

            if (self.allSelectedDistributionWorkflows.length === 0)
                self.selectedDistributionWorkflows = [];
        };
        /**
         * remove all user from Send distribution workflow users list
         */
        self.removeAllDistributionWorkflowUsers = function () {
            self.allSelectedDistributionWorkflows = [];
            self.selectedDistributionWorkflows = [];
        };

        self.getTranslatedNotification = function (notification) {
            return notification ? langService.get('yes') : langService.get('no');
        };
        self.getTranslatedEmailNotification = function (notification) {
            return notification ? langService.get('yes') : langService.get('no');
        };
        self.getTranslatedEscalationProcess = function (escalation) {
            return langService.current === 'ar' ? escalation.arName : escalation.enName;
        };
        self.getFormatedDueDate = function (dueDate) {
            return moment(dueDate).format('YYYY-MM-DD');
        };

        self.favoriteOUsArr = [];
        self.selectedAllFavoriteOUs = false;
        /**
         * @description to add or remove bulk favorite OUs
         * @param allOUGroups
         * @param isFavoriteTab
         * @param $event
         */
        self.addRemoveBulkFavoriteOUs = function (allOUGroups, isFavoriteTab, $event) {
            if (!self.selectedAllFavoriteOUs) {
                self.selectedAllFavoriteOUs = !self.selectedAllFavoriteOUs;

                self.favoriteOUsArr = [];
                angular.forEach(allOUGroups, function (val) {
                    var isOUExist = _.find(self.allFavoriteOUs, function (ouGroup) {
                        return ouGroup.id === val.id;
                    });

                    if (!isOUExist) {
                        val.selected = true;
                        self.favoriteOUsArr.push({"first": val.id});
                    }
                });

                distributionWorkflowService.addBulkFavoriteOU(self.favoriteOUsArr).then(function (result) {
                    self.loadFavoriteOUs().then(function (value) {

                        for (var i = 0; i < self.favoriteOUsArr.length; i++) {
                            var editRelationIdForOU = _.find(allOUGroups, function (ou) {
                                return ou.id === self.favoriteOUsArr[i]["first"];
                            });
                            editRelationIdForOU.relationId = result[i];
                        }

                    });
                });
            } else {
                if (isFavoriteTab) {
                    self.selectedAllFavoriteOUs = !self.selectedAllFavoriteOUs;
                    self.favoriteOUsArr = [];
                    angular.forEach(allOUGroups, function (val) {
                        self.favoriteOUsArr.push(val.relationId);
                    });

                    distributionWorkflowService.removeBulkFavoriteOU(self.favoriteOUsArr).then(function (result) {
                        self.loadFavoriteOUs().then(function (value) {
                            for (var i = 0; i < self.allOUGroups.length; i++) {
                                self.allOUGroups[i].relationId = null;
                                self.allOUGroups[i].selected = false;
                            }
                        });

                    });
                } else {
                    self.selectedAllFavoriteOUs = !self.selectedAllFavoriteOUs;
                    self.favoriteOUsArr = [];
                    angular.forEach(allOUGroups, function (val) {
                        self.favoriteOUsArr.push(val.relationId);
                    });

                    distributionWorkflowService.removeBulkFavoriteOU(self.favoriteOUsArr).then(function (result) {
                        self.loadFavoriteOUs().then(function (value) {
                            for (var i = 0; i < allOUGroups.length; i++) {
                                allOUGroups[i].relationId = null;
                                allOUGroups[i].selected = false;
                            }
                        });
                    });
                }
            }
        };
        /**
         * @description to add or remove single favorite OU
         * @param ouGroup
         * @param $event
         */
        self.addRemoveSingleFavoriteOU = function (ouGroup, $event) {
            if (!ouGroup.selected) {
                //distributionWorkflowService.addSingleFavoriteOU({"frequentOUID": ouGroup.id}).then(function (result) {
                distributionWorkflowService.addSingleFavoriteOU({"frequentUserOUID": ouGroup.id}).then(function (result) {
                    ouGroup.selected = !ouGroup.selected;
                    ouGroup.relationId = result;
                    self.loadFavoriteOUs().then(function (value) {

                        self.selectedAllFavoriteOUs = true;
                        var isSelected = _.find(self.allOUGroups, function (ou) {
                            return ou.selected === false;
                        });

                        if (isSelected) {
                            self.selectedAllFavoriteOUs = false;
                        }
                    });

                })
            } else {
                var removeId = ouGroup.relationId;
                distributionWorkflowService.removeSingleFavoriteOU(removeId).then(function (result) {
                    ouGroup.selected = !ouGroup.selected;

                    var unSelectOU = _.find(self.allOUGroups, function (ou) {
                        return ou.id === ouGroup.id;
                    });

                    if (unSelectOU)
                        if (unSelectOU.selected)
                            unSelectOU.selected = !unSelectOU.selected;

                    self.loadFavoriteOUs().then(function (value) {

                        self.selectedAllFavoriteOUs = true;
                        var isSelected = _.find(self.allOUGroups, function (ou) {
                            return ou.selected === false;
                        });

                        if (isSelected) {
                            self.selectedAllFavoriteOUs = false;
                        }

                    });
                })
            }
        };

        self.favoriteUsersArr = [];
        self.selectedAllFavoriteUsers = false;
        /**
         * @description remove single user from favorite tab
         * @param user
         * @param $event
         */
        self.removeSingleFavoriteUser = function (user, $event) {
            var removeId = user.relationId;
            distributionWorkflowService.removeSingleFavoriteUser(removeId).then(function (result) {
                user.selected = !user.selected;
                user.relationId = null;
                var unSelectUser = _.find(self.applicationUsers, function (appUser) {
                    return appUser.id === user.id && appUser.ouId === user.ouId;
                });
                if (unSelectUser) {
                    if (unSelectUser.selected)
                        unSelectUser.selected = !unSelectUser.selected;
                }

                var unSelectManager = _.find(self.allManagers, function (managerUser) {
                    return managerUser.id === user.id && managerUser.ouId === user.ouId;
                });
                if (unSelectManager) {
                    if (unSelectManager.selected)
                        unSelectManager.selected = !unSelectManager.selected;
                }

                var unSelectPrivateUser = _.find(self.allPrivateUsers, function (privateUser) {
                    return privateUser.id === user.id && privateUser.ouId === user.ouId;
                });
                if (unSelectPrivateUser) {
                    if (unSelectPrivateUser.selected)
                        unSelectPrivateUser.selected = !unSelectPrivateUser.selected;
                }

                self.loadFavoriteUsers().then(function (value) {
                    //select/Un-select heading for user tab
                    self.selectedAllFavoriteUsers = true;
                    var isSelected = _.find(self.applicationUsers, function (appUser) {
                        return appUser.selected === false;
                    });
                    if (isSelected) {
                        self.selectedAllFavoriteUsers = false;
                    }

                    //select/Un-select heading for manager tab
                    self.selectedAllFavoriteManagers = true;
                    var isUnSelectedManagerExist = _.find(self.allManagers, function (managerUser) {
                        return managerUser.selected === false;
                    });
                    if (isUnSelectedManagerExist) {
                        self.selectedAllFavoriteManagers = false;
                    }

                    //select/Un-select heading for private user tab
                    self.selectedAllFavoritePrivateUsers = true;
                    var isUnSelectedPrivateUserExist = _.find(self.allPrivateUsers, function (privateUser) {
                        return privateUser.selected === false;
                    });
                    if (isUnSelectedPrivateUserExist) {
                        self.selectedAllFavoritePrivateUsers = false;
                    }

                });
            })
        };
        /**
         * @description remove bulk favorite users from favorite tab
         */
        self.removeBulkUserFromFavoriteTab = function () {
            self.favoriteUsersArr = [];
            angular.forEach(self.allFavoriteUsers, function (val) {
                self.favoriteUsersArr.push(val.relationId);
            });

            distributionWorkflowService.removeBulkFavoriteUsers(self.favoriteUsersArr).then(function (result) {
                for (var i = 0; i < self.allFavoriteUsers.length; i++) {
                    //unselect user and remove relationId
                    var userExist = _.find(self.applicationUsers, function (user) {
                        return user.id === self.allFavoriteUsers[i].id && user.ouId === self.allFavoriteUsers[i].ouId;
                    });
                    if (userExist) {
                        userExist.relationId = null;
                        userExist.selected = false;
                    }

                    //unselect manager and remove relationId
                    var managerExist = _.find(self.allManagers, function (managerUser) {
                        return managerUser.id === self.allFavoriteUsers[i].id && managerUser.ouId === self.allFavoriteUsers[i].ouId;
                    });
                    if (managerExist) {
                        managerExist.relationId = null;
                        managerExist.selected = false;
                    }

                    //unselect private user and remove relationId
                    var privateUserExist = _.find(self.allPrivateUsers, function (privateUser) {
                        return privateUser.id === self.allFavoriteUsers[i].id && privateUser.ouId === self.allFavoriteUsers[i].ouId;
                    });
                    if (privateUserExist) {
                        privateUserExist.relationId = null;
                        privateUserExist.selected = false;
                    }
                    //here check other tabs also
                }

                self.selectedAllFavoriteUsers = true;
                var unSelectedUsersExist = _.find(self.applicationUsers, function (user) {
                    return user.selected === false;
                });
                if (unSelectedUsersExist) {
                    self.selectedAllFavoriteUsers = false;
                }


                //select/Unselect heading for managers tab
                self.selectedAllFavoriteManagers = true;
                var isUnSelectedManagerExist = _.find(self.allManagers, function (managerUser) {
                    return managerUser.selected === false;
                });
                if (isUnSelectedManagerExist) {
                    self.selectedAllFavoriteManagers = false;
                }


                //select/Unselect heading for private users tab
                self.selectedAllFavoritePrivateUsers = true;
                var isUnSelectedPrivateUserExist = _.find(self.allPrivateUsers, function (privateUser) {
                    return privateUser.selected === false;
                });
                if (isUnSelectedPrivateUserExist) {
                    self.selectedAllFavoritePrivateUsers = false;
                }

                self.loadFavoriteUsers();
            });
        };
        /**
         * @description add or remove bulk favorite users, this is for User tab
         * @param applicationUsers
         * @param $event
         */
        self.addRemoveBulkFavoriteUsers = function (applicationUsers, $event) {
            if (!self.selectedAllFavoriteUsers) {
                self.favoriteUsersArr = [];
                angular.forEach(applicationUsers, function (val) {
                    var isUserExist = _.find(self.allFavoriteUsers, function (user) {
                        return user.id === val.id && user.ouId === val.ouId;
                    });

                    if (!isUserExist) {
                        self.favoriteUsersArr.push({"first": val.id, "second": val.ouId});
                    }
                });

                distributionWorkflowService.addBulkFavoriteUser(self.favoriteUsersArr).then(function (result) {
                    self.loadFavoriteUsers().then(function (value) {
                        self.selectedAllFavoriteUsers = !self.selectedAllFavoriteUsers;
                        for (var i = 0; i < self.favoriteUsersArr.length; i++) {
                            //make user selected and add relation id
                            var editRelationIdForUser = _.find(applicationUsers, function (user) {
                                return user.id === self.favoriteUsersArr[i]["first"] && user.ouId === self.favoriteUsersArr[i]["second"]
                            });
                            editRelationIdForUser.selected = true;
                            editRelationIdForUser.relationId = result[i];

                            //make manager selected and add relation id
                            var editRelationIdForManager = _.find(self.allManagers, function (manager) {
                                return manager.id === self.favoriteUsersArr[i]["first"] && manager.ouId === self.favoriteUsersArr[i]["second"]
                            });
                            if (editRelationIdForManager) {
                                editRelationIdForManager.selected = true;
                                editRelationIdForManager.relationId = result[i];
                            }

                            //make private user selected and add relation id
                            var editRelationIdForPrivateUser = _.find(self.allPrivateUsers, function (privateUser) {
                                return privateUser.id === self.favoriteUsersArr[i]["first"] && privateUser.ouId === self.favoriteUsersArr[i]["second"]
                            });
                            if (editRelationIdForPrivateUser) {
                                editRelationIdForPrivateUser.selected = true;
                                editRelationIdForPrivateUser.relationId = result[i];
                            }

                            //check here for other tabs also
                        }

                        self.selectedAllFavoriteManagers = true;
                        var isUnSelectedExist = _.find(self.allManagers, function (managerUser) {
                            return managerUser.selected === false;
                        });
                        if (isUnSelectedExist) {
                            self.selectedAllFavoriteManagers = false;
                        }

                        self.selectedAllFavoritePrivateUsers = true;
                        var isUnSelectedPrivateUserExist = _.find(self.allPrivateUsers, function (privateUser) {
                            return privateUser.selected === false;
                        });
                        if (isUnSelectedPrivateUserExist) {
                            self.selectedAllFavoritePrivateUsers = false;
                        }

                        //check here for other tabs also
                    });
                });
            }
            else {
                // self.selectedAllFavoriteUsers = !self.selectedAllFavoriteUsers;
                self.favoriteUsersArr = [];
                angular.forEach(applicationUsers, function (val) {
                    self.favoriteUsersArr.push(val.relationId);
                });

                distributionWorkflowService.removeBulkFavoriteUsers(self.favoriteUsersArr).then(function (result) {
                    self.loadFavoriteUsers().then(function (value) {
                        self.selectedAllFavoriteUsers = !self.selectedAllFavoriteUsers;
                        for (var i = 0; i < applicationUsers.length; i++) {
                            applicationUsers[i].relationId = null;
                            applicationUsers[i].selected = false;

                            //make manager unselected and remove relation id
                            var editRelationIdForManager = _.find(self.allManagers, function (manager) {
                                return manager.id === applicationUsers[i]["id"] && manager.ouId === applicationUsers[i]["ouId"]
                            });
                            if (editRelationIdForManager) {
                                editRelationIdForManager.selected = false;
                                editRelationIdForManager.relationId = null;
                            }

                            //make private user unselected and remove relation id
                            var editRelationIdForPrivateUser = _.find(self.allPrivateUsers, function (privateUser) {
                                return privateUser.id === applicationUsers[i]["id"] && privateUser.ouId === applicationUsers[i]["ouId"]
                            });
                            if (editRelationIdForPrivateUser) {
                                editRelationIdForPrivateUser.selected = false;
                                editRelationIdForPrivateUser.relationId = null;
                            }
                        }

                        self.selectedAllFavoriteManagers = true;
                        var isUnSelectedExist = _.find(self.allManagers, function (managerUser) {
                            return managerUser.selected === false;
                        });
                        if (isUnSelectedExist) {
                            self.selectedAllFavoriteManagers = false;
                        }

                        self.selectedAllFavoritePrivateUsers = true;
                        var isUnSelectedPrivateUserExist = _.find(self.allPrivateUsers, function (privateUser) {
                            return privateUser.selected === false;
                        });
                        if (isUnSelectedPrivateUserExist) {
                            self.selectedAllFavoritePrivateUsers = false;
                        }

                    });
                });
            }
        };
        /**
         * @description add or remove single favorite user, this is for User tab
         * @param user
         * @param $event
         */
        self.addRemoveSingleFavoriteUser = function (user, $event) {
            if (!user.selected) {
                distributionWorkflowService.addSingleFavoriteUser({
                    "frequentUserId": user.id,
                    "frequentUserOUID": user.ouId
                }).then(function (result) {
                    user.selected = !user.selected;
                    user.relationId = result;
                    self.loadFavoriteUsers().then(function (value) {
                        self.selectedAllFavoriteUsers = true;
                        var isSelected = _.find(self.applicationUsers, function (appUser) {
                            return appUser.selected === false;
                        });
                        if (isSelected) {
                            self.selectedAllFavoriteUsers = false;
                        }

                        //make manager selected if exist and add relation id
                        var editRelationIdForManager = _.find(self.allManagers, function (manager) {
                            return manager.id === user.id && manager.ouId === user.ouId
                        });
                        if (editRelationIdForManager) {
                            editRelationIdForManager.selected = true;
                            editRelationIdForManager.relationId = result;
                        }

                        self.selectedAllFavoriteManagers = true;
                        var isUnSelectedExist = _.find(self.allManagers, function (managerUser) {
                            return managerUser.selected === false;
                        });
                        if (isUnSelectedExist) {
                            self.selectedAllFavoriteManagers = false;
                        }

                        //make private user selected if exist and add relation id
                        var editRelationIdForPrivateUser = _.find(self.allPrivateUsers, function (privateUser) {
                            return privateUser.id === user.id && privateUser.ouId === user.ouId
                        });
                        if (editRelationIdForPrivateUser) {
                            editRelationIdForPrivateUser.selected = true;
                            editRelationIdForPrivateUser.relationId = result;
                        }

                        self.selectedAllFavoritePrivateUsers = true;
                        var isUnSelectedPrivateUserExist = _.find(self.allPrivateUsers, function (privateUser) {
                            return privateUser.selected === false;
                        });
                        if (isUnSelectedPrivateUserExist) {
                            self.selectedAllFavoritePrivateUsers = false;
                        }

                    });

                })
            }
            else {
                var removeId = user.relationId;
                distributionWorkflowService.removeSingleFavoriteUser(removeId).then(function (result) {
                    user.selected = !user.selected;
                    user.relationId = null;
                    var unSelectUser = _.find(self.applicationUsers, function (appUser) {
                        return appUser.id === user.id && appUser.ouId === user.ouId;
                    });

                    if (unSelectUser) {
                        if (unSelectUser.selected)
                            unSelectUser.selected = !unSelectUser.selected;
                    }

                    self.loadFavoriteUsers().then(function (value) {
                        self.selectedAllFavoriteUsers = true;
                        var isSelected = _.find(self.applicationUsers, function (appUser) {
                            return appUser.selected === false;
                        });
                        if (isSelected) {
                            self.selectedAllFavoriteUsers = false;
                        }

                        //make manager unselected and remove relation id
                        var editRelationIdForManager = _.find(self.allManagers, function (manager) {
                            return manager.id === user["id"] && manager.ouId === user["ouId"]
                        });
                        if (editRelationIdForManager) {
                            editRelationIdForManager.selected = false;
                            editRelationIdForManager.relationId = null;
                        }

                        self.selectedAllFavoriteManagers = true;
                        var isUnSelectedManagerExist = _.find(self.allManagers, function (managerUser) {
                            return managerUser.selected === false;
                        });
                        if (isUnSelectedManagerExist) {
                            self.selectedAllFavoriteManagers = false;
                        }

                        //make private user unselected and remove relation id
                        var editRelationIdForPrivateUser = _.find(self.allPrivateUsers, function (privateUser) {
                            return privateUser.id === user["id"] && privateUser.ouId === user["ouId"]
                        });
                        if (editRelationIdForPrivateUser) {
                            editRelationIdForPrivateUser.selected = false;
                            editRelationIdForPrivateUser.relationId = null;
                        }

                        self.selectedAllFavoritePrivateUsers = true;
                        var isUnSelectedPrivateUserExist = _.find(self.allPrivateUsers, function (privateUser) {
                            return privateUser.selected === false;
                        });
                        if (isUnSelectedPrivateUserExist) {
                            self.selectedAllFavoritePrivateUsers = false;
                        }

                    });
                })
            }
        };

        self.favoriteManagersArr = [];
        self.selectedAllFavoriteManagers = false;
        /**
         * @description add or remove bulk favorite managers from manager tab
         */
        self.addRemoveBulkFavoriteManagers = function () {
            if (!self.selectedAllFavoriteManagers) {
                self.favoriteManagersArr = [];
                angular.forEach(self.allManagers, function (val) {
                    var isManagerExist = _.find(self.allFavoriteUsers, function (user) {
                        return user.id === val.id && user.ouId === val.ouId;
                    });

                    if (!isManagerExist) {
                        self.favoriteManagersArr.push({"first": val.id, "second": val.ouId});
                    }
                });

                distributionWorkflowService.addBulkFavoriteUser(self.favoriteManagersArr).then(function (result) {
                    self.loadFavoriteUsers().then(function (value) {
                        self.selectedAllFavoriteManagers = !self.selectedAllFavoriteManagers;
                        for (var i = 0; i < self.favoriteManagersArr.length; i++) {
                            var editRelationIdForManager = _.find(self.allManagers, function (user) {
                                return user.id === self.favoriteManagersArr[i]["first"] && user.ouId === self.favoriteManagersArr[i]["second"]
                            });
                            editRelationIdForManager.relationId = result[i];
                            editRelationIdForManager.selected = true;

                            //make application users selected and add relation id
                            var editRelationIdForUser = _.find(self.applicationUsers, function (user) {
                                return user.id === self.favoriteManagersArr[i]["first"] && user.ouId === self.favoriteManagersArr[i]["second"]
                            });
                            if (editRelationIdForUser) {
                                editRelationIdForUser.selected = true;
                                editRelationIdForUser.relationId = result[i];
                            }

                            //make private users selected and add relation id
                            var editRelationIdForPrivateUser = _.find(self.allPrivateUsers, function (privateUser) {
                                return privateUser.id === self.favoriteManagersArr[i]["first"] && privateUser.ouId === self.favoriteManagersArr[i]["second"]
                            });
                            if (editRelationIdForPrivateUser) {
                                editRelationIdForPrivateUser.selected = true;
                                editRelationIdForPrivateUser.relationId = result[i];
                            }
                        }

                        self.selectedAllFavoriteUsers = true;
                        var isUnSelectedExist = _.find(self.applicationUsers, function (user) {
                            return user.selected === false;
                        });
                        if (isUnSelectedExist) {
                            self.selectedAllFavoriteUsers = false;
                        }

                        self.selectedAllFavoritePrivateUsers = true;
                        var isUnSelectedPrivateUserExist = _.find(self.allPrivateUsers, function (privateUer) {
                            return privateUer.selected === false;
                        });
                        if (isUnSelectedPrivateUserExist) {
                            self.selectedAllFavoritePrivateUsers = false;
                        }

                    });
                });
            }
            else {
                self.favoriteManagersArr = [];
                angular.forEach(self.allManagers, function (val) {
                    self.favoriteManagersArr.push(val.relationId);
                });

                distributionWorkflowService.removeBulkFavoriteUsers(self.favoriteManagersArr).then(function (result) {
                    self.loadFavoriteUsers().then(function (value) {
                        self.selectedAllFavoriteManagers = !self.selectedAllFavoriteManagers;
                        for (var i = 0; i < self.allManagers.length; i++) {
                            self.allManagers[i].relationId = null;
                            self.allManagers[i].selected = false;

                            //make user unselected and remove relation id
                            var editRelationIdForUser = _.find(self.applicationUsers, function (user) {
                                return user.id === self.allManagers[i]["id"] && user.ouId === self.allManagers[i]["ouId"]
                            });
                            if (editRelationIdForUser) {
                                editRelationIdForUser.selected = false;
                                editRelationIdForUser.relationId = null;
                            }

                            //make private user unselected and remove relation id
                            var editRelationIdForPrivateUser = _.find(self.allPrivateUsers, function (privateUser) {
                                return privateUser.id === self.allManagers[i]["id"] && privateUser.ouId === self.allManagers[i]["ouId"]
                            });
                            if (editRelationIdForPrivateUser) {
                                editRelationIdForPrivateUser.selected = false;
                                editRelationIdForPrivateUser.relationId = null;
                            }
                        }

                        self.selectedAllFavoriteUsers = true;
                        var isUnSelectedExist = _.find(self.applicationUsers, function (user) {
                            return user.selected === false;
                        });
                        if (isUnSelectedExist) {
                            self.selectedAllFavoriteUsers = false;
                        }

                        self.selectedAllFavoritePrivateUsers = true;
                        var isUnSelectedPrivateUserExist = _.find(self.allPrivateUsers, function (privateUser) {
                            return privateUser.selected === false;
                        });
                        if (isUnSelectedPrivateUserExist) {
                            self.selectedAllFavoritePrivateUsers = false;
                        }

                    });
                });
            }
        };
        /**
         * @description add or remove single favorite manager from manager tab
         * @param user
         */
        self.addRemoveSingleFavoriteManager = function (user) {
            if (!user.selected) {
                distributionWorkflowService.addSingleFavoriteUser({
                    "frequentUserId": user.id,
                    "frequentUserOUID": user.ouId
                }).then(function (result) {
                    user.selected = !user.selected;
                    user.relationId = result;
                    self.loadFavoriteUsers().then(function (value) {
                        self.selectedAllFavoriteManagers = true;
                        var isSelected = _.find(self.allManagers, function (managerUser) {
                            return managerUser.selected === false;
                        });
                        if (isSelected) {
                            self.selectedAllFavoriteManagers = false;
                        }

                        //make application users selected and add relation id
                        var editRelationIdForUser = _.find(self.applicationUsers, function (appUser) {
                            return appUser.id === user.id && appUser.ouId === user.ouId
                        });
                        if (editRelationIdForUser) {
                            editRelationIdForUser.selected = true;
                            editRelationIdForUser.relationId = result;
                        }

                        self.selectedAllFavoriteUsers = true;
                        var isUnSelectedUserExist = _.find(self.applicationUsers, function (appUser) {
                            return appUser.selected === false;
                        });
                        if (isUnSelectedUserExist) {
                            self.selectedAllFavoriteUsers = false;
                        }

                        //make private users selected and add relation id
                        var editRelationIdForPrivateUser = _.find(self.allPrivateUsers, function (privateUser) {
                            return privateUser.id === user.id && privateUser.ouId === user.ouId
                        });
                        if (editRelationIdForPrivateUser) {
                            editRelationIdForPrivateUser.selected = true;
                            editRelationIdForPrivateUser.relationId = result;
                        }

                        self.selectedAllFavoritePrivateUsers = true;
                        var isUnSelectedPrivateUserExist = _.find(self.allPrivateUsers, function (privateUser) {
                            return privateUser.selected === false;
                        });
                        if (isUnSelectedPrivateUserExist) {
                            self.selectedAllFavoritePrivateUsers = false;
                        }

                    });

                })
            }
            else {
                var removeId = user.relationId;
                distributionWorkflowService.removeSingleFavoriteUser(removeId).then(function (result) {
                    user.selected = !user.selected;
                    user.relationId = null;
                    var unSelectManager = _.find(self.allManagers, function (managerUser) {
                        return managerUser.id === user.id && managerUser.ouId === user.ouId;
                    });
                    if (unSelectManager) {
                        if (unSelectManager.selected)
                            unSelectManager.selected = !unSelectManager.selected;
                    }

                    self.loadFavoriteUsers().then(function (value) {
                        self.selectedAllFavoriteManagers = true;
                        var isSelected = _.find(self.allManagers, function (managerUser) {
                            return managerUser.selected === false;
                        });
                        if (isSelected) {
                            self.selectedAllFavoriteManagers = false;
                        }

                        //make user unselected and remove relation id
                        var editRelationIdForUser = _.find(self.applicationUsers, function (appUser) {
                            return appUser.id === user["id"] && appUser.ouId === user["ouId"]
                        });
                        if (editRelationIdForUser) {
                            editRelationIdForUser.selected = false;
                            editRelationIdForUser.relationId = null;
                        }

                        self.selectedAllFavoriteUsers = true;
                        var isUnSelectedUserExist = _.find(self.applicationUsers, function (user) {
                            return user.selected === false;
                        });
                        if (isUnSelectedUserExist) {
                            self.selectedAllFavoriteUsers = false;
                        }


                        //make private user unselected and remove relation id
                        var editRelationIdForPrivateUser = _.find(self.allPrivateUsers, function (privateUser) {
                            return privateUser.id === user["id"] && privateUser.ouId === user["ouId"]
                        });
                        if (editRelationIdForPrivateUser) {
                            editRelationIdForPrivateUser.selected = false;
                            editRelationIdForPrivateUser.relationId = null;
                        }

                        self.selectedAllFavoritePrivateUsers = true;
                        var isUnSelectedPrivateUserExist = _.find(self.allPrivateUsers, function (privateUser) {
                            return privateUser.selected === false;
                        });
                        if (isUnSelectedPrivateUserExist) {
                            self.selectedAllFavoritePrivateUsers = false;
                        }

                    });
                })
            }
        };

        self.favoritePrivateUsersArr = [];
        self.selectedAllFavoritePrivateUsers = false;
        /**
         * @description add or remove bulk favorite private users from private users tab
         */
        self.addRemoveBulkFavoritePrivateUsers = function () {
            if (!self.selectedAllFavoritePrivateUsers) {
                self.favoritePrivateUsersArr = [];
                angular.forEach(self.allPrivateUsers, function (val) {
                    var isPrivateUserExist = _.find(self.allFavoriteUsers, function (user) {
                        return user.id === val.id && user.ouId === val.ouId;
                    });

                    if (!isPrivateUserExist) {
                        self.favoritePrivateUsersArr.push({"first": val.id, "second": val.ouId});
                    }
                });

                distributionWorkflowService.addBulkFavoriteUser(self.favoritePrivateUsersArr).then(function (result) {
                    self.loadFavoriteUsers().then(function (value) {
                        self.selectedAllFavoritePrivateUsers = !self.selectedAllFavoritePrivateUsers;
                        for (var i = 0; i < self.favoritePrivateUsersArr.length; i++) {
                            var editRelationIdForPrivateUser = _.find(self.allPrivateUsers, function (user) {
                                return user.id === self.favoritePrivateUsersArr[i]["first"] && user.ouId === self.favoritePrivateUsersArr[i]["second"]
                            });
                            editRelationIdForPrivateUser.relationId = result[i];
                            editRelationIdForPrivateUser.selected = true;

                            //make application users selected and add relation id
                            var editRelationIdForUser = _.find(self.applicationUsers, function (user) {
                                return user.id === self.favoritePrivateUsersArr[i]["first"] && user.ouId === self.favoritePrivateUsersArr[i]["second"]
                            });
                            if (editRelationIdForUser) {
                                editRelationIdForUser.selected = true;
                                editRelationIdForUser.relationId = result[i];
                            }

                            //make manager selected and add relation id
                            var editRelationIdForManager = _.find(self.allManagers, function (managerUser) {
                                return managerUser.id === self.favoritePrivateUsersArr[i]["first"] && managerUser.ouId === self.favoritePrivateUsersArr[i]["second"]
                            });
                            if (editRelationIdForManager) {
                                editRelationIdForManager.selected = true;
                                editRelationIdForManager.relationId = result[i];
                            }
                        }
                        self.selectedAllFavoriteUsers = true;
                        var isUnSelectedUserExist = _.find(self.applicationUsers, function (user) {
                            return user.selected === false;
                        });
                        if (isUnSelectedUserExist) {
                            self.selectedAllFavoriteUsers = false;
                        }

                        self.selectedAllFavoriteManagers = true;
                        var isUnSelectedManagerExist = _.find(self.allManagers, function (managerUser) {
                            return managerUser.selected === false;
                        });
                        if (isUnSelectedManagerExist) {
                            self.selectedAllFavoriteManagers = false;
                        }

                    });
                });
            }
            else {
                self.favoritePrivateUsersArr = [];
                angular.forEach(self.allPrivateUsers, function (val) {
                    self.favoritePrivateUsersArr.push(val.relationId);
                });

                distributionWorkflowService.removeBulkFavoriteUsers(self.favoritePrivateUsersArr).then(function (result) {
                    self.loadFavoriteUsers().then(function (value) {
                        self.selectedAllFavoritePrivateUsers = !self.selectedAllFavoritePrivateUsers;
                        for (var i = 0; i < self.allPrivateUsers.length; i++) {
                            self.allPrivateUsers[i].relationId = null;
                            self.allPrivateUsers[i].selected = false;

                            //make user unselected and remove relation id
                            var editRelationIdForUser = _.find(self.applicationUsers, function (user) {
                                return user.id === self.allPrivateUsers[i]["id"] && user.ouId === self.allPrivateUsers[i]["ouId"]
                            });
                            if (editRelationIdForUser) {
                                editRelationIdForUser.selected = false;
                                editRelationIdForUser.relationId = null;
                            }

                            //make manager unselected and remove relation id
                            var editRelationIdForManager = _.find(self.allManagers, function (managerUser) {
                                return managerUser.id === self.allPrivateUsers[i]["id"] && managerUser.ouId === self.allPrivateUsers[i]["ouId"]
                            });
                            if (editRelationIdForManager) {
                                editRelationIdForManager.selected = false;
                                editRelationIdForManager.relationId = null;
                            }
                        }

                        self.selectedAllFavoriteUsers = true;
                        var isUnSelectedExist = _.find(self.applicationUsers, function (user) {
                            return user.selected === false;
                        });
                        if (isUnSelectedExist) {
                            self.selectedAllFavoriteUsers = false;
                        }

                        self.selectedAllFavoriteManagers = true;
                        var isUnSelectedManagerExist = _.find(self.allManagers, function (managerUser) {
                            return managerUser.selected === false;
                        });
                        if (isUnSelectedManagerExist) {
                            self.selectedAllFavoriteManagers = false;
                        }

                    });
                });
            }
        };
        /**
         * @description add or remove single favorite private users from private users tab
         * @param user
         */
        self.addRemoveSingleFavoritePrivateUser = function (user) {
            if (!user.selected) {
                distributionWorkflowService.addSingleFavoriteUser({
                    "frequentUserId": user.id,
                    "frequentUserOUID": user.ouId
                }).then(function (result) {
                    user.selected = !user.selected;
                    user.relationId = result;
                    self.loadFavoriteUsers().then(function (value) {
                        self.selectedAllFavoritePrivateUsers = true;
                        var isSelected = _.find(self.allPrivateUsers, function (privateUser) {
                            return privateUser.selected === false;
                        });
                        if (isSelected) {
                            self.selectedAllFavoritePrivateUsers = false;
                        }

                        //make application users selected and add relation id
                        var editRelationIdForUser = _.find(self.applicationUsers, function (appUser) {
                            return appUser.id === user.id && appUser.ouId === user.ouId
                        });
                        if (editRelationIdForUser) {
                            editRelationIdForUser.selected = true;
                            editRelationIdForUser.relationId = result;
                        }

                        self.selectedAllFavoriteUsers = true;
                        var isUnSelectedExist = _.find(self.applicationUsers, function (appUser) {
                            return appUser.selected === false;
                        });
                        if (isUnSelectedExist) {
                            self.selectedAllFavoriteUsers = false;
                        }

                        //make manager selected and add relation id
                        var editRelationIdForManager = _.find(self.allManagers, function (managerUser) {
                            return managerUser.id === user.id && managerUser.ouId === user.ouId
                        });
                        if (editRelationIdForManager) {
                            editRelationIdForManager.selected = true;
                            editRelationIdForManager.relationId = result;
                        }

                        self.selectedAllFavoriteManagers = true;
                        var isUnSelectedManagerExist = _.find(self.allManagers, function (managerUser) {
                            return managerUser.selected === false;
                        });
                        if (isUnSelectedManagerExist) {
                            self.selectedAllFavoriteManagers = false;
                        }

                    });

                })
            }
            else {
                var removeId = user.relationId;
                distributionWorkflowService.removeSingleFavoriteUser(removeId).then(function (result) {
                    user.selected = !user.selected;
                    user.relationId = null;
                    var unSelectPrivateUser = _.find(self.allPrivateUsers, function (privateUser) {
                        return privateUser.id === user.id && privateUser.ouId === user.ouId;
                    });
                    if (unSelectPrivateUser) {
                        if (unSelectPrivateUser.selected)
                            unSelectPrivateUser.selected = !unSelectPrivateUser.selected;
                    }

                    self.loadFavoriteUsers().then(function (value) {
                        self.selectedAllFavoritePrivateUsers = true;
                        var isSelected = _.find(self.allPrivateUsers, function (privateUser) {
                            return privateUser.selected === false;
                        });
                        if (isSelected) {
                            self.selectedAllFavoritePrivateUsers = false;
                        }


                        //make user unselected and remove relation id
                        var editRelationIdForUser = _.find(self.applicationUsers, function (appUser) {
                            return appUser.id === user["id"] && appUser.ouId === user["ouId"]
                        });
                        if (editRelationIdForUser) {
                            editRelationIdForUser.selected = false;
                            editRelationIdForUser.relationId = null;
                        }

                        self.selectedAllFavoriteUsers = true;
                        var isUnSelectedExist = _.find(self.applicationUsers, function (user) {
                            return user.selected === false;
                        });
                        if (isUnSelectedExist) {
                            self.selectedAllFavoriteUsers = false;
                        }


                        //make manager unselected and remove relation id
                        var editRelationIdForManager = _.find(self.allManagers, function (managerUser) {
                            return managerUser.id === user["id"] && managerUser.ouId === user["ouId"]
                        });
                        if (editRelationIdForManager) {
                            editRelationIdForManager.selected = false;
                            editRelationIdForManager.relationId = null;
                        }

                        self.selectedAllFavoriteManagers = true;
                        var isUnSelectedManagerExist = _.find(self.allManagers, function (managerUser) {
                            return managerUser.selected === false;
                        });
                        if (isUnSelectedManagerExist) {
                            self.selectedAllFavoriteManagers = false;
                        }

                    });
                })
            }
        };
        /**
         * @description disable rows for users already selected
         * @param user
         * @returns {boolean}
         */
        self.disableRow = function (user) {
            var userExist = _.find(self.allSelectedDistributionWorkflows, function (selectedUser) {
                return (selectedUser.ouId === user.ouId) && (selectedUser.id === user.id);
            });

            return !!userExist;
        };
        self.showDistributionWorkflowAddedUsers = false;
        /**
         * @description show/hide Distribution Workflow Users grid
         */
        self.toggleDistributionWorkflowAddedUsers = function () {
            self.showDistributionWorkflowAddedUsers = !self.showDistributionWorkflowAddedUsers;
        };

        /**
         * @description send added users
         */
        self.launchDistributionWorkflow = function () {
            var normalUsers = _.filter(self.allSelectedDistributionWorkflows, function (user) {
                return user.workflowUserType === self.workflowUserTypes.NORMAL_USER || user.workflowUserType === self.workflowUserTypes.PRIVATE_USER;
            });
            var managerUsers = _.filter(self.allSelectedDistributionWorkflows, function (user) {
                return user.workflowUserType === self.workflowUserTypes.MANAGER || user.workflowUserType === self.workflowUserTypes.GOVERNMENT_ENTITY_USER;
            });
            var favoriteUsers = _.filter(self.allSelectedDistributionWorkflows, function (user) {
                return user.workflowUserType === self.workflowUserTypes.FAVORITE_USER;
            });
            /*var receivedOUs = _.filter(self.allSelectedDistributionWorkflows, function (user) {
                return user.workflowUserType === "receivedOUs";
            });*/
            var mainOUs = _.filter(self.allSelectedDistributionWorkflows, function (user) {
                return user.workflowUserType === self.workflowUserTypes.OU;
            });

            // if (normalUsers.length === 0 && managerUsers.length === 0 && favoriteUsers.length === 0 && receivedOUs.length === 0 && mainOUs.length === 0) {
            if (!normalUsers.length && !managerUsers.length && !favoriteUsers.length && !mainOUs.length) {
                toast.error(langService.get('select_users'));
                return false;
            }

            if (normalUsers.length > 1 && self._canNotSendToMultiUsers()) {
                dialog.errorMessage(langService.get('cannot_send_unapproved_document_to_multi_users'));
                return false;
            }

            var finalDistributionWorkflowUsers = new SendDistributionWorkflow();
            finalDistributionWorkflowUsers.normalUsers = normalUsers;
            finalDistributionWorkflowUsers.managerUsers = managerUsers;
            finalDistributionWorkflowUsers.favouriteUsers = favoriteUsers;
            //finalDistributionWorkflowUsers.receivedOUs = receivedOUs;
            finalDistributionWorkflowUsers.receivedRegOUs = mainOUs;

            distributionWorkflowService.sendDistributionWorkflow(finalDistributionWorkflowUsers, self.vsId, self.classDescription).then(function (result) {
                if (result) {
                    toast.success(langService.get('launch_success_distribution_workflow'));
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.allSelectedDistributionWorkflows = [];
                }
                else
                    toast.error(langService.get('failed'));

                dialog.hide(result);
            });

        };
        /**
         * @description forward added users
         */
        self.forwardDistributionWorkflow = function () {
            var normalUsers = _.filter(self.allSelectedDistributionWorkflows, function (user) {
                return user.workflowUserType === self.workflowUserTypes.NORMAL_USER || user.workflowUserType === self.workflowUserTypes.PRIVATE_USER;
            });
            var managerUsers = _.filter(self.allSelectedDistributionWorkflows, function (user) {
                return user.workflowUserType === self.workflowUserTypes.MANAGER || user.workflowUserType === self.workflowUserTypes.GOVERNMENT_ENTITY_USER;
            });
            var favoriteUsers = _.filter(self.allSelectedDistributionWorkflows, function (user) {
                return user.workflowUserType === self.workflowUserTypes.FAVORITE_USER;
            });
            /*var receivedOUs = _.filter(self.allSelectedDistributionWorkflows, function (ou) {
                return ou.workflowUserType === "receivedOUs";
            });*/
            var mainOUs = _.filter(self.allSelectedDistributionWorkflows, function (ou) {
                return ou.workflowUserType === self.workflowUserTypes.OU;
            });

            //if (normalUsers.length === 0 && managerUsers.length === 0 && favoriteUsers.length === 0 && receivedOUs.length === 0 && mainOUs.length === 0) {
            if (normalUsers.length === 0 && managerUsers.length === 0 && favoriteUsers.length === 0 && !mainOUs.length) {
                toast.error(langService.get('select_users'));
                return false;
            }

            var finalDistributionWorkflowUsers = new SendDistributionWorkflow();
            finalDistributionWorkflowUsers.normalUsers = normalUsers;
            finalDistributionWorkflowUsers.managerUsers = managerUsers;
            finalDistributionWorkflowUsers.favouriteUsers = favoriteUsers;
            //finalDistributionWorkflowUsers.receivedOUs = receivedOUs;
            finalDistributionWorkflowUsers.receivedRegOUs = mainOUs;

            distributionWorkflowService.forwardDistributionWorkflow(finalDistributionWorkflowUsers, self.vsId, self.workObjectNumber, self.classDescription).then(function (result) {
                if (result) {
                    toast.success(langService.get('launch_success_distribution_workflow'));
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.allSelectedDistributionWorkflows = [];
                }
                else
                    toast.error(langService.get('failed'));
                dialog.hide(result);
            })
                .catch(function (result) {
                    toast.error(langService.get('failed'));
                });

        };
        /**
         * @description forward added users
         */
        self.replyDistributionWorkflow = function () {
            var normalUsers = _.filter(self.allSelectedDistributionWorkflows, function (user) {
                return user.workflowUserType === self.workflowUserTypes.NORMAL_USER || user.workflowUserType === self.workflowUserTypes.PRIVATE_USER;
            });
            var managerUsers = _.filter(self.allSelectedDistributionWorkflows, function (user) {
                return user.workflowUserType === self.workflowUserTypes.MANAGER || user.workflowUserType === self.workflowUserTypes.GOVERNMENT_ENTITY_USER;
            });
            var favoriteUsers = _.filter(self.allSelectedDistributionWorkflows, function (user) {
                return user.workflowUserType === self.workflowUserTypes.FAVORITE_USER;
            });
            /*var receivedOUs = _.filter(self.allSelectedDistributionWorkflows, function (ou) {
                return ou.workflowUserType === "receivedOUs";
            });*/
            var mainOUs = _.filter(self.allSelectedDistributionWorkflows, function (ou) {
                return ou.workflowUserType === self.workflowUserTypes.OU;
            });

            //if (normalUsers.length === 0 && managerUsers.length === 0 && favoriteUsers.length === 0 && receivedOUs.length === 0 && mainOUs.length === 0) {
            if (normalUsers.length === 0 && managerUsers.length === 0 && favoriteUsers.length === 0 && !mainOUs.length) {
                toast.error(langService.get('select_users'));
                return false;
            }

            var finalDistributionWorkflowUsers = new SendDistributionWorkflow();
            finalDistributionWorkflowUsers.normalUsers = normalUsers;
            finalDistributionWorkflowUsers.managerUsers = managerUsers;
            finalDistributionWorkflowUsers.favouriteUsers = favoriteUsers;
            //finalDistributionWorkflowUsers.receivedOUs = receivedOUs;
            finalDistributionWorkflowUsers.receivedRegOUs = mainOUs;

            distributionWorkflowService.forwardDistributionWorkflow(finalDistributionWorkflowUsers, self.vsId, self.workObjectNumber, self.classDescription).then(function (result) {
                if (result) {
                    toast.success(langService.get('launch_success_distribution_workflow'));
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.allSelectedDistributionWorkflows = [];
                }
                else
                    toast.error(langService.get('failed'));

                dialog.hide(result);
            })
                .catch(function (result) {
                    toast.error(langService.get('failed'));
                });

        };

        /**
         * @description send bulk distribution workflow
         */
        self.launchDistributionWorkflowBulk = function () {

            var normalUsers = _.filter(self.allSelectedDistributionWorkflows, function (user) {
                return user.workflowUserType === self.workflowUserTypes.NORMAL_USER || user.workflowUserType === self.workflowUserTypes.PRIVATE_USER;
            });
            var managerUsers = _.filter(self.allSelectedDistributionWorkflows, function (user) {
                return user.workflowUserType === self.workflowUserTypes.MANAGER || user.workflowUserType === self.workflowUserTypes.GOVERNMENT_ENTITY_USER;
            });
            var favoriteUsers = _.filter(self.allSelectedDistributionWorkflows, function (user) {
                return user.workflowUserType === self.workflowUserTypes.FAVORITE_USER;
            });
            /*var receivedOUs = _.filter(self.allSelectedDistributionWorkflows, function (ou) {
                return ou.workflowUserType === "receivedOUs";
            });*/
            var mainOUs = _.filter(self.allSelectedDistributionWorkflows, function (ou) {
                return ou.workflowUserType === self.workflowUserTypes.OU;
            });

            //if (normalUsers.length === 0 && managerUsers.length === 0 && favoriteUsers.length === 0 && receivedOUs.length === 0 && mainOUs.length === 0) {
            if (normalUsers.length === 0 && managerUsers.length === 0 && favoriteUsers.length === 0 && !mainOUs.length) {
                toast.error(langService.get('select_users'));
                return false;
            }

            var vsIdBulk = _.map(self.selectedBooks, function (book) {
                return book.generalStepElm ? book.generalStepElm.vsId : book.vsId;
            });

            var finalDistributionWorkflowBulk = new DistributionWorkflowBulk();
            finalDistributionWorkflowBulk.first = vsIdBulk;

            finalDistributionWorkflowBulk.second.normalUsers = normalUsers;
            finalDistributionWorkflowBulk.second.managerUsers = managerUsers;
            finalDistributionWorkflowBulk.second.favouriteUsers = favoriteUsers;
            //finalDistributionWorkflowBulk.second.receivedOUs = receivedOUs;
            finalDistributionWorkflowBulk.second.receivedRegOUs = mainOUs;

            distributionWorkflowService.sendDistributionWorkflowBulk(finalDistributionWorkflowBulk, self.classDescription).then(function (result) {
                if (result.length > 0) {
                    generator.generateFailedBulkActionRecords('dw_success_except_following', _.map(result, function (bookVSID) {
                        return _.find(self.selectedBooks, function (book) {
                            return book.vsId === bookVSID;
                        })['docSubject'];
                    }));
                } else {
                    toast.success(langService.get('launch_success_distribution_workflow'));
                }
                mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);

                dialog.hide(result);
            });
        };

        self.openAddReceivedOUDialog = function ($event) {
            distributionWorkflowService.controllerMethod.distributionWorkflowAddReceivedOU(self.enableSMSNotification,
                self.enableEmailNotification, self.minDate, self.escalationProcessList, $event).then(function (result) {
                for (var i = 0; i < result.length; i++) {
                    if (result[i].workflowUserType === "receivedOUs") {
                        var isOUExist = _.find(self.allSelectedDistributionWorkflows, function (ou) {
                            return ou.id === result[i].id && !ou.ouId && ou.workflowUserType === "receivedOUs";
                        });
                        if (!isOUExist) {
                            var normalOU = new DistributionWorkflowOU();
                            normalOU = angular.copy(result[i]);
                            normalOU.toOUId = result[i].id;
                            self.allSelectedDistributionWorkflows.push(normalOU);
                        }
                    } else if (result[i].workflowUserType === self.workflowUserTypes.NORMAL_USER) {
                        var isUserExist = _.find(self.allSelectedDistributionWorkflows, function (user) {
                            return user.id === result[i].id && user.ouId === result[i].ouId;
                        });
                        if (!isUserExist) {
                            var normalUser = new DistributionWorkflowOU();
                            normalUser = angular.copy(result[i]);
                            normalUser.toUserDomain = result[i].toUserDomain;
                            normalUser.appUserOUID = result[i].ouId;
                            self.allSelectedDistributionWorkflows.push(normalUser);
                        }
                    }

                }
            });
        };

        /**
         * @description get only required fields from selected user to Send in workflow service
         * @param userDistributionWorkflow
         * @returns {Array}
         */
        self.prepareUserDistributionWorkflow = function (userDistributionWorkflow) {
            var distributionWorkflowUsersToSend = [];
            angular.forEach(userDistributionWorkflow, function (val) {
                var tempArr = _.pick(val, ['toUserDomain', 'appUserOUID', 'action', 'dueDate']);
                tempArr.action = tempArr.action.id ? tempArr.action.id : 0;
                tempArr.dueDate = getUnixTimeStamp(tempArr.dueDate);
                distributionWorkflowUsersToSend.push(tempArr);
            });
            return distributionWorkflowUsersToSend;
        };
        /**
         * convert Date to Unix Timestamp
         * @returns {*}
         * @param dueDate
         */
        var getUnixTimeStamp = function (dueDate) {
            return moment(dueDate, "YYYY-MM-DD").valueOf();
        };
        /**
         * @description generate a table template to show alert for Proxy Users
         * @param proxyUsers
         */
        self.getProxyUsersTemplate = function (proxyUsers) {
            var titleTemplate = angular.element('<span class="validation-title">' + langService.get('proxy_user_message') + '</span> <br/>');
            titleTemplate.html(langService.get('proxy_user_message'));

            var tableRows = _.map(proxyUsers, function (user) {
                return [user.arName, user.enName, user.proxyInfo.arName, user.proxyInfo.enName, user.proxyInfo.proxyDomain, moment(user.proxyInfo.proxyStartDate).format('YYYY-MM-DD'), moment(user.proxyInfo.proxyEndDate).format('YYYY-MM-DD'), user.proxyInfo.proxyMessage];
            });

            var table = tableGeneratorService.createTable([langService.get('arabic_name'), langService.get('english_name'), langService.get('proxy_arabic_name'), langService.get('proxy_english_name'), langService.get('proxy_domain'), langService.get('start_date'), langService.get('end_date'), langService.get('proxy_message')], 'error-table');
            table.createTableRows(tableRows);

            titleTemplate.append(table.getTable(true));

            return titleTemplate.html();
        };

        self.minDate = _createCurrentDate(1);

        self.notCurrentUser = function (applicationUser) {
            return applicationUser.id !== employeeService.getEmployee().id;
        };

        /**
         * create current date + given days if provided.
         * @param days
         * @return {Date}
         * @private
         */
        function _createCurrentDate(days) {
            var date = new Date();
            date.setDate(date.getDate() + (days || 0));
            return date;
        }

        self.closeLaunchDistributionWorkflowPopup = function () {
            return dialog.cancel();
        }
    });
};