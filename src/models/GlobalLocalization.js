module.exports = function (app) {
    app.factory('GlobalLocalization', function (CMSModelInterceptor) {
        'ngInject';
        return function GlobalLocalization(model) {
            var self = this;
            self.id = null;
            self.globalLookup = null;
            self.rootEntityId = null;
            self.arName = null;
            self.enName = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            GlobalLocalization.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('GlobalLocalization', 'init', this);
        }
    })
};