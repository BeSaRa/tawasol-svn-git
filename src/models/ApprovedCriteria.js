module.exports = function (app) {
    app.factory('ApprovedCriteria', function (CMSModelInterceptor) {
        'ngInject';
        return function ApprovedCriteria(model) {
            var self = this;
            self.userId = null;
            self.userOuId = null;
            self.approveDate = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            ApprovedCriteria.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ApprovedCriteria', 'init', this);
        }
    })
};