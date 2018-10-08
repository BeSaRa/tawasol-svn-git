module.exports = function (app) {
    app.factory('G2GMessagingHistory', function (CMSModelInterceptor,
                                                 Information,
                                                 viewDocumentService,
                                                 Indicator,
                                                 langService) {
        'ngInject';
        return function G2GMessagingHistory(model) {
            var self = this;

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

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('G2GMessagingHistory', 'init', this);
        }
    })
};