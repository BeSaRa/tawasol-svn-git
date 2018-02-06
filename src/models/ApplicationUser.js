module.exports = function (app) {
    app.factory('ApplicationUser', function (CMSModelInterceptor,
                                             _,
                                             generator,
                                             lookupService,
                                             langService) {
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
            self.inboxRefreshInterval = 10;
            self.defaultOUID = null;
            self.defaultThemeID = null;
            self.classificationPermisssions = null;
            self.actions = null;

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
                'loginName',
                'gender',
                'defaultDisplayLang',
                'employeeNo',
                'qid',
                'jobTitle',
                'mobile',
                'email',
                // 'defaultOUID',
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
                'reminderEmailDays'
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
            ApplicationUser.prototype.getDefaultOrganization = function () {
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


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ApplicationUser', 'init', this);
        }
    });
};