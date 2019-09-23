module.exports = function (app) {
    app.factory('OutgoingSearch', function (CMSModelInterceptor,
                                            Outgoing,
                                            generator,
                                            langService) {
        return function OutgoingSearch(model) {
            var self = this;

            Outgoing.call(this);

            delete self.docStatus;

            self.siteType = null;
            self.year = null;
            self.docDateFrom = null;
            self.docDateTo = null;

            self.approveDateFrom = null;
            self.approveDateTo = null;

            self.exportDateFrom = null;
            self.exportDateTo = null;

            self.serialNoFrom = null;
            self.serialNoTo = null;

            self.selectedEntityType = null;
            self.fromRegOUId = null;
            self.toRegOUId = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            OutgoingSearch.prototype.getTranslatedYesNo = function (fieldName) {
                return self[fieldName] ? langService.get('yes') : langService.get('no');
            };

            OutgoingSearch.prototype.prepareApproved = function () {
                model = this;
                if (model.approvers || model.approveDateFrom) {
                    var toDate = angular.copy(model.approveDateTo);
                    toDate = toDate ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999) : null;
                    model.approvers = angular.toJson({
                        userId: (model.approvers) ? model.approvers.applicationUser.id : null,
                        userOuId: (model.approvers) ? model.approvers.ouid.id : null,
                        approveDate: {
                            first: generator.getTimeStampFromDate(model.approveDateFrom),
                            second: generator.getTimeStampFromDate(toDate)
                        }
                    });
                }
                return model;
            };

            if (model)
                angular.extend(this, model);


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('OutgoingSearch', 'init', this);
        }
    })
};