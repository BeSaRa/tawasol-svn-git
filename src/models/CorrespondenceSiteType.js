module.exports = function (app) {
    app.factory('CorrespondenceSiteType', function (CMSModelInterceptor,
                                                    langService,
                                                    _) {
        'ngInject';
        return function CorrespondenceSiteType(model) {
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
                'enName'
                /*'status',
                'itemOrder'*/
            ];
            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            CorrespondenceSiteType.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            CorrespondenceSiteType.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };
            CorrespondenceSiteType.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };
            /**
             * @description Get the name of record with passed language name
             * @param language
             * @returns {string}
             */
            CorrespondenceSiteType.prototype.getNameByLanguage = function (language) {
                return this[language + 'Name'];
            };
            CorrespondenceSiteType.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            CorrespondenceSiteType.prototype.canDelete = function () {
                var defaultValues = [1, 3, 5]; // 1 - internal, 3 - g2g, 5 - old system, 2 - external
                return defaultValues.indexOf(this.lookupKey) === -1;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('CorrespondenceSiteType', 'init', this);
        }
    })
};
