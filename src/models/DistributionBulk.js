module.exports = function (app) {
    app.factory('DistributionBulk', function (CMSModelInterceptor, _, DistributionBulkItem) {
        'ngInject';
        return function DistributionBulk(model) {
            var self = this, documentClassMap = {
                outgoing: 0,
                incoming: 1,
                internal: 2
            };
            self.items = null;
            self.distWF = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            DistributionBulk.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            DistributionBulk.prototype.setDistWF = function (distWF) {
                this.distWF = distWF;
                return this;
            };
            DistributionBulk.prototype.setDistributionBulk = function (correspondences, distWF) {
                return this
                    .setDistWF(distWF)
                    .setItems(correspondences);
            };

            DistributionBulk.prototype.setItems = function (correspondences) {
                this.items = _.map(correspondences, function (item) {
                    var info = item.getInfo();
                    return {
                        wobNum: info.wobNumber,
                        vsid: info.vsId,
                        docClassId: documentClassMap[info.documentClass.toLowerCase()]
                    }
                });
                return this;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DistributionBulk', 'init', this);
        }
    })
};