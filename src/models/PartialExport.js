module.exports = function (app) {
    app.factory('PartialExport', function (CMSModelInterceptor) {
        'ngInject';
        return function PartialExport(model) {
            var self = this, keys = ['ATTACHMENTS', 'RELATED_BOOKS', 'RELATED_OBJECTS', 'MAILING_ROOM'];
            self.sitesToList = [];
            self.sitesCCList = [];
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            PartialExport.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            PartialExport.prototype.getKeys = function () {
                return keys;
            };

            PartialExport.prototype.setSitesToList = function (sites) {
                this.sitesToList = sites;
                return this;
            };
            PartialExport.prototype.setSitesCCList = function (sites) {
                this.sitesCCList = sites;
                return this;
            };
            PartialExport.prototype.hasSites = function () {
                return self.sitesToList.length || self.sitesCCList.length;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('PartialExport', 'init', this);
        }
    })
};
