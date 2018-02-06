module.exports = function (app) {
    app.factory('ApplicationUserInfo', function (CMSModelInterceptor, langService) {
        'ngInject';
        return function ApplicationUserInfo(model) {
            var self = this;
            self.id = null;
            self.domainName = null;
            self.arName = null;
            self.enName = null;
            self.ouArName = null;
            self.ouEnName = null;
            self.ouId = null;
            self.parent = null;
            self.parentId = null;
            self.proxyInfo = null;
            self.relationId = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            ApplicationUserInfo.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            ApplicationUserInfo.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };
            ApplicationUserInfo.prototype.getTranslatedOUName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.ouEnName : this.ouArName ) : (reverse ? this.ouArName : this.ouEnName);
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ApplicationUserInfo', 'init', this);
        }
    })
};