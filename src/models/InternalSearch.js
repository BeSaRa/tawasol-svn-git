module.exports = function (app) {
    app.factory('InternalSearch', function (CMSModelInterceptor,
                                            langService,
                                            Internal) {
        return function InternalSearch(model) {
            var self = this;

            Internal.call(this);

            self.docStatus = null;

            self.siteType = null;
            self.year = null;
            self.docDateFrom = null;
            self.docDateTo = null;

            self.selectedEntityType = null;


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            InternalSearch.prototype.getTranslatedYesNo = function (fieldName) {
                return self[fieldName] ? langService.get('yes') : langService.get('no');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('InternalSearch', 'init', this);
        }
    })
};