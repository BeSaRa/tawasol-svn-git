module.exports = function (app) {
    app.factory('UserSpecifiedDistWF', function (CMSModelInterceptor,
                                            langService) {
        'ngInject';
        return function UserSpecifiedDistWF(model) {
            var self = this;
            self.id = null;
            self.userId = null;
            self.ouId = null;
            self.toOUID = null;
            self.withSubs = false;
            self.ouInfo = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            UserSpecifiedDistWF.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for organization. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            UserSpecifiedDistWF.prototype.getNames = function (separator) {
                return this.ouInfo.arName + ' ' + (separator ? separator : '-') + ' ' + this.ouInfo.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for organization. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            UserSpecifiedDistWF.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.ouInfo.enName : this.ouInfo.arName ) : (reverse ? this.ouInfo.arName : this.ouInfo.enName);
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('UserSpecifiedDistWF', 'init', this);
        }
    })
};
