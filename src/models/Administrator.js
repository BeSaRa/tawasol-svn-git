module.exports = function (app) {
    app.factory('Administrator', function (CMSModelInterceptor,
                                           _,
                                           generator,
                                           lookupService,
                                           langService) {
        'ngInject';
        return function Administrator(model) {
            var self = this;
            self.id = null;
            self.userId = null;
            self.userInfo = null;
            self.isSuperAdmin = false;
            self.adminOnRegOUID = null;
            self.adminOnRegOUInfo = null;
            self.adminOnRegOUList = [];

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            Administrator.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the translated arabic or english name according to current language for administrator. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            Administrator.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.userInfo.enName : this.userInfo.arName ) : (reverse ? this.userInfo.arName : this.userInfo.enName);
            };

            Administrator.prototype.getNames = function (separator) {
                return this.userInfo.arName + ' ' + (separator ? separator : '-') + ' ' + this.userInfo.enName;
            };

            /**
             * @description Get the name of record with passed language name
             * @param language
             * @returns {string}
             */
            Administrator.prototype.getNameByLanguage = function (language) {
                return this.userInfo[language + 'Name'];
            };

            /**
             * @description Get the localization of field as Yes or No instead of true or false
             * @param fieldName
             * @returns {string}
             */
            Administrator.prototype.getTranslatedYesNo = function (fieldName) {
                return this[fieldName] ? langService.get('yes') : langService.get('no');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Administrator', 'init', this);
        }
    });
};
