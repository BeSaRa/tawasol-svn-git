module.exports = function (app) {
    app.factory('ProxyUser', function (CMSModelInterceptor, generator) {
        'ngInject';
        return function ProxyUser(model) {
            var self = this;
            self.id = null;
            self.applicationUser = null;
            self.organization = null;
            self.securityLevels = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            ProxyUser.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            ProxyUser.prototype.mapFromOUApplicationUser = function (ouApplicationUser) {
                return this.setApplicationUser(ouApplicationUser.applicationUser)
                    .setOrganization(ouApplicationUser.ouInfo)
                    .setSecurityLevels(ouApplicationUser.securityLevels)
                    .setId(ouApplicationUser);
            };

            ProxyUser.prototype.getOuId = function (ouApplicationUser) {
                if (ouApplicationUser.hasOwnProperty('ouInfo') && ouApplicationUser.ouInfo && ouApplicationUser.ouInfo.id) {
                    return ouApplicationUser.ouInfo.id;
                } else if (ouApplicationUser.ouid) {
                    return ouApplicationUser.ouid.hasOwnProperty('id') ? ouApplicationUser.ouid.id : ouApplicationUser.ouid;
                }
                return null;
            };
            ProxyUser.prototype.setId = function (ouApplicationUser) {
                this.id = Number(ouApplicationUser.applicationUser.id + '' + this.getOuId(ouApplicationUser));
                return this;
            };
            ProxyUser.prototype.setApplicationUser = function (applicationUser) {
                this.applicationUser = applicationUser;
                return this;
            };
            ProxyUser.prototype.setOrganization = function (organization) {
                this.organization = organization;
                return this;
            };
            ProxyUser.prototype.setSecurityLevels = function (securityLevels) {
                this.securityLevels = angular.isArray(securityLevels) ? generator.getResultFromSelectedCollection(securityLevels, 'lookupKey') : securityLevels;
                return this;
            };

            ProxyUser.prototype.getTranslatedName = function () {
                return this.applicationUser.getTranslatedName() + ' - ' + this.organization.getTranslatedName();
            };

            ProxyUser.prototype.getTranslatedApplicationUserName = function () {
                return this.applicationUser.getTranslatedName();
            }
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ProxyUser', 'init', this);
        }
    })
};
