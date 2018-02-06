module.exports = function (app) {
    app.factory('AttachmentType', function (CMSModelInterceptor, 
                                            langService, 
                                            _) {
        'ngInject';
        return function AttachmentType(model) {
            var self = this;
            self.id = null;
            self.category = null;
            self.lookupKey = null;
            self.lookupStrKey = null;
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
            AttachmentType.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for attachment type. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            AttachmentType.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for attachment type. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            AttachmentType.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the status of attachment type as Active or Inactive instead of true or false.
             * @returns {string}
             */
            AttachmentType.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /**
             * @description Get the concatenated attachment type as separated by comma.
             * @returns {string}
             */
            AttachmentType.prototype.getDocumentClass = function () {
                return _.map(_.map(this.lookupStrKey, 'lookupStrKey'), function (documentClass) {
                    return langService.get(documentClass.toLowerCase());
                }).join(' , ');
            };
            /**
             * @description to check if current keys equals or not.
             * @param lookup
             * @param key
             * @return {boolean}
             */
            AttachmentType.prototype.isCurrentBy = function (lookup, key) {
                return lookup[key] === this[key];
            };
            /**
             * @description to check by lookupStrKey
             * @param lookup
             * @return {boolean}
             */
            AttachmentType.prototype.currentStringKey = function (lookup) {
                return this.isCurrentBy(lookup, 'lookupStrKey');
            };
            /**
             * @description to check by id
             * @param lookup
             * @return {boolean}
             */
            AttachmentType.prototype.currentId = function (lookup) {
                return this.isCurrentBy(lookup, 'id');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('AttachmentType', 'init', this);
        }
    })
};