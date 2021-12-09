module.exports = function (app) {
    app.factory('UserMenuItem', function (CMSModelInterceptor) {
        'ngInject';
        return function UserMenuItem(model) {
            var self = this;
            self.id = null;
            self.menuItem = null;
            self.ouId = null;
            self.userId = null;

            self.userInfo = null;
            self.ouInfo = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            UserMenuItem.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('UserMenuItem', 'init', this);
        }
    })
};
