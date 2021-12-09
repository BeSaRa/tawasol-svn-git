module.exports = function (app) {
    app.factory('TawasolDocument', function (CMSModelInterceptor,
                                             langService) {
        'ngInject';
        return function TawasolDocument(model) {
            var self = this;
            self.id = null;
            self.docSubject = null;
            self.documentTitle = null;
            self.isMigrated = null;
            self.creatorId = null;
            self.lastModifierId = null;
            self.oldCmsVsid = null;
            self.createdBy = null;
            self.createdOn = null;
            self.lastModified = null;
            self.lastModifier = null;
            self.mimeType = null;
            self.contentSize = null;
            self.minorVersionNumber = null;
            self.majorVersionNumber = null;
            self.vsId = null;
            self.versionStatus = null;
            self.isCurrent = null;
            self.classDescription = null;


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            TawasolDocument.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated document subject and document title with separator passed for record. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            TawasolDocument.prototype.getSubjectTitle = function (separator) {
                return this.docSubject + ' ' + (separator ? separator : '-') + ' ' + this.documentTitle;
            };

            /**
             * @description Get the translated arabic or english name according to current language
             */
            TawasolDocument.prototype.getTranslatedName = function () {
                return this.docSubject;
            };

            /**
             * @description Get the concatenated arabic name and english name
             */
            TawasolDocument.prototype.getNames = function () {
                return this.docSubject;
            };

            TawasolDocument.prototype.getTranslatedYesNo = function (fieldName) {
                return this[fieldName] ? langService.get('yes') : langService.get('no');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('TawasolDocument', 'init', this);
        }
    })
};
