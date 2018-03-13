module.exports = function (app) {
    app.factory('Rank', function (CMSModelInterceptor,
                                      langService) {
        'ngInject';
        return function Rank(model) {
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
                'itemOrder'
            ];
            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            Rank.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            Rank.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };
            Rank.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };
            Rank.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Rank', 'init', this);
        }
    })
};