module.exports = function (app) {
    app.factory('DocumentFileType', function (CMSModelInterceptor, langService) {
        'ngInject';
        return function DocumentFileType(model) {
            var self = this;
            self.id = null;
            self.extension = null;
            self.description = null;
            self.mimeType = null;
            self.arName = null;
            self.enName = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            DocumentFileType.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            DocumentFileType.prototype.getExtension = function () {
                return this.extension;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DocumentFileType', 'init', this);
        }
    })
};