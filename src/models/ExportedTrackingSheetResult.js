module.exports = function (app) {
    app.factory('ExportedTrackingSheetResult', function (CMSModelInterceptor,
                                                         langService) {
        'ngInject';
        return function ExportedTrackingSheetResult(model) {
            var self = this;
            self.vsId = null;
            self.siteInfoView = null;
            self.eventLogViewList = [];

            if (model)
                angular.extend(this, model);


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ExportedTrackingSheetResult', 'init', this);
        }
    })
};
