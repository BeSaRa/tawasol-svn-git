module.exports = function (app) {
    app.factory('ApplicationUserSignature', function (CMSModelInterceptor,
                                                      langService) {
        'ngInject';
        return function ApplicationUserSignature(model) {
            var self = this;

            self.documentTitle = null;
            self.docSubject = null;
            self.appUserId = null;
            self.id = null;
            self.vsId = null;


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'docSubject',
                'documentTitle'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            ApplicationUserSignature.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for entity name. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            ApplicationUserSignature.prototype.getNames = function (separator) {
                // return this.subject + ' ' + (separator ? separator : '-') + ' ' + this.subject;
                return this.docSubject;
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ApplicationUserSignature', 'init', this);
        }
    })
};