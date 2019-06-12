module.exports = function (app) {
    app.factory('ViewerLog', function (CMSModelInterceptor) {
        'ngInject';
        return function ViewerLog(model) {
            var self = this;
            self.id = null;
            self.key = null;
            self.documentType = null;
            self.itemType = null;
            self.vsId = null;
            self.userInfo = null;
            self.itemTypeInfo = null;
            self.documentTypeInfo = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            ViewerLog.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ViewerLog', 'init', this);
        }
    })
};
