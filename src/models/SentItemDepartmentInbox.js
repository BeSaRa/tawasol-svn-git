module.exports = function (app) {
    app.factory('SentItemDepartmentInbox', function (CMSModelInterceptor,
                                                     Indicator,
                                                     langService,
                                                     managerService,
                                                     lookupService,
                                                     _,
                                                     rootEntity,
                                                     downloadService) {
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

            SentItemDepartmentInbox.prototype.getSubject = function () {
                return this.docSubject;
            };

            SentItemDepartmentInbox.prototype.getTranslatedType = function () {
                return this.type === 0 ? langService.get('original') : langService.get('copy');
            };

            SentItemDepartmentInbox.prototype.hasContent = function () {
                return true;
                // return this.contentSize;
            };

            /**
             * @description Checks if correspondence already has any active sequential workflow
             * @returns {boolean}
             */
            SentItemDepartmentInbox.prototype.hasActiveSeqWF = function () {
                // return false as property is missing in sent items
                return false;
            };

            /**
             * @description Returns the security level lookup based on value from database
             * @returns {*}
             */
            SentItemDepartmentInbox.prototype.getSecurityLevelLookup = function () {
                var securityLevel = this.securityLevel;
                if (securityLevel.hasOwnProperty('lookupKey')) {
                    return securityLevel;
                } else if (securityLevel.hasOwnProperty('id')) {
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
            SentItemDepartmentInbox.prototype.launchWorkFlowFromPredefinedAction = function ($event, action, tab, actionMembers) {
                return correspondenceService.launchCorrespondenceWorkflow(this, $event, action, tab, false, true, false, actionMembers);
            };
            SentItemDepartmentInbox.prototype.quickSendLaunchWorkflow = function ($event, tab, action) {
                action = action || 'forward';
                return correspondenceService.openQuickSendDialog(this, tab, action, false, true, $event);
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

            /**
             * @description Opens the new viewer for department sent items
             * @param actions
             * @param queueName
             * @param $event
             * @returns {*}
             */
            SentItemDepartmentInbox.prototype.viewNewG2GPendingItem = function (actions, queueName, $event) {
                var model = {
                    vsId: this.vsId,
                    docClassName: 'outgoing'
                };
                return viewDocumentService.viewG2GPendingItemDocument(model, actions, queueName, $event);
            };

            /**
             * @description Checks if the security level is private/personal for given document
             * @returns {boolean}
             */
            SentItemDepartmentInbox.prototype.isPrivateSecurityLevel = function () {
                if (this.securityLevel.hasOwnProperty('lookupKey')) {
                    return this.securityLevel.lookupKey === 4;
                } else if (this.securityLevel.hasOwnProperty('id')) {
                    return this.securityLevel.id === 4;
                }
                return this.securityLevel === 4;
            };
            /**
             * @description check if subSiteTo internal RegOu
             */
            SentItemDepartmentInbox.prototype.isSubSiteToInternalRegOu = function () {
                return _.startsWith(this.subSiteToId, "1");
            };

            SentItemDepartmentInbox.prototype.canSendByFax = function () {
                return rootEntity.returnRootEntity().rootEntity.faxEnabled;
            };

            SentItemDepartmentInbox.prototype.mainDocumentDownload = function ($event) {
                return downloadService.controllerMethod
                    .mainDocumentDownload(this, $event);
            };
            SentItemDepartmentInbox.prototype.compositeDocumentDownload = function ($event) {
                return downloadService.controllerMethod
                    .compositeDocumentDownload(this, $event);
            };
            SentItemDepartmentInbox.prototype.getMainDocumentEmailContent = function ($event) {
                var info = this.getInfo();
                downloadService.getMainDocumentEmailContent(info.vsId, info.docClassId);
            };
            SentItemDepartmentInbox.prototype.getCompositeDocumentEmailContent = function ($event) {
                var info = this.getInfo();
                downloadService.getCompositeDocumentEmailContent(info.vsId, info.docClassId);
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('SentItemDepartmentInbox', 'init', this);
        }
    })
};
