module.exports = function (app) {
    app.factory('FollowupOrganization', function (CMSModelInterceptor, _) {


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
            self.securityLevels = null;


            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get the translated security levels as separated by comma.
             * @returns {string}
             */
            FollowupOrganization.prototype.getSecurityLevelsText = function () {
                return _.map(this.securityLevels, function (securityLevel) {
                    return securityLevel.getTranslatedName();
                }).join(', ');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('FollowupOrganization', 'init', this);
        }
    });
}
