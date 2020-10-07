module.exports = function (app) {
    app.factory('BackStepOptions', function (CMSModelInterceptor,
                                             langService,
                                             _) {
        'ngInject';
        return function BackStepOptions(model) {
            var self = this;
            self.sendSMS = null;
            self.sendEmail = null;
            self.userComment = null;
            self.actionId = null;
            self.sLADueDay = 0;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);



            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('BackStepOptions', 'init', this);
        }
    })
};
