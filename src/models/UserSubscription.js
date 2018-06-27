module.exports = function (app) {
    app.factory('UserSubscription', function (CMSModelInterceptor,langService) {
        'ngInject';
        return function UserSubscription(model) {
            var self = this;

            //User Subscription properties
            self.id = null;
            self.trigerId = null;
            self.userId = null;
            self.documentVSId = "";
            self.status = true;
            self.ouId = null;
            self.updatedOn = null;
            self.docSubject = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'trigerId',
                'documentVSId',
                'status',
                'docSubject'
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

            /**
             * @description Get the status of User Subscription as Active or Inactive instead of true or false.
             * @returns {string}
             */
            UserSubscription.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('UserSubscription', 'init', this);
        }
    })
};