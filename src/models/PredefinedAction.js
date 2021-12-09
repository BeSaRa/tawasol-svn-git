module.exports = function (app) {
    app.factory('PredefinedAction', function (CMSModelInterceptor,
                                              langService) {
        'ngInject';
        return function PredefinedAction(model) {
            var self = this;
            self.id = null;
            self.arName = null;
            self.enName = null;
            self.status = true;
            self.userId = null;
            self.ouId = null;
            self.members = [];


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName',
                'status',
                'userId',
                'ouId'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            PredefinedAction.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for action. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            PredefinedAction.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for action. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            PredefinedAction.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the name of record with passed language name
             * @param language
             * @returns {string}
             */
            PredefinedAction.prototype.getNameByLanguage = function (language) {
                return this[language + 'Name'];
            };

            /**
             * @description Get the translated true/false as yes/no
             * @param fieldName
             * * @returns {*}
             */
            PredefinedAction.prototype.getTranslatedYesNo = function (fieldName) {
                return this[fieldName] ? langService.get('yes') : langService.get('no');
            };

            /**
             * @description Get the status of predefined action as Active or Inactive instead of true or false.
             * @returns {string}
             */
            PredefinedAction.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('PredefinedAction', 'init', this);
        }
    })
};
