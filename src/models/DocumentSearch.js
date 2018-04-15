module.exports = function (app) {
    app.factory('DocumentSearch', function (CMSModelInterceptor,
                                            Outgoing,
                                            Incoming,
                                            Internal,
                                            General,
                                            langService) {
        'ngInject';
        return function DocumentSearch(model) {
            var self = this;
            if (model.reqType === 0)
                model = new Outgoing({docStatus: null});
            if (model.reqType === 1)
                model = new Incoming({docStatus: null});
            if (model.reqType === 2)
                model = new Internal({docStatus: null});
            if (model.reqType === 3)
                model = new General({docStatus: null});
            //model.followupStatus = null;
            model.siteType = null;
            model.mainSiteId = null;
            model.subSiteId = null;
            model.year = null;
            model.docDateFrom = null;
            model.docDateTo = null;
            model.createdFrom = null;
            model.createdTo = null;
            model.followUpFrom = null;
            model.followUpTo = null;


            delete model.sitesInfoTo;
            delete model.sitesInfoCC;
            delete model.docClassName;

            //delete self.props.docStatus;
            delete model.contentSize;

            self.getTranslatedYesNo = function (fieldName) {
                return self[fieldName] ? langService.get('yes') : langService.get('no');
            };

            if (model)
                angular.extend(this, model);


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DocumentSearch', 'init', this);
        }
    })
};