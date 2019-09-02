module.exports = function (app) {
    app.factory('LDAPProvider', function (langService) {
        'ngInject';
        return function LDAPProvider(model) {
            var self = this;
            self.id = null;
            self.serverAddress = null;
            self.dc = null;
            self.serverName = null;
            self.tawasolOU = null;
            self.userName = null;
            self.password = null;
            self.isSSL = null;
            self.isDefault = null;
            self.ldapCode = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'serverAddress',
                'dc',
                'serverName',
                'tawasolOU',
                'userName',
                'password',
                //'ldapCode'
            ];
            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            LDAPProvider.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated server address and server name with separator passed for ldap provider. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            LDAPProvider.prototype.getNames = function (separator) {
                return this.serverAddress + ' ' + (separator ? separator : '-') + ' ' + this.serverName;
            };

            LDAPProvider.prototype.getTranslatedYesNo = function (fieldName) {
                return this[fieldName] ? langService.get('yes') : langService.get('no');
            };
        }
    });
};
