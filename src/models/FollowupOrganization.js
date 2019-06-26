module.exports = function (app) {
    app.factory('FollowupOrganization', function (CMSModelInterceptor) {


        'ngInject';
        return function FollowupOrganization(model) {
            var self = this;

            self.id = null;
            self.userId = null;
            self.ouId = null;
            self.followeeOUId = null;
            self.withSubs = false;
            self.ouInfo = null;
            self.userInfo = null;


            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('FollowupOrganization', 'init', this);
        }
    });
}