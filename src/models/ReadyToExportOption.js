module.exports = function (app) {
    app.factory('ReadyToExportOption', function (CMSModelInterceptor,
                                                 langService,
                                                 _) {
        'ngInject';
        return function ReadyToExportOption(model) {
            var self = this;
            self.ATTACHMENTS = true;
            self.RELATED_BOOKS = true;
            self.RELATED_OBJECTS = true;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            ReadyToExportOption.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            /**
             * @description get translated true/false for ATTACHMENT
             * @returns {*}
             */
            ReadyToExportOption.prototype.getTranslatedAttachmentStatus = function () {
                return this.ATTACHMENTS ? langService.get('yes') : langService.get('no');
            };
            /**
             * @description get translated true/false for RELATED_BOOKS
             * @returns {*}
             */
            ReadyToExportOption.prototype.getTranslatedRelatedBookStatus = function () {
                return this.RELATED_BOOKS ? langService.get('yes') : langService.get('no');
            };
            /**
             * @description get translated true/false for RELATED_OBJECTS
             * @returns {*}
             */
            ReadyToExportOption.prototype.getTranslatedRelatedObjectStatus = function () {
                return this.RELATED_OBJECTS ? langService.get('yes') : langService.get('no');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ReadyToExportOption', 'init', this);
        }
    })
};