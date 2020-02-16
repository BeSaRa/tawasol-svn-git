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
                    },
                    security_level:function () {
                        return this.securityLevel.getTranslatedName();
                    },
                    deleted_by:function () {
                        return this.lastModifierInfo.getTranslatedName();
                    },
                    deleted_on:'lastModified'
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
            self.distListId = null;
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

            Outgoing.prototype.saveCreateReplyDocument = function (status, workItemNum) {
                correspondenceService = this.getCorrespondenceService();
                if (status)
                    this.docStatus = queueStatusService.getDocumentStatus(status);
                return correspondenceService.addCreateReplyCorrespondence(this, workItemNum);
            };

            Outgoing.prototype.saveCreateReplyDocumentWithContent = function (information, workItemNum, sendToReview) {
                correspondenceService = this.getCorrespondenceService();
                if (sendToReview)
                    this.docStatus = 4;
                return correspondenceService.addCreateReplyCorrespondenceWithContent(this, information, workItemNum);
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

            Outgoing.prototype.openSendFaxDialog = function ($event) {
                correspondenceService = this.getCorrespondenceService();
                return correspondenceService.openSendFaxDialog(this, $event);
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Outgoing', 'init', this);
        }
    })
};
