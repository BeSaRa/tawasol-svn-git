module.exports = function (app) {
    app.factory('FollowupAction', function (CMSModelInterceptor, langService) {
        'ngInject';
        return function FollowupAction(model) {
            var self = this;

            self.followupDate = null;
            self.followupStatus = null;
            self.terminateWF = false;
            self.createAsAttachment = false;
            self.wobNum = '';
            self.sourceClassId = null;
            self.destClassId = null;
            self.vsId = '';
            self.versionNumber = null;


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('FollowupAction', 'init', this);
        }
    })
};
