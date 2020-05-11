module.exports = function (app) {
    app.factory('AppUserCertificate', function (CMSModelInterceptor,
                                                langService) {
        'ngInject';
        return function AppUserCertificate(model) {
            var self = this;

            self.documentTitle = null;
            self.docSubject = null;
            self.appUserId = null;
            self.id = null;
            self.vsId = null;
            self.pinCode = null;
            self.docClassName = 'AppUserCertificate';


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                /* subject and title are not required as they will be set in backend only. */
                //'docSubject',
                //'documentTitle',
                'pinCode'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            AppUserCertificate.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for entity name. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            AppUserCertificate.prototype.getNames = function (separator) {
                return this.docSubject;
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('AppUserCertificate', 'init', this);
        }
    })
};
