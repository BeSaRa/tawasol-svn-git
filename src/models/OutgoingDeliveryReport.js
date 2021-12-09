module.exports = function (app) {
    app.factory('OutgoingDeliveryReport', function (CMSModelInterceptor,
                                                    langService) {
        'ngInject';
        return function OutgoingDeliveryReport(model) {
            var self = this;
            /*self.id = null;
            self.documentVSID = null;
            self.refVSId = null;
            self.mainSiteFromId = null;
            self.subSiteFromId = null;
            self.sentDate = null;
            self.sentByOrg = null;
            self.sentById = null;
            self.mainSiteToId = null;
            self.subSiteToId = null;
            self.type = null;
            self.followupStatus = null;
            self.followupDate = null;
            self.receivedByOrg = null;
            self.receivedById = null;
            self.deliveryDate = null;
            self.status = null;
            self.incomingDocId = null;
            self.refIncomingDocId = null;
            self.docFullSerial = null;
            self.docSubject = null;
            self.securityLevel = null;
            self.priorityLevel = null;
            self.comment = null;
            self.isCurrent = null;
            self.isRead = null;
            self.isToG2G = null;
            self.exportedAttchmentsVSIDs = null;
            self.exception = null;
            self.g2GRefNo = null;
*/

            self.updatedBy = null;
            self.updatedOn = null;
            self.updatedByInfo = null;
            self.id = null;
            self.vsId = null;
            self.refVSId = null;
            self.mainSiteFromId = null;
            self.subSiteFromId = null;
            self.sentDate = null;
            self.sentByOrg = null;
            self.sentById = null;
            self.mainSiteToId = null;
            self.subSiteToId = null;
            self.type = null;
            self.followupStatus = null;
            self.followupDate = null;
            self.receivedByOrg = null;
            self.receivedById = null;
            self.deliveryDate = null;
            self.status = null;
            self.incomingDocId = null;
            self.refIncomingDocId = null;
            self.docFullSerial = null;
            self.docSubject = null;
            self.securityLevel = null;
            self.priorityLevel = null;
            self.comment = null;
            self.isCurrent = null;
            self.isRead = null;
            self.isToG2G = null;
            self.exportedAttchmentsVSIDs = null;
            self.exception = null;
            self.mainSiteFromIdInfo = null;
            self.subSiteFromIdInfo = null;
            self.sentByIdInfo = null;
            self.mainSiteToIdInfo = null;
            self.subSiteToIdInfo = null;
            self.receivedByIdInfo = null;
            self.securityLevelInfo = null;
            self.priorityLevelInfo = null;
            self.messageStatus = null;
            self.g2GRefNo = null;

            if (model)
                angular.extend(this, model);


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('OutgoingDeliveryReport', 'init', this);
        }
    })
};