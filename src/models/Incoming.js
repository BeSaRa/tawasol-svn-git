module.exports = function (app) {
    app.factory('Incoming', function (CMSModelInterceptor,
                                      moment,
                                      langService,
                                      Correspondence,
                                      Site,
                                      Information,
                                      Indicator) {
        'ngInject';
        return function Incoming(model) {
            var self = this, correspondenceService, exportData = {
                label_serial: 'docFullSerial',
                subject: 'docSubject',
                priority_level: function () {
                    return this.priorityLevel.getTranslatedName();
                },
                label_document_type: function () {
                    return this.docTypeInfo.getTranslatedName();
                },
                creator: function () {
                    return this.creatorInfo.getTranslatedName();
                },
                created_on: 'createdOn',
                correspondence_sites: function () {
                    return this.getTranslatedCorrespondenceSiteInfo();
                }
            };
            Correspondence.call(this);
            self.docStatus = 2;
            self.docClassName = 'Incoming';
            self.classDescription = 'Incoming';
            self.refDocNumber = null;
            self.siteTypeInfo = null;
            self.subSiteInfo = null;
            self.mainSiteInfo = null;
            self.siteType = null;
            self.mainSiteId = null;
            self.subSiteId = null;
            self.addMethod = 1;
            self.refDocDate = null;
            // G2G FROM ABU AL NASSER
            self.g2gMHId = null;
            /*These fields come from common correspondence model. The below fields are not in Incoming model*/
            delete self.approvers;
            delete self.signaturesCount;
            delete self.exportInfo;
            delete self.sitesInfoCC;
            delete self.sitesInfoTo;

            // this property for not for the current Model.
            self.site = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);


            Incoming.prototype.getExportedData = function () {
                return exportData;
            };

            Incoming.prototype.fetchIncomingData = function () {
                var self = this;
                correspondenceService = this.getCorrespondenceService();

                self.site = self.subSiteId ? new Site({
                    mainSiteId: self.mainSiteId,
                    subSiteId: self.subSiteId,
                    followupStatus: new Information(self.followupStatusInfo),
                    followupDate: self.followupDate,
                    mainEnSiteText: self.mainSiteInfo.enName,
                    mainArSiteText: self.mainSiteInfo.arName,
                    subEnSiteText: self.subSiteInfo.enName,
                    subArSiteText: self.subSiteInfo.arName,
                    siteType: correspondenceService.getLookup('incoming', 'siteTypes', model.siteType)
                }) : null;

            };

            var indicator = new Indicator();
            Incoming.prototype.getSecurityLevelIndicator = function (securityLevel) {
                return indicator.getSecurityLevelIndicator(securityLevel);
            };

            Incoming.prototype.getDocClassIndicator = function () {
                return indicator.getDocClassIndicator('incoming');
            };

            Incoming.prototype.getPriorityLevelIndicator = function (priorityLevel) {
                return indicator.getPriorityLevelIndicator(priorityLevel);
            };
            Incoming.prototype.receiveDocument = function (wobNumber) {
                correspondenceService = this.getCorrespondenceService();
                return correspondenceService.receiveIncoming(this, wobNumber);
            };
            Incoming.prototype.receiveG2GDocument = function () {
                correspondenceService = this.getCorrespondenceService();
                return correspondenceService.receiveG2GIncoming(this);
            };
            Incoming.prototype.getIncomingDate = function () {
                return this.docDate ? moment(this.docDate).format(langService.current === 'ar' ? 'DD-MM-YYYY' : 'YYYY-MM-DD') : '';
            };
            Incoming.prototype.getDocumentDate = function () {
                return this.refDocDate ? moment(this.refDocDate).format(langService.current === 'ar' ? 'DD-MM-YYYY' : 'YYYY-MM-DD') : '';
            };
            Incoming.prototype.saveIncomingSite = function () {
                correspondenceService = this.getCorrespondenceService();
                return correspondenceService.saveIncomingCorrespondenceSite(this);
            };
            Incoming.prototype.getSiteInformation = function () {
                var self = this;
                return {
                    followupDate: self.followupDate,
                    followupStatus: self.followupStatus,
                    siteType: self.siteType,
                    mainSiteId: self.mainSiteId,
                    subSiteId: self.subSiteId
                }
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Incoming', 'init', this);
        }
    })
};
