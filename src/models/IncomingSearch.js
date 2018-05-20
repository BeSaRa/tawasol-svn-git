module.exports = function (app) {
    app.factory('IncomingSearch', function (CMSModelInterceptor,
                                            langService) {
        return function IncomingSearch(model) {
            var self = this;
            self.id = null;
            self.arName = null;
            self.enName = null;
            self.status = true;
            self.global = true;


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName',
                'status',
                'global'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            IncomingSearch.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for record. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            IncomingSearch.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for record. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            IncomingSearch.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the status of record as Active or Inactive instead of true or false.
             * @returns {string}
             */
            IncomingSearch.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /**
             * @description Get the globalization of record as Yes or No instead of true or false.
             * @returns {string}
             */
            IncomingSearch.prototype.getTranslatedGlobal = function () {
                return this.global ? langService.get('yes') : langService.get('no');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('IncomingSearch', 'init', this);
        }
    })
};