module.exports = function (app) {
    app.factory('OUApplicationUser', function (CMSModelInterceptor) {
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
            self.sendToAllEntityUsers = false;
            self.sendToAllRegistryOUUsers = false;
            self.sendToAllParentOUUsers = false;
            self.privateUsers = null;
            self.managers = null;
            self.proxyUser = null;
            self.proxyStartDate = null;
            self.proxyEndDate = null;
            self.proxyAuthorityLevels = null;
            self.viewProxyMessage = false;
            self.proxyMessage = null;
            self.permissionList = null;
            self.ouViewPermissionList = null;

            self.wfsecurity = null;

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

            /**
             * @description Get the translated arabic or english name according to current language for application user. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            OUApplicationUser.prototype.getTranslatedApplicationUserName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.applicationUser.enFullName : this.applicationUser.arFullName ) : (reverse ? this.applicationUser.arFullName : this.applicationUser.enFullName );
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

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('OUApplicationUser', 'init', this);
        }
    })
};