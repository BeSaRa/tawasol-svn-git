module.exports = function (app) {
    app.factory('OutgoingIncomingSearch', function (CMSModelInterceptor,
                                                    langService,
                                                    Incoming) {
        'ngInject';
        return function OutgoingIncomingSearch(model) {
            var self = this;

            Incoming.call(this);

            self.docStatus = null;
            self.addMethod = null;

            self.mainSiteId = null;
            self.subSiteId = null;
            self.year = null;
            self.docDateFrom = null;
            self.docDateTo = null;

            self.approveDateFrom = null;
            self.approveDateTo = null;

            self.serialNoFrom = null;
            self.serialNoTo = null;
            self.creatorId = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            OutgoingIncomingSearch.prototype.getTranslatedYesNo = function (fieldName) {
                return self[fieldName] ? langService.get('yes') : langService.get('no');
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('OutgoingIncomingSearch', 'init', this);
        }
    })
};
