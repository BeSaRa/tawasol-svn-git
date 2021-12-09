module.exports = function (app) {
    app.factory('DistributionWorkflowBulk', function (CMSModelInterceptor,
                                                      langService,
                                                      _) {
        'ngInject';
        return function DistributionWorkflowBulk(model) {
            var self = this;
            self.first = [];
            self.second = {
                normalUsers: [],
                managerUsers: [],
                favoriteUsers: [],
                receivedOUs: [],
                wfGroups: []
            };

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DistributionWorkflowBulk', 'init', this);
        }
    })
};