module.exports = function (app) {
    app.factory('DocumentTemplate', function (CMSModelInterceptor,
                                              langService) {
        'ngInject';
        return function DocumentTemplate(model) {
            var self = this;
            self.id = null;
            self.docSubject = null;
            self.documentTitle = null;
            self.docType = null;
            self.registryOU = null;
            self.ou = null;
            self.templateType = null;
            self.signaturesCount = null;
            self.isGlobal = false;
            self.status = true;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'docSubject',
                'documentTitle',
                // 'docType',
                'signaturesCount',
                // 'templateType',
                'isGlobal'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            DocumentTemplate.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated document subject and document title with separator passed for document template. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            DocumentTemplate.prototype.getSubjectTitle = function (separator) {
                return this.docSubject + ' ' + (separator ? separator : '-') + ' ' + this.documentTitle;
            };

            /**
             * @description Get the translated arabic or english name according to current language for document template. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            /*DocumentTemplate.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };*/

            /**
             * @description Get the status of document template as Active or Inactive instead of true or false.
             * @returns {string}
             */
            DocumentTemplate.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /**
             * @description Get the globalization of document template as Yes or No instead of true or false.
             * @returns {string}
             */
            DocumentTemplate.prototype.getTranslatedGlobal = function () {
                return this.isGlobal ? langService.get('yes') : langService.get('no');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DocumentTemplate', 'init', this);
        }
    })
};
