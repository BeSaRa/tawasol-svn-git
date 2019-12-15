module.exports = function (app) {
    app.factory('Lookup', function (CMSModelInterceptor, generator) {
        'ngInject';
        return function Lookup(model) {
            var self = this, langService;
            self.id = null;
            self.category = null;
            self.lookupKey = null;
            self.lookupStrKey = null;
            self.defaultArName = null;
            self.defaultEnName = null;
            self.status = null;
            self.itemOrder = null;
            self.parent = null;

            if (model)
                angular.extend(this, model);

            Lookup.prototype.setLangService = function (lang) {
                langService = lang;
            };

            Lookup.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.defaultEnName : this.defaultArName) : (reverse ? this.defaultArName : this.defaultEnName);
            };
            /**
             * @description to check if current keys equals or not.
             * @param lookup
             * @param key
             * @return {boolean}
             */
            Lookup.prototype.isCurrentBy = function (lookup, key) {
                return lookup[key] === this[key];
            };
            /**
             * @description to check by lookupStrKey
             * @param lookup
             * @return {boolean}
             */
            Lookup.prototype.currentStringKey = function (lookup) {
                return this.isCurrentBy(lookup, 'lookupStrKey');
            };
            /**
             * @description to check by id
             * @param lookup
             * @return {boolean}
             */
            Lookup.prototype.currentId = function (lookup) {
                return this.isCurrentBy(lookup, 'id');
            };
            /**
             * @description to get StringKeyValue.
             * @return {null}
             */
            Lookup.prototype.getStringKeyValue = function () {
                return this.lookupStrKey;
            };
            /**
             * @description check if the lookupStrKey
             */
            Lookup.prototype.hasValueOrSpace = function () {
                //console.log('this.lookupStrKey.length', this.lookupStrKey.length);
                return this.lookupStrKey.length;
            };
            /**
             * @description Get the name of record with passed language name
             * @param language
             * @returns {string}
             */
            Lookup.prototype.getNameByLanguage = function (language) {
                return this['default' + generator.ucFirst(language) + 'Name'];
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Lookup', 'init', this);
        }
    })
};