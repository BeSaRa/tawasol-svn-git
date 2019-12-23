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
                document_number: 'refDocNumber',
                label_document_type: function () {
                    if (this.docTypeInfo && this.docTypeInfo.hasOwnProperty('id') && this.docTypeInfo.id){
                        return this.docTypeInfo.getTranslatedName();
                    } else if (this.docType && this.docType.hasOwnProperty('id') && this.docType.id){
                        return this.docType.getTranslatedName();
                    }
                    return '';
                },
                creator: function () {
                    return this.creatorInfo.getTranslatedName();
                },
                created_by: function () {
                    if (typeof this.createdBy === 'string') {
                        return this.createdBy;
                    }
                    return this.createdBy.getTranslatedName();
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
                    followupStatus: new Information(self.siteInfo.followupStatusResult),
                    followupDate: self.siteInfo.followupDate,
                    followupEndDate: self.followupEndDate,
                    mainEnSiteText: self.siteInfo.mainSite ? self.siteInfo.mainSite.enName : null,
                    mainArSiteText: self.siteInfo.mainSite ? self.siteInfo.mainSite.arName : null,
                    subEnSiteText: self.siteInfo.subSite ? self.siteInfo.subSite.enName : null,
                    subArSiteText: self.siteInfo.subSite ? self.siteInfo.subSite.arName : null,
                    siteType: correspondenceService.getLookup('incoming', 'siteTypes', self.siteInfo.siteType)
                }) : null;
                if (self.siteInfo.hasOwnProperty('mainSite') && self.siteInfo.mainSite)
                    self.siteInfo.mainSite = new Information(self.siteInfo.mainSite);
                if (self.siteInfo.hasOwnProperty('subSite') && self.siteInfo.subSite)
                    self.siteInfo.subSite = new Information(self.siteInfo.subSite);
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
                    followupDate: self.site.followupDate,
                    followupStatus: self.site.followupStatus && self.site.followupStatus.hasOwnProperty('lookupKey') ? self.site.followupStatus.lookupKey : self.site.followupStatus,
                    siteType: self.site.siteType && self.site.siteType.hasOwnProperty('lookupKey') ? self.site.siteType.lookupKey : self.site.siteType,
                    mainSiteId: self.site.mainSiteId,
                    subSiteId: self.site.subSiteId
                }
            };
            Incoming.prototype.openSendFaxDialog = function ($event) {
                correspondenceService = this.getCorrespondenceService();
                return correspondenceService.openSendFaxDialog(this, $event);
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Incoming', 'init', this);
        }
    })
};
