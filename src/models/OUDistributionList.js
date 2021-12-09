module.exports = function (app) {
    app.factory('OUDistributionList', function (CMSModelInterceptor) {
        'ngInject';
        return function OUDistributionList(model) {
            var self = this;
            self.ouid = null;
            self.distributionList = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'distributionList',
                'ouid'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            OUDistributionList.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            OUDistributionList.prototype.setOuId = function (organization) {
                this.ouid = organization;
                return this;
            };

            OUDistributionList.prototype.setDistributionList = function (distributionList) {
                this.distributionList = distributionList;
                return this;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('OUDistributionList', 'init', this);
        }
    })
};