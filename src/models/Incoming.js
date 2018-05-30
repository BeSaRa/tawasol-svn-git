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
            var self = this, correspondenceService;
            Correspondence.call(this);
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
            Incoming.prototype.getIncomingDate = function () {
                return this.refDocDate ? moment(this.refDocDate).format(langService.current === 'ar' ? 'DD-MM-YYYY' : 'YYYY-MM-DD') : '';
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Incoming', 'init', this);
        }
    })
};