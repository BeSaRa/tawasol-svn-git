module.exports = function (app) {
    app.factory('UserFollowupRequest', function (CMSModelInterceptor,
                                                 langService) {
        'ngInject';
        return function UserFollowupRequest(model) {
            var self = this;
            self.id =  null;
            self.comment = null;
            self.toUserId = null;
            self.toOUId = null;
            self.folderId = null;
            self.fromUserId = null;
            self.fromOUId = null;

            if (model)
                angular.extend(this, model);

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('UserFollowupRequest', 'init', this);
        }
    })
};
