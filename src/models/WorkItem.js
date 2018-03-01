module.exports = function (app) {
    app.factory('WorkItem', function (CMSModelInterceptor,
                                      langService,
                                      Indicator) {
        'ngInject';

        return function WorkItem(model) {
            var self = this,
                correspondenceService = null,
                managerService = null,
                downloadService = null;
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
                return this;
            };
            WorkItem.prototype.setManagerService = function (service) {
                managerService = service;
                return this;
            };
            WorkItem.prototype.setDownloadService = function (service) {
                downloadService = service;
                return this;
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
            /**
             * @description to start launch workflow item.
             * @param $event
             * @param action
             * @param tab
             * @returns {promise|*}
             */
            WorkItem.prototype.launchWorkFlow = function ($event, action, tab) {
                return correspondenceService.launchCorrespondenceWorkflow(this, $event, action, tab);
            };

            WorkItem.prototype.setStar = function (value) {
                this.generalStepElm.starred = value;
                return this;
            };

            WorkItem.prototype.isStarred = function () {
                return !!this.generalStepElm.starred;
            };

            WorkItem.prototype.toggleStar = function (ignoreMessage) {
                return this.isStarred() ? this.unStar(ignoreMessage) : this.star(ignoreMessage);
            };

            WorkItem.prototype.star = function (ignoreMessage) {
                return correspondenceService.starWorkItem(this, ignoreMessage);
            };

            WorkItem.prototype.unStar = function (ignoreMessage) {
                return correspondenceService.unStarWorkItem(this, ignoreMessage);
            };

            WorkItem.prototype.terminate = function ($event, ignoreMessage) {
                return correspondenceService.terminateWorkItem(this, $event, ignoreMessage);
            };

            WorkItem.prototype.addToFavorite = function (ignoreMessage) {
                return correspondenceService.addCorrespondenceToFavorite(this, ignoreMessage);
            };

            WorkItem.prototype.removeFromFavorite = function (ignoreMessage) {
                return correspondenceService.deleteCorrespondenceFromFavorite(this, ignoreMessage);
            };

            WorkItem.prototype.viewAsGroupInbox = function () {
                return correspondenceService.viewCorrespondenceGroupMail.apply(correspondenceService, arguments);
            };

            WorkItem.prototype.view = function () {
                return correspondenceService.viewCorrespondence.apply(correspondenceService, arguments);
            };
            WorkItem.prototype.manageDocumentComments = function ($event) {
                var info = this.getInfo();
                return managerService.manageDocumentComments.apply(managerService, [info.vsId, info.title, $event]);
            };
            WorkItem.prototype.manageDocumentAttachments = function ($event) {
                var info = this.getInfo();
                return managerService.manageDocumentAttachments.apply(managerService, [info.vsId, info.documentClass, info.title, $event]);
            };
            WorkItem.prototype.manageDocumentLinkedDocuments = function ($event) {
                var info = this.getInfo();
                return managerService.manageDocumentLinkedDocuments.apply(managerService, [info.vsId, info.documentClass, info.title, $event]);
            };
            WorkItem.prototype.manageDocumentEntities = function ($event) {
                var info = this.getInfo();
                return managerService.manageDocumentEntities.apply(managerService, [info.vsId, info.documentClass, info.title, $event]);
            };
            WorkItem.prototype.manageDocumentCorrespondence = function ($event) {
                var info = this.getInfo();
                return managerService.manageDocumentCorrespondence.apply(managerService, [info.vsId, info.documentClass, info.title, $event]);
            };
            WorkItem.prototype.manageDocumentContent = function ($event) {
                var info = this.getInfo();
                return managerService.manageDocumentContent.apply(managerService, [info.vsId, info.documentClass, info.title, $event])
            };
            WorkItem.prototype.mainDocumentDownload = function ($event) {
                var info = this.getInfo();
                return downloadService.controllerMethod
                    .mainDocumentDownload(info.vsId, $event);
            };
            WorkItem.prototype.compositeDocumentDownload = function ($event) {
                var info = this.getInfo();
                return downloadService.controllerMethod
                    .compositeDocumentDownload(info.vsId, $event);
            };
            WorkItem.prototype.addToFolder = function (folders, $event, showInbox) {
                return correspondenceService
                    .showAddWorkItemToFolder(this, folders, $event, showInbox)
                    .then(function (result) {
                        return result[0];
                    });
            };
            WorkItem.prototype.getFolderId = function () {
                return this.generalStepElm.folderId;
            };
            WorkItem.prototype.getFullSerial = function () {
                var info = this.getInfo();
                return info.isPaper || info.documentClass === 'incoming' || (info.documentClass === 'outgoing' && info.status >= 24) || (info.documentClass === 'internal' && info.status >= 24) ? info.docFullSerial : null;
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('WorkItem', 'init', this);
        }
    })
};