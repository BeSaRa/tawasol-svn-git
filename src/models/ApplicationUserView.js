module.exports = function (app) {
    app.factory('ApplicationUserView', function (CMSModelInterceptor,
                                                 langService) {
        'ngInject';
        return function ApplicationUserView(model) {
            var self = this;
            self.id = null;
            self.arFullName = null;
            self.enFullName = null;
            self.employeeNo = null;
            self.qid = null;
            self.domainName = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            ApplicationUserView.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for entity name. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            ApplicationUserView.prototype.getNames = function (separator) {
                return this.arFullName + ' ' + (separator ? separator : '-') + ' ' + this.enFullName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for entity name. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            ApplicationUserView.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enFullName : this.arFullName) : (reverse ? this.arFullName : this.enFullName);
            };

            /**
             * @description Get the name of record with passed language name
             * @param language
             * @returns {string}
             */
            ApplicationUserView.prototype.getNameByLanguage = function (language) {
                return this[language + 'FullName'];
            };

            /**
             * @description Get the translated true/false as yes/no
             * @param fieldName
             * * @returns {*}
             */
            ApplicationUserView.prototype.getTranslatedYesNo = function (fieldName) {
                return this[fieldName] ? langService.get('yes') : langService.get('no');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ApplicationUserView', 'init', this);
        }
    })
};
