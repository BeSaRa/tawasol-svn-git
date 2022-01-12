module.exports = function (app) {
    app.factory('ManualDeliveryReport', function (CMSModelInterceptor) {
        'ngInject';
        return function ManualDeliveryReport(model) {
            var self = this;
            self.id = null;
            self.mainSiteInfo = null;
            self.subSiteInfo = null;
            self.deliveryDate = null;
            self.comment = null;
            self.receivedByOrg = null;
            self.withNotification = true;


            if (model)
                angular.extend(this, model);

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ManualDeliveryReport', 'init', this);
        }
    });
};
