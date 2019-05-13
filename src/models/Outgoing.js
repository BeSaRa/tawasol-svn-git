module.exports = function (app) {
    app.factory('Outgoing', function (CMSModelInterceptor,
                                      generator,
                                      Site,
                                      Correspondence,
                                      queueStatusService,
                                      Indicator) {
        'ngInject';
        return function Outgoing(model) {
            var self = this,
                correspondenceService,
                exportData = {
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
            self.docClassName = 'Outgoing';
            self.classDescription = 'Outgoing';
            self.docStatus = 2; // by default
            self.sitesInfoTo = [];
            self.sitesInfoCC = [];
            self.ccSitesList = [];
            self.toSitesList = [];
            self.isComposite = false;
            self.fromEditOnDesktop = false;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            Outgoing.prototype.getExportedData = function () {
                return exportData;
            };

            Outgoing.prototype.fetchOutgoingData = function () {
                var info = this.getInfo();
                this.sitesInfoCC = _.map(this.ccSitesList, function (item) {
                    item.docClassName = info.documentClass;
                    return generator.interceptReceivedInstance('Site', new Site(item));
                });
                this.sitesInfoTo = _.map(this.toSitesList, function (item) {
                    item.docClassName = info.documentClass;
                    return generator.interceptReceivedInstance('Site', new Site(item));
                });
            };

            Outgoing.prototype.updateSites = function () {
                correspondenceService = this.getCorrespondenceService();
                return correspondenceService.updateCorrespondenceSites(this);
            };

            Outgoing.prototype.hasSiteTO = function () {
                return this.sitesInfoTo && this.sitesInfoTo.length;
            };

            Outgoing.prototype.hasSiteCC = function () {
                return this.sitesInfoCC && this.sitesInfoCC.length;
            };

            var indicator = new Indicator();
            Outgoing.prototype.getIsPaperIndicator = function ($event) {
                return indicator.getIsPaperIndicator(this.addMethod);
            };

            Outgoing.prototype.getSecurityLevelIndicator = function (securityLevel) {
                return indicator.getSecurityLevelIndicator(securityLevel);
            };

            Outgoing.prototype.getDocClassIndicator = function () {
                return indicator.getDocClassIndicator('outgoing');
            };

            Outgoing.prototype.getPriorityLevelIndicator = function (priorityLevel) {
                return indicator.getPriorityLevelIndicator(priorityLevel);
            };

            Outgoing.prototype.partialExport = function ($event, ignoreMessage) {
                correspondenceService = this.getCorrespondenceService();
                return correspondenceService.showPartialExportDialog(this, $event, ignoreMessage);
            };

            Outgoing.prototype.saveReplyDocument = function (status, workItemNum) {
                correspondenceService = this.getCorrespondenceService();
                if (status)
                    this.docStatus = queueStatusService.getDocumentStatus(status);
                return correspondenceService.updateReplyCorrespondence(this, workItemNum);
            };

            Outgoing.prototype.saveReplyDocumentWithContent = function (information, workItemNum, sendToReview) {
                correspondenceService = this.getCorrespondenceService();
                if (sendToReview)
                    this.docStatus = 4;
                return correspondenceService.updateReplyCorrespondenceWithContent(this, information, workItemNum);
            };

            Outgoing.prototype.isCompositeSites = function () {
                return this.isComposite;
            };
            Outgoing.prototype.exportDocument = function ($event, checkArchive, ignoreMessage) {
                correspondenceService = this.getCorrespondenceService();
                return correspondenceService.exportCorrespondence(this, $event, checkArchive, ignoreMessage);
            };
            Outgoing.prototype.exportViaArchive = function () {
                return this.exportViaCentralArchive || this.addedViaCentralArchive;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Outgoing', 'init', this);
        }
    })
};
