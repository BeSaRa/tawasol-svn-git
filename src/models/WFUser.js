module.exports = function (app) {
    app.factory('WFUser', function (CMSModelInterceptor,
                                    langService,
                                    employeeService) {
        'ngInject';
        return function WFUser(model) {
            var self = this;
            self.id = null;
            self.ouId = null;
            self.arName = null;
            self.domainName = null;
            self.enName = null;
            self.ouArName = null;
            self.ouEnName = null;
            self.parent = null;
            self.parentId = null;
            self.proxyInfo = null;
            self.isSecureAction = false;
            self.registeryOu = null;
            self.sendRelatedDocs = false;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            WFUser.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            /**
             * @description get translated name of the WFUser
             * @param reverse
             * @returns {null}
             */
            WFUser.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };

            WFUser.prototype.getTranslatedOrganizationName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.ouEnName : this.ouArName) : (reverse ? this.ouArName : this.ouEnName);
            };

            WFUser.prototype.getTranslatedNameAndOU = function (reverse) {
                return this.getTranslatedName(reverse) + " - " + this.getTranslatedOrganizationName(reverse);
            };

            WFUser.prototype.getNameByLanguage = function (language) {
                return this.getTranslatedNameAndOU();
            };

            WFUser.prototype.isSendRelatedDocsAllowed = function () {
                return this.regouId && this.regouId === employeeService.getEmployee().getRegistryOUID();
            }
            WFUser.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            }
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('WFUser', 'init', this);
        }
    })
};
