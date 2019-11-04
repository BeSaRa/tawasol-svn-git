module.exports = function (app) {
    app.factory('SelectedDownload', function (CMSModelInterceptor) {
        'ngInject';
        return function SelectedDownload(model) {
            var self = this;
            self.BOOK = true;
            self.ATTACHMENTS = [];
            self.RELATED_BOOKS = [];


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            SelectedDownload.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('SelectedDownload', 'init', this);
        }
    })
};