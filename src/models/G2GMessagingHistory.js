module.exports = function (app) {
    app.factory('G2GMessagingHistory', function (CMSModelInterceptor,
                                                 Information,
                                                 viewDocumentService,
                                                 configurationService,
                                                 Outgoing,
                                                 Indicator,
                                                 rootEntity,
                                                 langService) {
        'ngInject';
        return function G2GMessagingHistory(model) {
            var self = this, correspondenceService, g2gReturnedService, managerService,
                exportData = {
                    subject: 'subject',
                    document_type: function () {
                        return this.typeInfo.getTranslatedName();
                    },
                    security_level: function () {
                        return this.securityLevel.getTranslatedName()
                    },
                    sent_date: 'sentDate',
                    document_number: 'outgoingSerial',
                    g2g_book_number: 'g2GRefNo',
                    received_date: 'updateDate',
                    status: function () {
                        return this.statusInfo.getTranslatedName()
                    },
                    correspondence_sites: function () {
                        return this.getTranslatedCorrespondenceSiteInfo();
                    },
                    comment: 'comment',
                    returned_by: 'senderForTrackingSheet',
                    updated_by: function () {
                        return this.updatedByOrg.hasOwnProperty('name') ? this.updatedByOrg.name : this.updatedByOrg
                    }
                };

            self.refDocId = null;
            self.status = null;
            self.type = null;
            self.mainSiteFrom = null;
            self.subSiteFrom = null;
            self.sentDate = null;
            self.sentByOrg = null;
            self.sentBy = null;
            self.mainSiteTo = null;
            self.subSiteTo = null;
            self.typeString = null;
            self.followupStatusString = null;
            self.followupDate = null;
            self.receivedByOrg = null;
            self.receivedBy = null;
            self.deliveryDate = null;
            self.statusString = null;
            self.incomingDocId = null;
            self.refIncomingDocId = null;
            self.updatedByOrg = null;
            self.updatedBy = null;
            self.updateDate = null;
            self.comment = null;
            self.g2GRefNo = null;
            self.outgoingSerial = null;
            self.subject = null;
            self.securityLevelString = null;
            self.prioretyLevelString = null;
            self.isCurrent = null;
            self.isRead = null;
            self.creationDocDate = null;
            self.lockedBy = null;
            self.lockedDate = null;
            self.internal = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            G2GMessagingHistory.prototype.setCorrespondenceService = function (service) {
                correspondenceService = service;
                return this;
            };
            G2GMessagingHistory.prototype.setManagerService = function (service) {
                managerService = service;
                return this;
            };
            G2GMessagingHistory.prototype.setG2GReturnService = function (service) {
                g2gReturnedService = service;
                return this;
            };

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            G2GMessagingHistory.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Returns the document subject
             * @returns {null}
             */
            G2GMessagingHistory.prototype.getTranslatedName = function () {
                return this.subject;
            };

            /**
             * @description Returns the document subject
             * @returns {null}
             */
            G2GMessagingHistory.prototype.getSubject = function () {
                return this.subject;
            };

            /**
             * @description to get documentClass,vsId.
             * @return {{documentClass: *, vsId: *}}
             */
            G2GMessagingHistory.prototype.getInfo = function () {
                return this.recordInfo;
            };

            G2GMessagingHistory.prototype.getTranslatedCorrespondenceSiteInfo = function () {
                /*var mainSite = new Information(this.mainSiteTo);
                var subSite = (this.subSiteTo) ? new Information(this.subSiteTo) : null;

                return (mainSite.getTranslatedName() + (subSite ? (' - ' + subSite.getTranslatedName()) : ''));*/
                return this.mainSiteSubSiteString.getTranslatedName();
            };

            /**
             * @description Set the main site sub site string to display/sort in the grid
             * @returns {*}
             */
            G2GMessagingHistory.prototype.setMainSiteSubSiteString = function () {
                var mainSite = new Information(this.mainSiteTo);
                var subSite = (this.subSiteTo) ? new Information(this.subSiteTo) : null;

                this.mainSiteSubSiteString = new Information({
                    arName: mainSite.getTranslatedNameByLang('ar') + (subSite ? (' - ' + subSite.getTranslatedNameByLang('ar')) : ''),
                    enName: mainSite.getTranslatedNameByLang('en') + (subSite ? (' - ' + subSite.getTranslatedNameByLang('en')) : '')
                });

                return this;
            };

            G2GMessagingHistory.prototype.viewDocument = function (actions, queueName, $event) {
                return viewDocumentService.viewG2GHistoryDocument(this, actions, queueName, $event);
            };

            /**
             * @description Checks if G2G record is internal G2G record
             * @returns {boolean}
             */
            G2GMessagingHistory.prototype.isInternalG2G = function () {
                return this.internal;
            };

            var indicator = new Indicator();
            G2GMessagingHistory.prototype.getIsInternalG2GIndicator = function () {
                return indicator.getIsInternalG2GIndicator(this.internal);
            };

            G2GMessagingHistory.prototype.getTranslatedOriginalCopy = function () {
                return this.type === 0
                    ? new Information({
                        enName: langService.getByLangKey('original', 'en'),
                        arName: langService.getByLangKey('original', 'ar')
                    })
                    : new Information({
                        enName: langService.getByLangKey('copy', 'en'),
                        arName: langService.getByLangKey('copy', 'ar')
                    });
            };

            G2GMessagingHistory.prototype.resendG2GItem = function ($event) {
                var correspondence = new Outgoing({
                    docSubject: this.subject,
                    docStatus: 24,
                    docClassName: 'Outgoing',
                    vsId: this.refDocId,
                    securityLevel: this.securityLevel
                });
                return correspondenceService.openExportCorrespondenceDialog(correspondence, $event, true, this);
            };

            G2GMessagingHistory.prototype.resendNewG2GItem = function () {
                return correspondenceService.resendG2GItemNew(this.g2gActionID);
            };

            G2GMessagingHistory.prototype.manageG2GDocumentProperties = function ($event) {
                var info = this.getInfo();

                if (rootEntity.isQatarVersion()) {
                    return managerService.manageDocumentProperties(this.refDocId, 'outgoing', info.title, $event)
                } else {
                    return managerService.manageG2GKuwaitDocumentProperties(this, $event);
                }
            };


            G2GMessagingHistory.prototype.manageDocumentComments = function ($event) {
                var info = this.getInfo();
                return managerService.manageDocumentComments.apply(managerService, [this, this.refDocId, info.title, $event]);
            };
            G2GMessagingHistory.prototype.manageDocumentAttachments = function ($event) {
                var info = this.getInfo();
                var correspondence = new Outgoing({
                    docSubject: this.subject,
                    docStatus: 24,
                    docClassName: 'Outgoing',
                    vsId: this.refDocId,
                    securityLevel: this.securityLevel
                });
                if (rootEntity.isQatarVersion()) {
                    return managerService.manageDocumentAttachments.apply(managerService, [correspondence, this.refDocId, info.documentClass, info.title, $event]);
                }
                return managerService.manageDocumentAttachmentsG2GKuwait(this, $event);
            };
            G2GMessagingHistory.prototype.manageDocumentLinkedDocuments = function ($event) {
                var info = this.getInfo();
                return managerService.manageDocumentLinkedDocuments.apply(managerService, [this.refDocId, info.documentClass, info.title, $event, this]);
            };
            G2GMessagingHistory.prototype.manageDocumentEntities = function ($event) {
                var info = this.getInfo();
                return managerService.manageDocumentEntities.apply(managerService, [this.refDocId, info.documentClass, info.title, $event]);
            };
            G2GMessagingHistory.prototype.manageDocumentCorrespondence = function ($event) {
                var info = this.getInfo();
                return managerService.manageDocumentCorrespondence.apply(managerService, [this.refDocId, info.documentClass, info.title, $event]);
            };
            G2GMessagingHistory.prototype.getExportedData = function () {
                return exportData;
            };

            G2GMessagingHistory.prototype.terminate = function ($event) {
                var method = rootEntity.isQatarVersion() ? 'terminateG2G' : 'terminateG2GKuwait';
                return g2gReturnedService[method](this, $event);
            };

            G2GMessagingHistory.prototype.getCorrespondenceSitesCount = function ($event) {
                return 1;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('G2GMessagingHistory', 'init', this);
        }
    })
};
