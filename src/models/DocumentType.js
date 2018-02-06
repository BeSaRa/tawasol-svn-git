module.exports = function (app) {
    app.factory('DocumentType', function (CMSModelInterceptor,
                                          langService,
                                          _) {
        'ngInject';
        return function DocumentType(model) {
            var self = this;
            self.id = null;
            self.category = null;
            self.lookupKey = null;
            self.lookupStrKey = null; // 1,2,4
            self.arName = null;
            self.enName = null;
            self.status = true;
            self.parent = null;
            self.itemOrder = 1;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName',
                'lookupStrKey',
                'status',
                'itemOrder'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            DocumentType.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for document type. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            DocumentType.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for document type. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            DocumentType.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the status of document type as Active or Inactive instead of true or false.
             * @returns {string}
             */
            DocumentType.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /**
             * @description Get the concatenated document type as separated by comma.
             * @returns {string}
             */
            DocumentType.prototype.getDocumentClass = function () {
                return _.map(_.map(this.lookupStrKey, 'lookupStrKey'), function (documentClass) {
                    return langService.get(documentClass.toLowerCase());
                }).join(' , ');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DocumentType', 'init', this);
        }
    })
};