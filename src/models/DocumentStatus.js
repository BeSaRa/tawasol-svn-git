module.exports = function (app) {
    app.factory('DocumentStatus', function (CMSModelInterceptor, 
                                            langService, 
                                            _) {
        'ngInject';
        return function DocumentStatus(model) {
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
                'status',
                'itemOrder'
            ];
            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            DocumentStatus.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            DocumentStatus.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };
            DocumentStatus.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };
            DocumentStatus.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };
            DocumentStatus.prototype.getDocumentClass = function () {
                return _.map(_.map(this.lookupStrKey , 'lookupStrKey'),function (documentClass) {
                    return langService.get(documentClass.toLowerCase());
                }).join(', ');
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DocumentStatus', 'init', this);
        }
    })
};
