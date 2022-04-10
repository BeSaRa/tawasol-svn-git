module.exports = function (app) {
    app.factory('CustomLevelGroup', function (CMSModelInterceptor,
                                              langService,
                                              _) {
        'ngInject';
        return function CustomLevelGroup(model) {
            var self = this;
            self.id = null;
            self.arName = null;
            self.enName = null;
            self.status = true;
            self.levels = [];

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName',
                'levels'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            CustomLevelGroup.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for custom level group. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            CustomLevelGroup.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for custom level group. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            CustomLevelGroup.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the status of custom level group as Active or Inactive instead of true or false.
             * @returns {string}
             */
            CustomLevelGroup.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('CustomLevelGroup', 'init', this);
        }
    })
};
