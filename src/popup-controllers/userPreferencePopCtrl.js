module.exports = function (app) {
    app.controller('userPreferencePopCtrl', function (_,
                                                      toast,
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
                                                      moment,
                                                      $sce,
                                                      listGeneratorService) {
        'ngInject';
        var self = this;
        self.controllerName = 'userPreferencePopCtrl';
        self.applicationUser = new ApplicationUser(applicationUser);

        //self.applicationUser.signature = signature;
        self.currentEmployee = applicationUser;
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
        self.workflowGroups = workflowGroups;
        self.userWorkflowGroups = userWorkflowGroups;
        self.userWorkflowGroupsCopy = angular.copy(userWorkflowGroups);
        self.userFolderService = userFolderService;
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


        self.rootEntity = rootEntity;

        /**
         * @description List of ou application users
         */
        self.ouApplicationUsers = ouApplicationUsers;
        //self.organizationsForAppUser = _.map(self.ouApplicationUsers, 'ouid');
        self.getOrganizationsForAppUser = function (ouAppUser) {
            self.organizationsForAppUser = _.map(self.ouApplicationUsers, function (ouAppUser) {
                return {
                    ou: ouAppUser.ouid,
                    status: (ouAppUser ? ouAppUser.status : ouAppUser.status),
                    id: ouAppUser.id
                }
            });
        };

        self.getOrganizationsForAppUser();
        /**
         * @description Current ou application user
         */

        self.ouApplicationUser = generator.interceptReceivedInstance('OUApplicationUser', angular.copy(employeeService.getCurrentOUApplicationUser()));
        // security levels for current OUApplicationUser
        self.securityLevels = self.ouApplicationUser.getSecurityLevels();
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


        /**
         * @description to check if the current user has valid proxy or not.
         * @param ouApplicationUser
         * @private
         */
        function _checkProxyDate(ouApplicationUser) {
            if (ouApplicationUser.proxyEndDate && ouApplicationUser.proxyEndDate.valueOf() < (new Date()).valueOf()) {
                self.isOutOfOffice = false;
                self.applicationUser.outOfOffice = false;
                self.selectedProxyUser = null;
                ouApplicationUser.emptyOutOfOffice();
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
            viewInboxAsGrid: 'view_inbox_as'
        };

        self.validateSignatureLabels = {
            docSubject: 'subject',
            documentTitle: 'title',
            fileUrl: 'upload_signature'
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


        /**
         * @description Contains the selected tab name
         * @type {string}
         */
        self.selectedTab = selectedTab ? selectedTab : "general";
        self.requestForApprove = (selectedTab === 'signature');
        /**
         * @description Set the current tab name
         * @param tabName
         */
        self.setCurrentTab = function (tabName) {
            var defer = $q.defer();
            if (tabName === 'signature') {
                applicationUserSignatureService.loadApplicationUserSignatures(self.applicationUser.id)
                    .then(function (result) {
                        self.applicationUser.signature = result;
                        defer.resolve(tabName);
                    });
            } else {
                defer.resolve(tabName);
            }
            return defer.promise.then(function (tab) {
                self.selectedTab = tab;
            });
        };

        self.tabsToShow = [
            'general',
            'ns',
            'ooos',
            'uc',
            'wfg',
            'folders',
            'signature'
        ];
        self.showTab = function (tabName) {
            return (self.tabsToShow.indexOf(tabName) > -1);
        };
        self.selectedTabIndex = self.tabsToShow.indexOf(self.selectedTab);

        /**
         * @description Changes the sms notifications to null/empty/0 when notifications are set to false or revert them when set to true
         * @param userPreferencesForm
         * @param $event
         */
        self.changeSMSNotifications = function (userPreferencesForm, $event) {
            if (!self.applicationUser.subscriptionsmsNotify) {
                self.applicationUser.newsmsEmailNotify = false;
                self.applicationUser.deadlinesmsNotify = false;
                self.applicationUser.reminderSmsnotify = false;
            } else {
                generator.replaceWithOriginalValues(self.applicationUser, self.model, ['newsmsEmailNotify', 'deadlinesmsNotify', 'reminderSmsnotify']);
            }
            self.resetNotificationsUserPreferences('newsmsEmailNotify', 'newItemSmspriority', [userPreferencesForm.newItemSmspriority]);
            self.resetNotificationsUserPreferences('deadlinesmsNotify', 'deadlineSmspriority', [userPreferencesForm.deadlineSmspriority]);
            self.resetNotificationsUserPreferences('reminderSmsnotify', ['reminderSmsPriority', 'reminderSmsdays'], [userPreferencesForm.reminderSmsPriority, userPreferencesForm.reminderSmsdays]);
        };

        /**
         * @description Changes the email notifications to null/empty/0 when notifications are set to false or revert them when set to true
         * @param userPreferencesForm
         * @param $event
         */
        self.changeEmailNotifications = function (userPreferencesForm, $event) {
            if (!self.applicationUser.subscriptionEmailNotify) {
                self.applicationUser.newItemEmailNotify = false;
                self.applicationUser.deadlineEmailNotify = false;
                self.applicationUser.reminderEmailNotify = false;
            } else {
                generator.replaceWithOriginalValues(self.applicationUser, self.model, ['newItemEmailNotify', 'deadlineEmailNotify', 'reminderEmailNotify']);
            }
            self.resetNotificationsUserPreferences('newItemEmailNotify', 'newItemEmailPriority', [userPreferencesForm.newItemEmailPriority]);
            self.resetNotificationsUserPreferences('deadlineEmailNotify', 'deadlineEmailPriority', [userPreferencesForm.deadlineEmailPriority]);
            self.resetNotificationsUserPreferences('reminderEmailNotify', ['reminderEmailPriority', 'reminderEmailDays'], [userPreferencesForm.reminderEmailPriority, userPreferencesForm.reminderEmailDays]);
        };

        /**
         * @description Opens dialog for add new theme
         * @param $event
         */
        self.openAddThemeDialog = function ($event) {
            themeService
                .controllerMethod
                .themeAdd($event)
                .then(function (result) {
                    self.themes.unshift(result);
                    self.applicationUser.defaultThemeID = result.id;
                })
        };

        /**
         * @description Resets the original values if notification is enabled/disabled
         * @param changedProperty
         * @param resetProperties
         * @param fields
         */
        self.resetNotificationsUserPreferences = function (changedProperty, resetProperties, fields) {
            if (self.applicationUser[changedProperty]) {
                generator.replaceWithOriginalValues(self.applicationUser, self.model, resetProperties);
                for (var i = 0; i < fields.length; i++) {
                    fields[i].$setUntouched();
                }
            } else {
                generator.replaceWithOriginalValues(self.applicationUser, self.model, resetProperties, true);
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


        /**
         * @description Describes if user is out of office
         * @type {boolean}
         */
        self.isOutOfOffice = self.ouApplicationUser.proxyUser !== null;

        _checkProxyDate(self.ouApplicationUser);

        /**
         * @description Returns out of office value as Yes/No instead of true/false
         * @returns {*}
         */
        self.getTranslatedOutOfOfficeYesNo = function () {
            return self.isOutOfOffice ? langService.get('yes') : langService.get('no');
        };


        /**
         * @description Saves the ou application user data when not out of office
         * @param form
         */
        self.changeOutOfOffice = function (form) {
            var defer = $q.defer();
            if (!self.isOutOfOffice) {
                if (self.ouApplicationUserCopy.proxyUser) {
                    self.ouApplicationUser.proxyUser = self.selectedProxyUser = null;
                    self.ouApplicationUser.proxyStartDate = null;
                    self.ouApplicationUser.proxyEndDate = null;
                    self.ouApplicationUser.proxyAuthorityLevels = null;
                    self.ouApplicationUser.viewProxyMessage = false;
                    self.ouApplicationUser.proxyMessage = null;
                    ouApplicationUserService
                        .updateOUApplicationUser(self.ouApplicationUser)
                        .then(function (result) {
                            employeeService.setCurrentOUApplicationUser(result);
                            self.ouApplicationUserCopy = angular.copy(result);
                            toast.success(langService.get('out_of_office_success'));
                            defer.resolve(true);
                        });
                }
            } else {
                if (self.currentEmployee.proxyUsers && self.currentEmployee.proxyUsers.length) {
                    var outOfOfficeUsers = generator.generateCollection(self.currentEmployee.proxyUsers, ProxyInfo);
                    var scope = $rootScope.$new(), templateDefer = $q.defer(),
                        templateUrl = cmsTemplate.getPopup('delegated-by-users-message'),
                        html = $templateCache.get(templateUrl);

                    if (!html){
                        $templateRequest(templateUrl).then(function (template) {
                            html = template;
                            templateDefer.resolve(html);
                        });
                    }else {
                        $timeout(function () {
                            templateDefer.resolve(html);
                        })
                    }
                    templateDefer.promise.then(function (template) {

                        scope.ctrl = {
                            outOfOfficeUsers: outOfOfficeUsers
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
                                                    return ouApplicationUserService.getUsersWhoSetYouAsProxy(self.applicationUser)
                                                }
                                            }
                                        })
                                        .then(function (result) {
                                            form.$setUntouched();
                                            defer.resolve(true);
                                        }).catch(function (error) {
                                        self.isOutOfOffice = !self.isOutOfOffice;
                                    })

                                })
                                .catch(function () {
                                    self.isOutOfOffice = !self.isOutOfOffice;
                                });
                        });
                    });

                } else {
                    form.$setUntouched();
                    defer.resolve(true);
                }
            }
            defer.promise.then(function (response) {
                if (!self.isOutOfOffice)
                    self.applicationUser.outOfOffice = false;
                employeeService.setCurrentEmployee(self.applicationUser);
            });
        };

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
            var required = self.requiredFieldsOutOfOffice, result = [];
            if (!self.applicationUser.outOfOffice) {
                if (!self.ouApplicationUser.proxyStartDate && !self.ouApplicationUser.proxyEndDate) {
                    required = _.filter(required, function (property) {
                        return property !== 'proxyStartDate' && property !== 'proxyEndDate';
                    })
                }
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
         * @description Save the Application User out of office settings in the ouApplicationUser model
         */
        self.saveOutOfOfficeSettingsFromCtrl = function () {
            if (self.selectedProxyUser) {
                self.ouApplicationUser.proxyUser = self.selectedProxyUser;
            }
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
                    ouApplicationUserService
                        .updateProxyUser(self.ouApplicationUser)
                        .then(function (result) {
                            employeeService.setCurrentOUApplicationUser(result);
                            self.ouApplicationUserCopy = angular.copy(result);
                            employeeService.setCurrentEmployee(self.applicationUser);
                            toast.success(langService.get('out_of_office_success'));
                        });
                })
                .catch(function (result) {
                    console.log(result);
                });
        };


        self.userComment = new UserComment({
            userId: applicationUser.id,
            itemOrder: generator.createNewID(self.userComments, 'itemOrder')
        });

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
        self.isUserCommentForm = false;
        self.userCommentForm = null;

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataUserComments = function () {
            self.userComments = $filter('orderBy')(self.userComments, self.grid.order);
        };

        self.grid = {
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
            ]
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
            self.progress = defer.promise;
            return userCommentService
                .loadUserComments()
                .then(function (result) {
                    self.userComments = _.filter(result, function (userComment) {
                        return userComment.userId === applicationUser.id;
                    });
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
         * @param userCommentForm
         * @param $event
         */
        self.openUserCommentForm = function (userCommentForm, $event) {
            self.isUserCommentForm = true;
            self.userComment = new UserComment({
                userId: applicationUser.id,
                itemOrder: generator.createNewID(self.userComments, 'itemOrder')
            });
            userCommentForm.$setUntouched();
        };

        /**
         * @description Closes the user comment form and reset it.
         * @param $event
         */
        self.closeUserCommentForm = function ($event) {
            self.isUserCommentForm = false;
        };

        /**
         * @description Add the new user comment
         */
        self.addUserCommentFromCtrl = function () {
            userCommentService
                .addUserComment(self.userComment)
                .then(function () {
                    self.reloadUserComments(self.grid.page)
                        .then(function () {
                            self.closeUserCommentForm();
                            toast.success(langService.get('save_success'));
                        });
                });
        };

        /**
         * @description Opens the edit user comment form
         * @param {UserComment} userComment
         * @param userCommentForm
         * @param $event
         */
        self.editUserComment = function (userComment, userCommentForm, $event) {
            self.isUserCommentForm = true;
            self.userComment = angular.copy(userComment);
            userCommentForm.$setUntouched();
        };

        /**
         * @description Updates the user comment
         */
        self.editUserCommentFromCtrl = function () {
            userCommentService
                .updateUserComment(self.userComment)
                .then(function () {
                    self.reloadUserComments(self.grid.page)
                        .then(function () {
                            self.closeUserCommentForm();
                            toast.success(langService.get('update_success'));
                        });
                });
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
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
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
            searchCallback: function () {
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
         * @description Delete single user workflow group
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
            self.userWorkflowProgress = defer.promise;

            return userWorkflowGroupService
                .getUserWorkflowGroupsByUser($event)
                .then(function (result) {
                    self.userWorkflowGroups = result;
                    self.userWorkflowGroupsCopy = angular.copy(result);
                    self.selectedUserWorkflowGroups = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
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
         * @description Close the popup
         */
        self.closeUserPreferencePopupFromCtrl = function () {
            if (self.requestForApprove)
                dialog.hide(self.applicationUser.signature);
            dialog.cancel();
        };


        /**
         * @description check upload file
         * @return {Array}
         */
        /*self.checkRequiredFile = function () {
         var result = [];
         if (!self.fileUrl)
         result.push('fileUrl');
         return result;
         };*/

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
                            self.signatureProgress = defer.promise;
                            applicationUserSignatureService.loadApplicationUserSignatures(self.ouApplicationUser.applicationUser.id).then(function (result) {

                                self.applicationUser.signature = result;
                                self.signature = new ApplicationUserSignature();
                                self.fileUrl = null;
                                self.enableAdd = false;
                                defer.resolve(true);
                                toast.success(langService.get('save_success'));
                            })

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
                self.signatureProgress = defer.promise;
                applicationUserSignatureService.loadApplicationUserSignatures(signature.appUserId).then(function (result) {
                    self.applicationUser.signature = result;
                    defer.resolve(true);
                    toast.success(langService.get('save_success'));
                })
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
                    self.signatureProgress = defer.promise;
                    applicationUserSignatureService.loadApplicationUserSignatures(self.ouApplicationUser.applicationUser.id).then(function (result) {
                        self.applicationUser.signature = result;
                        defer.resolve(true);
                        toast.success(langService.get('delete_success'));
                    })

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
        }

    });
};
