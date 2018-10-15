module.exports = function (app) {
    app.factory('LookupG2G', function (CMSModelInterceptor,
                                            langService) {
        'ngInject';
        return function LookupG2G(model) {
            var self = this;
            self.id = null;
            self.category = null;
            self.lkey = null;
            self.arvalue = null;
            self.envalue = null;
            self.parent = null;


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            LookupG2G.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for record. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            LookupG2G.prototype.getNames = function (separator) {
                return this.arvalue + ' ' + (separator ? separator : '-') + ' ' + this.envalue;
            };

            /**
             * @description Get the translated arabic or english name according to current language for record. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            LookupG2G.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.envalue : this.arvalue ) : (reverse ? this.arvalue : this.envalue);
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('LookupG2G', 'init', this);
        }
    })
};