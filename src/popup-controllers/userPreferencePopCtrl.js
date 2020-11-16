module.exports = function (app) {
    app.controller('userPreferencePopCtrl', function (_,
                                                      toast,
                                                      followupFolders,
                                                      validationService,
                                                      LangWatcher,
                                                      generator,
                                                      $timeout,
                                                      $templateRequest,
                                                      $templateCache,
                                                      dialog,
                                                      langService,
                                                      applicationUser,
                                                      ApplicationUser,
                                                      applicationUserService,
                                                      lookupService,
                                                      jobTitles,
                                                      ranks,
                                                      themes,
                                                      roles,
                                                      permissions,
                                                      ouApplicationUsers,
                                                      applicationUsers,
                                                      ouApplicationUserService,
                                                      userCommentService,
                                                      userComments,
                                                      UserComment,
                                                      rootEntity,
                                                      employeeService,
                                                      workflowGroupService,
                                                      workflowGroups,
                                                      userWorkflowGroups,
                                                      userWorkflowGroupService,
                                                      UserWorkflowGroup,
                                                      WorkflowGroup,
                                                      themeService,
                                                      availableProxies,
                                                      userFolderService,
                                                      followUpUserService,
                                                      ApplicationUserSignature,
                                                      applicationUserSignatureService,
                                                      attachmentService,
                                                      gridService,
                                                      $scope,
                                                      $rootScope,
                                                      $q,
                                                      $filter,
                                                      //signature,
                                                      selectedTab,
                                                      cmsTemplate,
                                                      ProxyInfo,
                                                      $compile,
                                                      organizationService,
                                                      predefinedActions,
                                                      predefinedActionService,
                                                      AppUserCertificate,
                                                      errorCode) {
        'ngInject';
        var self = this;
        self.controllerName = 'userPreferencePopCtrl';
        self.applicationUser = new ApplicationUser(applicationUser);
        self.employeeService = employeeService;
        self.employee = employeeService.getEmployee();
        self.model = angular.copy(self.applicationUser);
        self.priorityLevels = lookupService.returnLookups(lookupService.priorityLevel);
        self.genders = lookupService.returnLookups(lookupService.gender);
        self.languages = lookupService.returnLookups(lookupService.language);
        //self.authorityLevels = lookupService.returnLookups(lookupService.securityLevel);
        self.authorityLevels = rootEntity.getGlobalSettings().getSecurityLevels();

        self.jobTitles = jobTitles;
        self.ranks = ranks;
        self.themes = themes;
        self.roles = roles;
        self.permissions = permissions;
        self.applicationUsers = applicationUsers;
        self.globalSetting = rootEntity.returnRootEntity().settings;
        self.maxRowCount = angular.copy(self.globalSetting.searchAmountLimit);
        self.userComments = userComments;
        self.userCommentsCopy = angular.copy(self.userComments);
        self.workflowGroups = workflowGroups;
        self.userWorkflowGroups = userWorkflowGroups;
        self.userWorkflowGroupsCopy = angular.copy(userWorkflowGroups);
        self.userFolderService = userFolderService;
        self.followupFolders = followupFolders;
        self.currentNode = null;
        self.viewInboxAsOptions = [
            {
                key: 'view_magazine',
                value: false
            },
            {
                key: 'view_grid',
                value: true
            }
        ];

        var currentDate = new Date();

        self.today = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate()
        );
        // tomorrow
        self.tomorrow = (new Date()).setDate(self.today.getDate() + 1);
        self.jobTitleSearchText = '';
        self.rankSearchText = '';

        self.rootEntity = rootEntity;
        self.organizationsForAppUser = employeeService.getEmployee().ouList;

        /**
         * @description Current ou application user
         */

        self.ouApplicationUser = generator.interceptReceivedInstance('OUApplicationUser', angular.copy(employeeService.getCurrentOUApplicationUser()));
        // security levels for current OUApplicationUser
        self.securityLevels = self.ouApplicationUser.getSecurityLevels();
        self.filteredSecurityLevels = [];
        self.availableProxies = availableProxies;
        self.selectedProxyUser = self.ouApplicationUser.getSelectedProxyId() ? _.find(availableProxies, function (item) {
            return item.id === self.ouApplicationUser.getSelectedProxyId();
        }) : null;
        self.ouApplicationUserCopy = angular.copy(self.ouApplicationUser);
        self.notFound = {};


        self.getMaxProxyStartDate = function () {
            var endDate = self.ouApplicationUser.proxyEndDate ? new Date(self.ouApplicationUser.proxyEndDate) : null;
            self.calculatedMaxProxyStartDate = endDate ? new Date(endDate.setDate(endDate.getDate() - 1)) : null;
            return self.calculatedMaxProxyStartDate;
        };
        self.calculatedMaxProxyStartDate = self.ouApplicationUser.proxyEndDate ? self.getMaxProxyStartDate() : null;

        self.getMinProxyEndDate = function () {
            var startDate = self.ouApplicationUser.proxyStartDate ? new Date(self.ouApplicationUser.proxyStartDate) : null;
            self.calculatedMinProxyEndDate = startDate ? new Date(startDate.setDate(startDate.getDate() + 1)) : null;
            return self.calculatedMinProxyEndDate;
        };
        self.calculatedMinProxyEndDate = self.ouApplicationUser.proxyStartDate ? self.getMinProxyEndDate() : null;

        function _resetOutOfOfficeIfProxyUserAndAuthorityLevelsEmpty() {
            if (!self.ouApplicationUser.proxyUser && !self.ouApplicationUser.proxyAuthorityLevels) {
                self.applicationUser.outOfOffice = false;
            }
        };
        _resetOutOfOfficeIfProxyUserAndAuthorityLevelsEmpty();

        /**
         * @description to check if the current user has valid proxy or not.
         * @param ouApplicationUser
         * @private
         */
        function _checkProxyDate(ouApplicationUser) {
            if (ouApplicationUser.proxyEndDate && new Date(ouApplicationUser.proxyEndDate).valueOf() < (new Date()).valueOf()) {
                self.applicationUser.outOfOffice = false;
                self.selectedProxyUser = null;
                ouApplicationUser.emptyOutOfOffice();
                self.calculatedMaxProxyStartDate = null;
                self.calculatedMinProxyEndDate = null;
            }
        }

        /**
         * @description to check if the security level included for selected proxyUser.
         * @param securityLevel
         * @returns {*|boolean}
         */
        self.isSecurityLevelInclude = function (securityLevel) {
            return self.selectedProxyUser && !!(self.selectedProxyUser.securityLevels & securityLevel.lookupKey);
        };


        /**
         * @description Contains the labels for the fields for validation purpose
         */
        self.validateLabels = {
            arFullName: 'arabic_full_name',
            enFullName: 'english_full_name',
            loginName: 'login_name',
            gender: 'gender',
            defaultDisplayLang: 'defaultDisplayLang',
            employeeNo: 'employee_number',
            qid: 'qid',
            jobTitle: 'job_title',
            rank: 'rank',
            mobile: 'mobile',
            email: 'email',
            defaultOUID: 'organization_unit',
            domainName: 'domain_name',
            defaultThemeID: 'default_theme',
            searchAmountLimit: 'default_max_row_search',
            subscriptionsmsNotify: 'subscription_sms',
            subscriptionEmailNotify: 'subscription_email',
            newsmsEmailNotify: 'new_item_sms',
            newItemEmailNotify: 'new_item_email',
            deadlinesmsNotify: 'deadline_sms',
            deadlineEmailNotify: 'deadline_email',
            reminderSmsnotify: 'reminder_sms',
            reminderEmailNotify: 'reminder_email',
            newItemSmspriority: 'new_item_sms_priority',
            newItemEmailPriority: 'new_item_email_priority',
            deadlineSmspriority: 'deadline_sms_priority',
            deadlineEmailPriority: 'deadline_email_priority',
            reminderSmsPriority: 'reminder_sms_priority',
            reminderEmailPriority: 'reminder_email_priority',
            reminderSmsdays: 'reminder_sms_days',
            reminderEmailDays: 'reminder_email_days',
            viewInboxAsGrid: 'view_inbox_as',
            inboxRefreshInterval: 'inbox_refresh_interval'
        };

        self.validateSignatureLabels = {
            docSubject: 'subject',
            documentTitle: 'title',
            fileUrl: 'upload_signature'
        };

        self.validateCertificateLabels = {
            docSubject: 'subject',
            documentTitle: 'title',
            pinCode: 'pin'
        };


        self.notificationProperties = [
            {
                property: 'newsmsEmailNotify',
                dependents: ['newItemSmspriority']
            },
            {
                property: 'newItemEmailNotify',
                dependents: ['newItemEmailPriority']
            },
            {
                property: 'deadlinesmsNotify',
                dependents: ['deadlineSmspriority']
            },
            {
                property: 'deadlineEmailNotify',
                dependents: ['deadlineEmailPriority']
            },
            {
                property: 'reminderSmsnotify',
                dependents: ['reminderSmsPriority', 'reminderSmsdays']
            },
            {
                property: 'reminderEmailNotify',
                dependents: ['reminderEmailPriority', 'reminderEmailDays']
            }
        ];

        self.disabledFields = [
            'arFullName',
            'enFullName',
            'gender',
            'loginName',
            'employeeNo',
            'qid',
            'jobTitle',
            'rank',
            'domainName'//,
            // 'searchAmountLimit'
        ];

        if (!self.globalSetting.isDigitalCertificateEnabled()) {
            self.disabledFields.push('pinCodePrompt');
        }

        if (!self.globalSetting.enableSMSNotification) {
            self.disabledFields.push(
                'subscriptionsmsNotify',
                'newsmsEmailNotify',
                'newItemSmspriority',
                'deadlinesmsNotify',
                'deadlineSmspriority',
                'reminderSmsnotify',
                'reminderSmsPriority',
                'reminderSmsdays'
            );
        }

        if (!self.globalSetting.enableEmailNotification) {
            self.disabledFields.push(
                'subscriptionEmailNotify',
                'newItemEmailNotify',
                'newItemEmailPriority',
                'deadlineEmailNotify',
                'deadlineEmailPriority',
                'reminderEmailNotify',
                'reminderEmailPriority',
                'reminderEmailDays'
            );
        }

        if (!self.globalSetting.isSlowConnectionMode()) {
            self.disabledFields.push('slowConnectionMode');
        }


        /**
         * @description Contains the selected tab name
         * @type {string}
         */
        self.selectedTab = selectedTab ? selectedTab : "general";
        self.requestForApprove = (selectedTab === 'signature');
        self.usersWhoSetYouAsProxy = [];

        self.isSignaturesLoaded = false;
        self.isCertificateLoaded = false;
        self.isOutOfOfficeLoaded = false;

        /**
         * @description Set the current tab name
         * @param tabName
         */
        self.setCurrentTab = function (tabName) {
            var defer = $q.defer();
            if (tabName.toLowerCase() === 'signature' && !self.isSignaturesLoaded) {
                self.loadSignatures(self.applicationUser.id)
                    .then(function () {
                        self.isSignaturesLoaded = true;
                        defer.resolve(tabName);
                    });
            } else if (tabName.toLowerCase() === 'digitalcertificates' && !self.isCertificateLoaded) {
                self.loadUserCertificates(self.applicationUser.id)
                    .then(function (result) {
                        self.isCertificateLoaded = true;
                        self.showCertificateForm = !result; // if no user certificate exists on first load of tab, show form
                        defer.resolve(tabName);
                    });
            } else if (tabName.toLowerCase() === 'outofofficesettings') {
                ouApplicationUserService.getUsersWhoSetYouAsProxy(self.applicationUser.id)
                    .then(function (result) {
                        self.isOutOfOfficeLoaded = true;
                        self.usersWhoSetYouAsProxy = result;
                        defer.resolve(tabName);
                    })
            } else {
                defer.resolve(tabName);
            }
            return defer.promise.then(function (tab) {
                self.selectedTab = tab;
            });
        };

        self.tabsToShow = [
            'general',
            'notificationSettings',
            'outOfOfficeSettings',
            'userComments',
            'workflowGroups',
            'folders',
            'followupFolders',
            'signature',
            'predefinedActions',
            'digitalCertificates'
        ];
        self.showTab = function (tabName) {
            var isAvailable = (self.tabsToShow.indexOf(tabName) > -1);
            if (tabName === 'digitalCertificates') {
                return isAvailable && self.globalSetting.isDigitalCertificateEnabled();
            } else if (tabName === 'predefinedActions') {
                return isAvailable && self.employee.hasPermissionTo('LAUNCH_DISTRIBUTION_WORKFLOW');
            }
            return isAvailable;
        };
        self.selectedTabIndex = self.tabsToShow.indexOf(self.selectedTab);

        if (self.selectedTab !== 'general') {
            self.setCurrentTab('general');
        }

        self.notificationTypes = {
            sms: {
                newSMS: {key: 'newsmsEmailNotify', dependentProperties: ['newItemSmspriority']},
                deadlineSMS: {key: 'deadlinesmsNotify', dependentProperties: ['deadlineSmspriority']},
                reminderSMS: {
                    key: 'reminderSmsnotify',
                    dependentProperties: ['reminderSmsPriority', 'reminderSmsdays'],
                    skipDefault: ['reminderSmsdays']
                }
            },
            email: {
                newEmail: {key: 'newItemEmailNotify', dependentProperties: ['newItemEmailPriority']},
                deadlineEmail: {key: 'deadlineEmailNotify', dependentProperties: ['deadlineEmailPriority']},
                reminderEmail: {
                    key: 'reminderEmailNotify',
                    dependentProperties: ['reminderEmailPriority', 'reminderEmailDays'],
                    skipDefault: ['reminderEmailDays']
                }
            }
        };

        /**
         * @description Toggles all sms notifications
         * @param form
         * @param $event
         */
        self.toggleAllSMSNotifications = function (form, $event) {
            var isActive = !!self.applicationUser.subscriptionsmsNotify;

            self.applicationUser[self.notificationTypes.sms.newSMS.key] = isActive;
            self.applicationUser[self.notificationTypes.sms.deadlineSMS.key] = isActive;
            self.applicationUser[self.notificationTypes.sms.reminderSMS.key] = isActive;

            self.resetNotifications(form, self.notificationTypes.sms.newSMS, (isActive ? self.priorityLevels : null));
            self.resetNotifications(form, self.notificationTypes.sms.deadlineSMS, (isActive ? self.priorityLevels : null));
            self.resetNotifications(form, self.notificationTypes.sms.reminderSMS, (isActive ? self.priorityLevels : null));
        };

        /**
         * @description Toggles all email notifications
         * @param form
         * @param $event
         */
        self.toggleAllEmailNotifications = function (form, $event) {
            var isActive = !!self.applicationUser.subscriptionEmailNotify;

            self.applicationUser[self.notificationTypes.email.newEmail.key] = isActive;
            self.applicationUser[self.notificationTypes.email.deadlineEmail.key] = isActive;
            self.applicationUser[self.notificationTypes.email.reminderEmail.key] = isActive;

            self.resetNotifications(form, self.notificationTypes.email.newEmail, (isActive ? self.priorityLevels : null));
            self.resetNotifications(form, self.notificationTypes.email.deadlineEmail, (isActive ? self.priorityLevels : null));
            self.resetNotifications(form, self.notificationTypes.email.reminderEmail, (isActive ? self.priorityLevels : null));
        };

        /**
         * @description Resets the values if notification is enabled/disabled
         * @param form
         * @param changedProperty
         * @param defaultValue
         */
        self.resetNotifications = function (form, changedProperty, defaultValue) {
            generator.replaceWithOriginalValues(self.applicationUser, self.model, changedProperty.dependentProperties, true);

            if (self.applicationUser[changedProperty.key]) {
                for (var i = 0; i < changedProperty.dependentProperties.length; i++) {
                    if (defaultValue) {
                        if (!changedProperty.skipDefault || changedProperty.skipDefault.indexOf(changedProperty.dependentProperties[i]) === -1) {
                            self.applicationUser[changedProperty.dependentProperties[i]] = defaultValue;
                        }
                    }
                    form[changedProperty.dependentProperties[i]].$setUntouched();
                }
            }
        };

        /**
         * @description Checks the required fields validation by skipping notification if notification is false
         * @param model
         * @returns {Array}
         */
        self.checkRequiredFieldsAppUser = function (model) {
            var required = new ApplicationUser().getRequiredFields(), result = [];

            /* If notification property is false, remove the property from required */
            for (var i = 0; i < self.notificationProperties.length; i++) {
                var property = self.notificationProperties[i].property;
                if (!model[property]) {
                    var dependents = self.notificationProperties[i].dependents;
                    for (var j = 0; j < dependents.length; j++) {
                        required.splice(required.indexOf(dependents[j]), 1);
                    }
                }
            }
            _.map(required, function (property) {
                if (!generator.validRequired(model[property]))
                    result.push(property);
            });
            return result;
        };

        /**
         * @description Edit application user(preferences)
         */
        self.editApplicationUserFromCtrl = function () {
            generator.replaceWithOriginalValues(self.applicationUser, self.model, self.disabledFields);
            validationService
                .createValidation('EDIT_APPLICATION_USER_PREFERENCES')
                .addStep('check_required', true, self.checkRequiredFieldsAppUser, self.applicationUser, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, applicationUserService.checkDuplicateApplicationUser, [self.applicationUser, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('check_duplicate_employeeNo', true, applicationUserService.checkDuplicateApplicationUserProperties, [self.applicationUser, 'employeeNo', true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('employee_number_duplication_message'));
                })
                .addStep('check_duplicate_qatari_id', true, applicationUserService.checkDuplicateApplicationUserProperties, [self.applicationUser, 'qid', true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('qid_duplication_message'));
                })
                .validate()
                .then(function () {
                    applicationUserService
                        .updateApplicationUser(self.applicationUser)
                        .then(function (result) {
                            employeeService.setCurrentEmployee(result);
                            toast.success(langService.get('general_notification_settings_success'));
                        });
                });
        };

        _checkProxyDate(self.ouApplicationUser);

        /**
         * @description Saves the ou application user data when not out of office
         * @param form
         */


        self.getSelectedDelegatedUserText = function () {
            if (!self.selectedProxyUser) {
                if (self.ouApplicationUser.applicationUser.outOfOffice) {
                    var proxyOU = _.find(organizationService.organizations, {id: self.ouApplicationUser.proxyOUId});
                    if (self.ouApplicationUser.proxyUser) {
                        if (langService.current === 'en')
                            return self.ouApplicationUser.proxyUser.getTranslatedName() + ' - ' + proxyOU.getTranslatedName();
                        return proxyOU.getTranslatedName() + ' - ' + self.ouApplicationUser.proxyUser.getTranslatedName();
                    }
                }
                return langService.get('user_on_behalf');
            } else {
                if (langService.current === 'en')
                    return self.selectedProxyUser.applicationUser.getTranslatedName() + ' - ' + self.selectedProxyUser.organization.getTranslatedName();
                return self.selectedProxyUser.organization.getTranslatedName() + ' - ' + self.selectedProxyUser.applicationUser.getTranslatedName();
            }
        };


        self.searchTextProxyUser = '';
        self.proxyUserSearch = function (searchText) {
            var results = self.availableProxies;
            if (searchText) {
                results = _.filter(self.availableProxies, function (availableProxyUSer) {
                    return availableProxyUSer.getTranslatedName().toLowerCase().indexOf(searchText.toLowerCase()) > -1;
                })
            }
            var deferred = $q.defer();
            $timeout(function () {
                deferred.resolve(results);
            }, Math.random() * 1000, false);
            return deferred.promise;
        };

        self.selectedProxyUserChange = function (proxyUser) {
            self.ouApplicationUser.proxyAuthorityLevels = null;
            self.ouApplicationUser.proxyStartDate = null;
            self.ouApplicationUser.proxyEndDate = null;
            self.filteredSecurityLevels = _.filter(self.securityLevels, self.isSecurityLevelInclude);
            if (!proxyUser) {
                self.ouApplicationUser.proxyUser = null;
            }
        };


        self.requiredFieldsOutOfOffice = [
            'proxyUser',
            'proxyAuthorityLevels',
            'proxyStartDate',
            'proxyEndDate',
            'viewProxyMessage'//,
            //'proxyMessage'
        ];

        self.validateLabelsOutOfOffice = {
            proxyUser: 'user_on_behalf',
            proxyAuthorityLevels: 'authority_level',
            proxyStartDate: 'start_date',
            proxyEndDate: 'end_date',
            viewProxyMessage: 'view_message_to_sender'//,
            //proxyMessage: 'out_of_office_message'
        };

        self.checkRequiredFieldsOutOfOffice = function (model) {
            var required = angular.copy(self.requiredFieldsOutOfOffice), result = [];
            if (!self.applicationUser.outOfOffice) {
                if (!self.ouApplicationUser.proxyUser) {
                    required.splice(required.indexOf('proxyUser'), 1);
                    required.splice(required.indexOf('proxyAuthorityLevels'), 1);
                }
                if (!self.ouApplicationUser.proxyStartDate && !self.ouApplicationUser.proxyEndDate) {
                    required = _.filter(required, function (property) {
                        return property !== 'proxyStartDate' && property !== 'proxyEndDate';
                    })
                }
            }

            if (self.selectedProxyUser && !self.filteredSecurityLevels.length) {
                required = _.filter(required, function (property) {
                    return property !== 'proxyAuthorityLevels';
                });
            }
            _.map(required, function (property) {
                if (!generator.validRequired(model[property]))
                    result.push(property);
            });
            return result;
        };

        self.checkRequiredOutOfOfficeMessage = function (model) {
            var property = 'proxyMessage', result = [];
            if (model.viewProxyMessage && !generator.validRequired(model[property]))
                result.push(property);
            return result;
        };

        /**
         * @description Saves the ou application user data when not out of office
         */
        self.changeOutOfOffice = function () {
            if (!self.applicationUser.outOfOffice) {
                // terminate proxy user
                ouApplicationUserService
                    .terminateProxyUser(self.ouApplicationUser)
                    .then(function () {
                        if (self.ouApplicationUserCopy.proxyUser) {
                            self.ouApplicationUser.proxyUser = null;
                            self.selectedProxyUser = null;
                            self.ouApplicationUser.proxyStartDate = null;
                            self.ouApplicationUser.proxyEndDate = null;
                            self.ouApplicationUser.proxyAuthorityLevels = null;
                            self.ouApplicationUser.viewProxyMessage = false;
                            self.ouApplicationUser.proxyMessage = null;

                            employeeService.setCurrentOUApplicationUser(self.ouApplicationUser);
                        }
                        employeeService.setCurrentEmployee(self.applicationUser);
                    });
            }
        };

        /**
         * @description Save the Application User out of office settings in the ouApplicationUser model
         */
        self.saveOutOfOfficeSettingsFromCtrl = function () {
            self.ouApplicationUser.proxyUser = self.selectedProxyUser;

            validationService
                .createValidation('EDIT_OUT_OF_OFFICE_SETTINGS')
                .addStep('check_required', true, self.checkRequiredFieldsOutOfOffice, self.ouApplicationUser, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabelsOutOfOffice[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_message_required', true, self.checkRequiredOutOfOfficeMessage, self.ouApplicationUser, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = ['out_of_office_message'];
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .validate()
                .then(function () {
                    self.ouApplicationUser.applicationUser = self.applicationUser;
                    self.checkDelegatedFromAnotherUsers().then((notDelegated) => {
                        if (notDelegated) {
                            if (!self.applicationUser.outOfOffice &&
                                !self.ouApplicationUser.proxyUser && self.ouApplicationUser.proxyUser !== self.ouApplicationUserCopy.proxyUser) {
                                // terminate proxy user
                                ouApplicationUserService
                                    .terminateProxyUser(self.ouApplicationUser)
                                    .then(function () {
                                        employeeService.setCurrentOUApplicationUser(self.ouApplicationUser);
                                        self.ouApplicationUserCopy = angular.copy(self.ouApplicationUser);
                                        employeeService.setCurrentEmployee(self.applicationUser);
                                        toast.success(langService.get('out_of_office_success'));
                                    });
                            } else {
                                ouApplicationUserService
                                    .updateProxyUser(self.ouApplicationUser)
                                    .then(function (result) {
                                        employeeService.setCurrentOUApplicationUser(result);
                                        self.ouApplicationUserCopy = angular.copy(result);
                                        employeeService.setCurrentEmployee(self.applicationUser);
                                        toast.success(langService.get('out_of_office_success'));
                                    }).catch(function (error) {
                                    if (errorCode.checkIf(error, 'OPERATION_NOT_SUPPORTED') === true) {
                                        dialog.errorMessage(langService.get('delegating_someone_out_of_office'));
                                    }
                                });
                            }
                        }
                    });
                })
                .catch(function (result) {
                    console.log(result);
                });
        };

        /**
         * @description Contains the labels for the fields for validation purpose
         */
        self.validateLabelsUserComment = {
            ouId: 'organization_unit',
            itemOrder: 'item_order',
            shortComment: 'short_comment',
            comment: 'comment',
            status: 'status'
        };


        self.selectedUserComments = [];

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataUserComments = function () {
            self.userComments = $filter('orderBy')(self.userComments, self.grid.order);
        };

        self.grid = {
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.userComments.length + 21);
                    }
                }
            ],
            searchColumns: {
                shortComment: 'shortComment',
                itemOrder: 'itemOrder'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.userComments = gridService.searchGridData(self.grid, self.userCommentsCopy);
            }
        };

        /**
         * @description Opens the popup to show comment details
         * @param comment
         * @param $event
         */
        self.showComment = function (comment, $event) {
            $event.preventDefault();
            dialog
                .successMessage(comment.comment, null, null, $event, true);
        };

        /**
         * @description Contains methods for CRUD operations for entities
         */
        self.statusServices = {
            'activate': userCommentService.activateBulkUserComments,
            'deactivate': userCommentService.deactivateBulkUserComments,
            'true': userCommentService.activateUserComment,
            'false': userCommentService.deactivateUserComment
        };

        /**
         * @description Reload the grid of entity
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadUserComments = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return userCommentService
                .loadUserComments()
                .then(function (result) {
                    self.userComments = _.filter(result, function (userComment) {
                        return userComment.userId === applicationUser.id;
                    });
                    self.userCommentsCopy = angular.copy(self.userComments);
                    self.selectedUserComments = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedDataUserComments();
                    return result;
                });
        };

        /**
         * @description Opens the form to add user comment and hides the user comment grid
         * @param $event
         */
        self.openAddUserCommentDialog = function ($event) {
            userCommentService.controllerMethod.userCommentAddDialog(applicationUser.id, null, $event)
                .then(function () {
                    self.reloadUserComments(self.grid.page);
                })
        };

        /**
         * @description Opens the edit user comment form
         * @param {UserComment} userComment
         * @param $event
         */
        self.openEditUserCommentDialog = function (userComment, $event) {
            userCommentService.controllerMethod.userCommentEditDialog(userComment, $event)
                .then(function () {
                    self.reloadUserComments(self.grid.page);
                })
        };

        /**
         * @description Delete single user comment
         * @param userComment
         * @param $event
         */
        self.removeUserComment = function (userComment, $event) {
            userCommentService
                .controllerMethod
                .userCommentDelete(userComment, $event)
                .then(function () {
                    self.reloadUserComments(self.grid.page);
                });
        };

        /**
         * @description Delete multiple selected user comments
         * @param $event
         */
        self.removeBulkUserComments = function ($event) {
            userCommentService
                .controllerMethod
                .userCommentDeleteBulk(self.selectedUserComments, $event)
                .then(function () {
                    self.reloadUserComments(self.grid.page);
                });
        };

        /**
         * @description Change the status of user comment
         * @param userComment
         */
        self.changeStatusUserComment = function (userComment) {
            self.statusServices[userComment.status](userComment)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    userComment.status = !userComment.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected user comments
         * @param status
         */
        self.changeStatusBulkUserComments = function (status) {
            self.statusServices[status](self.selectedUserComments).then(function () {
                self.reloadUserComments(self.grid.page).then(function () {
                    toast.success(langService.get('selected_status_updated'));
                });
            });
        };


        self.selectedUserWorkflowGroups = [];

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataUserWorkflow = function () {
            self.userWorkflowGroups = $filter('orderBy')(self.userWorkflowGroups, self.userWorkflowGrid.order);
        };

        self.userWorkflowGrid = {
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20,
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.userWorkflowGroups.length + 21);
                    }
                }
            ],
            searchColumns: {
                arabicName: 'wfgroup.arName',
                englishName: 'wfgroup.enName'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.userWorkflowGroups = gridService.searchGridData(self.userWorkflowGrid, self.userWorkflowGroupsCopy);
            }
        };

        self.workflowStatusServices = {
            'activate': workflowGroupService.activateBulkWorkflowGroups,
            'deactivate': workflowGroupService.deactivateBulkWorkflowGroups,
            'true': workflowGroupService.activateWorkflowGroup,
            'false': workflowGroupService.deactivateWorkflowGroup
        };


        /**
         * @description Opens the popup to add new workflow group and relate to user
         * @param $event
         */
        self.openAddWorkflowGroupDialog = function ($event) {
            workflowGroupService
                .controllerMethod
                .workflowGroupAdd(true, $event)
                .then(function (result) {
                    var userWorkflowGroup = new UserWorkflowGroup({
                        applicationUser: {id: applicationUser.id},
                        wfgroup: {id: result.id}
                    });
                    return userWorkflowGroupService
                        .addUserWorkflowGroup(userWorkflowGroup)
                        .then(function () {
                            self.reloadUserWorkflowGroups(self.userWorkflowGrid.page)
                                .then(function () {
                                    toast.success(langService.get('add_success').change({name: result.getNames()}));
                                });
                        });
                });
        };

        /**
         * @description Opens the popup to edit user workflow group
         * @param userWorkflowGroup
         * @param $event
         */
        self.openEditWorkflowGroupDialog = function (userWorkflowGroup, $event) {
            workflowGroupService
                .controllerMethod
                .workflowGroupEdit(userWorkflowGroup, true, $event)
                .then(function (result) {
                    self.reloadUserWorkflowGroups(self.userWorkflowGrid.page)
                        .then(function () {
                            toast.success(langService.get('update_success'));
                        });
                });
        };


        /**
         * @description Delete single user workflow group
         * @param userWorkflowGroup
         * @param workflowGroup
         * @param $event
         */
        self.removeUserWorkflowGroup = function (userWorkflowGroup, workflowGroup, $event) {
            userWorkflowGroupService
                .controllerMethod
                .userWorkflowGroupDelete(userWorkflowGroup, workflowGroup, $event)
                .then(function (result) {
                    if (result) {
                        workflowGroupService
                            .deleteWorkflowGroup(workflowGroup)
                            .then(function () {
                                self.reloadUserWorkflowGroups(self.userWorkflowGrid.page)
                                    .then(function () {
                                        toast.success(langService.get('delete_specific_success').change({name: new WorkflowGroup(workflowGroup).getNames()}));
                                    });
                            });
                    }
                });
        };

        /**
         * @description Delete bulk user workflow groups
         * @param $event
         */
        self.removeBulkUserWorkflowGroups = function ($event) {
            userWorkflowGroupService
                .controllerMethod
                .userWorkflowGroupDeleteBulk(self.selectedUserWorkflowGroups, $event)
                .then(function (result) {
                    if (result) {
                        var workflowGroupsToDelete = self.selectedUserWorkflowGroups;

                        if (userWorkflowGroupService.failedToDeleteRecords.length) {
                            var failedRecordsIds = _.map(userWorkflowGroupService.failedToDeleteRecords, 'id');
                            workflowGroupsToDelete = _.filter(self.selectedUserWorkflowGroups, function (userWorkflowGroup) {
                                return (failedRecordsIds.indexOf(userWorkflowGroup.id) < 0);
                            });
                        }
                        workflowGroupService
                            .deleteBulkWorkflowGroups(_.map(workflowGroupsToDelete, 'wfgroup'))
                            .then(function () {
                                self.reloadUserWorkflowGroups(self.userWorkflowGrid.page)
                                    .then(function () {
                                        toast.success(langService.get('delete_success'));
                                    });
                            });
                    }
                });
        };

        /**
         * @description this method to reload the grid
         * @param pageNumber
         * @param $event
         * @return {*|Promise<U>}
         */
        self.reloadUserWorkflowGroups = function (pageNumber, $event) {
            var defer = $q.defer();
            self.userWorkflowGrid.progress = defer.promise;

            return userWorkflowGroupService
                .getUserWorkflowGroupsByUser($event)
                .then(function (result) {
                    self.userWorkflowGroups = result;
                    self.userWorkflowGroupsCopy = angular.copy(result);
                    self.selectedUserWorkflowGroups = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.userWorkflowGrid.page = pageNumber;
                    self.getSortedDataUserWorkflow();
                });
        };

        /**
         * @description Change the status of user workflow group
         * @param workflowGroup
         */
        self.changeStatusUserWorkflowGroup = function (workflowGroup) {
            self.workflowStatusServices[workflowGroup.status](workflowGroup)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    workflowGroup.status = !workflowGroup.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected user workflow groups
         * @param status
         */
        self.changeStatusBulkUserWorkflowGroups = function (status) {
            self.workflowStatusServices[status](_.map(self.selectedUserWorkflowGroups, 'wfgroup'))
                .then(function () {
                    self.reloadUserWorkflowGroups(self.userWorkflowGrid.page)
                        .then(function () {
                            toast.success(langService.get('selected_status_updated'));
                        });
                });
        };


        /**
         * @description check upload file
         * @return {Array}
         */
        self.checkRequiredFile = function () {
            return self.selectedFile;
        };

        self.selectedExtension = ['png'];
        self.signature = new ApplicationUserSignature();
        self.signature.appUserId = self.applicationUser.id;
        self.enableAdd = false;
        // self.imageDimensionsInfo = langService.get('image_dimensions_info').change({height: 283, width: 283});

        /**
         * check validation of required fields
         * @param model
         * @return {Array}
         */
        self.checkSignatureRequiredFields = function (model) {
            var required = model.getRequiredFields(), result = [];
            _.map(required, function (property) {
                if (!generator.validRequired(model[property]))
                    result.push(property);
            });
            return result;
        };

        /**
         * @description Loads the signatures
         * @param appUserId
         * @returns {Promise<any>}
         */
        self.loadSignatures = function (appUserId) {
            return applicationUserSignatureService.loadApplicationUserSignatures(appUserId || self.applicationUser.id, false)
                .then(function (result) {
                    self.applicationUser.signature = result;
                    return result;
                });
        };

        /**
         * @description add signature for application User
         */
        self.addApplicationUserSignatureFromCtrl = function () {
            if (!self.selectedFile) {
                toast.error(langService.get('file_required'));
            } else {
                validationService
                    .createValidation('ADD_APPLICATION_USER_SIGNATURE')
                    .addStep('check_required_fields', true, self.checkSignatureRequiredFields, self.signature, function (result) {
                        return !result.length;
                    })
                    .notifyFailure(function (step, result) {
                        var labels = _.map(result, function (label) {
                            return self.validateSignatureLabels[label];
                        });
                        generator.generateErrorFields('check_this_fields', labels);
                    })
                    .addStep('check_required_file', true, self.checkRequiredFile, function (result) {
                        return !result.length;
                    })
                    .notifyFailure(function (step, result) {
                        var labels = _.map(result, function (label) {
                            return self.validateLabels[label];
                        });
                        generator.generateErrorFields('check_this_fields', labels);
                    })
                    .addStep('check_duplicate', true, applicationUserSignatureService.checkDuplicateApplicationUserSignature, [self.signature, false], function (result) {
                        return !result;
                    }, true)
                    .notifyFailure(function () {
                        toast.error(langService.get('subject_duplication_message'));
                    })
                    .validate()
                    .then(function () {
                        self.signature.appUserId = applicationUser.id;
                        applicationUserSignatureService
                            .addApplicationUserSignature(self.signature, self.selectedFile).then(function () {
                            var defer = $q.defer();
                            self.signatureGrid.progress = defer.promise;
                            self.loadSignatures(self.ouApplicationUser.applicationUser.id)
                                .then(function (result) {
                                    self.signature = new ApplicationUserSignature();
                                    self.fileUrl = null;
                                    self.enableAdd = false;
                                    defer.resolve(true);
                                    toast.success(langService.get('save_success'));
                                });
                        });
                    })
                    .catch(function () {

                    });
            }
        };

        /**
         * @description close signature fields
         */
        self.closeApplicationUserSignatureFromCtrl = function () {
            self.enableAdd = false;
        };

        /**
         * @description edit signature
         * @param signature
         */
        self.editSignature = function (signature) {
            applicationUserSignatureService
                .controllerMethod
                .applicationUserSignatureEdit(signature).then(function () {
                var defer = $q.defer();
                self.signatureGrid.progress = defer.promise;
                self.loadSignatures(signature.appUserId)
                    .then(function (result) {
                        defer.resolve(true);
                        toast.success(langService.get('save_success'));
                    });
            });
        };
        /**
         * @description remove signature
         * @type {{limit: number, page: number, order: string, limitOptions: [number,number,number,null]}}
         */
        self.removeSignature = function (signature) {
            dialog.confirmMessage((langService.get('confirm_delete_msg'))).then(function () {
                applicationUserSignatureService
                    .deleteApplicationUserSignature(signature).then(function () {
                    var defer = $q.defer();
                    self.signatureGrid.progress = defer.promise;
                    self.loadSignatures(self.ouApplicationUser.applicationUser.id)
                        .then(function (result) {
                            defer.resolve(true);
                            toast.success(langService.get('delete_success'));
                        });
                });
            })
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataSignature = function () {
            self.applicationUser.signature = $filter('orderBy')(self.applicationUser.signature, self.signatureGrid.order);
        };

        self.signatureGrid = {
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, {
                label: langService.get('all'),
                value: function () {
                    return (self.applicationUser.signature.length + 21);
                }
            }]
        };
        self.selectedSignature = [];
        self.selectedFile = null;
        self.fileUrl = null;

        self.viewImage = function (files, element) {
            attachmentService
                .validateBeforeUpload('userSignature', files[0])
                .then(function (file) {
                    /* //var image;
                     self.selectedFile = file;
                     self.fileUrl = window.URL.createObjectURL(file);
                     var reader = new FileReader();
                     reader.onload = function () {
                     //image = new Blob([reader.result], {type: file.type});
                     if (!$scope.$$phase)
                     $scope.$apply();
                     };
                     reader.readAsArrayBuffer(file);
                     self.enableAdd = true;*/

                    self.selectedFile = file;
                    var url = window.URL || window.webkitURL;
                    var img = new Image();
                    img.src = self.fileUrl = url.createObjectURL(file);

                    img.onload = function () {
                        /*if (element[0].name === 'add-sign') {
                            var width = this.naturalWidth || this.width;
                            var height = this.naturalHeight || this.height;
                            if (width > 283 && height > 283) {
                                toast.error(langService.get('image_dimensions_info').change({width: 283, height: 283}));
                                self.enableAdd = false;
                                return false;
                            }
                        }*/
                        $timeout(function () {
                            self.enableAdd = true;
                        })
                    };
                })
                .catch(function (availableExtensions) {
                    self.fileUrl = null;
                    self.selectedFile = null;
                    self.enableAdd = false;
                    dialog.errorMessage(langService.get('invalid_uploaded_file').addLineBreak(availableExtensions.join(', ')));
                });
        };

        /**
         * @description to check if the current user selected.
         * @param proxyUser
         * @returns {boolean}
         */
        self.currentUser = function (proxyUser) {
            return proxyUser.applicationUser.id === self.ouApplicationUser.applicationUser.id;
        };


        self.predefinedActions = angular.copy(predefinedActions);
        self.predefinedActionsCopy = angular.copy(self.predefinedActions);
        self.selectedPredefinedActions = [];

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataPredefinedActions = function () {
            self.predefinedActions = $filter('orderBy')(self.predefinedActions, self.predefinedActionsGrid.order);
        };

        self.predefinedActionsGrid = {
            name: 'predefinedActions',
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20,
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.predefinedActions.length + 21);
                    }
                }
            ],
            searchColumns: {
                arabicName: 'arName',
                englishName: 'enName'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.predefinedActions = gridService.searchGridData(self.predefinedActionsGrid, self.predefinedActionsCopy);
            }
        };

        self.predefinedActionServices = {
            'activate': predefinedActionService.activateBulkPredefinedActions,
            'deactivate': predefinedActionService.deactivateBulkPredefinedActions,
            'true': predefinedActionService.activatePredefinedAction,
            'false': predefinedActionService.deactivatePredefinedAction
        };

        /**
         * @description reload the predefined actions grid
         * @param pageNumber
         * @param $event
         * @return {*|Promise<U>}
         */
        self.reloadPredefinedActions = function (pageNumber, $event) {
            var defer = $q.defer();
            self.predefinedActionsGrid.progress = defer.promise;

            return predefinedActionService
                .loadPredefinedActionsForUser($event)
                .then(function (result) {
                    self.predefinedActions = result;
                    self.predefinedActionsCopy = angular.copy(self.predefinedActions);
                    self.selectedPredefinedActions = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.predefinedActionsGrid.page = pageNumber;
                    self.getSortedDataPredefinedActions();
                });
        };


        /**
         * @description Opens the popup to add new predefined action
         * @param $event
         */
        self.openAddPredefinedActionDialog = function ($event) {
            predefinedActionService
                .controllerMethod
                .predefinedActionAdd($event)
                .then(function (result) {
                    self.reloadPredefinedActions(self.predefinedActionsGrid.page).then(function () {
                        toast.success(langService.get('add_success').change({name: result.getNames()}));
                    });
                });
        };

        /**
         * @description Opens the popup to edit predefined action
         * @param record
         * @param $event
         */
        self.openEditPredefinedActionDialog = function (record, $event) {
            predefinedActionService
                .controllerMethod
                .predefinedActionEdit(record, $event)
                .then(function (result) {
                    self.reloadPredefinedActions(self.predefinedActionsGrid.page).then(function () {
                        toast.success(langService.get('edit_success').change({name: result.getNames()}));
                    });
                });
        };


        /**
         * @description Delete single predefined action
         * @param record
         * @param $event
         */
        self.removePredefinedAction = function (record, $event) {
            predefinedActionService
                .controllerMethod
                .predefinedActionDelete(record, $event)
                .then(function () {
                    self.reloadPredefinedActions(self.grid.page);
                });
        };

        /**
         * @description Change the status of predefined action
         * @param record
         */
        self.changeStatusPredefinedAction = function (record) {
            self.predefinedActionServices[record.status](record)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    record.status = !record.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                });
        };

        /**
         * @description Initialize the application user certificate form
         * @private
         */
        function _initCertificate(forceReset) {
            if (forceReset || !self.userCertificate || !self.userCertificate.vsId) {
                self.userCertificate = new AppUserCertificate({
                    appUserId: self.applicationUser.id
                });
            }
            self.attachedCertificate = null;
        }

        _initCertificate(true);

        self.showCertificateForm = false; // defines if form will be shown or not
        self.certificateTypeUpload = false; // false means generate certificate, true means upload certificate
        self.certificateExtensions = attachmentService.getExtensionGroup('userCertificate').join(',');

        /**
         * @description Loads the user certificates
         * @param appUserId
         * @returns {Promise<any>}
         */
        self.loadUserCertificates = function (appUserId) {
            return applicationUserSignatureService.loadApplicationUserCertificate(appUserId || self.applicationUser.id)
                .then(function (result) {
                    self.applicationUser.certificate = result;
                    return result;
                });
        };

        self.onChangeCertificateTypeUpload = function () {
            _initCertificate();
        };

        self.removeCertificateContent = function ($event) {
            _initCertificate();
        };

        /**
         * @description Check validation of required fields for user certificate
         * @param model
         * @return {Array}
         */
        self.checkUserCertificateRequiredFields = function (model) {
            var required = model.getRequiredFields(), result = [];
            _.map(required, function (property) {
                if (!generator.validRequired(model[property]))
                    result.push(property);
            });
            return result;
        };

        self.checkRequiredCertificate = function () {
            if (!self.certificateTypeUpload) {
                return true;
            }
            return !!self.attachedCertificate;
        };

        /**
         * @description saves user certificate
         */
        self.saveUserCertificate = function ($event) {
            if (self.userCertificate.id || self.userCertificate.vsId) {
                // stop updating for user preference. admin can update
                return;
            }
            if (!self.checkRequiredCertificate()) {
                toast.error(langService.get('file_required'));
                return;
            }
            validationService
                .createValidation('ADD_USER_CERTIFICATE')
                .addStep('check_required_fields', true, self.checkUserCertificateRequiredFields, self.userCertificate, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateCertificateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .validate()
                .then(function () {
                    applicationUserSignatureService
                        .addApplicationUserCertificate(self.userCertificate, self.attachedCertificate).then(function () {
                        var defer = $q.defer();
                        self.userCertificateGrid.progress = defer.promise;
                        self.loadUserCertificates(self.applicationUser.id)
                            .then(function (result) {
                                _initCertificate(true);
                                self.showCertificateForm = false;

                                defer.resolve(true);
                                toast.success(langService.get('save_success'));
                            });
                    });
                })
                .catch(function () {

                });
        };

        /**
         * @description Handles the uploaded certificate to verify extension
         * @param files
         * @param element
         */
        self.handleUploadCertificate = function (files, element) {
            _initCertificate();

            attachmentService
                .validateBeforeUpload('userCertificate', files[0])
                .then(function (file) {
                    self.attachedCertificate = file;
                })
                .catch(function (availableExtensions) {
                    _initCertificate();
                    dialog.errorMessage(langService.get('invalid_uploaded_file').addLineBreak(availableExtensions.join(', ')));
                });
        };

        self.userCertificateGrid = {
            progress: null
        };

        /**
         * @description clear user certificate fields
         */
        self.clearUserCertificate = function ($event) {
            if (self.userCertificate.vsId) {
                self.showCertificateForm = false;
            }
            _initCertificate(true);
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
         * @description Close the popup
         */
        self.closeUserPreferencePopupFromCtrl = function () {
            //employeeService.setCurrentEmployee(self.ouApplicationUserCopy.applicationUser);
            if (self.requestForApprove)
                dialog.hide(self.applicationUser.signature);
            dialog.cancel();
        };


        self.checkDelegatedFromAnotherUsers = function () {
            var defer = $q.defer();
            if (self.usersWhoSetYouAsProxy && self.usersWhoSetYouAsProxy.length) {
                var scope = $rootScope.$new(), templateDefer = $q.defer(),
                    templateUrl = cmsTemplate.getPopup('delegated-by-users-message'),
                    html = $templateCache.get(templateUrl);

                if (!html) {
                    $templateRequest(templateUrl).then(function (template) {
                        html = template;
                        templateDefer.resolve(html);
                    });
                } else {
                    $timeout(function () {
                        templateDefer.resolve(html);
                    })
                }
                templateDefer.promise.then(function (template) {

                    scope.ctrl = {
                        outOfOfficeUsers: self.usersWhoSetYouAsProxy
                    };
                    LangWatcher(scope);
                    template = $compile(angular.element(template))(scope);

                    $timeout(function () {
                        dialog.confirmMessage(template[0].innerHTML)
                            .then(function (result) {
                                dialog
                                    .showDialog({
                                        targetEvent: null,
                                        templateUrl: cmsTemplate.getPopup('update-manager-proxy'),
                                        controller: 'updateManagerProxyPopCtrl',
                                        controllerAs: 'ctrl',
                                        locals: {
                                            currentUser: self.ouApplicationUser,
                                            availableProxies: availableProxies
                                        },
                                        resolve: {
                                            usersWhoSetProxy: function (ouApplicationUserService) {
                                                'ngInject';
                                                return ouApplicationUserService.getUsersWhoSetYouAsProxy(self.applicationUser);
                                            }
                                        }
                                    })
                                    .then(function (result) {
                                        self.outOfOfficeSettingsForm.$setUntouched();
                                        self.usersWhoSetYouAsProxy = [];
                                        defer.resolve(true);
                                    }).catch(function (error) {
                                    defer.reject(false);
                                    //   self.applicationUser.outOfOffice = !self.applicationUser.outOfOffice;
                                })

                            })
                            .catch(function () {
                                defer.reject(false);
                                //  self.applicationUser.outOfOffice = !self.applicationUser.outOfOffice;
                            });
                    });
                });

            } else {
                self.outOfOfficeSettingsForm.$setUntouched();
                defer.resolve(true);
            }

            return defer.promise;

        };

        self.checkIfEmptyProxyUserChanged = function () {
            return !self.selectedProxyUser && self.selectedProxyUser === self.ouApplicationUserCopy.proxyUser;
        };

        self.$onInit = function () {
            self.filteredSecurityLevels = _.filter(self.securityLevels, self.isSecurityLevelInclude);

            $timeout(function () {
                self.outOfOfficeSettingsForm = $scope.userPreferencesForm.outOfOfficeSettingsForm;
            })
        };

    });
};
