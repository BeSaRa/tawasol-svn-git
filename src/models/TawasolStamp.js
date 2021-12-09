module.exports = function (app) {
    app.factory('TawasolStamp', function (CMSModelInterceptor,
                                          TawasolDocument,
                                          langService) {
        'ngInject';
        return function TawasolStamp(model) {
            var self = this;
            TawasolDocument.call(this);
            self.ou = null;
            self.status = true;
            self.classDescription = 'TawasolStamp';


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            TawasolStamp.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the status of record as Active or Inactive instead of true or false.
             * @returns {string}
             */
            TawasolStamp.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('TawasolStamp', 'init', this);
        }
    })
};
