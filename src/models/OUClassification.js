module.exports = function (app) {
    app.factory('OUClassification', function (CMSModelInterceptor, langService) {
        'ngInject';
        return function OUClassification(model) {
            var self = this, ouClassificationService;
            self.id = null;
            self.code = null;
            self.status = true;
            self.itemOrder = null;
            self.ouid = null;
            self.classification = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'classification',
                'ouid',
                'code',
                'status'
            ];


            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            OUClassification.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            OUClassification.prototype.setOuId = function (organization) {
                this.ouid = organization;
                return this;
            };

            OUClassification.prototype.setClassification = function (classification) {
                this.classification = classification;
                return this;
            };

            OUClassification.prototype.setOUClassificationService = function (service) {
                ouClassificationService = service;
            };

            OUClassification.prototype.updateStatus = function () {
                var method = this.status ? 'activateOUClassification' : 'deactivateOUClassification';
                return ouClassificationService[method](this);
            };
            OUClassification.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('OUClassification', 'init', this);
        }
    })
};