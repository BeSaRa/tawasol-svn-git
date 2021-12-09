module.exports = function (app) {
    app.factory('OrganizationType', function (CMSModelInterceptor,
                                              langService) {
        'ngInject';
        return function OrganizationType(model) {
            var self = this;
            self.id = null;
            self.category = null;
            self.lookupKey = null;
            self.lookupStrKey = null;
            self.arName = null;
            self.enName = null;
            self.status = true; // default status active
            self.parent = null;
            self.itemOrder = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'status',
                'itemOrder',
                'arName',
                'enName'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            OrganizationType.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for organization type. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            OrganizationType.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for organization type. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            OrganizationType.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the status of organization type as Active or Inactive instead of true or false.
             * @returns {string}
             */
            OrganizationType.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('OrganizationType', 'init', this);
        }
    })
};