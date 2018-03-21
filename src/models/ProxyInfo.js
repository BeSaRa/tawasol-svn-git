module.exports = function (app) {
    app.factory('ProxyInfo', function (CMSModelInterceptor, moment, langService) {
        'ngInject';
        return function ProxyInfo(model) {
            var self = this;
            self.arName = null;
            self.enName = null;
            self.outOfOffice = null;
            self.proxyDomain = null;
            self.proxyEndDate = null;
            self.proxyMessage = null;
            self.proxyStartDate = null;
            self.proxyUser = null;
            self.proxyUserOU = null;
            self.proxyUserOUInfo = null;
            self.securityLevels = null;
            self.viewProxyMessage = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            ProxyInfo.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            /**
             * @description Get the translated true/false as active/inactive or yes/no
             * @param fieldName
             * * @returns {*}
             */
            ProxyInfo.prototype.getTranslatedYesNo = function (fieldName) {
                return this[fieldName] ? langService.get('yes') : langService.get('no');
            };
            ProxyInfo.prototype.getFullName = function (separator) {
                return this.arName + (separator ? separator : '-') + this.enName;
            };
            ProxyInfo.prototype.getFullNameByKey = function (langKey) {
                return this[langKey + 'Name'];
            };
            ProxyInfo.prototype.getProxyStartDate = function () {
                return moment(this.proxyStartDate).format('YYYY-MM-DD');
            };
            ProxyInfo.prototype.getProxyEndDate = function () {
                return moment(this.proxyEndDate).format('YYYY-MM-DD');
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ProxyInfo', 'init', this);
        }
    })
};