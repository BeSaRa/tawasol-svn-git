module.exports = function (app) {
    app.factory('EventHistory', function (CMSModelInterceptor,
                                          langService,
                                          Indicator,
                                          correspondenceService,
                                          Information,
                                          managerService) {
        'ngInject';
        return function EventHistory(model) {
            var self = this, viewDocumentService,
                exportData = {
                    sent_items_serial_number: 'docFullSerial',
                    label_document_class: function () {
                        return this.docClassIndicator.value;
                    },
                    sent_items_document_subject: 'docSubject',
                    sent_items_receive_date: 'actionDate',
                    sent_items_action: function () {
                        return this.action.getTranslatedName();
                    },
                    sent_items_receiver: function () {
                        return this.receiverInfo.getTranslatedName();
                    },
                    sent_items_correspondence_site: function () {
                        return this.getTranslatedCorrespondenceSiteInfo();
                    }
                };
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

            EventHistory.prototype.setViewDocumentService = function (service) {
                viewDocumentService = service;
                return this;
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
                var action = (this.workflowActionId)
                    ? this.workflowActionInfo
                    : (this.documentStatusInfo ? this.documentStatusInfo : '');
                return langService.current === 'ar'
                    ? (reverse ? action.enName : action.arName)
                    : (reverse ? action.arName : action.enName);
            };

            /**
             * @description Get the translated correspondence site info.
             * @returns {string}
             */
            EventHistory.prototype.getTranslatedCorrespondenceSiteInfo = function () {
                /*var mainSite = angular.isArray(this.mainSiteInfo) && this.mainSiteInfo.length > 0 ? new Information(this.mainSiteInfo[0]) : new Information();
                var subSite = angular.isArray(this.subSiteInfo) && this.subSiteInfo.length > 0 ? new Information(this.subSiteInfo[0]) : null;

                return mainSite.getTranslatedName() + (subSite ? (' - ' + subSite.getTranslatedName()) : '');*/
                return this.mainSiteSubSiteString.getTranslatedName();
            };

            /**
             * @description Set the main site sub site string to display/sort in the grid
             * @returns {*}
             */
            EventHistory.prototype.setMainSiteSubSiteString = function () {
                this.mainSiteSubSiteString = new Information({
                    arName: '',
                    enName: ''
                });
                if (this.getInfo().documentClass !== 'internal') {
                    var mainSite = angular.isArray(this.mainSiteInfo) && this.mainSiteInfo.length > 0 ? new Information(this.mainSiteInfo[0]) : new Information();
                    var subSite = angular.isArray(this.subSiteInfo) && this.subSiteInfo.length > 0 ? new Information(this.subSiteInfo[0]) : null;

                    this.mainSiteSubSiteString.arName = mainSite.getTranslatedNameByLang('ar') + (subSite ? (' - ' + subSite.getTranslatedNameByLang('ar')) : '');
                    this.mainSiteSubSiteString.enName = mainSite.getTranslatedNameByLang('en') + (subSite ? (' - ' + subSite.getTranslatedNameByLang('en')) : '');
                }
                return this;
            };

            /**
             * @description Gets the common properties of the document
             * @returns {CorrespondenceInfo}
             */
            EventHistory.prototype.getInfo = function () {
                return correspondenceService.getCorrespondenceInformation(this);
            };

            EventHistory.prototype.hasContent = function () {
                return true;
                // return this.contentSize;
            };

            /*This is used by due date indicator*/
            EventHistory.prototype.getDueDate = function () {
                return this.dueDate;
            };

            /*      EventHistory.prototype.loadDocumentAttachments = function (correspondence) {

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

            EventHistory.prototype.getPriorityLevelIndicator = function (priorityLevel) {
                return indicator.getPriorityLevelIndicator(priorityLevel);
            };

            EventHistory.prototype.getAttachmentsIndicator = function () {
                return indicator.getAttachmentsIndicator();
            };

            EventHistory.prototype.getLinkedDocumentsIndicator = function () {
                return indicator.getLinkedDocumentsIndicator();
            };

            /*EventHistory.prototype.getFollowUpStatusIndicator = function(workItem){
             return indicator.getFollowUpStatusIndicator(workItem);
             };*/

            EventHistory.prototype.getDueDateStatusIndicator = function (dueDate) {
                return indicator.getDueDateStatusIndicator(dueDate);
            };

            EventHistory.prototype.getTagsIndicator = function (tagsCount) {
                return indicator.getTagsIndicator(tagsCount);
            };

            EventHistory.prototype.getDocClassIndicator = function (docType) {
                return indicator.getDocClassIndicator(docType);
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
            EventHistory.prototype.hasDocumentClass = function (documentClass) {
                return this.getInfo().documentClass.toLowerCase() === documentClass.toLowerCase();
            };

            EventHistory.prototype.manageDocumentAttachments = function ($event) {
                var info = this.getInfo();
                return managerService.manageDocumentAttachments.apply(managerService, [this, info.vsId, info.documentClass, info.title, $event]);
            };

            EventHistory.prototype.viewUserSentItem = function (actions, gridName, $event) {
                return viewDocumentService.viewUserSentDocument(this, actions, gridName, $event);
            };

            EventHistory.prototype.viewSpecificVersion = function ($event) {
                return correspondenceService.viewSpecificCorrespondenceVersion(this, false, $event);
            };
            EventHistory.prototype.duplicateVersion = function ($event) {
                return correspondenceService.duplicateCurrentCorrespondenceVersion(this, $event);
            };
            EventHistory.prototype.duplicateSpecificVersion = function ($event) {
                return correspondenceService.duplicateSpecificCorrespondenceVersion(this, $event);
            };

            EventHistory.prototype.getExportedData = function () {
                return exportData;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('EventHistory', 'init', this);
        }
    })
};
