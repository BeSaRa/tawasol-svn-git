module.exports = function (app) {
    app.factory('Organization', function (CMSModelInterceptor,
                                          $q,
                                          OUClassification,
                                          OUCorrespondenceSite,
                                          langService,
                                          _,
                                          Indicator) {
        'ngInject';
        return function Organization(model) {
            var self = this,
                customProperties = ['children', 'relationship', 'parentId'],
                organizationService,
                ouClassificationService,
                validationService,
                ouCorrespondenceSiteService;

            self.id = null;
            self.adminUserId = null;
            self.arName = null;
            self.centralArchive = false;
            self.centralArchiveUnitId = null;
            self.children = null;
            self.code = null;
            // B-Q: in use case number 12 Create Organization Unit not mentioned default 1 until i get answer.
            self.correspondenceTypeId = 1;
            self.deadlineReminder = 1;
            self.description = null;
            self.email = null;
            self.enName = null;
            self.enableEmailNotification = true;
            self.enableEscalation = false;
            self.enableSmsnotification = true;
            self.errorCode = null;
            self.errorMessage = null;
            self.escalationNotifyReceiver = true; // default
            self.escalationNotifySender = true; // default
            self.escalationProcess = null;
            self.followupUsers = null;
            self.hasRegistry = true;
            self.ldapCode = null;
            self.ldapPrefix = null;
            self.logo = null;
            self.managerId = null;
            self.mobile = null;
            self.outype = null;
            self.parent = null;
            self.referenceNumberPlanId = null;
            self.registryParentId = null;
            self.securitySchema = null;
            self.wfsecurity = null;
            self.sla = null;
            self.status = true;
            self.viceManagerId = null;
            self.classificationList = null;
            self.correspondenceSiteList = null;
            self.documentFileList = null;
            self.referencePlan = null;
            self.referencePlanItemStartSerialList = [];
            self.relationship = null; // add by default must removed when i send the object
            self.parentId = null; // add by default must removed when i send the object
            self.g2gId = null;
            self.internalG2gId = null;
            self.ouLevel = 1;
            self.faxId = null;
            self.isPrivateRegistry = false;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'code',
                'arName',
                'enName',
                // 'parent',
                // 'registryParentId',
                'hasRegistry',
                'centralArchive',
                'status',
                'ldapCode',
                // 'ldapPrefix', // must be removed from the ui as per abu Al Nasser.
                // 'referenceNumberPlanId',
                'outype',
                'correspondenceTypeId',
                'securitySchema',
                'enableEscalation',
                'escalationNotifySender',
                'escalationNotifyReceiver',
                'deadlineReminder',
                // 'enableSmsnotification',
                // 'enableEmailNotification',
                'sla'
            ];


            if (model)
                angular.extend(this, model);


            Organization.prototype.setValidationService = function (service) {
                validationService = service;
            };

            Organization.prototype.setParent = function (parent) {
                this.parent = parent;
                return this;
            };

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            Organization.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            /**
             * @description delete the custom properties from the model.
             * @returns {Organization}
             */
            Organization.prototype.customProperties = function () {
                var self = this;
                _.map(customProperties, function (property) {
                    delete self[property];
                });
                return self;
            };

            Organization.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            Organization.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            Organization.prototype.getHasRegistryTranslate = function () {
                return this.hasRegistry ? langService.get('yes') : langService.get('no');
            };

            Organization.prototype.getHasCentralArchiveTranslate = function () {
                return this.centralArchive ? langService.get('yes') : langService.get('no');
            };

            Organization.prototype.getIsPrivateRegistryTranslate = function () {
                return this.isPrivateRegistry ? langService.get('yes') : langService.get('no');
            };

            Organization.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the name of record with passed language name
             * @param language
             * @returns {string}
             */
            Organization.prototype.getNameByLanguage = function (language) {
                return this[language + 'Name'];
            };

            Organization.prototype.getTranslatedNameRegOUSection = function () {
                if (this.tempRegOUSection) {
                    return this.tempRegOUSection[langService.current + 'Name']
                }
                return this[langService.current + 'Name'];
            };

            Organization.prototype.getNameByLanguageRegOUSection = function (language) {
                if (this.tempRegOUSection) {
                    return this.tempRegOUSection[language + 'Name']
                }
                return this[language + 'Name'];
            };

            Organization.prototype.setRegistryParentId = function (registryParentId) {
                this.registryParentId = registryParentId;
                return this;
            };

            Organization.prototype.setCentralArchiveUnitId = function (centralArchiveUnitId) {
                this.centralArchiveUnitId = centralArchiveUnitId;
                return this;
            };

            Organization.prototype.setOrganizationService = function (service) {
                organizationService = service;
            };

            Organization.prototype.getParent = function () {
                return this.parent ? organizationService.getOrganizationById(this.parent) : null;
            };

            Organization.prototype.getType = function () {
                return this.outype;
            };
            Organization.prototype.updateStatus = function () {
                var method = this.status ? 'activateOrganization' : 'deactivateOrganization';
                return organizationService[method](this);
            };

            Organization.prototype.addOUClassification = function (ouClassification) {
                return ouClassificationService.addOUClassification(ouClassification);
            };

            Organization.prototype.setOUClassificationService = function (service) {
                ouClassificationService = service
            };

            Organization.prototype.setOUCorrespondenceSiteService = function (service) {
                ouCorrespondenceSiteService = service
            };

            Organization.prototype.deleteAllOUClassifications = function (ouClassifications) {
                return ouClassificationService
                    .deleteBulkOUClassifications(ouClassifications);
            };

            Organization.prototype.deleteOUClassification = function (ouClassification) {
                return ouClassificationService
                    .deleteOUClassification(ouClassification);
            };

            Organization.prototype.activateBulkOUClassifications = function (ouClassifications) {
                return ouClassificationService
                    .activateBulkOUClassifications(ouClassifications);
            };
            Organization.prototype.deactivateBulkOUClassifications = function (ouClassifications) {
                return ouClassificationService
                    .deactivateBulkOUClassifications(ouClassifications);
            };
            Organization.prototype.updateOUClassification = function (ouClassification) {
                return ouClassificationService
                    .updateOUClassification(ouClassification)
                    .then(function () {
                        if (ouClassification.classification.isGlobal) {
                            return ouClassification.classification.setIsGlobal(false).update().then(function () {
                                return ouClassification;
                            })
                        } else {
                            return ouClassification;
                        }
                    });
            };


            Organization.prototype.addOUCorrespondenceSite = function (ouCorrespondenceSite) {
                return ouCorrespondenceSiteService.addOUCorrespondenceSite(ouCorrespondenceSite);
            };
            Organization.prototype.deleteAllOUCorrespondenceSites = function (ouCorrespondenceSites) {
                return ouCorrespondenceSiteService
                    .deleteBulkOUCorrespondenceSites(ouCorrespondenceSites);
            };

            Organization.prototype.deleteOUCorrespondenceSite = function (ouCorrespondenceSite) {
                return ouCorrespondenceSiteService
                    .deleteOUCorrespondenceSite(ouCorrespondenceSite);
            };

            Organization.prototype.activateBulkOUCorrespondenceSites = function (ouCorrespondenceSites) {
                return ouCorrespondenceSiteService
                    .activateBulkOUCorrespondenceSites(ouCorrespondenceSites);
            };
            Organization.prototype.deactivateBulkOUCorrespondenceSites = function (ouCorrespondenceSites) {
                return ouCorrespondenceSiteService
                    .deactivateBulkOUCorrespondenceSites(ouCorrespondenceSites);
            };
            Organization.prototype.updateOUCorrespondenceSite = function (ouCorrespondenceSite) {
                return ouCorrespondenceSiteService
                    .updateOUCorrespondenceSite(ouCorrespondenceSite);
            };

            Organization.prototype.assignClassifications = function (classifications) {
                var self = this;
                var ouClassifications = _.map(classifications, function (classification) {
                    return new OUClassification({ouid: self.id, classification: classification});
                });
                return ouClassificationService.addBulkOUClassifications(ouClassifications);
            };

            Organization.prototype.assignCorrespondenceSites = function (correspondenceSites) {
                var self = this;
                var ouCorrespondenceSites = _.map(correspondenceSites, function (correspondenceSite) {
                    return new OUCorrespondenceSite({ouid: self.id, correspondenceSite: correspondenceSite});
                });
                return ouCorrespondenceSiteService.addBulkOUCorrespondenceSites(ouCorrespondenceSites);
            };

            Organization.prototype.getNameByKey = function (langKey) {
                return this[langKey + 'Name'];
            };

            Organization.prototype.getRegistryOUID = function () {
                return this.hasRegistry ? this.id : (this.registryParentId.hasOwnProperty('id') ? this.registryParentId.id : this.registryParentId);
            };

            Organization.prototype.getManagerAndOuTranslate = function () {
                return this.getTranslatedName() + ' - ' + this.managerId.getTranslatedName();
            };

            Organization.prototype.getViceManagerAndOuTranslate = function () {
                return this.getTranslatedName() + ' - ' + this.viceManagerId.getTranslatedName();
            };

            var indicator = new Indicator();
            Organization.prototype.getRegistryOuIndicator = function () {
                return this.hasRegistry ? indicator.getRegistryOuIndicator(true) : null;
            };

            Organization.prototype.getCentralArchiveIndicator = function () {
                return this.centralArchive ? indicator.getCentralArchiveIndicator(true) : null;
            };

            Organization.prototype.getPrivateRegOuIndicator = function () {
                return this.hasRegistry && this.isPrivateRegistry ? indicator.getPrivateRegOuIndicator(true) : null;
            };

            Organization.prototype.getNotSyncOuIndicator = function () {
                return !this.isFnSynched ? indicator.getNotSyncOuIndicator(true) : null;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Organization', 'init', this);
        }
    })
};
