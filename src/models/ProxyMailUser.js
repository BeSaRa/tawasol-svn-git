module.exports = function (app) {
    app.factory('ProxyMailUser', function (CMSModelInterceptor,
                                           langService,
                                           _) {
        'ngInject';
        return function ProxyMailUser(model) {
            var self = this;

            self.arName = null;
            self.enName = null;
            self.proxyUser = null;
            self.proxyUserOU = null;
            self.proxyMessage = null;
            self.viewProxyMessage = null;
            self.proxyStartDate = null;
            self.proxyEndDate = null;
            self.proxyDomain = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            ProxyMailUser.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for Proxy Mail User. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            ProxyMailUser.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for Proxy Mail User. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            ProxyMailUser.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the status of Proxy Mail User as Active or Inactive instead of true or false.
             * @returns {string}
             */
            ProxyMailUser.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /*/!**
             * @description Get the globalization of Proxy Mail User as Yes or No instead of true or false.
             * @returns {string}
             *!/
             ProxyMailUser.prototype.getTranslatedGlobal = function () {
             return this.global ? langService.get('yes') : langService.get('no');
             };*/

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ProxyMailUser', 'init', this);
        }
    })
};