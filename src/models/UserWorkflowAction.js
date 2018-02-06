module.exports = function (app) {
    app.factory('UserWorkflowAction', function (CMSModelInterceptor) {
        'ngInject';
        return function UserWorkflowAction(model) {
            var self = this;
            self.id = null;
            self.userId = null;
            self.applicationUser = null;
            self.wfAction = null;


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'wfAction',
                'userId'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            UserWorkflowAction.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            UserWorkflowAction.prototype.setUserId = function (applicationUser) {
                this.userId = applicationUser;
                return this;
            };

            UserWorkflowAction.prototype.setWorkflowAction = function (wfAction) {
                this.wfAction = wfAction;
                return this;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('UserWorkflowAction', 'init', this);
        }
    })
};