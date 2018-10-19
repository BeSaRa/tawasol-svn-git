module.exports = function (app) {
    app.factory('Entity', function (CMSModelInterceptor,
                                    langService) {
        'ngInject';
        return function Entity(model) {
            var self = this;
            self.id = null;
            self.identifier = null;
            self.enName = null;
            self.arName = null;
            self.appArName = null;
            self.appEnName = null;
            // self.groupPrefix = null;
            self.status = true;
            self.helpUrl = null;
            self.cmUserName = null;
            self.cmPassword = null;
            self.cmEJBaddress = null;
            self.cmStanza = null;
            self.osName = null;
            self.peRouterName = null;
            self.cmsDatabaseName = null;
            self.cmsDataSourceName = null;
            self.smtpServerAddress = null;
            self.smtpUserName = null;
            self.smtpPassword = null;
            self.smtpFromEmail = null;
            self.smtpSubject = null;
            self.smtpPort = null;
            self.ldapProviders = [];
            // new properties for G2G
            self.g2gPrivateKey = null;
            self.g2gServerAddress = null;
            self.g2gPassword = null;
            self.g2gGECode = null;
            self.g2gUserName = null;
            //internal G2g properties
            self.internalG2gServerAddress = null;
            self.internalg2gPassword = null;
            self.internalG2gGECode = null;
            self.internalG2gUserName = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'identifier',
                'arName',
                'enName',
                'serverAddress',
                'dc',
                'userName',
                'password',
                'tawasolOU',
                'cmUserName',
                'cmPassword',
                'cmEJBaddress',
                'cmStanza',
                'osName',
                'peRouterName',
                'cmsDatabaseName',
                'cmsDataSourceName'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            Entity.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for entity. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            Entity.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for entity. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            Entity.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the status of entity as Active or Inactive instead of true or false.
             * @returns {string}
             */
            Entity.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            Entity.prototype.getNameByKey = function (langKey) {
                return this[langKey + 'Name'];
            };
            Entity.prototype.getTranslatedIsSSL = function (isSSL) {
                return isSSL ? langService.get('yes') : langService.get('no');
            };

            Entity.prototype.removeAllPasswords = function () {
                delete this.password;
                delete this.cmPassword;
                delete this.smtpPassword;
                delete this.g2gPassword;
                delete this.internalG2gPassword;
                return this;
            };

            /*/!**
             * @description Get the globalization of entity as Yes or No instead of true or false.
             * @returns {string}
             *!/
             Entity.prototype.getTranslatedGlobal = function () {
             return this.global ? langService.get('yes') : langService.get('no');
             };*/

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Entity', 'init', this);
        }
    })
};