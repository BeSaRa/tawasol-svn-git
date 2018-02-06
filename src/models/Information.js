module.exports = function (app) {
    app.factory('Information', function (CMSModelInterceptor, langService) {
        'ngInject';
        return function Information(model) {
            var self = this;
            self.id = null;
            self.arName = null;
            self.enName = null;
            self.parent = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            Information.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the translated arabic or english name according to current language for entity name. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            Information.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Information', 'init', this);
        }
    })
};