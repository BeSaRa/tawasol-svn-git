module.exports = function (app) {
    app.factory('SearchCorrespondenceSite', function (CMSModelInterceptor,
                                                      langService,
                                                      _) {
        'ngInject';
        return function SearchCorrespondenceSite(model) {
            var self = this;
            self.id = null;
            self.exactId = null;
            self.parent = null;
            self.isGlobal = null;
            self.arName = null;
            self.enName = null;
            self.status = null;
            self.arDisplayName = null;
            self.enDisplayName = null;
            self.sourceType = null;
            self.ouId = null;
            self.code = null;
            self.correspondenceSiteTypeId = null;
            self.parentInfo = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            SearchCorrespondenceSite.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for Correspondence Site. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            SearchCorrespondenceSite.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for Correspondence Site. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            SearchCorrespondenceSite.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the status of Correspondence Site as Active or Inactive instead of true or false.
             * @returns {string}
             */
            SearchCorrespondenceSite.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('SearchCorrespondenceSite', 'init', this);
        }
    })
};