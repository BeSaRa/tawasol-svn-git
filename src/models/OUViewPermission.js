module.exports = function (app) {
    app.factory('OUViewPermission', function (CMSModelInterceptor, langService) {
        'ngInject';
        return function OUViewPermission(model) {
            var self = this;
            self.id = null;
            self.userId = null;
            self.ouId = null;
            self.securityLevels = null;
            self.ouInfo = null;
            self.userInfo = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            OUViewPermission.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the translated security levels as separated by comma.
             * @returns {string}
             */
            OUViewPermission.prototype.getSecurityLevelsText = function () {
                return _.map(this.securityLevels, function (securityLevel) {
                    return securityLevel.getTranslatedName();
                }).join(', ');
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('OUViewPermission', 'init', this);
        }
    })
};