module.exports = function (app) {
    app.factory('ContentViewHistoryEvents', function (CMSModelInterceptor,
                                            langService) {
        'ngInject';
        return function ContentViewHistoryEvents(model) {
            var self = this;
            self.updatedBy = null;
            self.updatedOn = null;
            self.updatedByInfo = null;
            self.id = null;
            self.vsId = null;
            self.docSubject = null;
            self.actionDate = null;
            self.actionBy = null;
            self.ouId = null;
            self.actionByInfo= null;
            self.ouInfo = null;
            self.trackingSheetType = null;


            if (model)
                angular.extend(this, model);


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ContentViewHistoryEvents', 'init', this);
        }
    })
};