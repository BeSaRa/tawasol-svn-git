module.exports = function (app) {
    app.factory('IncomingSearch', function (CMSModelInterceptor,
                                            langService,
                                            Incoming) {
        'ngInject';
        return function IncomingSearch(model) {
            var self = this;

            Incoming.call(this);

            //self.docStatus = null;

            self.mainSiteId = null;
            self.subSiteId = null;
            self.year = null;
            self.docDateFrom = null;
            self.docDateTo = null;

            self.approveDateFrom = null;
            self.approveDateTo = null;

            self.serialNoFrom = null;
            self.serialNoTo = null;
            self.fromRegOUId = null;
            self.toRegOUId = null;
            self.creatorId = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            IncomingSearch.prototype.getTranslatedYesNo = function (fieldName) {
                return self[fieldName] ? langService.get('yes') : langService.get('no');
            };

            IncomingSearch.prototype.hasValidRefDocDateRange = function () {
                var model = this, isValid = false;
                if ((model.refDocDateFrom && model.refDocDateTo) || (!model.refDocDateFrom && !model.refDocDateTo)) {
                    isValid = true;
                }
                return isValid;
            };

            IncomingSearch.prototype.hasValidFollowUpDateRange = function () {
                var model = this, isValid = false;
                if ((model.followUpFrom && model.followUpTo) || (!model.followUpFrom && !model.followUpTo)) {
                    isValid = true;
                }
                return isValid;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('IncomingSearch', 'init', this);
        }
    })
};
