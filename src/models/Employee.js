module.exports = function (app) {
    app.factory('Employee', function (CMSModelInterceptor,
                                      lookupService,
                                      generator,
                                      $q,
                                      _,
                                      singleNotifierService,
                                      urlService,
                                      OUApplicationUser) {
        'ngInject';
        return function Employee(model) {
            var self = this, organizationService, Organization, workflowActionService, applicationUserService, $http, rootEntity;
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
            self.viewInboxAsGrid = true;
            self.otpEnabled = false;
            // extra fields
            self.permissions = [];
            self.mappedToCentralArchive = false;
            // ouApplicationUser
            self.organization = null;
            self.proxyUsers = [];
            self.userOrganization = null;
            self.ouList = [];
            self.outOfOffice = false;
            self.isAdmin = false;
            self.isSuperAdmin = false;
            self.isSubAdmin = false;
            self.backLogMode = false;
            self.slowConnectionMode = false;
            self.pinCodePrompt = false;
            self.subAdminOuList = [];

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

            Employee.prototype.setHttpService = function (service) {
                $http = service;
                return this;
            };
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

            Employee.prototype.setApplicationUSerService = function (service) {
                applicationUserService = service;
                return this;
            };
            /**
             * @description set rootEntity service.
             * @param entity
             */
            self.setRootEntityService = function (entity) {
                rootEntity = entity;
                return this;
            };
            Employee.prototype.getRootEntity = function () {
                return rootEntity;
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
                    if (permissionKey === '') {
                        return true;
                    }
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
                singleNotifierService.getNotifierByName('EMPLOYEE_PERMISSION_CHANGE').notify(this);
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
            Employee.prototype.setIsSubAdmin = function (isSubAdmin) {
                this.isSubAdmin = isSubAdmin;
                return this;
            };
            Employee.prototype.setIsSuperAdmin = function (isSuperAdmin) {
                this.isSuperAdmin = isSuperAdmin;
                return this;
            };
            Employee.prototype.setIsAdmin = function (isAdmin) {
                this.isAdmin = isAdmin;
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

                ouApplication.ouRegistryID = ouApplication.ouRegistryID.hasOwnProperty('id') ? ouApplication.ouRegistryID.id : ouApplication.ouRegistryID;
                this.organization = new OUApplicationUser(ouApplication);
                this.organization.applicationUser = applicationUser;
                return this;
            };

            Employee.prototype.updateUserOrganizationInfo = function (org) {
                var self = this;
                org = generator.generateInstance(org, Organization, organizationService._sharedMethods);
                org = generator.interceptReceivedInstance('Organization', org);
                return self.userOrganization = new Organization(org);
            };

            Employee.prototype.loadOrganization = function () {
                var self = this;
                return organizationService.loadOrganizationById(this.organization.ouid)
                    .then(function (organization) {
                        self.userOrganization = organization;
                        return organization;
                    });
            };

            Employee.prototype.getDefaultEditMode = function () {
                return this.defaultEditMode;
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
                return this.canSendTo('Managers');
            };
            Employee.prototype.canSendToViceManagers = function () {
                return this.canSendTo('ViceManager');
            };
            /**
             * to check if the current user has permission
             * @param permissionKey
             * @param debug
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
                permissions = angular.isArray(permissions) ? permissions : [permissions];
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
                    ouList: self.ouList,
                    ouInfo: self.userOrganization
                }
            };

            Employee.prototype.inCentralArchive = function () {
                return this.userOrganization && this.userOrganization.centralArchive;
            };

            Employee.prototype.inCentralArchiveAndNotHasRegistry = function () {
                return this.userOrganization && this.userOrganization.centralArchive && !this.userOrganization.hasRegistry;
            };

            Employee.prototype.inCentralArchiveAndHasRegistry = function () {
                return this.userOrganization && this.userOrganization.centralArchive && this.userOrganization.hasRegistry;
            };

            Employee.prototype.isBacklogMode = function () {
                return this.backLogMode;
            };

            Employee.prototype.isSlowConnectionMode = function () {
                return this.slowConnectionMode;
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
                return this.organization && this.organization.ouid ? (this.organization.ouid.hasOwnProperty('id') ? this.organization.ouid.id : this.organization.ouid) : false;
            };
            Employee.prototype.getNormalizeID = function (organization) {
                return organization.hasOwnProperty('id') ? organization.id : organization;
            };

            Employee.prototype.getRegistryOUID = function () {
                return this.userOrganization.hasRegistry ? this.getNormalizeID(this.userOrganization.id) : this.getNormalizeID(this.userOrganization.registryParentId);
            };

            /**
             * @description Gets the registry organization
             * @returns {Promise|*}
             */
            Employee.prototype.getRegistryOrganization = function () {
                if (!this.userOrganization) {
                    return $q.reject(null);
                }
                return this.userOrganization.hasRegistry
                    ? $q.resolve(this.userOrganization)
                    : organizationService.loadOrganizationById(this.getRegistryOUID());
            };

            Employee.prototype.isInSection = function () {
                return this.getOUID() !== this.getRegistryOUID();
            };

            Employee.prototype.isInDepartment = function () {
                return !this.isInSection();
            };

            Employee.prototype.getIntervalMin = function () {
                return (60000) * (this.inboxRefreshInterval || 5);
            };

            Employee.prototype.hasProxy = function () {
                return this.organization ? this.organization.proxyUser : false;
            };

            Employee.prototype.hasPinCodePrompt = function () {
                return this.pinCodePrompt;
            };

            /**
             * @description check if the current proxy user for the employee inside the given collection of proxyUsers.
             * @param collectionOfProxyUsers
             * @return {*|boolean}
             */
            Employee.prototype.currentProxyUserInCollection = function (collectionOfProxyUsers) {
                var self = this;
                return !!_.find(collectionOfProxyUsers, function (proxyUser) {
                    var info = self.getProxyInformation();
                    return info.userId === proxyUser.applicationUser.id && info.ouId === proxyUser.organization.id;
                });
            };
            /**
             * @description return proxy user information for the employee .. but should call this function if the user has proxy
             * @return {{userId: *, ouId: null}}
             */
            Employee.prototype.getProxyInformation = function () {
                var self = this, proxyUser = !!self.organization.proxyUser.hasOwnProperty('applicationUser');
                return {
                    userId: proxyUser ? self.organization.proxyUser.applicationUser.id : self.organization.proxyUser.id,
                    ouId: proxyUser ? self.organization.proxyUser.organization.id : self.organization.proxyOUId,
                    securityLevels: self.proxyAuthorityLevels
                };
            };

            Employee.prototype.inRegistry = function () {
                return this.userOrganization && this.userOrganization.hasRegistry;
            };

            Employee.prototype.updateLanguage = function (language) {
                var self = this;
                return this.defaultDisplayLang !== language.lookupKey ? applicationUserService.updateCurrentLanguage(language).then(function () {
                    self.defaultDisplayLang = language.lookupKey;
                }) : $q.resolve(true);
            };

            Employee.prototype.toggleInboxView = function () {
                var self = this;
                return $http.put(urlService.applicationUsers + '/change-inbox-view/' + (self.viewInboxAsGrid ? 0 : 1))
                    .then(function () {
                        self.viewInboxAsGrid = !self.viewInboxAsGrid;
                    })
                    .catch(function (reason) {
                        self.viewInboxAsGrid = !self.viewInboxAsGrid;
                        return reason;
                    })
            };
            /**
             * to listening to permissions changes for the current logged in  user.
             * @param callback
             */
            Employee.prototype.listeningToPermissionsChanges = function (callback) {
                singleNotifierService.getNotifierByName('EMPLOYEE_PERMISSION_CHANGE').promise.then(function () {
                    // for the resolve not needs
                }, function () {
                    // for the reject not needs
                }, function (employee) {
                    // for notify
                    callback(employee);
                });
            };
            /**
             * return (userId + current ouID ) converted to integer
             * @returns {number}
             */
            Employee.prototype.getCombinedEmployeeId = function () {
                return Number(this.id + '' + this.getOUID());
            };


            CMSModelInterceptor.runEvent('Employee', 'init', this);

        }
    });
};
