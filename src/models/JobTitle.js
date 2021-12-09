module.exports = function (app) {
    app.factory('JobTitle', function (CMSModelInterceptor,
                                      langService) {
        'ngInject';
        return function JobTitle(model) {
            var self = this;
            self.lookupKey = null;
            self.lookupStrKey = null;
            self.arName = null;
            self.enName = null;
            self.status = true;
            self.parent = null;
            self.itemOrder = 1;
            self.category=null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName',
                'status',
                'itemOrder',
                'lookupStrKey'
            ];
            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            JobTitle.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            JobTitle.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };
            JobTitle.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };
            JobTitle.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };
            /**
             * @description Get the name of record with passed language name
             * @param language
             * @returns {string}
             */
            JobTitle.prototype.getNameByLanguage = function (language) {
                return this[language + 'Name'];
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('JobTitle', 'init', this);
        }
    })
};
