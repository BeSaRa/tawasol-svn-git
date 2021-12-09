module.exports = function (app) {
    app.factory('DistributionBulkItem', function (CMSModelInterceptor) {
        'ngInject';
        return function DistributionBulkItem(model) {
            var self = this;
            self.wobNum = null;
            self.vsid = null;
            self.docClassId = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            DistributionBulkItem.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DistributionBulkItem', 'init', this);
        }
    })
};