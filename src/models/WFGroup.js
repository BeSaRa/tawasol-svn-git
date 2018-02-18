module.exports = function (app) {
    app.factory('WFGroup', function (CMSModelInterceptor) {
        'ngInject';
        return function WFGroup(model) {
            var self = this;
            self.arName = null;
            self.enName = null;
            self.status = true;
            self.global = true;
            self.groupMembers = [];
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            WFGroup.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('WFGroup', 'init', this);
        }
    })
};