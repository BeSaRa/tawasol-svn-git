module.exports = function (app) {
    app.factory('FileIcon', function (CMSModelInterceptor) {
        'ngInject';
        return function FileIcon(model) {
            var self = this;
            self.icon = null;
            self.extensions = [];
            self.mimeTypes = [];
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            FileIcon.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            /**
             * to check the extension for file
             * @param extensionWithType
             */
            FileIcon.prototype.checkExtension = function (extensionWithType) {
                _.map(extensionWithType, function (value, key) {
                    extensionWithType[key] = value.toLowerCase().trim();
                });
                var type = _.find(this.mimeTypes, function (mimeType) {
                    return mimeType.toLowerCase().trim() === extensionWithType.type;
                });
                var ext = _.find(this.extensions, function (extension) {
                    return extension.toLowerCase().trim() === extensionWithType.ext
                });
                return !!(type || ext);
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('FileIcon', 'init', this);
        }
    })
};