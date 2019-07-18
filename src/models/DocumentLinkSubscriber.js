module.exports = function (app) {
    app.factory('DocumentLinkSubscriber', function (CMSModelInterceptor,
                                                    langService,
                                                    _) {
        'ngInject';
        return function DocumentLinkSubscriber(model) {
            var self = this;

            self.documentLinkId = null;
            self.sharedToFullName = null;
            self.sharedToMobileNum = null;
            self.sharedToEmail = null;
            self.otp = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            DocumentLinkSubscriber.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DocumentLinkSubscriber', 'init', this);
        }
    })
};
