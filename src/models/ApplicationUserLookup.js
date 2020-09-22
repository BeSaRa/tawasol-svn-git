module.exports = function (app) {
    app.factory('ApplicationUserLookup', function (CMSModelInterceptor,
                                            langService) {
        'ngInject';
        return function ApplicationUserLookup(model) {
            var self = this;
            self.rankList = [];
            self.jobTitleList = [];
            self.themeList = [];
            self.permissionList = [];
            self.customRoleList = [];

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ApplicationUserLookup', 'init', this);
        }
    })
};
