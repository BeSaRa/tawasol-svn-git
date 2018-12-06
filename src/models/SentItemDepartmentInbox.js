module.exports = function (app) {
    app.factory('SentItemDepartmentInbox', function (CMSModelInterceptor,
                                                     Indicator,
                                                     langService,
                                                     managerService,
                                                     lookupService) {
        'ngInject';
        return function SentItemDepartmentInbox(model) {
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


            SentItemDepartmentInbox.prototype.setViewDocumentService = function (service) {
                viewDocumentService = service;
                return this;
            };

            SentItemDepartmentInbox.prototype.getTranslatedName = function () {
                return this.docSubject;
            };

            SentItemDepartmentInbox.prototype.getTranslatedType = function () {
                return this.type === 0 ? langService.get('original') : langService.get('copy');
            };


            /**
             * @description Returns the security level lookup based on value from database
             * @returns {*}
             */
            SentItemDepartmentInbox.prototype.getSecurityLevelLookup = function () {
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
            SentItemDepartmentInbox.prototype.getSecurityLevelIndicator = function (securityLevel) {
                return indicator.getSecurityLevelIndicator(securityLevel);
            };

            SentItemDepartmentInbox.prototype.getPriorityLevelIndicator = function (priorityLevel) {
                return indicator.getPriorityLevelIndicator(priorityLevel);
            };

            SentItemDepartmentInbox.prototype.getAttachmentsIndicator = function () {
                return indicator.getAttachmentsIndicator();
            };

            SentItemDepartmentInbox.prototype.getLinkedDocumentsIndicator = function () {
                return indicator.getLinkedDocumentsIndicator();
            };

            SentItemDepartmentInbox.prototype.getOriginalCopyIndicator = function () {
                return indicator.getOriginalCopyIndicator(this.type);
            };

            /*SentItemDepartmentInbox.prototype.getFollowUpStatusIndicator = function(sentItemDepartmentInbox){
                return indicator.getFollowUpStatusIndicator(sentItemDepartmentInbox);
            };*/

            /*SentItemDepartmentInbox.prototype.getDueDateStatusIndicator = function (dueDate) {
                return indicator.getDueDateStatusIndicator(dueDate);
            };*/

            /*  SentItemDepartmentInbox.prototype.getTagsIndicator = function (tagsCount) {
                  return indicator.getTagsIndicator(tagsCount);
              };*/

            /*SentItemDepartmentInbox.prototype.getDocClassIndicator = function (docType) {
                return indicator.getDocClassIndicator(docType);
            };*/

            /*   SentItemDepartmentInbox.prototype.getReassignedIndicator = function (reassigned) {
                   return indicator.getReassignedIndicator(reassigned);
               };

               SentItemDepartmentInbox.prototype.getOpenedIndicator = function (reassigned) {
                   return indicator.getOpenedIndicator(reassigned);
               };*/

            SentItemDepartmentInbox.prototype.getFollowUpStatusIndicator = function (followupStatus) {
                return indicator.getFollowUpStatusIndicator(followupStatus);
            };

            SentItemDepartmentInbox.prototype.setCorrespondenceService = function (service) {
                correspondenceService = service;
                return this;
            };

            SentItemDepartmentInbox.prototype.getTagsCount = function () {
                return 0;
                /*Tags property missing*/
            };

            SentItemDepartmentInbox.prototype.getCommentsCount = function () {
                return 0;
                /*Comments property missing*/
            };

            /**
             * @description to get documentClass,vsId.
             * @return {{documentClass: *, vsId: *}}
             */
            SentItemDepartmentInbox.prototype.getInfo = function () {
                return correspondenceService.getCorrespondenceInformation(this);
            };

            SentItemDepartmentInbox.prototype.launchWorkFlow = function ($event, action, tab) {
                return correspondenceService.launchCorrespondenceWorkflow(this, $event, action, tab, false, true);
            };


            SentItemDepartmentInbox.prototype.manageDocumentAttachments = function ($event) {
                var info = this.getInfo();
                return managerService.manageDocumentAttachments.apply(managerService, [this, info.vsId, info.documentClass, info.title, $event]);
            };


            /**
             * @description Opens the new viewer for department sent items
             * @param actions
             * @param queueName
             * @param $event
             * @returns {*}
             */
            SentItemDepartmentInbox.prototype.viewNewDepartmentSentItem = function (actions, queueName, $event) {
                var model = {
                    vsId: this.vsId,
                    docClassName: 'outgoing'
                };
                return viewDocumentService.viewDepartmentSentItemDocument(model, actions, queueName, $event);
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('SentItemDepartmentInbox', 'init', this);
        }
    })
};