module.exports = function (app) {
    app.factory('WFUser', function (CMSModelInterceptor) {
        'ngInject';
        return function WFUser(model) {
            var self = this;
            self.id = null;
            self.ouId = null;
            self.arName = null;
            self.domainName = null;
            self.enName = null;
            self.ouArName = null;
            self.ouEnName = null;
            self.parent = null;
            self.parentId = null;
            self.proxyInfo = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            WFUser.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('WFUser', 'init', this);
        }
    })
};