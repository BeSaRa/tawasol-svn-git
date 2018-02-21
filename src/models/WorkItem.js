module.exports = function (app) {
    app.factory('WorkItem', function (CMSModelInterceptor,
                                      langService,
                                      Indicator) {
        'ngInject';

        return function WorkItem(model) {
            var self = this, correspondenceService = null;
            self.generalStepElm = null;
            self.folder = null;
            self.mainClassification = null;
            self.subClassification = null;
            self.creatorOu = null;
            self.registeryOu = null;
            self.securityLevel = null;
            self.priorityLevel = null;
            self.docType = null;
            self.senderInfo = null;
            self.action = null;
            self.siteInfo = null;
            self.fromRegOu = null;
            self.toRegOu = null;
            self.fromOuInfo = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);
            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            WorkItem.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the subject of the workitem. It is done to make it similar to any model request of getTranslatedName
             */
            WorkItem.prototype.getTranslatedName = function () {
                return this.generalStepElm.docSubject;
            };

            WorkItem.prototype.getNames = function () {
                return this.generalStepElm.docSubject;
            };

            /**
             * @description Get the status of entity name as Active or Inactive instead of true or false.
             * @returns {string}
             */
            WorkItem.prototype.getTranslatedStarred = function () {
                return this.generalStepElm.starred ? langService.get('starred') : langService.get('un_starred');
            };

            WorkItem.prototype.setCorrespondenceService = function (service) {
                correspondenceService = service;
            };
            WorkItem.prototype.hasContent = function () {
                // return correspondenceService.getContentSize(this);
                return true;
            };
            /**
             * @description to get documentClass,vsId.
             * @return {{documentClass: *, vsId: *}}
             */
            WorkItem.prototype.getInfo = function () {
                return correspondenceService.getCorrespondenceInformation(this);
            };

            /**
             * @description Get the status of Ready To Export Outgoing as Active or Inactive instead of true or false.
             * @returns {string}
             */
            WorkItem.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };


            var indicator = new Indicator();
            WorkItem.prototype.getSecurityLevelIndicator = function (securityLevel) {
                return indicator.getSecurityLevelIndicator(securityLevel);
            };

            WorkItem.prototype.getPriorityLevelIndicator = function (priorityLevel) {
                return indicator.getPriorityLevelIndicator(priorityLevel);
            };

            WorkItem.prototype.getAttachmentsIndicator = function () {
                return indicator.getAttachmentsIndicator();
            };

            WorkItem.prototype.getLinkedDocumentsIndicator = function () {
                return indicator.getLinkedDocumentsIndicator();
            };

            WorkItem.prototype.getFollowUpStatusIndicator = function (followupStatus) {
                return indicator.getFollowUpStatusIndicator(followupStatus);
            };

            WorkItem.prototype.getDueDateStatusIndicator = function (docClass, dueDate) {
                return indicator.getDueDateStatusIndicator(docClass, dueDate);
            };

            WorkItem.prototype.getTagsIndicator = function (tagsCount) {
                return indicator.getTagsIndicator(tagsCount);
            };

            WorkItem.prototype.getDocTypeIndicator = function (docType) {
                return indicator.getDocTypeIndicator(docType);
            };

            WorkItem.prototype.getReassignedIndicator = function (reassigned) {
                return indicator.getReassignedIndicator(reassigned);
            };

            WorkItem.prototype.getOpenedIndicator = function (reassigned) {
                return indicator.getOpenedIndicator(reassigned);
            };

            WorkItem.prototype.getIsPaperIndicator = function (isPaper) {
                return indicator.getIsPaperIndicator(isPaper);
            };

            WorkItem.prototype.getWobNumber = function () {
                return this.generalStepElm.workObjectNumber;
            };

            WorkItem.prototype.barcodePrint = function ($event) {
                return correspondenceService.correspondencePrintBarcode(this, $event);
            };

            WorkItem.prototype.getTagsCount = function ($event) {
                return this.generalStepElm.tagsNO ? this.generalStepElm.tagsNO : 0;
            };

            WorkItem.prototype.getCommentsCount = function ($event) {
                return this.generalStepElm.commentsNO ? this.generalStepElm.commentsNO : 0;
            };


            WorkItem.prototype.sendToReadyToExport = function () {
                return correspondenceService.sendCorrespondenceToReadyToExport(this);
            };

            WorkItem.prototype.correspondenceBroadcast = function ($event) {
                return correspondenceService.broadcastCorrespondence(this, $event);
            };

            WorkItem.prototype.needApprove = function () {
                return this.generalStepElm.docStatus < 24 && !this.generalStepElm.addMethod;
            };

            WorkItem.prototype.getReceivedDate = function () {
                return this.generalStepElm.receivedDate;
            };

            WorkItem.prototype.hasDocumentClass = function (documentClass) {
                return this.getInfo().documentClass.toLowerCase() === documentClass.toLowerCase();
            };

            WorkItem.prototype.isBroadcasted = function () {
                return this.generalStepElm.isBrodcasted;
            };

            WorkItem.prototype.launchWorkFlow = function ($event, action, tab) {
                return correspondenceService.launchCorrespondenceWorkflow(this, $event, action, tab);
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('WorkItem', 'init', this);
        }
    })
};