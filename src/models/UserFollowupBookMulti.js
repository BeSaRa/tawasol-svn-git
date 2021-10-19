module.exports = function (app) {
    app.factory('UserFollowupBookMulti', function (CMSModelInterceptor) {
        'ngInject';
        return function UserFollowupBookMulti(model) {
            var self = this;
            self.vsId = null;
            self.docClassId = null;
            self.followupDate = null;
            self.userList = [];


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('UserFollowupBookMulti', 'init', this);
        }
    })
};
