module.exports = function (app) {
    app.factory('ReferencePlanItemStartSerial', function (CMSModelInterceptor) {
        'ngInject';
        return function ReferencePlanItemStartSerial(model) {
            var self = this, referencePlanNumberService;
            self.id = null;
            self.referencePlanId = null;
            self.referencePlanItemId = null;
            self.regOUID = null;
            self.startSerial = null;
            self.updatedBy = null;
            self.updatedByInfo = null;
            self.updatedOn = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            ReferencePlanItemStartSerial.prototype.setReferencePlanNumberService = function (service) {
                referencePlanNumberService = service;
            };
            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            ReferencePlanItemStartSerial.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            /**
             * @param item
             * @returns {ReferencePlanItemStartSerial}
             */
            ReferencePlanItemStartSerial.prototype.setReferencePlanItemId = function (item) {
                this.referencePlanItemId = item;
                return this;
            };

            ReferencePlanItemStartSerial.prototype.getReferencePlanItem = function () {
                try {
                    this.referencePlanItemId = referencePlanNumberService.getReferencePlanNumberById(this.referencePlanId).getReferencePlanItemById(this.referencePlanItemId);
                } catch (e) {

                }
                return this;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ReferencePlanItemStartSerial', 'init', this);
        }
    })
};