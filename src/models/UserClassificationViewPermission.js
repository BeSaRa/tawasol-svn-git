module.exports = function (app) {
    app.factory('UserClassificationViewPermission', function (CMSModelInterceptor,
                                                              langService) {
        'ngInject';
        return function UserClassificationViewPermission(model) {
            var self = this;
            self.id = null;
            self.userId = null;
            self.classificationId = null;
            self.securityLevels = null;


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            UserClassificationViewPermission.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for user classification view permission. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            UserClassificationViewPermission.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated name of classification in user classification view permission
             * @returns {string}
             */
            UserClassificationViewPermission.prototype.getTranslatedClassificationName = function () {
                return this.classificationId.getTranslatedName();
            };


            /**
             * @description Get the translated security levels as separated by comma.
             * @returns {string}
             */
            UserClassificationViewPermission.prototype.getSecurityLevelsText = function () {
                return _.map(this.securityLevels, function (securityLevel) {
                    return securityLevel.getTranslatedName();
                }).join(', ');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('UserClassificationViewPermission', 'init', this);
        }
    })
};