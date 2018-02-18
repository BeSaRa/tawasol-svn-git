module.exports = function (app) {
    app.factory('UserSearchCriteria', function (CMSModelInterceptor) {
        'ngInject';
        return function UserSearchCriteria(model) {
            var self = this;
            self.arName = null;
            self.enName = null;
            self.ou = null;
            self.regOU = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            UserSearchCriteria.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('UserSearchCriteria', 'init', this);
        }
    })
};