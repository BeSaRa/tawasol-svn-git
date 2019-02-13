module.exports = function (app) {
    app.factory('UserWorkflowGroup', function (CMSModelInterceptor,
                                               langService,
                                               _) {
        'ngInject';
        return function UserWorkflowGroup(model) {
            var self = this;
            self.id = null;
            self.applicationUser = {};
            self.wfgroup = {};


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            UserWorkflowGroup.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for User Workflow Group. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            UserWorkflowGroup.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for UserWorkflowGroup. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            UserWorkflowGroup.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the name of record with passed language name
             * @param language
             * @returns {string}
             */
            UserWorkflowGroup.prototype.getNameByLanguage = function (language) {
                return this[language + 'Name'];
            };

            /**
             * @description Get the status of UserWorkflowGroup as Active or Inactive instead of true or false.
             * @returns {string}
             */
            UserWorkflowGroup.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('UserWorkflowGroup', 'init', this);
        }
    })
};