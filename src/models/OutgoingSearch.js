module.exports = function (app) {
    app.factory('OutgoingSearch', function (CMSModelInterceptor,
                                            Outgoing,
                                            langService) {
        return function OutgoingSearch(model) {
            var self = this;

            Outgoing.call(this);

            self.docStatus = null;

            self.siteType = null;
            self.mainSiteId = null;
            self.subSiteId = null;
            self.year = null;
            self.docDateFrom = null;
            self.docDateTo = null;
            self.createdFrom = null;
            self.createdTo = null;
            self.followUpFrom = null;
            self.followUpTo = null;


            delete self.sitesInfoTo;
            delete self.sitesInfoCC;
            //delete model.docClassName;

            //delete self.props.docStatus;
            delete self.contentSize;

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