module.exports = function (app) {
    app.factory('UserSubscription', function (CMSModelInterceptor) {
        'ngInject';
        return function UserSubscription(model) {
            var self = this;

            //User Subscription properties
            self.id = null;
            self.trigerID = null;
            self.userId = null;
            self.documentVSId = "";
            self.status = true;
            self.ouId = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'trigerID',
                'userId',
                'documentVSId',
                'status',
                'ouId'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            UserSubscription.prototype.getRequiredFields = function () {
                return requiredFields;
            };



            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('UserSubscription', 'init', this);
        }
    })
};