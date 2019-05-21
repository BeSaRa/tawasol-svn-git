module.exports = function (app) {
    app.factory('DocumentFile', function (CMSModelInterceptor,
                                          langService,
                                          _) {
        'ngInject';
        return function DocumentFile(model) {
            var self = this, documentFileService, ouDocumentFileService, organizationService;

            self.securityLevels = null;
            self.global = true;
            self.arName = null;
            self.enName = null;
            self.status = true;
            self.childCount = 0;
            self.relatedOus = [];

            self.cmsRefId = null;
            self.id = null;
            self.parent = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName'
            ];
            if (model)
                angular.extend(this, model);
            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            DocumentFile.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            DocumentFile.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };
            DocumentFile.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the globalization of sms template as Yes or No instead of true or false.
             * @returns {string}
             */
            DocumentFile.prototype.getTranslatedGlobal = function () {
                return this.global ? langService.get('yes') : langService.get('no');
            };
            DocumentFile.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };
            DocumentFile.prototype.getSecurityLevels = function () {
                var x = ['defaultArName', 'defaultEnName'], property = langService.current === 'ar' ? x[0] : x[1];
                return _.map(this.securityLevels, property).join(', ');
            };
            DocumentFile.prototype.getSelectedOU = function () {
                return _.map(_.map(this.relatedOus, 'enName'), function (organizations) {
                    return organizations;
                }).join(' , ');
            };

            DocumentFile.prototype.setDocumentFileService = function (service) {
                documentFileService = service;
                return this;
            };
            DocumentFile.prototype.setOUDocumentFileService = function (service) {
                ouDocumentFileService = service;
                return this;
            };
            DocumentFile.prototype.setOrganizationService = function (service) {
                organizationService = service;
                return this;
            };
            /**
             * @description get children document files
             */
            DocumentFile.prototype.getChildren = function () {
                return this.children = documentFileService.getChildrenFromDocumentFile(this);
            };

            /**
             * @description checks if document file has children
             */
            DocumentFile.prototype.hasChildren = function () {
                return this.childCount > 0;
            };

            /**
             * @description checks if document file is empty
             */
            DocumentFile.prototype.isEmpty = function () {
                return !(!!this.id && !!this.enName && !!this.arName);
            };

            DocumentFile.prototype.getRelatedOUDocumentFiles = function () {
                return this.relatedOus = _.map(ouDocumentFileService.getRelatedOUDocumentFile(this), function (item) {
                    var organization = organizationService.getOrganizationById(item.ouid);
                    organization.selectedOUId = item.id;
                    return organization;
                });
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DocumentFile', 'init', this);
        }
    })
};
