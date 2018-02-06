module.exports = function (app) {
    app.factory('UserOuPermission', function (CMSModelInterceptor,
                                            langService) {
        'ngInject';
        return function UserOuPermission(model) {
            var self = this;
            self.id = null;
            self.userId = null;
            self.ouId = null;
            self.customRoleId = true;
            self.permissionId = true;
            self.permission = null;


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [

            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            UserOuPermission.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for user ou permission. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            UserOuPermission.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for user ou permission. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            UserOuPermission.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the status of user ou permission as Active or Inactive instead of true or false.
             * @returns {string}
             */
            UserOuPermission.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /**
             * @description Get the globalization of user ou permission as Yes or No instead of true or false.
             * @returns {string}
             */
            UserOuPermission.prototype.getTranslatedGlobal = function () {
                return this.global ? langService.get('yes') : langService.get('no');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('UserOuPermission', 'init', this);
        }
    })
};