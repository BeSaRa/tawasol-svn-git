module.exports = function (app) {
    app.factory('ApplicationUser', function (CMSModelInterceptor,
                                             _,
                                             generator,
                                             lookupService,
                                             langService,
                                             rootEntity) {
        'ngInject';
        return function ApplicationUser(model) {
            var self = this, organizationService;
            self.id = null;
            self.arFullName = null;
            self.loginName = null;
            self.enFullName = null;
            self.employeeNo = null;
            self.qid = null;
            self.domainName = "";
            self.rank = null;
            self.jobTitle = null;
            self.subscriptionsmsNotify = false;
            self.newItemEmailNotify = false;
            self.newsmsEmailNotify = false;
            self.deadlineEmailNotify = false;
            self.defaultDisplayLang = 1;
            self.searchAmountLimit = null;
            self.subscriptionEmailNotify = false;
            self.deadlinesmsNotify = false;
            self.reminderEmailNotify = false;
            self.reminderSmsnotify = false;
            self.newItemEmailPriority = 0;
            self.newItemSmspriority = 0;
            self.email = null;
            self.deadlineEmailPriority = 0;
            self.deadlineSmspriority = 0;
            self.reminderEmailPriority = 0;
            self.reminderSmsPriority = 0;
            self.reminderEmailDays = 0;
            self.reminderSmsdays = 0;
            self.mobile = null;
            self.gender = 1;
            self.inboxRefreshInterval = rootEntity.getGlobalSettings().inboxRefreshInterval;
            self.defaultOUID = null;
            self.defaultThemeID = null;
            self.classificationPermisssions = null;
            self.actions = null;
            self.outOfOffice = false;
            self.viewInboxAsGrid = true;
            self.defaultViewerLang = 1;
            self.defaultEditMode = 0;
            self.backLogMode = false;
            self.slowConnectionMode = false;

            var collectionResults = [
                'reminderSmsPriority',
                'newItemSmspriority',
                'deadlineSmspriority',
                'newItemEmailPriority',
                'deadlineEmailPriority',
                'reminderEmailPriority'
            ];

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arFullName',
                'enFullName',
                //'loginName',
                'gender',
                'defaultDisplayLang',
                'employeeNo',
                'qid',
                'jobTitle',
                'mobile',
                'email',
                'defaultOUID',
                'domainName',
                'defaultThemeID',
                'searchAmountLimit',
                'subscriptionsmsNotify',
                'subscriptionEmailNotify',
                'newsmsEmailNotify',
                'newItemEmailNotify',
                'deadlinesmsNotify',
                'deadlineEmailNotify',
                'reminderSmsnotify',
                'reminderEmailNotify',
                'newItemSmspriority',
                'newItemEmailPriority',
                'deadlineSmspriority',
                'deadlineEmailPriority',
                'reminderSmsPriority',
                'reminderEmailPriority',
                'reminderSmsdays',
                'reminderEmailDays',
                'viewInboxAsGrid'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            ApplicationUser.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for application user. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            ApplicationUser.prototype.getNames = function (separator) {
                return this.arFullName + (separator ? separator : ' - ') + this.enFullName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for application user. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            ApplicationUser.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enFullName : this.arFullName) : (reverse ? this.arFullName : this.enFullName);
            };

            /**
             * @description Get the name of record with passed language name
             * @param language
             * @returns {string}
             */
            ApplicationUser.prototype.getNameByLanguage = function (language) {
                return this[language + 'FullName'];
            };

            /**
             * @description Get the translated true/false as active/inactive or yes/no
             * @param fieldName
             * * @returns {*}
             */
            ApplicationUser.prototype.getTranslatedYesNo = function (fieldName) {
                return this[fieldName] ? langService.get('yes') : langService.get('no');
            };

            ApplicationUser.prototype.setOrganizationService = function (orgService) {
                organizationService = orgService;
                return this;
            };
            ApplicationUser.prototype.getDefaultOrganization = function (returnIdOnly) {
                if (returnIdOnly){
                   return this.defaultOUID;
                }
                return organizationService.getOrganizationById(this.defaultOUID);
            };

            ApplicationUser.prototype.getDefaultOrganizationEnglishName = function () {
                return this.getDefaultOrganization().enName;
            };

            ApplicationUser.prototype.getDefaultOrganizationArabicName = function () {
                return this.getDefaultOrganization().arName;
            };

            ApplicationUser.prototype.mapSend = function () {
                var self = this;
                _.map(collectionResults, function (key) {
                    if (angular.isArray(self[key]))
                        self[key] = generator.getResultFromSelectedCollection(self[key], 'lookupKey');
                });
                return this;
            };

            ApplicationUser.prototype.mapReceived = function () {
                var self = this;
                var priorityLevels = lookupService.returnLookups(lookupService.priorityLevel);
                _.map(collectionResults, function (key) {
                    if (!angular.isArray(self[key]))
                        self[key] = generator.getSelectedCollectionFromResult(priorityLevels, self[key], 'lookupKey');
                });
                return this;
            };

            ApplicationUser.prototype.getFullNameByKey = function (key) {
                return this[key + 'FullName'] ? this[key + 'FullName'] : null;
            };

            // add setter for application user

            ApplicationUser.prototype.setId = function (id) {
                this.id = id;
                return this;
            };
            ApplicationUser.prototype.setArFullName = function (arFullName) {
                this.arFullName = arFullName;
                return this;
            };
            ApplicationUser.prototype.setLoginName = function (loginName) {
                this.loginName = loginName;
                return this;
            };
            ApplicationUser.prototype.setEnFullName = function (enFullName) {
                this.enFullName = enFullName;
                return this;
            };
            ApplicationUser.prototype.setEmployeeNo = function (employeeNo) {
                this.employeeNo = employeeNo;
                return this;
            };
            ApplicationUser.prototype.setQid = function (qid) {
                this.qid = qid;
                return this;
            };
            ApplicationUser.prototype.setDomainName = function (domainName) {
                this.domainName = domainName;
                return this;
            };
            ApplicationUser.prototype.setRank = function (rank) {
                this.rank = rank;
                return this;
            };
            ApplicationUser.prototype.setJobTitle = function (jobTitle) {
                this.jobTitle = jobTitle;
                return this;
            };
            ApplicationUser.prototype.setSubscriptionsmsNotify = function (subscriptionsmsNotify) {
                this.subscriptionsmsNotify = subscriptionsmsNotify;
                return this;
            };
            ApplicationUser.prototype.setNewItemEmailNotify = function (newItemEmailNotify) {
                this.newItemEmailNotify = newItemEmailNotify;
                return this;
            };
            ApplicationUser.prototype.setNewsmsEmailNotify = function (newsmsEmailNotify) {
                this.newsmsEmailNotify = newsmsEmailNotify;
                return this;
            };
            ApplicationUser.prototype.setDeadlineEmailNotify = function (deadlineEmailNotify) {
                this.deadlineEmailNotify = deadlineEmailNotify;
                return this;
            };
            ApplicationUser.prototype.setDefaultDisplayLang = function (defaultDisplayLang) {
                this.defaultDisplayLang = defaultDisplayLang;
                return this;
            };
            ApplicationUser.prototype.setSearchAmountLimit = function (searchAmountLimit) {
                this.searchAmountLimit = searchAmountLimit;
                return this;
            };
            ApplicationUser.prototype.setSubscriptionEmailNotify = function (subscriptionEmailNotify) {
                this.subscriptionEmailNotify = subscriptionEmailNotify;
                return this;
            };
            ApplicationUser.prototype.setDeadlinesmsNotify = function (deadlinesmsNotify) {
                this.deadlinesmsNotify = deadlinesmsNotify;
                return this;
            };
            ApplicationUser.prototype.setReminderEmailNotify = function (reminderEmailNotify) {
                this.reminderEmailNotify = reminderEmailNotify;
                return this;
            };
            ApplicationUser.prototype.setReminderSmsnotify = function (reminderSmsnotify) {
                this.reminderSmsnotify = reminderSmsnotify;
                return this;
            };
            ApplicationUser.prototype.setNewItemEmailPriority = function (newItemEmailPriority) {
                this.newItemEmailPriority = newItemEmailPriority;
                return this;
            };
            ApplicationUser.prototype.setNewItemSmspriority = function (newItemSmspriority) {
                this.newItemSmspriority = newItemSmspriority;
                return this;
            };
            ApplicationUser.prototype.setEmail = function (email) {
                this.email = email;
                return this;
            };
            ApplicationUser.prototype.setDeadlineEmailPriority = function (deadlineEmailPriority) {
                this.deadlineEmailPriority = deadlineEmailPriority;
                return this;
            };
            ApplicationUser.prototype.setDeadlineSmspriority = function (deadlineSmspriority) {
                this.deadlineSmspriority = deadlineSmspriority;
                return this;
            };
            ApplicationUser.prototype.setReminderEmailPriority = function (reminderEmailPriority) {
                this.reminderEmailPriority = reminderEmailPriority;
                return this;
            };
            ApplicationUser.prototype.setReminderSmsPriority = function (reminderSmsPriority) {
                this.reminderSmsPriority = reminderSmsPriority;
                return this;
            };
            ApplicationUser.prototype.setReminderEmailDays = function (reminderEmailDays) {
                this.reminderEmailDays = reminderEmailDays;
                return this;
            };
            ApplicationUser.prototype.setReminderSmsdays = function (reminderSmsdays) {
                this.reminderSmsdays = reminderSmsdays;
                return this;
            };
            ApplicationUser.prototype.setMobile = function (mobile) {
                this.mobile = mobile;
                return this;
            };
            ApplicationUser.prototype.setGender = function (gender) {
                this.gender = gender;
                return this;
            };
            ApplicationUser.prototype.setInboxRefreshInterval = function (inboxRefreshInterval) {
                this.inboxRefreshInterval = inboxRefreshInterval;
                return this;
            };
            ApplicationUser.prototype.setDefaultOUID = function (defaultOUID) {
                this.defaultOUID = defaultOUID;
                return this;
            };
            ApplicationUser.prototype.setDefaultThemeID = function (defaultThemeID) {
                this.defaultThemeID = defaultThemeID;
                return this;
            };
            ApplicationUser.prototype.setClassificationPermisssions = function (classificationPermisssions) {
                this.classificationPermisssions = classificationPermisssions;
                return this;
            };
            ApplicationUser.prototype.setActions = function (actions) {
                this.actions = actions;
                return this;
            };
            ApplicationUser.prototype.setOutOfOffice = function (outOfOffice) {
                this.outOfOffice = outOfOffice;
                return this;
            };
            ApplicationUser.prototype.setViewInboxAsGrid = function (viewInboxAsGrid) {
                this.viewInboxAsGrid = viewInboxAsGrid;
                return this;
            };
            ApplicationUser.prototype.setDefaultViewerLang = function (defaultViewerLang) {
                this.defaultViewerLang = defaultViewerLang;
                return this;
            };
            ApplicationUser.prototype.setDefaultEditMode = function (defaultEditMode) {
                this.defaultEditMode = defaultEditMode;
                return this;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ApplicationUser', 'init', this);
        }
    });
};
