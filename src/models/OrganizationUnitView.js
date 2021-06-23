module.exports = function (app) {
    app.factory('OrganizationUnitView', function (CMSModelInterceptor,
                                                  langService,
                                                  Indicator) {
        'ngInject';
        return function OrganizationUnitView(model) {
            var self = this,
                organizationService;

            self.id = null;
            self.arName = null;
            self.enName = null;
            self.parent = null;

            self.relationId = null;
            self.hasRegistry = false;
            self.sendEmail = false;
            self.sendSMS = false;
            self.regouId = null;
            self.isFnSynched = false;
            self.centralArchive = false;
            self.registryParentId = null;
            self.isPrivateRegistry = false;
            self.sla = null;
            self.securityLevels = null;
            self.status = false;


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);


            OrganizationUnitView.prototype.setOrganizationService = function (service) {
                organizationService = service;
            };

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            OrganizationUnitView.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for organization. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            OrganizationUnitView.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for organization. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            OrganizationUnitView.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the name of record with passed language name
             * @param language
             * @returns {string}
             */
            OrganizationUnitView.prototype.getNameByLanguage = function (language) {
                return this[language + 'Name'];
            };

            OrganizationUnitView.prototype.getTranslatedNameRegOUSection = function () {
                if (this.tempRegOUSection) {
                    return this.tempRegOUSection[langService.current + 'Name']
                }
                return this[langService.current + 'Name'];
            };

            OrganizationUnitView.prototype.getNameByLanguageRegOUSection = function (language) {
                if (this.tempRegOUSection) {
                    return this.tempRegOUSection[language + 'Name']
                }
                return this[language + 'Name'];
            };

            /**
             * @description Get the status of organization as Active or Inactive instead of true or false.
             * @returns {string}
             */
            OrganizationUnitView.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /**
             * @description Get the globalization of organization as Yes or No instead of true or false.
             * @returns {string}
             */
            OrganizationUnitView.prototype.getTranslatedGlobal = function () {
                return this.global ? langService.get('yes') : langService.get('no');
            };


            OrganizationUnitView.prototype.getParent = function () {
                return this.parent ? organizationService.getOrganizationViewById(this.parent) : null;
            };

            var indicator = new Indicator();
            OrganizationUnitView.prototype.getRegistryOuIndicator = function () {
                return this.hasRegistry ? indicator.getRegistryOuIndicator(true) : null;
            };

            OrganizationUnitView.prototype.getCentralArchiveIndicator = function () {
                return this.centralArchive ? indicator.getCentralArchiveIndicator(true) : null;
            };

            OrganizationUnitView.prototype.getPrivateRegOuIndicator = function () {
                return this.hasRegistry && this.isPrivateRegistry ? indicator.getPrivateRegOuIndicator(true) : null;
            };

            OrganizationUnitView.prototype.getNotSyncOuIndicator = function () {
                return !this.isFnSynched ? indicator.getNotSyncOuIndicator(true) : null;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('OrganizationUnitView', 'init', this);
        }
    })
};
