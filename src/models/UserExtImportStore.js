module.exports = function (app) {
    app.factory('UserExtImportStore', function (CMSModelInterceptor) {
        'ngInject';
        return function UserExtImportStore(model) {
            var self = this;
            self.id = null;
            self.extImportStore = null;
            self.ouId = null;
            self.userId = null;
            self.userInfo = null;
            self.ouInfo = null;

            if (model)
                angular.extend(this, model);


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('UserExtImportStore', 'init', this);
        }
    })
};
