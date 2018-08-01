module.exports = function (app) {
    app.factory('DocumentSecuritySetting', function (CMSModelInterceptor,
                                                     langService) {
        'ngInject';
        return function DocumentSecuritySetting(model) {
            var self = this;
            self.id = null;
            self.status = true;
            self.documentType = null;
            self.documentSecuritySettingId = null;
            self.status2D = true;
            self.textOrientation = 0;
            self.textRepetitionNo = 1;
            self.textSize = 40;
            self.securityLevel = null;
            self.secureUnSigned = false;


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            DocumentSecuritySetting.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for document security setting. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            DocumentSecuritySetting.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for document security setting. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            DocumentSecuritySetting.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the status of document security setting as Active or Inactive instead of true or false.
             * @returns {string}
             */
            DocumentSecuritySetting.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /**
             * @description Get the globalization of DocumentSecurity as Yes or No instead of true or false.
             * @returns {string}
             */
            DocumentSecuritySetting.prototype.getTranslatedYesNo = function (fieldName) {
                return this[fieldName] ? langService.get('yes') : langService.get('no');
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DocumentSecuritySetting', 'init', this);
        }
    })
};