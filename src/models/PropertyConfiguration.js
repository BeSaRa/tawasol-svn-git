module.exports = function (app) {
    app.factory('PropertyConfiguration', function (CMSModelInterceptor,
                                                   langService,
                                                   _) {
        'ngInject';
        return function PropertyConfiguration(model) {
            var self = this;
            self.id = null;
            self.ouId = null;
            self.dataType = null;
            self.isSequence = false;
            self.isList = false;
            self.isMandatory = false;
            self.spName = null;
            self.defaultValue = null;
            self.spParameters = null;
            self.symbolicName = null;
            self.defaultOperator = null;
            self.documentClass = null;
            self.status = false;


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'dataType',
                'spName',
                'defaultValue',
                'spParameters',
                'symbolicName',
                'defaultOperator',
                'documentClass'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            PropertyConfiguration.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for Property Configuration. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            PropertyConfiguration.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for Property Configuration. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            PropertyConfiguration.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the status of Property Configuration as Active or Inactive instead of true or false.
             * @returns {string}
             */
            PropertyConfiguration.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('PropertyConfiguration', 'init', this);
        }
    })
};