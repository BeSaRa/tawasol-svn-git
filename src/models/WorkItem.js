module.exports = function (app) {
    app.factory('WorkItem', function (CMSModelInterceptor,
                                      langService,
                                      Indicator,
                                      Information,
                                      ResolveDefer,
                                      $sce,
                                      $q,
                                      dialog,
                                      moment) {
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
            //self.firstSiteInfo = null;

            // not related to the workItem

            self.exportViaCentralArchive = null;
            self.addedViaCentralArchive = null;

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
             * @description get subject for the workItem i made it to be more convention.
             */
            WorkItem.prototype.getSubject = function () {
                return this.generalStepElm.docSubject;
            };

            /**
             * @description Get the status of entity name as Active or Inactive instead of true or false.
             * @returns {string}
             */
            WorkItem.prototype.getTranslatedStarred = function () {
                return this.generalStepElm.starred ? langService.get('starred') : langService.get('un_starred');
            };

            /**
             * @description Get the translated correspondence site info.
             * @returns {string}
             */
            WorkItem.prototype.getTranslatedCorrespondenceSiteInfo = function () {
                var mainSite, subSite;
                /*if (this.getInfo().documentClass === 'outgoing') {
                    mainSite = new Information(this.firstSiteInfo.mainSite);
                    subSite = (this.firstSiteInfo.subSite) ? new Information(this.firstSiteInfo.subSite) : new Information();
                    return this.firstSiteInfo
                        ? mainSite.getTranslatedName() + (subSite.getTranslatedName() ? (' - ' + subSite.getTranslatedName()) : '')
                        : "";
                }*/
                if (this.siteInfo) {
                    mainSite = new Information(this.siteInfo.mainSite);
                    subSite = (this.siteInfo.subSite) ? new Information(this.siteInfo.subSite) : new Information();
                    return this.siteInfo
                        ? mainSite.getTranslatedName() + (subSite.getTranslatedName() ? (' - ' + subSite.getTranslatedName()) : '')
                        : "";
                }
                return '';
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

            /*Its used */
            WorkItem.prototype.getDueDate = function () {
                return this.generalStepElm.dueDate;
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

            WorkItem.prototype.getDueDateStatusIndicator = function (dueDate) {
                return indicator.getDueDateStatusIndicator(dueDate);
            };

            WorkItem.prototype.getTagsIndicator = function (tagsCount) {
                return indicator.getTagsIndicator(tagsCount);
            };

            WorkItem.prototype.getDocClassIndicator = function (docType) {
                return indicator.getDocClassIndicator(docType);
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

            WorkItem.prototype.getExportViaCentralArchiveIndicator = function (exportViaCentralArchive) {
                return indicator.getExportViaCentralArchiveIndicator(exportViaCentralArchive);
            };

            WorkItem.prototype.getOriginalCopyIndicator = function () {
                new indicator.getOriginalCopyIndicator(this.generalStepElm.orginality);
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
             * @param isDeptIncoming
             * @returns {promise|*}
             */
            WorkItem.prototype.launchWorkFlow = function ($event, action, tab, isDeptIncoming) {
                return correspondenceService.launchCorrespondenceWorkflow(this, $event, action, tab, isDeptIncoming);
            };

            WorkItem.prototype.launchWorkFlowCondition = function ($event, action, tab, isDeptIncoming, callback, confirmationMessage) {
                if (!callback)
                    return $q.reject(callback());

                if (callback(this)) {
                    return confirmationMessage ? dialog.confirmMessage(confirmationMessage) :
                        correspondenceService.launchCorrespondenceWorkflow(this, $event, action, tab, isDeptIncoming);
                }
                return $q.reject(callback());
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
            WorkItem.prototype.viewInboxWorkItem = function (actions, editProperties, editCorrespondence) {
                var info = this.getInfo();
                return correspondenceService.viewCorrespondenceWorkItem.apply(correspondenceService, [info, actions, editProperties, editCorrespondence, false, false, false]);
            };
            WorkItem.prototype.viewNewInboxWorkItem = function (actions, editProperties, editCorrespondence) {
                var info = this.getInfo();
                return correspondenceService.viewCorrespondenceWorkItemNew.apply(correspondenceService, [info, actions, editProperties, editCorrespondence, false, false, false]);
            };
            WorkItem.prototype.manageDocumentComments = function ($event) {
                var info = this.getInfo();
                return managerService.manageDocumentComments.apply(managerService, [info.vsId, info.title, $event]);
            };
            WorkItem.prototype.manageDocumentAttachments = function ($event) {
                var info = this.getInfo();
                return managerService.manageDocumentAttachments.apply(managerService, [this, info.vsId, info.documentClass, info.title, $event]);
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
            WorkItem.prototype.addToFolder = function ($event, showInbox) {
                return correspondenceService
                    .showAddWorkItemToFolder(this, $event, showInbox)
                    .then(function (result) {
                        if(result)
                            return result[0];
                    });
            };
            WorkItem.prototype.getFolderId = function () {
                return this.generalStepElm.folderId;
            };
            WorkItem.prototype.getFullSerial = function () {
                var info = this.getInfo();
                return info.isPaper || info.documentClass === 'incoming' || (info.documentClass === 'outgoing' && info.docStatus >= 24) || (info.documentClass === 'internal' && info.docStatus >= 24) ? info.docFullSerial : null;
            };
            WorkItem.prototype.getFullSerialText = function () {
                return this.getFullSerial() ? this.getFullSerial() : langService.get('no_serial');
            };

            WorkItem.prototype.getFromOUDetails = function () {
                if (this.registeryOu.id === this.fromOuInfo.id) {
                    return this.registeryOu.getTranslatedName();
                }
                return this.fromOuInfo.getTranslatedName() + ' ' + langService.get('in') + ' ' + this.registeryOu.getTranslatedName();
            };
            WorkItem.prototype.isSameOU = function () {
                return this.registeryOu.id === this.fromOuInfo.id;
            };

            WorkItem.prototype.getRegistryOUTranslate = function () {
                return this.registeryOu.getTranslatedName();
            };
            WorkItem.prototype.getOUTranslate = function () {
                return this.fromOuInfo.getTranslatedName();
            };
            WorkItem.prototype.exportViaArchive = function () {
                return this.generalStepElm.exportViaCentralArchive || this.generalStepElm.addedViaCentralArchive;
            };

            WorkItem.prototype.exportWorkItem = function ($event, checkArchive, ignoreMessage) {
                return correspondenceService.exportCorrespondence(this, $event, checkArchive, ignoreMessage);
            };

            WorkItem.prototype.returnWorkItem = function ($event, ignoreMessage) {
                return correspondenceService.returnWorkItem(this, $event, ignoreMessage);
            };

            WorkItem.prototype.returnWorkItemFromCentralArchive = function ($event, ignoreMessage) {
                return correspondenceService.centralArchiveReturn(this, $event, ignoreMessage)
            };
            WorkItem.prototype.approveWorkItem = function ($event, defer, ignoreMessage) {
                var workItem = this;
                return correspondenceService.showApprovedDialog(this, $event, ignoreMessage).then(function (result) {
                    new ResolveDefer(defer);
                    if (result === 'PARIALLY_AUTHORIZED') {
                        return dialog.confirmMessage(langService.get('book_needs_more_signatures_launch_to_user').change({name: workItem.getTranslatedName()}))
                            .then(function () {
                                return workItem.launchWorkFlow($event, 'forward', 'favorites');
                            });
                    }
                    return result;
                });
            };
            WorkItem.prototype.markAsReadUnread = function ($event, ignoreMessage, isGroupMail) {
                return correspondenceService.workItemMarkAsReadUnreadSingle(this, $event, ignoreMessage, isGroupMail);
            };
            /**
             * @description magazine indicators docType [paper , electronic]
             * @param model
             * @return {*}
             */
            WorkItem.prototype.getIndicatorBookType = function (model) {
                var types = [langService.get('electronic'), langService.get('paper')];
                return types[typeof  model.generalStepElm.addMethod === 'undefined' ? 1 : model.generalStepElm.addMethod];
            };
            WorkItem.prototype.getIndicatorPriorityLevel = function (model) {
                return model.priorityLevel[langService.current + 'Name'];
            };
            WorkItem.prototype.getIndicatorPriorityLevelColor = function (model) {
                var colors = ['#27ae60', '#e67e22', '#c0392b'];
                var classes = ['priority-normal-indicator', 'priority-urgent-indicator', 'priority-top-urgent-indicator'];
                return classes[model.priorityLevel.id];
            };
            WorkItem.prototype.getIndicatorSecurityLevel = function (model) {
                return model.securityLevel[langService.current + 'Name'];
            };
            WorkItem.prototype.getIndicatorTransfer = function (model) {
                return model.generalStepElm.isReassigned ? langService.get('reassigned') : null;
            };
            WorkItem.prototype.getBroadCastedText = function (model) {
                return model.generalStepElm.isBrodcasted ? langService.get('broadcasted') : null;
            };
            WorkItem.prototype.getIndicatorDocumentType = function (model) {
                var icons = ['tablet', 'file-document'];
                return icons[typeof  model.generalStepElm.addMethod === 'undefined' ? 1 : model.generalStepElm.addMethod];
            };
            WorkItem.prototype.getIndicatorHasLinkedDoc = function (model) {
                return model.generalStepElm.linkedDocsNO ? langService.get('indicator_doc_has_linked_doc') : null;
            };
            WorkItem.prototype.getIndicatorHasAttachment = function (model) {
                return model.generalStepElm.attachementsNO ? langService.get('indicator_doc_has_attachment') : null;
            };

            WorkItem.prototype.getTypeIcon = function () {
                var icons = ['arrow-up-bold-box', 'arrow-down-bold-box', 'recycle'];
                return icons[this.generalStepElm.docType];
            };

            WorkItem.prototype.getTypeText = function () {
                var typeText = ['indicator_outgoing', 'indicator_incoming', 'indicator_internal'];
                return typeText[this.generalStepElm.docType];
            };

            WorkItem.prototype.isRead = function () {
                return this.generalStepElm.isOpen;
            };

            WorkItem.prototype.getIndicatorDueDate = function () {
                var today = moment(new Date()).startOf('day');
                var recordDueDate = moment(this.generalStepElm.dueDate).startOf('day');
                var diff = recordDueDate.diff(today, 'days');
                var dueDateStatus = (diff < 0) ? 'past' : (diff === 0 ? 'today' : 'future');
                return new Indicator({
                    class: dueDateStatus,
                    tooltip: diff < 0 ? 'indicator_date_passed' : (diff === 0 ? 'indicator_date_today' : 'indicator_date_coming'),
                    text: this.generalStepElm.dueDate
                });

            };

            WorkItem.prototype.isWorkItem = function () {
                return true;
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('WorkItem', 'init', this);
        }
    })
};