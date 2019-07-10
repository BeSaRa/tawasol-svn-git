module.exports = function (app) {
    app.factory('WorkItem', function (CMSModelInterceptor,
                                      langService,
                                      Indicator,
                                      Information,
                                      ResolveDefer,
                                      $sce,
                                      viewDocumentService,
                                      Correspondence,
                                      $q,
                                      dialog,
                                      generator,
                                      moment,
                                      employeeService,
                                      lookupService,
                                      cmsTemplate,
                                      Lookup) {
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
            self.allInternalSites = null;
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
                /*var mainSite, subSite;
                if (this.siteInfo) {
                    mainSite = new Information(this.siteInfo.mainSite);
                    subSite = (this.siteInfo.subSite) ? new Information(this.siteInfo.subSite) : null;
                    return mainSite.getTranslatedName() + (subSite ? (' - ' + subSite.getTranslatedName()) : '');
                }
                return '';*/
                return this.mainSiteSubSiteString.getTranslatedName();
            };

            /**
             * @description Set the main site sub site string to display/sort in the grid
             * @returns {*}
             */
            WorkItem.prototype.setMainSiteSubSiteString = function () {
                this.mainSiteSubSiteString = new Information({
                    arName: '',
                    enName: ''
                });
                if (this.getInfo().documentClass !== 'internal' && this.siteInfo) {
                    var mainSite = new Information(this.siteInfo.mainSite);
                    var subSite = (this.siteInfo.subSite) ? new Information(this.siteInfo.subSite) : null;

                    this.mainSiteSubSiteString.arName = mainSite.getTranslatedNameByLang('ar') + (subSite ? (' - ' + subSite.getTranslatedNameByLang('ar')) : '');
                    this.mainSiteSubSiteString.enName = mainSite.getTranslatedNameByLang('en') + (subSite ? (' - ' + subSite.getTranslatedNameByLang('en')) : '');
                }
                return this;
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
             * @description To get the workItem information
             * @returns {CorrespondenceInfo}
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

            /**
             * @description Returns the security level lookup based on value from database
             * @returns {*}
             */
            WorkItem.prototype.getSecurityLevelLookup = function () {
                var securityLevel = this.generalStepElm.securityLevel;
                if (securityLevel.hasOwnProperty('lookupKey')) {
                    return securityLevel;
                } else if (securityLevel.hasOwnProperty('id')) {
                    return lookupService.getLookupByLookupKey(lookupService.securityLevel, securityLevel.id);
                }
                return lookupService.getLookupByLookupKey(lookupService.securityLevel, securityLevel);
            };

            /**
             * @description Checks if the security level is private/personal for given document
             * @returns {boolean}
             */
            WorkItem.prototype.isPrivateSecurityLevel = function () {
                var securityLevel = this.generalStepElm.securityLevel;
                if (securityLevel instanceof Lookup) {
                    return securityLevel.lookupKey === 4
                }
                return securityLevel === 4;
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
                return indicator.getOriginalCopyIndicator(this.generalStepElm.orginality);
            };

            WorkItem.prototype.getIsTransferredDocumentIndicator = function () {
                // if no incomingVSID, then its directly sent from launch(transferred)
                return indicator.getIsTransferredDocumentIndicator((!this.generalStepElm.incomingVSID));
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

            WorkItem.prototype.sendToReadyToExport = function ($event) {
                return correspondenceService.sendCorrespondenceToReadyToExport(this, $event);
            };

            WorkItem.prototype.correspondenceBroadcast = function ($event) {
                return correspondenceService.broadcastCorrespondence(this, $event);
            };

            WorkItem.prototype.needApprove = function () {
                return this.generalStepElm.docStatus < 24 && !this.generalStepElm.addMethod;
            };

            WorkItem.prototype.hasSingleSignature = function () {
                return this.generalStepElm.signaturesCount && this.generalStepElm.signaturesCount === 1;
            };

            WorkItem.prototype.getReceivedDate = function () {
                return this.generalStepElm.receivedDate;
            };
            WorkItem.prototype.getReceivedTime = function () {
                return this.generalStepElm.receivedTime;
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
             * @param fromSimplePopup
             * @returns {promise|*}
             */
            WorkItem.prototype.launchWorkFlow = function ($event, action, tab, isDeptIncoming, fromSimplePopup) {
                return correspondenceService.launchCorrespondenceWorkflow(this, $event, action, tab, isDeptIncoming, null, fromSimplePopup);
            };
            /**
             * @description to start simple launch workflow item.
             * @param $event
             * @param action
             * @returns {promise|*}
             */
            WorkItem.prototype.replySimple = function ($event, action) {
                return correspondenceService.replySimple(this, $event, action);
            };
            /**
             * @description send the document after approve , this is custom method , don't use it anywhere, just made to use after approve form inbox.
             * @param $event
             * @param action
             * @param tab
             * @param isDeptIncoming
             * @return {promise|*}
             */
            WorkItem.prototype.launchWorkflowByVsIdAfterApprove = function ($event, action, tab, isDeptIncoming) {
                var correspondence = new Correspondence({
                    docClassName: generator.getDocumentClassName(this.generalStepElm.docType),
                    classDescription: generator.getDocumentClassName(this.generalStepElm.docType),
                    docStatus: this.generalStepElm.docStatus,
                    vsId: this.generalStepElm.vsId,
                    securityLevel: this.generalStepElm.securityLevel,
                    ccSitesList: [true], // just to ignore the validation while send
                    toSitesList: [true] // just to ignore the validation while send
                });
                return correspondenceService.launchCorrespondenceWorkflow(correspondence, $event, action, tab, isDeptIncoming)
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
            /**
             * @description Opens(Preview) the viewer for work items
             * @param actions
             * @param editProperties
             * @param editCorrespondence
             * @returns {*}
             */
            WorkItem.prototype.viewInboxWorkItem = function (actions, editProperties, editCorrespondence) {
                var info = this.getInfo();
                return correspondenceService.viewCorrespondenceWorkItem.apply(correspondenceService, [info, actions, editProperties, editCorrespondence, false, false, false]);
            };
            WorkItem.prototype.viewProxyInboxWorkItem = function (actions, editProperties, editCorrespondence) {
                var info = this.getInfo();
                return correspondenceService.viewCorrespondenceProxyWorkItem.apply(correspondenceService, [info, actions, editProperties, editCorrespondence, false, false, false]);
            };
            /*WorkItem.prototype.viewNewInboxWorkItem = function (actions, editProperties, editCorrespondence) {
                var info = this.getInfo();
                return correspondenceService.viewCorrespondenceWorkItemNew.apply(correspondenceService, [info, actions, editProperties, editCorrespondence, false, false, false]);
            };*/
            /**
             * @description Opens(Open) the viewer with details for work items
             * @param actions
             * @param queueName
             * @param $event
             * @returns {*}
             */
            WorkItem.prototype.viewNewWorkItemDocument = function (actions, queueName, $event) {
                return viewDocumentService.viewUserInboxDocument(this, actions, queueName, $event);
            };
            /**
             * @description Opens the new viewer for approved internal items
             * @param actions
             * @param queueName
             * @param $event
             * @returns {*}
             */
            WorkItem.prototype.viewNewApprovedInternalWorkItemDocument = function (actions, queueName, $event) {
                return viewDocumentService.viewApprovedInternalDocument(this, actions, queueName, $event);
            };
            /**
             * @description Opens the new viewer for proxy mail
             * @param actions
             * @param queueName
             * @param $event
             * @returns {*}
             */
            WorkItem.prototype.viewNewProxyDocument = function (actions, queueName, $event) {
                return viewDocumentService.viewUserInboxProxyDocument(this, actions, queueName, $event);
            };
            /**
             * @description view from group inbox documents as full view.
             * @param actions
             * @param queueName
             * @param $event
             * @return {*}
             */
            WorkItem.prototype.viewNewGroupMailDocument = function (actions, queueName, $event) {
                return viewDocumentService.viewGroupMailDocument(this, actions, queueName, $event);
            };

            /**
             * @description view from group inbox documents as full view.
             * @param actions
             * @param queueName
             * @param $event
             * @return {*}
             */
            WorkItem.prototype.viewNewCentralArchiveReadyToExport = function (actions, queueName, $event) {
                return viewDocumentService.viewCentralArchiveReadyToExportDocument(this, actions, queueName, $event);
            };

            /**
             * @description Opens the new viewer for department incoming as workItem
             * @param actions
             * @param queueName
             * @param $event
             * @returns {*}
             */
            WorkItem.prototype.viewNewDepartmentIncomingAsWorkItem = function (actions, queueName, $event) {
                return viewDocumentService.viewDepartmentIncomingAsWorkItemDocument(this, actions, queueName, $event);
            };

            /**
             * @description Opens the new viewer for department incoming as correspondence
             * @param actions
             * @param queueName
             * @param $event
             * @returns {*}
             */
            WorkItem.prototype.viewNewDepartmentIncomingAsCorrespondence = function (actions, queueName, $event) {
                return viewDocumentService.viewDepartmentIncomingAsCorrespondenceDocument(this, actions, queueName, $event);
            };

            /**
             * @description Opens the new viewer for department returned
             * @param actions
             * @param queueName
             * @param $event
             * @returns {*}
             */
            WorkItem.prototype.viewNewDepartmentReturned = function (actions, queueName, $event) {
                return viewDocumentService.viewDepartmentReturnedDocument(this, actions, queueName, $event);
            };

            /**
             * @description Opens the new viewer for department ready to export
             * @param actions
             * @param queueName
             * @param $event
             * @returns {*}
             */
            WorkItem.prototype.viewNewDepartmentReadyToExport = function (actions, queueName, $event) {
                return viewDocumentService.viewDepartmentReadyToExportDocument(this, actions, queueName, $event);
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
                return managerService.manageDocumentLinkedDocuments.apply(managerService, [info.vsId, info.documentClass, info.title, $event, this]);
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
                        if (result)
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

            WorkItem.prototype.resendWorkItem = function ($event) {
                return correspondenceService
                    .openExportCorrespondenceDialog(this, $event, true);
            };

            WorkItem.prototype.returnWorkItem = function ($event, ignoreMessage) {
                return correspondenceService.returnWorkItem(this, $event, ignoreMessage);
            };

            WorkItem.prototype.returnWorkItemFromCentralArchive = function ($event, ignoreMessage) {
                return correspondenceService.centralArchiveReturn(this, $event, ignoreMessage)
            };
            WorkItem.prototype.approveWorkItem = function ($event, defer, ignoreMessage, sendAfterApprove, additionalData) {
                var workItem = this;
                return correspondenceService
                    .showApprovedDialog(this, $event, ignoreMessage, additionalData)
                    .then(function (result) {
                        new ResolveDefer(defer);
                        if (result === 'PARIALLY_AUTHORIZED' && !sendAfterApprove) {
                            return dialog.confirmMessage(langService.get('book_needs_more_signatures_launch_to_user').change({name: workItem.getTranslatedName()}))
                                .then(function () {
                                    return workItem.launchWorkFlow($event, 'forward', 'favorites');
                                });
                        }
                        return result;
                    });
            };

            WorkItem.prototype.approveDocument = function ($event, defer, ignoreMessage) {
                var workItem = this;
                return correspondenceService
                    .showApprovedDialog(this, $event, ignoreMessage)
                    .then(function (result) {
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
                return types[typeof model.generalStepElm.addMethod === 'undefined' ? 1 : model.generalStepElm.addMethod];
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
                return icons[typeof model.generalStepElm.addMethod === 'undefined' ? 1 : model.generalStepElm.addMethod];
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

            WorkItem.prototype.loadThumbnails = function () {
                var self = this;
                return correspondenceService
                    .loadDocumentThumbnails(this)
                    .then(function (result) {
                        self.thumbnails = result;
                        return self.thumbnails;
                    });
            };

            WorkItem.prototype.hasThumbanils = function () {
                return !!this.thumbnails.length;
            };

            WorkItem.prototype.loadVersions = function () {
                return correspondenceService.loadDocumentVersions(this);
            };

            WorkItem.prototype.viewSpecificVersion = function ($event) {
                return correspondenceService.viewSpecificCorrespondenceVersion(this, false, $event);
            };

            WorkItem.prototype.duplicateVersion = function ($event) {
                return correspondenceService.duplicateCurrentCorrespondenceVersion(this, $event);
            };

            WorkItem.prototype.duplicateSpecificVersion = function ($event) {
                return correspondenceService.duplicateSpecificCorrespondenceVersion(this, $event);
            };

            WorkItem.prototype.isComposite = function () {
                return this.generalStepElm.isComposite;
            };

            WorkItem.prototype.isLocked = function () {
                return !!this.generalStepElm.lockingInfo;
            };

            WorkItem.prototype.getLockingInfo = function () {
                if (this.isLocked()) {
                    var info = angular.copy(this.generalStepElm.lockingInfo);
                    info.lockingTime = generator.getDateFromTimeStamp(info.lockingTime, true);
                    return info;
                }
                return null;
            };

            WorkItem.prototype.isLockedByCurrentUser = function () {
                var info = this.getLockingInfo();
                if (!info) return false;
                return (info && info.domainName.toLowerCase() === employeeService.getEmployee().domainName.toLowerCase());
            };

            WorkItem.prototype.getLockingUserInfo = function () {
                return (this.isLocked() && this.generalStepElm.lockingInfo.lockingUserInfo)
                    ? new Information(this.generalStepElm.lockingInfo.lockingUserInfo)
                    : new Information();
            };
            WorkItem.prototype.getLockingUserDateTime = function () {
                return (this.isLocked() && this.generalStepElm.lockingInfo.lockingTime)
                    ? generator.getDateFromTimeStamp(this.generalStepElm.lockingInfo.lockingTime, true)
                    : '';
            };

            WorkItem.prototype.getLockedWorkItemIndicator = function () {
                return indicator.getLockedWorkItemIndicator(this);
            };

            WorkItem.prototype.unlockWorkItem = function ($event) {
                return correspondenceService.unlockWorkItem(this, false, $event);
            };
            /**
             * @description Handle the export/resend properties
             * @param $event
             * @returns {*}
             */
            WorkItem.prototype.handleExportPropertiesForSend = function ($event) {
                delete this.exportType;
                delete this.relatedThings;
                delete this.model;
                delete this.partialExportList;
                delete this.exportOptions;
                return this;
            };

            WorkItem.prototype.editCorrespondenceInDesktop = function () {
                return correspondenceService.editWordInDesktop(this);
            };

            WorkItem.prototype.openSendSMSDialog = function ($event) {
                return correspondenceService.openSendSMSDialog(this, $event);
            };

            WorkItem.prototype.openSendFaxDialog = function ($event) {
                return correspondenceService.openSendFaxDialog(this, $event);
            };

            WorkItem.prototype.createReply = function ($event) {
                if (this.getInfo().documentClass === 'incoming') {
                    return dialog.showDialog({
                        $event: $event || null,
                        templateUrl: cmsTemplate.getPopup('create-reply-confirm'),
                        controller: 'createReplyPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        locals: {
                            record: angular.copy(this)
                        }
                    });
                }
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('WorkItem', 'init', this);
        }
    })
};
