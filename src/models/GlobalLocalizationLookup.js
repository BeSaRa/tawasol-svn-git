module.exports = function (app) {
    app.factory('GlobalLocalizationLookup', function (CMSModelInterceptor) {
        'ngInject';
        return function GlobalLocalizationLookup(model) {
            var self = this;
            self.id = null;
            self.category = null;
            self.lookupKey = null;
            self.lookupStrKey = null;
            self.defaultArName = null;
            self.defaultEnName = null;
            self.status = null;
            self.itemOrder = null;
            self.parent = null;
            self.globalLocalization = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            GlobalLocalizationLookup.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('GlobalLocalizationLookup', 'init', this);
        }
    })
};