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

            /**
             * @description Get the arabic or english name according to language passed for entity name.
             * @param lang
             * @returns {string}
             */
            Information.prototype.getTranslatedNameByLang = function (lang) {
                if (typeof this.arName === 'undefined' || this.arName === null)
                    this.arName = '';
                if (typeof this.enName === 'undefined' || this.enName === null)
                    this.enName = '';
                return lang === 'ar' ? this.arName : this.enName;
            };

            /**
             * @description Get the name of record with passed language name
             * @param language
             * @returns {string}
             */
            Information.prototype.getNameByLanguage = function (language) {
                return this[language + 'Name'] || '';
            };

            Information.prototype.getId = function (id) {
                return this.id;
            };
            Information.prototype.setId = function (id) {
                this.id = id;
                return this;
            };
            Information.prototype.setArName = function (arName) {
                this.arName = arName;
                return this;
            };
            Information.prototype.setEnName = function (enName) {
                this.enName = enName;
                return this;
            };
            Information.prototype.setParent = function (parent) {
                this.parent = parent;
                return this;
            };

            Information.prototype.fillInfoFromOU = function (organization) {
                this.setParent(organization.parent)
                    .setArName(organization.arName)
                    .setEnName(organization.enName)
                    .setId(organization.id);
                return this;
            };

            Information.prototype.isEmpty = function () {
                return !(!!this.enName && !!this.arName);
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Information', 'init', this);
        }
    })
};
