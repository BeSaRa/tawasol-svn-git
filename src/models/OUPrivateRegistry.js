module.exports = function (app) {
    app.factory('OUPrivateRegistry', function (CMSModelInterceptor,langService) {
        'ngInject';
        return function OUPrivateRegistry(model) {
            var self = this;
            self.id = null;
            self.managedByOU = null;
            self.ouid = null;
            self.regOu = null;
            self.status = true;
            self.ouInfo = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            OUPrivateRegistry.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.ouInfo.enName : this.ouInfo.arName) : (reverse ? this.ouInfo.arName : this.ouInfo.enName);
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('OUPrivateRegistry', 'init', this);
        }
    })
};
