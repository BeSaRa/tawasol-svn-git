module.exports = function (app) {
    app.factory('DuplicateOption', function (CMSModelInterceptor, ReadyToExportOption) {
        'ngInject';
        return function DuplicateOption(model) {
            var self = this, keys = ['RELATED_BOOKS', 'RELATED_OBJECTS', 'ATTACHMENTS', 'TAGS', 'CORRESPONDENCE_SITES'];
            ReadyToExportOption.call(this);
            self.CORRESPONDENCE_SITES = true;
            self.TAGS = true;
            self.MAILING_ROOM = false;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            DuplicateOption.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            DuplicateOption.prototype.getDuplicateKeys = function () {
                return keys;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DuplicateOption', 'init', this);
        }
    })
};