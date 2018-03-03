module.exports = function (app) {
    app.factory('Localization', function (CMSModelInterceptor) {
        'ngInject';
        return function Localization(model) {
            var self = this, langService;
            self.arName = null;
            self.enName = null;
            self.isOverrided = null;
            self.localizationKey = null;
            self.module = null;
            self.updatedBy = null;
            self.updatedByInfo = null;
            self.updatedOn = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName',
                'module',
                'localizationKey'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            Localization.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            Localization.prototype.getLocalizationKey = function () {
                return this.localizationKey;
            };
            Localization.prototype.setLangService = function (service) {
                langService = service;
                return this;
            };
            Localization.prototype.updateLocalization = function () {
                return langService.updateGlobalLocalizationKey(this);
                // return langService.updateLocalizationKey(this);
            };
            Localization.prototype.addLocalization = function () {
                return langService.addLocalizationKey(this);
            };
            /**
             * @description save localization
             * @return {*}
             */
            Localization.prototype.saveLocalizationKey = function () {
                // return this.isOverrided ? this.updateLocalization() : this.addLocalization();
                return this.updateLocalization();
            };
            Localization.prototype.addGlobalLocalization = function () {
                return langService.addGlobalLocalizationKey(this);
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Localization', 'init', this);
        }
    })
};