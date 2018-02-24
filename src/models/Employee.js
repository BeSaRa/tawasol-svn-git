module.exports = function (app) {
    app.factory('Employee', function (CMSModelInterceptor,
                                      lookupService,
                                      generator,
                                      OUApplicationUser) {
        'ngInject';
        return function Employee(model) {
            var self = this, organizationService, Organization, workflowActionService;
            self.arFullName = null;
            self.deadlineEmailNotify = null;
            self.deadlineEmailPriority = null;
            self.deadlineSmspriority = null;
            self.deadlinesmsNotify = null;
            self.defaultDisplayLang = null;
            self.defaultOUID = null;
            self.defaultThemeID = null;
            self.domainName = null;
            self.email = null;
            self.employeeNo = null;
            self.enFullName = null;
            self.gender = null;
            self.id = null;
            self.inboxRefreshInterval = null;
            self.jobTitle = null;
            self.loginName = null;
            self.mobile = null;
            self.newItemEmailNotify = null;
            self.newItemEmailPriority = null;
            self.newItemSmspriority = null;
            self.newsmsEmailNotify = null;
            self.qid = null;
            self.rank = null;
            self.reminderEmailDays = null;
            self.reminderEmailNotify = null;
            self.reminderEmailPriority = null;
            self.reminderSmsPriority = null;
            self.reminderSmsdays = null;
            self.reminderSmsnotify = null;
            self.searchAmountLimit = null;
            self.subscriptionEmailNotify = null;
            self.subscriptionsmsNotify = null;
            // extra fields
            self.permissions = [];
            // ouApplicationUser
            self.organization = null;
            self.proxyUsers = [];
            self.userOrganization = null;
            self.ouList = [];
            self.outOfOffice = false;

            var collectionResults = [
                'reminderSmsPriority',
                'newItemSmspriority',
                'deadlineSmspriority',
                'newItemEmailPriority',
                'deadlineEmailPriority',
                'reminderEmailPriority'
            ];

            if (model)
                angular.extend(this, model);
            /**
             * @description to set organization service when create the Employee Model.
             * @param service
             * @return {Employee}
             */
            Employee.prototype.setOrganizationService = function (service) {
                organizationService = service;
                return this;
            };

            Employee.prototype.setOrganizationModel = function (model) {
                Organization = model;
                return this;
            };

            Employee.prototype.setWorkflowActionService = function (service) {
                workflowActionService = service;
                return this;
            };

            Employee.prototype.loadMyWorkflowActions = function () {
                return workflowActionService.loadCurrentUserWorkflowActions();
            };

            Employee.prototype._checkPermission = function (permissionKey) {
                var self = this;
                if (typeof permissionKey === 'function')
                    return permissionKey(this);

                var result = _.find(self.permissions, function (item) {
                    return item.permissionKey.toLowerCase().trim() === permissionKey.toLowerCase().trim();
                });
                return !!result;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for application user(employee). If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            Employee.prototype.getNames = function (separator) {
                return this.arFullName + (separator ? separator : ' - ') + this.enFullName;
            };

            /**
             * set permission for current user
             * @param permissions
             * @return {Employee}
             */
            Employee.prototype.setPermissions = function (permissions) {
                this.permissions = permissions;
                return this;
            };
            /**
             * @description set proxy Users for current Employee.
             * @param proxyUsers
             * @return {Employee}
             */
            Employee.prototype.setProxyUsers = function (proxyUsers) {
                this.proxyUsers = proxyUsers;
                return this;
            };

            Employee.prototype.setOuList = function (ouList) {
                this.ouList = generator.generateCollection(ouList, Organization);
                return this;
            };

            Employee.prototype.getTranslatedName = function () {
                return $('html').hasClass('rtl') ? this.arFullName : this.enFullName;
            };

            Employee.prototype.setOrganization = function (ouApplication) {
                var applicationUser = angular.copy(this);
                delete applicationUser.permissions;
                delete applicationUser.organization;

                this.organization = new OUApplicationUser(ouApplication);
                this.organization.applicationUser = applicationUser;
                return this;
            };

            Employee.prototype.loadOrganization = function () {
                var self = this;
                return organizationService.loadOrganizationById(this.organization.ouid)
                    .then(function (organization) {
                        self.userOrganization = organization;
                        return organization;
                    });
            };

            Employee.prototype.canSendTo = function (property) {
                return this.organization['sendTo' + property];
            };
            Employee.prototype.canSendToPrivate = function () {
                return this.canSendTo('PrivateUsers');
            };
            Employee.prototype.canSendToEntityUsers = function () {
                return this.canSendTo('AllEntityUsers');
            };
            Employee.prototype.canSendToParentOUUsers = function () {
                return this.canSendTo('AllParentOUUsers');
            };
            Employee.prototype.canSendToRegistryOUUsers = function () {
                return this.canSendTo('AllRegistryOUUsers');
            };
            Employee.prototype.canSendToManagers = function () {
                return this.canSendTo('AllRegistryOUUsers');
            };
            /**
             * to check if the current user has permission
             * @param permissionKey
             * @return {boolean}
             */
            Employee.prototype.hasPermissionTo = function (permissionKey, debug) {
                if (debug)
                    console.log(permissionKey);
                return this._checkPermission(permissionKey);
            };
            /**
             * @description to check if Employee has Proxy users.
             * @return {Number}
             */
            Employee.prototype.isProxyUser = function () {
                return this.proxyUsers.length;
            };
            /**
             * check if the given permission collection found in current user or not.
             * @param permissions
             * @return {boolean}
             */
            Employee.prototype.hasThesePermissions = function (permissions) {
                var self = this;
                return !_.some(_.map(permissions, function (permission) {
                    return self.hasPermissionTo(permission);
                }), function (item) {
                    return !item;
                });
            };

            /**
             * if the employee at lest one of these permissions.
             * @param permissions
             * @return {boolean}
             */
            Employee.prototype.hasAnyPermissions = function (permissions) {
                var self = this;
                return _.some(_.map(permissions, function (permission) {
                    return self.hasPermissionTo(permission);
                }), function (item) {
                    return !!item;
                });
            };


            Employee.prototype.getExtraFields = function () {
                var self = this;
                return {
                    ou: self.organization,
                    proxyUsers: self.proxyUsers,
                    permissions: self.permissions,
                    ouList: self.ouList
                }
            };

            Employee.prototype.inCentralArchive = function () {
                return false;
            };

            Employee.prototype.mapSend = function () {
                var self = this;

                _.map(collectionResults, function (key) {
                    if (angular.isArray(self[key]))
                        self[key] = generator.getResultFromSelectedCollection(self[key], 'lookupKey');
                });
                return this;
            };

            Employee.prototype.mapReceived = function () {
                var self = this;
                var priorityLevels = lookupService.returnLookups(lookupService.priorityLevel);
                _.map(collectionResults, function (key) {
                    if (!angular.isArray(self[key]))
                        self[key] = generator.getSelectedCollectionFromResult(priorityLevels, self[key], 'lookupKey');
                });
                return this;
            };

            Employee.prototype.getOUID = function () {
                return this.organization.ouid ? (this.organization.ouid.hasOwnProperty('id') ? this.organization.ouid.id : this.organization.ouid) : false;
            };

            Employee.prototype.getRegistryOUID = function () {
                return this.userOrganization.hasRegistry ? this.userOrganization.id : this.userOrganization.registryParentId;
            };

            Employee.prototype.getIntervalMin = function () {
                return (60 * 100 * 10) * (this.inboxRefreshInterval || 1);
            };

            Employee.prototype.hasProxy = function () {
                return this.organization ? this.organization.proxyUser : false;
            };


            CMSModelInterceptor.runEvent('Employee', 'init', this);

        }
    });
};