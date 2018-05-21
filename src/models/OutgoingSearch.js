module.exports = function (app) {
    app.factory('OutgoingSearch', function (CMSModelInterceptor,
                                            Outgoing,
                                            langService) {
        return function OutgoingSearch(model) {
            var self = this;

            Outgoing.call(this);

            delete self.docStatus;

            self.siteType = null;
            self.year = null;
            self.docDateFrom = null;
            self.docDateTo = null;

            self.selectedEntityType = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            OutgoingSearch.prototype.getTranslatedYesNo = function (fieldName) {
                return self[fieldName] ? langService.get('yes') : langService.get('no');
            };


            if (model)
                angular.extend(this, model);


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('OutgoingSearch', 'init', this);
        }
    })
};