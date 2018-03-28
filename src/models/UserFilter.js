module.exports = function (app) {
    app.factory('UserFilter', function (CMSModelInterceptor) {
        'ngInject';
        return function UserFilter(model) {
            var self = this;
            self.isDefault = null;
            self.userId = null;
            self.ouId = null;
            self.expression = null;
            self.parsedExpression = null;
            self.arName = null;
            self.enName = null;
            self.sortOptionId = null;
            self.isDefault = null;
            self.status = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            UserFilter.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('UserFilter', 'init', this);
        }
    })
};