module.exports = function (app) {
    app.factory('DocumentSecurity', function (CMSModelInterceptor,
                                              langService) {
        'ngInject';
        return function DocumentSecurity(model) {
            var self = this;
            self.id = null;
            self.ouId = null;
            self.status = true;
            self.locationX2D = null;
            self.locationY2D = null;
            self.locationXText = null;
            self.locationYText = null;
            self.settingDetails = null;


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            DocumentSecurity.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the status of DocumentSecurity as Active or Inactive instead of true or false.
             * @returns {string}
             */
            DocumentSecurity.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /**
             * @description Get the globalization of DocumentSecurity as Yes or No instead of true or false.
             * @returns {string}
             */
            DocumentSecurity.prototype.getTranslatedYesNo = function (fieldName) {
                return self[fieldName] ? langService.get('yes') : langService.get('no');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DocumentSecurity', 'init', this);
        }
    }, 'DocumentSecurity')
};