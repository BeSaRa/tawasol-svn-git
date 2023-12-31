module.exports = function (app) {
    app.factory('OUApplicationUser', function (CMSModelInterceptor, generator, lookupService, ProxyUser, _) {
        'ngInject';
        return function OUApplicationUser(model) {
            var self = this, langService;
            self.id = null;
            self.applicationUser = null;
            self.ouid = null;
            self.ouRegistryID = null;
            self.customRoleId = null;
            self.status = true;
            self.isPrivate = false;
            self.securityLevels = null;
            self.sendToPrivateUsers = false;
            self.sendToManagers = false;
            self.sendToViceManager = false;
            self.sendToAllEntityUsers = false;
            self.sendToAllRegistryOUUsers = false;
            self.sendToAllParentOUUsers = false;
            self.privateUsers = null;
            self.managers = null;
            self.viceManagers = null;
            self.proxyUser = null;
            self.proxyStartDate = null;
            self.proxyEndDate = null;
            self.proxyAuthorityLevels = null;
            self.viewProxyMessage = false;
            self.proxyMessage = null;
            self.permissionList = null;
            self.ouViewPermissionList = null;
            self.proxyOUId = null;
            self.ouInfo = null;
            self.wfsecurity = null;
            self.archiveSecurityLevels = null;
            self.proxyStartDateString = '';
            self.proxyEndDateString = '';
            self.userLevelId = null;
            self.useProxyWFSecurity = false;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'applicationUser',
                'ouid',
                'ouRegistryID',
                'customRoleId',
                'status',
                'isPrivate',
                'securityLevels',
                'wfsecurity'//,
                // //out of office settings
                // 'proxyUser',
                // 'proxyAuthorityLevels',
                // 'proxyStartDate',
                // 'proxyEndDate',
                // 'viewProxyMessage',
                // 'proxyMessage',
                // //workflow participation
                // 'sendToPrivateUsers',
                // 'sendToManagers',
                // 'privateUsers',
                // 'managers',
                // 'sendToAllEntityUsers',
                // 'sendToAllRegistryOUUsers',
                // 'sendToAllParentOUUsers'
            ];

            if (model)
                angular.extend(this, model);
            OUApplicationUser.prototype.setLangService = function (service) {
                langService = service;
            };
            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            OUApplicationUser.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            OUApplicationUser.prototype.setOuId = function (organization) {
                this.ouid = organization;
                return this;
            };

            OUApplicationUser.prototype.getApplicationUserId = function () {
                if (!this.applicationUser) {
                    return null;
                }
                return this.applicationUser.hasOwnProperty('id') ? this.applicationUser.id : this.applicationUser;
            };

            OUApplicationUser.prototype.getApplicationUser = function () {
                if (!this.applicationUser) {
                    return null;
                }
                return this.applicationUser;
            };

            OUApplicationUser.prototype.getOuId = function () {
                if (this.hasOwnProperty('ouInfo') && this.ouInfo && this.ouInfo.id) {
                    return this.ouInfo.id;
                } else if (this.ouid) {
                    return this.ouid.hasOwnProperty('id') ? this.ouid.id : this.ouid;
                } else if (this.ouId) {
                    return this.ouId.hasOwnProperty('id') ? this.ouId.id : this.ouId;
                }
                return null;
            };

            OUApplicationUser.prototype.getOrganization = function () {
                if (this.hasOwnProperty('ouInfo') && this.ouInfo && this.ouInfo.id) {
                    return this.ouInfo;
                } else if (this.hasOwnProperty('ouid') && this.ouid && this.ouid.id) {
                    return this.ouid;
                } else if (this.hasOwnProperty('ouId') && this.ouId && this.ouId.id) {
                    return this.ouId;
                }
                return null;
            };

            /**
             * @description Get the translated arabic or english name according to current language for application user. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            OUApplicationUser.prototype.getTranslatedApplicationUserName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.applicationUser.enFullName : this.applicationUser.arFullName) : (reverse ? this.applicationUser.arFullName : this.applicationUser.enFullName);
            };
            OUApplicationUser.prototype.getTranslatedApplicationUserNameByLanguage = function (language) {
                return this.applicationUser[language + 'FullName'];
            };
            /**
             * @description get translated Name by lang key
             * @param key
             * @returns {*}
             */
            OUApplicationUser.prototype.getFullNameByKey = function (key) {
                return this.applicationUser.getFullNameByKey(key);
            };
            /**
             * @description get applicationUser domainName
             */
            OUApplicationUser.prototype.getDomainName = function () {
                return this.applicationUser.domainName;
            };

            OUApplicationUser.prototype.getOrganizationTranslate = function () {
                if (this.ouInfo && this.ouInfo.id) {
                    return this.ouInfo.getTranslatedName();
                } else if (this.ouid && this.ouid.hasOwnProperty('id')) {
                    return this.ouid.getTranslatedName();
                }
                return '';
            };

            OUApplicationUser.prototype.getAppUserAndOuTranslate = function () {
                if (this.getOrganizationTranslate()) {
                    return this.getTranslatedApplicationUserName() + ' - ' + this.getOrganizationTranslate();
                }
                return this.getTranslatedApplicationUserName();
            };

            /**
             * @description Get the status of ou application user as Active or Inactive instead of true or false.
             * @returns {string}
             */
            OUApplicationUser.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /**
             * @description Get the private value of ou application user as Yes or No instead of true or false.
             * @returns {string}
             */
            OUApplicationUser.prototype.getTranslatedPrivate = function () {
                return this.isPrivate ? langService.get('yes') : langService.get('no');
            };

            /**
             * @description Get the view message to sender as Yes or No instead of true or false.
             * @returns {string}
             */
            OUApplicationUser.prototype.getTranslatedViewMessageToSender = function () {
                return this.viewProxyMessage ? langService.get('yes') : langService.get('no');
            };

            /**
             * @description Get the translated security levels as separated by comma.
             * @returns {string}
             */
            OUApplicationUser.prototype.getSecurityLevelsText = function () {
                return _.map(this.securityLevels, function (securityLevel) {
                    return securityLevel.getTranslatedName();
                }).join(', ');
            };

            /**
             * @description Get the translated archive security levels as separated by comma.
             * @returns {string}
             */
            OUApplicationUser.prototype.getArchiveSecurityLevelsText = function () {
                return _.map(this.archiveSecurityLevels, function (securityLevel) {
                    return securityLevel.getTranslatedName();
                }).join(', ');
            };

            OUApplicationUser.prototype.getOutOffOfficeTranslatedStatus = function (status) {
                return langService.get('out_of_office_toggle_button').change({status: status ? langService.get('will') : langService.get('will_not')});
            };

            OUApplicationUser.prototype.getRegistryOUID = function () {
                return this.ouRegistryID;
            };

            OUApplicationUser.prototype.getSelectedProxyId = function () {
                return this.proxyUser ? Number(this.proxyUser instanceof ProxyUser ? this.proxyUser.applicationUser.id + '' + this.proxyUser.organization.id : this.proxyUser.id + '' + this.proxyOUId) : null;
            };

            OUApplicationUser.prototype.emptyOutOfOffice = function () {
                this.proxyUser = null;
                this.proxyEndDate = null;
                this.proxyStartDate = null;
                this.proxyMessage = null;
                this.viewProxyMessage = false;
                this.proxyOUId = null;
                this.proxyAuthorityLevels = null;
                return this;
            };
            OUApplicationUser.prototype.getSecurityAsLookup = function () {
                return angular.isArray(this.securityLevels) ? this.securityLevels : generator.getSelectedCollectionFromResult(lookupService.returnLookups(lookupService.securityLevel), this.securityLevels, 'lookupKey');
            };
            OUApplicationUser.prototype.getSecurityAsNumber = function () {
                return angular.isArray(this.securityLevels) ? generator.getResultFromSelectedCollection(this.securityLevels, 'lookupKey') : this.securityLevels;
            };
            /**
             * @description to get security levels as lookup or Number
             * @param justResult
             * @returns {null}
             */
            OUApplicationUser.prototype.getSecurityLevels = function (justResult) {
                return justResult ? (angular.isArray(this.securityLevels) ? this.getSecurityAsNumber() : this.securityLevels) : this.getSecurityAsLookup();
            };

            OUApplicationUser.prototype.getManagerAndOuTranslate = function () {
                return this.ouid.getTranslatedName() + ' - ' + this.getTranslatedApplicationUserName();
            };
            OUApplicationUser.prototype.getManagerAndOuRegistryTranslate = function () {
                return this.ouRegistryID.getTranslatedName() + ' - ' + this.getTranslatedApplicationUserName();
            };
            OUApplicationUser.prototype.getMobileNumber = function () {
                return this.applicationUser.mobile;
            };
            OUApplicationUser.prototype.getEmail = function () {
                return this.applicationUser.email;
            };

            OUApplicationUser.prototype.getUserIdAndOuIdCombination = function () {
                return this.getApplicationUserId() + '-' + this.getOuId();
            };

            OUApplicationUser.prototype.getTranslatedYesNo = function (fieldName) {
                return self[fieldName] ? langService.get('yes') : langService.get('no');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('OUApplicationUser', 'init', this);
        }
    })
};
