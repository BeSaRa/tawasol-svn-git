module.exports = function (app) {
    app.factory('EventHistory', function (CMSModelInterceptor,
                                          langService,
                                          Indicator,
                                          correspondenceService,
                                          attachmentService) {
        'ngInject';
        return function EventHistory(model) {
            var self = this;
            self.id = null;
            self.documentVSID = null;
            self.documentCreationDate = null;
            self.workflowActionId = null;
            self.documentStatusId = null;
            self.actionDate = null;
            self.userFromId = null;
            self.userToId = null;
            self.userFromOuId = null;
            self.userToOuId = null;
            self.queueId = null;
            self.docSubject = null;
            self.comments = null;
            self.docClassId = null;
            self.docFullSerial = null;
            self.sitesInfoTo = null;
            self.sitesInfoCC = null;
            self.securityLevel = null;
            self.ouId = null;
            self.wfId = null;
            self.wobNum = null;
            self.workflowActionInfo = null;
            self.documentStatusInfo = null;
            self.ouInfo = null;
            self.userFromInfo = null;
            self.userToInfo = null;
            self.userFromOuInfo = null;
            self.userToOuInfo = null;
            self.docClassName = null;
            self.mainSiteInfo = [];
            self.subSiteInfo = [];

            // need from backend
            self.priorityLevel = null;
            self.followUpStatus = null;

            if (model)
                angular.extend(this, model);

            EventHistory.prototype.getTranslatedName = function () {
                return this.docSubject;
            };

            EventHistory.prototype.getTranslatedUserFrom = function (reverse) {
                return (!this.userFromInfo) ? '' : langService.current === 'ar' ? (reverse ? this.userFromInfo.enName : this.userFromInfo.arName) : (reverse ? this.userFromInfo.arName : this.userFromInfo.enName);
            };

            EventHistory.prototype.getTranslatedUserTo = function (reverse) {
                return (!this.userToInfo) ? '' : langService.current === 'ar' ? (reverse ? this.userToInfo.enName : this.userToInfo.arName) : (reverse ? this.userToInfo.arName : this.userToInfo.enName);
            };

            EventHistory.prototype.getTranslatedOrganization = function (reverse) {
                return (!this.ouInfo) ? '' : langService.current === 'ar' ? (reverse ? this.ouInfo.enName : this.ouInfo.arName) : (reverse ? this.ouInfo.arName : this.ouInfo.enName);
            };

            EventHistory.prototype.getTranslatedAction = function (reverse) {
                var action = (this.workflowActionId) ? this.workflowActionInfo : (this.documentStatusInfo ? this.documentStatusInfo : '');
                return langService.current === 'ar'
                    ? (reverse ? action.enName : action.arName)
                    : (reverse ? action.arName : action.enName);
            };

            /**
             * @description to get documentClass,vsId.
             * @return {{documentClass: *, vsId: *}}
             */
            EventHistory.prototype.getInfo = function () {
                return correspondenceService.getCorrespondenceInformation(this);
            };

            EventHistory.prototype.hasContent = function () {
                return true;
                // return this.contentSize;
            };

            /*      EventHistory.prototype.loadDocumentAttachments = function (correspondence) {
                      console.log(correspondence);
                      var self = this;
                      return attachmentService.loadDocumentAttachmentsByVsId(correspondence || this).then(function (attachments) {
                          self.attachments = attachments;
                          return self.attachments;
                      });
                  };*/

            var indicator = new Indicator();
            EventHistory.prototype.getSecurityLevelIndicator = function (securityLevel) {
                return indicator.getSecurityLevelIndicator(securityLevel);
            };

            /*EventHistory.prototype.getPriorityLevelIndicator = function (priorityLevel) {
                return indicator.getPriorityLevelIndicator(priorityLevel);
            };*/

            EventHistory.prototype.getAttachmentsIndicator = function () {
                return indicator.getAttachmentsIndicator();
            };

            EventHistory.prototype.getLinkedDocumentsIndicator = function () {
                return indicator.getLinkedDocumentsIndicator();
            };

            /*EventHistory.prototype.getFollowUpStatusIndicator = function(workItem){
                return indicator.getFollowUpStatusIndicator(workItem);
            };

            EventHistory.prototype.getDueDateStatusIndicator = function(docClass, dueDate){
                return indicator.getDueDateStatusIndicator(docClass, dueDate);
            };*/

            EventHistory.prototype.getTagsIndicator = function (tagsCount) {
                return indicator.getTagsIndicator(tagsCount);
            };

            EventHistory.prototype.getDocTypeIndicator = function (docType) {
                return indicator.getDocTypeIndicator(docType);
            };

            EventHistory.prototype.getCommentsIndicator = function (commentsCounts) {
                return indicator.getCommentsIndicator(commentsCounts);
            };

            EventHistory.prototype.getTagsCount = function ($event) {
                return this.tags && this.tags.length ? this.tags.length : 0;
            };

            EventHistory.prototype.getCommentsCount = function ($event) {
                return this.comments && this.comments.length ? this.comments.length : 0;
            };
            EventHistory.prototype.hisDocumentClass = function (documentClass) {
                return this.getInfo().documentClass.toLowerCase() === documentClass.toLowerCase();
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('EventHistory', 'init', this);
        }
    })
};