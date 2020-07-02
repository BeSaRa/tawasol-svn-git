module.exports = function (app) {
    app.factory('PrivateDocumentType', function (CMSModelInterceptor,
                                                 langService) {
        'ngInject';
        return function PrivateDocumentType(model) {
            var self = this;
            self.id = null;
            self.ouId = null;
            self.userId = null;
            self.lookup = null;
            self.ouInfo = null;
            self.userInfo = null;


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);


            /**
             * @description Gets organization info for private document type
             * @returns {null}
             */
            PrivateDocumentType.prototype.getOrganizationInfo = function () {
                return this.ouInfo;
            };

            /**
             * @description Gets organization id for private document type
             * @returns {null}
             */
            PrivateDocumentType.prototype.getOuId = function () {
                return this.ouId;
            };
            /**
             * @description Gets user info for private lookup
             * @returns {null}
             */
            PrivateDocumentType.prototype.getUserInfo = function () {
                return this.userInfo;
            };

            /**
             * @description Gets user id for private document type
             * @returns {null}
             */
            PrivateDocumentType.prototype.getUserId = function () {
                return this.userId;
            };

            /**
             * @description Gets concatenated user info and organization info
             * @returns {string}
             */
            PrivateDocumentType.prototype.getTranslatedUserAndOrganizationName = function () {
                return this.getUserInfo().getTranslatedName() + ' - ' + this.getOrganizationInfo().getTranslatedName();
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('PrivateDocumentType', 'init', this);
        }
    })
};
