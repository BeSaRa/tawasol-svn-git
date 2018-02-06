module.exports = function (app) {
    app.factory('EntityType', function (CMSModelInterceptor,
                                        langService) {
        'ngInject';
        return function EntityType(model) {
            var self = this;
            self.lookupKey = null;
            self.lookupStrKey = null;
            self.arName = null;
            self.enName = null;
            self.status = true;
            self.parent = null;
            self.itemOrder = 1;
            self.category = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName',
                'status',
                'itemOrder'
            ];
            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            EntityType.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            EntityType.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };
            EntityType.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };
            EntityType.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };
            EntityType.prototype.canDelete = function () {
                var defaultValues = ['EMPLOYEE', 'EXTERNAL_USER', 'COMPANY'];
                return defaultValues.indexOf(this.lookupStrKey) === -1;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('EntityType', 'init', this);
        }
    })
};