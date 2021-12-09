module.exports = function (app) {
    app.factory('Role', function (CMSModelInterceptor, 
                                  langService, 
                                  _) {
        'ngInject';
        return function Role(model) {
            var self = this;
            self.updatedBy = null;
            self.updatedOn = null;

            self.id = null;
            self.arName = null;
            self.enName = null;
            self.description = null;
            self.status = true;
            self.clientData = null;
            self.customRolePermission = [];
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            Role.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for role. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            Role.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for role. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            Role.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the id concatenated with name of record with passed language name
             * @param language
             * @returns {string}
             */
            Role.prototype.getNameByLanguage = function (language) {
                return this[language + 'Name'];
            };

            Role.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            Role.prototype.getTranslatedPermissionName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.customRolePermission[0].enName : this.customRolePermission[0].arName) : (reverse ? this.customRolePermission[0].arName : this.customRolePermission[0].enName);
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Role', 'init', this);
        }
    })
};
