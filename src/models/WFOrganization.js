module.exports = function (app) {
    app.factory('WFOrganization', function (CMSModelInterceptor, langService) {
        'ngInject';
        return function WFOrganization(model) {
            var self = this;
            self.id = null;
            self.arName = null;
            self.enName = null;
            self.parent = null;

            self.relationId = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            WFOrganization.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            WFOrganization.prototype.getTranslatedName = function () {
                return this[langService.current + 'Name'];
            };
            /**
             * @description Get the name of record with passed language name
             * @param language
             * @returns {string}
             */
            WFOrganization.prototype.getNameByLanguage = function (language) {
                return this[language + 'Name'];
            };

            WFOrganization.prototype.getTranslatedNameRegOUSection = function () {
                if (this.tempRegOUSection) {
                    return this.tempRegOUSection[langService.current + 'Name']
                }
                return this[langService.current + 'Name'];
            };

            WFOrganization.prototype.getNameByLanguageRegOUSection = function (language) {
                if (this.tempRegOUSection) {
                    return this.tempRegOUSection[language + 'Name']
                }
                return this[language + 'Name'];
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('WFOrganization', 'init', this);
        }
    })
};
