module.exports = function (app) {
    app.factory('OUCorrespondenceSite', function (CMSModelInterceptor,
                                                  langService) {
        'ngInject';
        return function OUCorrespondenceSite(model) {
            var self = this, ouCorrespondenceSiteService;
            self.id = null;
            self.code = null;
            self.status = true;
            self.itemOrder = null;
            self.ouid = null;
            self.correspondenceSite = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'correspondenceSite',
                'status',
                'code'
            ];


            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            OUCorrespondenceSite.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            OUCorrespondenceSite.prototype.setOuId = function (organization) {
                this.ouid = organization;
                return this;
            };

            OUCorrespondenceSite.prototype.setCorrespondenceSite = function (correspondenceSite) {
                this.correspondenceSite = correspondenceSite;
                return this;
            };

            OUCorrespondenceSite.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };
            OUCorrespondenceSite.prototype.setOUCorrespondenceSiteService = function (service) {
                ouCorrespondenceSiteService = service;
            };
            OUCorrespondenceSite.prototype.updateStatus = function () {
                var method = this.status ? 'activateOUCorrespondenceSite' : 'deactivateOUCorrespondenceSite';
                return ouCorrespondenceSiteService[method](this);
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('OUCorrespondenceSite', 'init', this);
        }
    })
};