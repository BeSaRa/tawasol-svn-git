module.exports = function (app) {
    app.factory('SentItemCentralArchive', function (CMSModelInterceptor,
                                                     Indicator,
                                                     langService,
                                                     managerService,
                                                     lookupService) {
        'ngInject';
        return function SentItemCentralArchive(model) {
            var self = this, correspondenceService = null, viewDocumentService;
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
            self.messageStatus = null;
            self.mainSiteFromIdInfo = null;
            self.subSiteFromIdInfo = null;
            self.sentByIdInfo = null;
            self.mainSiteToIdInfo = null;
            self.subSiteToIdInfo = null;
            self.receivedByIdInfo = null;
            self.securityLevelInfo = null;
            self.priorityLevelInfo = null;
            self.g2GRefNo = null;
            self.docStatus = 24;
            /*Default status to show its already approved*/

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);


            SentItemCentralArchive.prototype.setViewDocumentService = function (service) {
                viewDocumentService = service;
                return this;
            };

            SentItemCentralArchive.prototype.getTranslatedName = function () {
                return this.docSubject;
            };

            SentItemCentralArchive.prototype.getSubject = function () {
                return this.docSubject;
            };

            SentItemCentralArchive.prototype.getTranslatedType = function () {
                return this.type === 0 ? langService.get('original') : langService.get('copy');
            };


            /**
             * @description Returns the security level lookup based on value from database
             * @returns {*}
             */
            SentItemCentralArchive.prototype.getSecurityLevelLookup = function () {
                var securityLevel = this.securityLevel;
                if (securityLevel.hasOwnProperty('lookupKey')) {
                    return securityLevel;
                }
                else if (securityLevel.hasOwnProperty('id')) {
                    return lookupService.getLookupByLookupKey(lookupService.securityLevel, securityLevel.id);
                }
                return lookupService.getLookupByLookupKey(lookupService.securityLevel, securityLevel);
            };

            var indicator = new Indicator();
            SentItemCentralArchive.prototype.getSecurityLevelIndicator = function (securityLevel) {
                return indicator.getSecurityLevelIndicator(securityLevel);
            };

            SentItemCentralArchive.prototype.getPriorityLevelIndicator = function (priorityLevel) {
                return indicator.getPriorityLevelIndicator(priorityLevel);
            };

            SentItemCentralArchive.prototype.getAttachmentsIndicator = function () {
                return indicator.getAttachmentsIndicator();
            };

            SentItemCentralArchive.prototype.getLinkedDocumentsIndicator = function () {
                return indicator.getLinkedDocumentsIndicator();
            };

            SentItemCentralArchive.prototype.getOriginalCopyIndicator = function () {
                return indicator.getOriginalCopyIndicator(this.type);
            };

            /*SentItemCentralArchive.prototype.getFollowUpStatusIndicator = function(SentItemCentralArchive){
                return indicator.getFollowUpStatusIndicator(SentItemCentralArchive);
            };*/

            /*SentItemCentralArchive.prototype.getDueDateStatusIndicator = function (dueDate) {
                return indicator.getDueDateStatusIndicator(dueDate);
            };*/

            /*  SentItemCentralArchive.prototype.getTagsIndicator = function (tagsCount) {
                  return indicator.getTagsIndicator(tagsCount);
              };*/

            /*SentItemCentralArchive.prototype.getDocClassIndicator = function (docType) {
                return indicator.getDocClassIndicator(docType);
            };*/

            /*   SentItemCentralArchive.prototype.getReassignedIndicator = function (reassigned) {
                   return indicator.getReassignedIndicator(reassigned);
               };

               SentItemCentralArchive.prototype.getOpenedIndicator = function (reassigned) {
                   return indicator.getOpenedIndicator(reassigned);
               };*/

            SentItemCentralArchive.prototype.getFollowUpStatusIndicator = function (followupStatus) {
                return indicator.getFollowUpStatusIndicator(followupStatus);
            };

            SentItemCentralArchive.prototype.setCorrespondenceService = function (service) {
                correspondenceService = service;
                return this;
            };

            SentItemCentralArchive.prototype.getTagsCount = function () {
                return 0;
                /*Tags property missing*/
            };

            SentItemCentralArchive.prototype.getCommentsCount = function () {
                return 0;
                /*Comments property missing*/
            };

            /**
             * @description to get documentClass,vsId.
             * @return {{documentClass: *, vsId: *}}
             */
            SentItemCentralArchive.prototype.getInfo = function () {
                return correspondenceService.getCorrespondenceInformation(this);
            };

            SentItemCentralArchive.prototype.launchWorkFlow = function ($event, action, tab) {
                return correspondenceService.launchCorrespondenceWorkflow(this, $event, action, tab, false, true);
            };
            SentItemCentralArchive.prototype.launchWorkFlowFromPredefinedAction = function ($event, action, tab, actionMembers) {
                return correspondenceService.launchCorrespondenceWorkflow(this, $event, action, tab, false, true, false, actionMembers);
            };
            SentItemCentralArchive.prototype.quickSendLaunchWorkflow = function ($event, tab, action, isDeptIncoming, isDeptSent, fromLaunchPopup) {
                action = action || 'forward';
                return correspondenceService.openQuickSendDialog(this, tab, action, false, true, fromLaunchPopup, $event);
            };


            SentItemCentralArchive.prototype.manageDocumentAttachments = function ($event) {
                var info = this.getInfo();
                return managerService.manageDocumentAttachments.apply(managerService, [this, info.vsId, info.documentClass, info.title, $event]);
            };


            /**
             * @description Opens the new viewer for central archive sent items
             * @param actions
             * @param queueName
             * @param $event
             * @returns {*}
             */
           /* SentItemCentralArchive.prototype.viewNewCentralArchiveSentItem = function (actions, queueName, $event) {
                var model = {
                    vsId: this.vsId,
                    docClassName: 'outgoing'
                };
                return viewDocumentService.viewDepartmentSentItemDocument(model, actions, queueName, $event);
            };*/

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('SentItemCentralArchive', 'init', this);
        }
    })
};
