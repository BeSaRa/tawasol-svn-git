module.exports = function (app) {
    app.factory('PrivateUserClassification', function (CMSModelInterceptor,
                                                       $q,
                                                       langService,
                                                       _) {
        'ngInject';
        return function PrivateUserClassification(model) {
            var self = this;
            self.id = null;
            self.ouId = null;
            self.userId = null;
            self.hasView = false;
            self.hasEdit = false;
            self.classification = null;
            self.archiveSecurityLevels = null;
            self.viewSecurityLevels = null;
            self.userInfo = null;
            self.ouInfo = null;


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(self, model);

            PrivateUserClassification.prototype.getSecurityLevelsText = function (securityLevels) {
                return _.map(securityLevels, function (securityLevel) {
                    return securityLevel.getTranslatedName();
                }).join(', ');
            };

            self.getTranslatedYesNo = function (fieldName) {
                return self[fieldName] ? langService.get('yes') : langService.get('no');
            };

            PrivateUserClassification.prototype.getNames = function (separator) {
                return this.classification.arName + ' ' + (separator ? separator : '-') + ' ' + this.classification.enName;
            };

            PrivateUserClassification.prototype.filterSecurityLevels = function (ouApplicationUser) {
                var ouSecurityLevels = _.map(ouApplicationUser.archiveSecurityLevels, 'lookupKey');
                return this.classification.securityLevels.filter(securityLevel => {
                    return securityLevel.lookupKey !== 4 && ouSecurityLevels.indexOf(securityLevel.lookupKey) !== -1;
                })
            }


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('PrivateUserClassification', 'init', this);
        }
    })
};
