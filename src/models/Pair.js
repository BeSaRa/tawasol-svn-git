module.exports = function (app) {
    app.factory('Pair', function (CMSModelInterceptor) {
        'ngInject';
        return function Pair(model) {
            var self = this;
            self.first = null;
            self.second = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            Pair.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Pair', 'init', this);
        }
    })
};