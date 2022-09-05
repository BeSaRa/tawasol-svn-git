module.exports = function (app) {
    app.factory('WorkItem', function (CMSModelInterceptor,
                                      langService,
                                      Indicator,
                                      Information,
                                      counterService,
                                      ResolveDefer,
                                      $sce,
                                      taskService,
                                      viewDocumentService,
                                      Correspondence,
                                      Attachment,
                                      $q,
                                      dialog,
                                      generator,
                                      Outgoing,
                                      Incoming,
                                      Internal,
                                      moment,
                                      employeeService,
                                      rootEntity,
                                      lookupService,
                                      cmsTemplate,
                                      SignDocumentModel,
                                      sequentialWorkflowService,
                                      encryptionService,
                                      _,
                                      configurationService,
                                      Lookup) {
        'ngInject';

        return function WorkItem(model) {
            var self = this,
                correspondenceService = null,
                exportData = {
                    inbox_serial: function () {
                        return this.generalStepElm.docFullSerial;
                    },
                    subject: function () {
                        return this.generalStepElm.docSubject;
                    },
                    received_date: function () {
                        return this.getReceivedDateTime();
                    },
                    action: function () {
                        return this.action.getTranslatedName();
                    },
                    sender: function () {
                        return this.senderInfo.getTranslatedName()
                    },
                    due_date: function () {
                        return this.generalStepElm.dueDate;
                    },
                    correspondence_sites: function () {
                        return this.getTranslatedCorrespondenceSiteInfo();
                    }
                },
                followUpUserService = null,
                managerService = null,
                downloadService = null,
                attachmentService = null,
                classesMap = {
                    outgoing: Outgoing,
                    incoming: Incoming,
                    internal: Internal
                };

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

            WorkItem.prototype.setAttachmentService = function (service) {
                attachmentService = service;
                return this;
            };
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
            WorkItem.prototype.setFollowUpUserService = function (service) {
                followUpUserService = service;
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
                return indicator.getIsTransferredDocumentIndicator(this.isTransferredDocument());
            };

            WorkItem.prototype.getBroadcastIndicator = function () {
                return indicator.getIsBroadcastedIndicator(this.isBroadcasted());
            };

            WorkItem.prototype.getCommentsIndicator = function () {
                return indicator.getCommentsIndicator(this.getCommentsCount());
            };

            /**
             * @description Checks if the document is transferred
             * if no incomingVSID, then its directly sent from launch(transferred), otherwise its exported to organization
             * @returns {boolean}
             */
            WorkItem.prototype.isTransferredDocument = function () {
                // if no incomingVSID, then its directly sent from launch(transferred)
                return !this.generalStepElm.incomingVSID;
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
            WorkItem.prototype.getReceivedDateTime = function () {
                return this.receivedDateTime;
            };

            WorkItem.prototype.hasDocumentClass = function (documentClass) {
                return this.getInfo().documentClass.toLowerCase() === documentClass.toLowerCase();
            };

            WorkItem.prototype.isBroadcasted = function () {
                return this.generalStepElm.isBrodcasted;
            };

            WorkItem.prototype.hasDueDate = function () {
                return !!this.generalStepElm.dueDate;
            };

            WorkItem.prototype.isDueDatePassed = function () {
                return moment(this.generalStepElm.dueDate).valueOf() < moment().valueOf();
            };

            WorkItem.prototype.isConditionalApproved = function () {
                return !this.getInfo().isPaper && !!this.generalStepElm.dueDate;
            };

            WorkItem.prototype.getConditionalApproveExportDate = function () {
                return this.conditionalApproveExportDate;
            };

            WorkItem.prototype.getConditionalApproveComment = function () {
                return this.conditionalApproveComment;
            };

            WorkItem.prototype.getConditionalApproveIndicator = function () {
                return indicator.getConditionalApproveIndicator(this.isConditionalApproved());
            };

            WorkItem.prototype.showConditionalApproveDetails = function ($event) {
                return dialog.showDialog({
                    $event: $event || null,
                    templateUrl: cmsTemplate.getPopup('conditional-approve-details'),
                    controller: function (dialog, gridService) {
                        'ngInject';
                        var self = this;

                        self.iconsMap = gridService.gridIcons;

                        self.closePopup = function () {
                            dialog.cancel();
                        };
                    },
                    controllerAs: 'ctrl',
                    bindToController: true,
                    locals: {
                        record: angular.copy(this)
                    }
                });
            };
            /**
             * @description to start launch workflow item.
             * @param $event
             * @param action
             * @param tab
             * @param isDeptIncoming
             * @param fromSimplePopup
             * @param reloadCallback
             * @returns {promise|*}
             */
            WorkItem.prototype.launchWorkFlow = function ($event, action, tab, isDeptIncoming, fromSimplePopup, reloadCallback) {
                return correspondenceService.launchCorrespondenceWorkflow(this, $event, action, tab, isDeptIncoming, null, fromSimplePopup, [], reloadCallback);
            };
            WorkItem.prototype.launchWorkFlowFromPredefinedAction = function ($event, action, tab, isDeptIncoming, isDeptSent, actionMembers) {
                return correspondenceService.launchCorrespondenceWorkflow(this, $event, action, tab, isDeptIncoming, isDeptSent, false, actionMembers);
            };
            WorkItem.prototype.quickSendLaunchWorkflow = function ($event, tab, action, isDeptIncoming, isDeptSent, fromLaunchPopup) {
                action = action || 'forward';
                return correspondenceService.openQuickSendDialog(this, tab, action, isDeptIncoming, isDeptSent, fromLaunchPopup, $event);
            };
            WorkItem.prototype.openLaunchSequentialWorkflowDialog = function ($event) {
                return correspondenceService.openLaunchSeqWFDialog(this, $event);
            };

            WorkItem.prototype.getSeqWFId = function () {
                return this.generalStepElm.seqWFId;
            };
            /**
             * @description Checks if correspondence already has any active sequential workflow
             * @returns {boolean}
             */
            WorkItem.prototype.hasActiveSeqWF = function () {
                return !!this.getSeqWFId() && !!this.getSeqWFNextStepId();
            };
            WorkItem.prototype.getSeqWFCurrentStepId = function () {
                return this.generalStepElm.seqWFCurStepId;
            };
            WorkItem.prototype.getSeqWFNextStepId = function () {
                return this.generalStepElm.seqWFNextStepId;
            };
            WorkItem.prototype.getSeqWFBackStepId = function () {
                return this.generalStepElm.seqWFBackStepId;
            }

            /**
             * @description Show seqWF status
             */
            WorkItem.prototype.showSeqWFStatusSteps = function ($event) {
                return sequentialWorkflowService.openWFStatusStepsDialog(this.getSeqWFId(), $event);
            };

            /**
             * @description to start simple launch workflow item.
             * @param $event
             * @param action
             * @param defaultReplyToIdentifier
             * @returns {promise|*}
             */
            WorkItem.prototype.replySimple = function ($event, action, defaultReplyToIdentifier) {
                return correspondenceService.replySimple(this, $event, action, defaultReplyToIdentifier);
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

            WorkItem.prototype.addToIcnArchiveDialog = function ($event) {
                return correspondenceService.openIcnArchiveOptionsDialog(this, $event);
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
             * @param reloadCallback
             * @returns {*}
             */
            WorkItem.prototype.viewNewWorkItemDocument = function (actions, queueName, $event, reloadCallback) {
                var self = this, info = self.getInfo(), pdfViewerEnabled = rootEntity.hasPSPDFViewer();
                if (pdfViewerEnabled && !info.isPaper && employeeService.getEmployee().isFirstViewForApproval && self.checkElectronicSignaturePermission() && self.generalStepElm.isMultiSignature) {
                    return self.openForAnnotation(true, info.docStatus < 23 ? 3 : 1, actions, true);
                } else {
                    return viewDocumentService.viewUserInboxDocument(this, actions, queueName, $event, false, reloadCallback);
                }
            };
            /***
             * @description view document before approve as signed document with draft watermark             * @param actions
             * @param queueName
             * @param $event
             * @returns {*}
             */
            WorkItem.prototype.viewDocumentAsApproved = function (actions, queueName, $event) {
                return viewDocumentService.viewDocumentAsApproved(this, actions, queueName, $event);
            }
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
                var self = this, info = self.getInfo(), pdfViewerEnabled = rootEntity.hasPSPDFViewer();
                if (pdfViewerEnabled && !info.isPaper && employeeService.getEmployee().isFirstViewForApproval && self.checkElectronicSignaturePermission() && self.generalStepElm.isMultiSignature) {
                    return self.openForAnnotation(true, info.docStatus < 23 ? 3 : 1, actions, true);
                } else {
                    return viewDocumentService.viewUserInboxProxyDocument(this, actions, queueName, $event);
                }
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
                return managerService.manageDocumentComments.apply(managerService, [this, info.vsId, info.title, $event]);
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
                return downloadService.controllerMethod
                    .mainDocumentDownload(this, $event);
            };
            WorkItem.prototype.compositeDocumentDownload = function ($event) {
                return downloadService.controllerMethod
                    .compositeDocumentDownload(this, $event);
            };
            WorkItem.prototype.getMainDocumentEmailContent = function ($event) {
                var info = this.getInfo();
                downloadService.getMainDocumentEmailContent(info.vsId, info.docClassId);
            };
            WorkItem.prototype.getCompositeDocumentEmailContent = function ($event) {
                var info = this.getInfo();
                downloadService.getCompositeDocumentEmailContent(info.vsId, info.docClassId);
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

            WorkItem.prototype.returnWorkItemToCentralArchive = function ($event, ignoreMessage) {
                return correspondenceService.returnWorkItemToCentralArchive(this, $event, ignoreMessage);
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

                        if (sendAfterApprove) {
                            return result;
                        }
                        if (result === correspondenceService.authorizeStatus.PARTIALLY_AUTHORIZED.text) {
                            return dialog.confirmMessage(langService.get('book_needs_more_signatures_launch_to_user').change({name: workItem.getTranslatedName()}))
                                .then(function () {
                                    return workItem.launchWorkFlow($event, 'forward', 'favorites');
                                })
                                .catch(function (error) {
                                    return $q.reject('PARTIAL_AUTHORIZE_LAUNCH_CANCELLED');
                                });
                        }
                        return result;
                    });
            };

            WorkItem.prototype.approveDocument = function ($event, defer, ignoreMessage, ignoreLaunch) {
                var workItem = this;
                return correspondenceService
                    .showApprovedDialog(this, $event, ignoreMessage)
                    .then(function (result) {
                        new ResolveDefer(defer);
                        if (result === correspondenceService.authorizeStatus.PARTIALLY_AUTHORIZED.text && !ignoreLaunch) {
                            return dialog.confirmMessage(langService.get('book_needs_more_signatures_launch_to_user').change({name: workItem.getTranslatedName()}))
                                .then(function () {
                                    return workItem.launchWorkFlow($event, 'forward', 'favorites');
                                });
                        }
                        return result;
                    });
            };

            WorkItem.prototype.applyConditionalApprove = function ($event, defer, ignoreMessage, ignoreLaunch) {
                var workItem = this;
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('conditional-approve'),
                        controller: 'conditionalApprovePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            correspondence: workItem
                        },
                        resolve: {
                            comments: function (userCommentService) {
                                'ngInject';
                                return userCommentService.loadUserCommentsForDistribution();
                            }
                        }
                    })
                    .then(function (data) {
                        return correspondenceService
                            .showApprovedDialog(workItem, $event, ignoreMessage, null, data)
                            .then(function (result) {
                                new ResolveDefer(defer);
                                if (result === correspondenceService.authorizeStatus.PARTIALLY_AUTHORIZED.text && !ignoreLaunch) {
                                    return dialog.confirmMessage(langService.get('book_needs_more_signatures_launch_to_user').change({name: workItem.getTranslatedName()}))
                                        .then(function () {
                                            return workItem.launchWorkFlow($event, 'forward', 'favorites');
                                        });
                                }
                                return result;
                            });
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
            WorkItem.prototype.getIndicatorNumberOfReceivedDays = function (model) {
                return model.generalStepElm.numberOfReceivedDays.days;
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
            WorkItem.prototype.getIndicatorSequentialWF = function (model) {
                return model.hasActiveSeqWF() ? langService.get('sequential_workflow') : null;
            };

            WorkItem.prototype.getTypeIcon = function () {
                var icons = [
                    {icon: 'arrow-up-bold-box', class: 'outgoing'},
                    {icon: 'arrow-down-bold-box', class: 'incoming'},
                    {icon: 'recycle', class: ''}];
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

            WorkItem.prototype.isCorrespondenceApprovedBefore = function () {
                return !!this.generalStepElm.isApprovedBefore;
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
                delete this.isGroupExport;
                delete this.relatedThings;
                delete this.model;
                delete this.partialExportList;
                delete this.exportOptions;
                return this;
            };

            WorkItem.prototype.editCorrespondenceInDesktop = function () {
                return correspondenceService.editWordInDesktop(this);
            };

            WorkItem.prototype.editCorrespondenceInOfficeOnline = function () {
                return correspondenceService.editDocumentInOfficeOnline(this);
            };

            WorkItem.prototype.openSendSMSDialog = function ($event) {
                return correspondenceService.openSendSMSDialog(this, null, $event);
            };

            WorkItem.prototype.openSendDocumentURLDialog = function ($event) {
                return correspondenceService.openSendDocumentURLDialog(this, $event);
            };

            WorkItem.prototype.openSendFaxDialog = function ($event) {
                return correspondenceService.openSendFaxDialog(this, $event);
            };

            /**
             * @description Opens the create reply confirmation popup
             * @param $event
             * @param isSpecificVersion
             * @returns {promise}
             */
            WorkItem.prototype.createReply = function ($event, isSpecificVersion) {
                var docClass = this.getInfo().documentClass,
                    record = angular.copy(this);
                if (record.getSeqWFId()) {
                    delete record.generalStepElm.workObjectNumber
                }

                if (docClass === 'incoming' || docClass === 'internal') {
                    return dialog.showDialog({
                        $event: $event || null,
                        templateUrl: cmsTemplate.getPopup('create-reply-confirm'),
                        controller: 'createReplyPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        locals: {
                            record: record,
                            isSpecificVersion: isSpecificVersion
                        },
                        resolve: {
                            versions: function () {
                                'ngInject';
                                return isSpecificVersion ? correspondenceService.loadDocumentVersions(record) : [];
                            }
                        }
                    });
                }
            };

            WorkItem.prototype.checkIfInternalSiteTypeWhenCreateReply = function () {
                var info = this.getInfo();
                if (info.documentClass.toLowerCase() === 'incoming') {
                    return configurationService.INTERNAL_CORRESPONDENCE_SITES_TYPE === this.generalStepElm.siteType;
                }
                return false;
            }

            WorkItem.prototype.createDocumentTask = function ($event) {
                return taskService
                    .controllerMethod
                    .addCorrespondenceTask(this, $event);
            };

            WorkItem.prototype.convertToCorrespondence = function () {
                var self = this;
                var info = this.getInfo();
                self.priorityLevel.lookupKey = self.priorityLevel.id;
                self.securityLevel.lookupKey = self.securityLevel.id;
                return generator.interceptReceivedInstance(['Correspondence', generator.ucFirst(info.documentClass)], new classesMap[info.documentClass]({
                    docSubject: info.title,
                    docStatus: info.docStatus,
                    vsId: info.vsId,
                    securityLevel: new Information(self.securityLevel),
                    priorityLevel: new Information(self.priorityLevel),
                    contentSize: true,
                    externalImportData: self.externalImportData
                }));

            };

            WorkItem.prototype.canSendByFax = function () {
                return rootEntity.returnRootEntity().rootEntity.faxEnabled;
            };

            WorkItem.prototype.getSiteFollowupStatus = function () {
                var info = this.getInfo();
                // followupStatus = 0 (need reply)
                if (info.documentClass === 'outgoing' || info.documentClass === 'incoming') {
                    return this.siteInfo ? this.siteInfo.followupStatus : null;
                }
                return null;
            };

            WorkItem.prototype.endFollowup = function ($event) {
                return correspondenceService.endCorrespondenceFollowup(this, $event);
            };

            WorkItem.prototype.getCorrespondenceSitesCount = function () {
                var info = this.getInfo(),
                    sitesTo = [], sitesCC = [];
                if (info.documentClass === 'outgoing') {
                    sitesTo = this.generalStepElm.sitesInfoTo;
                    sitesCC = this.generalStepElm.sitesInfoCC;
                    if (generator.isJsonString(sitesTo)) {
                        sitesTo = JSON.parse(sitesTo);
                    }
                    if (generator.isJsonString(sitesCC)) {
                        sitesCC = JSON.parse(sitesCC);
                    }
                    return sitesTo.length + sitesCC.length;
                } else if (info.documentClass === 'incoming') {
                    return 1;
                }
                return 0;
            };

            /**
             * @description Check if book has create reply permission
             * @param isSpecificVersion
             * @returns {boolean|boolean}
             */
            WorkItem.prototype.checkCreateReplyPermission = function (isSpecificVersion) {
                var info = this.getInfo(),
                    employee = employeeService.getEmployee(),
                    isAllowed = employee && (
                        (info.documentClass === 'incoming' && employee.hasPermissionTo('CREATE_REPLY'))
                        || (info.documentClass === 'internal' && employee.hasPermissionTo('CREATE_REPLY_INTERNAL'))
                    );

                if (isSpecificVersion) {
                    isAllowed = isAllowed && employee.hasPermissionTo('VIEW_DOCUMENT_VERSION');
                }
                return isAllowed;
            };

            /**
             * @description Check if book has electronic signature permission
             */
            WorkItem.prototype.checkElectronicSignaturePermission = function () {
                var info = this.getInfo();
                var employee = employeeService.getEmployee();
                return employee && (
                    (info.documentClass === 'outgoing' && employee.hasPermissionTo('ELECTRONIC_SIGNATURE'))
                    || (info.documentClass === 'internal' && employee.hasPermissionTo('ELECTRONIC_SIGNATURE_MEMO'))
                );
            };

            WorkItem.prototype.addToMyDirectFollowUp = function () {
                return followUpUserService.addCorrespondenceToMyFollowUp(this).then(function () {
                    return counterService.loadCounters();
                });
            };

            WorkItem.prototype.addToUserFollowUp = function () {
                return followUpUserService.addCorrespondenceToEmployeeFollowUp(this).then(function () {
                    return counterService.loadCounters();
                });
            };

            WorkItem.prototype.addToBroadcastFollowUp = function () {
                return followUpUserService.addCorrespondenceToBroadcastFollowUp(this).then(function () {
                    return counterService.loadCounters();
                });
            };

            WorkItem.prototype.addDocumentContentFile = function (content) {
                if (!content)
                    throw Error('Need To Pass the Content for this work Item');

                var correspondence = this.convertToCorrespondence();
                return correspondenceService.saveDocumentContentFile(correspondence, content);
            };

            WorkItem.prototype.updateDocumentContentByAnnotation = function (content, annotationType) {
                if (!content)
                    throw Error('Need To Pass the Content for this work Item');

                var correspondence = this.convertToCorrespondence();
                return correspondenceService.updateContentByAnnotation(correspondence, content, annotationType);
            };

            WorkItem.prototype.openForAnnotation = function (inboxItem, annotationType, actions, displayInformation) {
                var self = this;
                if (!inboxItem) {
                    return correspondenceService.annotateCorrespondence(self, annotationType);
                }
                return viewDocumentService.viewUserInboxDocument(self, [], 'userInbox', null, true)
                    .then(function (generalStepElementView) {
                        // just to set the seqWFId from the real correspondence
                        self.generalStepElm.seqWFId = generalStepElementView.correspondence.seqWFId;
                        self.generalStepElm.isOfficial = generalStepElementView.correspondence.isOfficial;
                        generalStepElementView.actions = actions;
                        self.fromUserInbox = true;
                        return correspondenceService.annotateCorrespondence(self, annotationType, null, null, displayInformation ? generalStepElementView : false);
                    });
            };

            WorkItem.prototype.openSequentialDocument = function (annotationType, seqWF, actions) {
                var self = this, info = this.getInfo(), step = null,
                    forApproval = employeeService.getEmployee().isFirstViewForApproval && !info.isPaper && info.docStatus < 23 && self.checkElectronicSignaturePermission();
                return viewDocumentService.viewUserInboxDocument(self, actions, 'userInbox', null, true)
                    .then(function (generalStepElementView) {
                        generalStepElementView.actions = actions;
                        self.generalStepElm.isSeqWFBackward = generalStepElementView.generalStepElm.isSeqWFBackward;
                        self.generalStepElm.isOfficial = generalStepElementView.correspondence.isOfficial;
                        if (seqWF) {
                            var step = _.find(seqWF.steps, function (step) {
                                return step.id === generalStepElementView.generalStepElm.seqWFNextStepId;
                            });
                            if (!step) {
                                step = _.find(seqWF.steps, function (step) {
                                    return step.itemOrder === 0;
                                });
                            }
                            return correspondenceService.annotateCorrespondence(self, (forApproval && step.isAuthorizeAndSendStep() ? 3 : annotationType), null, seqWF, generalStepElementView);
                        }
                        return sequentialWorkflowService.loadSequentialWorkflowById(self.getSeqWFId()).then(function (seqWF) {
                            var step = _.find(seqWF.steps, function (step) {
                                return step.id === generalStepElementView.generalStepElm.seqWFNextStepId;
                            });
                            if (!step) {
                                step = _.find(seqWF.steps, function (step) {
                                    return step.itemOrder === 0;
                                });
                            }
                            return correspondenceService.annotateCorrespondence(self, (forApproval && step.isAuthorizeAndSendStep() ? 3 : annotationType), null, seqWF, generalStepElementView);
                        });
                    });
            };

            WorkItem.prototype.openSequentialProxyDocument = function (annotationType, seqWF, actions) {
                var self = this, info = this.getInfo(), step = null,
                    forApproval = employeeService.getEmployee().isFirstViewForApproval && !info.isPaper && info.docStatus < 23 && self.checkElectronicSignaturePermission();
                return viewDocumentService.viewUserInboxProxyDocument(self, actions, 'proxyMail', null, true)
                    .then(function (generalStepElementView) {
                        generalStepElementView.actions = actions;
                        self.generalStepElm.isSeqWFBackward = generalStepElementView.generalStepElm.isSeqWFBackward;
                        if (seqWF) {
                            var step = _.find(seqWF.steps, function (step) {
                                return step.id === generalStepElementView.generalStepElm.seqWFNextStepId;
                            });
                            if (!step) {
                                step = _.find(seqWF.steps, function (step) {
                                    return step.itemOrder === 0;
                                });
                            }
                            return correspondenceService.annotateCorrespondence(self, (forApproval && step.isAuthorizeAndSendStep() ? 3 : annotationType), null, seqWF, generalStepElementView);
                        }
                        return sequentialWorkflowService.loadSequentialWorkflowById(self.getSeqWFId()).then(function (seqWF) {
                            var step = _.find(seqWF.steps, function (step) {
                                return step.id === generalStepElementView.generalStepElm.seqWFNextStepId;
                            });
                            if (!step) {
                                step = _.find(seqWF.steps, function (step) {
                                    return step.itemOrder === 0;
                                });
                            }
                            return correspondenceService.annotateCorrespondence(self, (forApproval && step.isAuthorizeAndSendStep() ? 3 : annotationType), null, seqWF, generalStepElementView);
                        });
                    });
            };

            WorkItem.prototype.prepareSignatureModel = function (pinCode, isComposite, ignoreValidateMultiSignature) {
                return (new SignDocumentModel())
                    .setSignature(this, null)
                    .setIsComposite(isComposite)
                    .setPinCode(pinCode ? encryptionService.encrypt(pinCode) : null)
                    .setValidateMultiSignature(!ignoreValidateMultiSignature);
            };

            WorkItem.prototype.authorizeDocumentByAnnotation = function (signatureModel, content) {
                return correspondenceService.authorizeCorrespondenceByAnnotation(this, signatureModel, content);
            };

            WorkItem.prototype.getSequentialWFIndicator = function () {
                return indicator.getSequentialWFIndicator();
            };

            WorkItem.prototype.displayCompositeMessage = function (pinCode) {
                var composite = this.isComposite();
                return $q(function (resolve) {
                    if (composite) {
                        dialog
                            .confirmMessage(langService.get('document_is_composite'))
                            .then(function () {
                                resolve({
                                    pinCode: pinCode,
                                    composite: true
                                });
                            })
                            .catch(function () {
                                resolve({
                                    pinCode: pinCode,
                                    composite: false
                                });
                            });
                    } else {
                        resolve({
                            pinCode: pinCode,
                            composite: composite
                        });
                    }
                });
            };

            WorkItem.prototype.displayPinCodeMessage = function () {
                var requirePinCode = rootEntity.getGlobalSettings().isDigitalCertificateEnabled() && employeeService.getEmployee().hasPinCodePrompt();
                return $q(function (resolve, reject) {
                    if (!requirePinCode) {
                        resolve(null)
                    } else {
                        dialog
                            .showDialog({
                                templateUrl: cmsTemplate.getPopup('pincode'),
                                controller: 'pinCodePopCtrl',
                                controllerAs: 'ctrl'
                            })
                            .then(function (result) {
                                result ? resolve(result) : reject('PINCODE_MISSING');
                            })
                            .catch(function () {
                                reject('PINCODE_MISSING');
                            });
                    }
                });
            };

            WorkItem.prototype.handlePinCodeAndCompositeThenCompleteAuthorization = function (content, ignoreValidationSignature) {
                var self = this;
                return $q(function (resolve, reject) {
                    self.displayPinCodeMessage()
                        .then(self.displayCompositeMessage.bind(self))
                        .then(function (info) {
                            var signatureModel = self.prepareSignatureModel(info.pinCode, info.composite, ignoreValidationSignature);
                            return info.pinCode === 'PINCODE_MISSING' ? reject(info.pinCode) : resolve(self.authorizeDocumentByAnnotation(signatureModel, content));
                        })
                        .catch(reject);
                });
            };

            WorkItem.prototype.addAnnotationAsAttachment = function (content) {
                var self = this, info = self.getInfo();
                var attachment = new Attachment({
                    docSubject: langService.get('attached_annotation') + ' - ' + (self.generalStepElm.attachementsNO + 1),
                    documentTitle: langService.get('attached_annotation') + ' - ' + (self.generalStepElm.attachementsNO + 1),
                    securityLevel: info.securityLevel,
                    priorityLevel: 1,
                    attachmentType: 0,
                    updateActionStatus: 0,
                    isAnnotation: true,
                    exportStatus: false
                });
                attachment.file = content;
                return attachmentService.addAttachment(info, attachment).then(function (result) {
                    return result;
                })
            };

            WorkItem.prototype.handlePinCodeAndComposite = function () {
                var self = this;
                return $q(function (resolve, reject) {
                    self.displayPinCodeMessage()
                        .then(self.displayCompositeMessage.bind(self))
                        .then(function (info) {
                            var signatureModel = self.prepareSignatureModel(info.pinCode, info.composite);
                            return info.pinCode === 'PINCODE_MISSING' ? reject(info.pinCode) : resolve(signatureModel);
                        })
                        .catch(reject);
                });
            };

            WorkItem.prototype.userCanAnnotate = function () {
                var info = this.getInfo(), self = this;
                if (!info.isPaper && info.docStatus === 25) {
                    return employeeService.hasPermissionTo('MANAGE_ATTACHMENTS');
                } else if (!info.isPaper) {
                    if (info.docStatus === 23 && self.generalStepElm.authorizeByAnnotation && info.documentClass === 'outgoing') {
                        return employeeService.hasPermissionTo('EDIT_OUTGOING_CONTENT');
                    } else if (info.docStatus === 23 && self.generalStepElm.authorizeByAnnotation && info.documentClass === 'internal') {
                        return employeeService.hasPermissionTo('EDIT_INTERNAL_CONTENT');
                    } else if (info.docStatus === 24 && info.documentClass === 'outgoing') {
                        return employeeService.hasPermissionTo('EDIT_OUTGOING_CONTENT');
                    } else if (info.docStatus === 24 && info.documentClass === 'internal') {
                        return employeeService.hasPermissionTo('EDIT_INTERNAL_CONTENT');
                    } else {
                        return employeeService.hasPermissionTo('MANAGE_ATTACHMENTS')
                    }
                } else if (info.isPaper && info.documentClass === 'outgoing') {
                    return employeeService.hasPermissionTo('EDIT_OUTGOING_PAPER');
                } else if (info.isPaper && info.documentClass === 'internal') {
                    return employeeService.hasPermissionTo('EDIT_INTERNAL_CONTENT');
                } else if (info.isPaper && info.documentClass === 'incoming') {
                    return employeeService.hasPermissionTo('EDIT_INCOMING’S_CONTENT');
                }
                return false;
            };

            WorkItem.prototype.getAuthorizeByAnnotationStatus = function () {
                return this.generalStepElm.authorizeByAnnotation;
            };

            WorkItem.prototype.isTerminatedSEQ = function () {
                var info = this.getInfo();
                return info.docStatus === 21 && this.hasActiveSeqWF();
            };

            WorkItem.prototype.isNotPaperAndNotTerminatedSEQ = function () {
                var info = this.getInfo();
                return !info.isPaper && info.docStatus !== 21;
            };

            WorkItem.prototype.isSeqInBackStep = function () {
                return this.generalStepElm.isSeqWFBackward;
            };

            WorkItem.prototype.getExportedData = function () {
                return exportData;
            };

            WorkItem.prototype.hasNormalOrPersonalPrivateSecurityLevel = function () {
                return this.securityLevel.hasOwnProperty('id') ?
                    (this.securityLevel.lookupKey === 1 || this.securityLevel.lookupKey === 4) :
                    (this.securityLevel === 1 || this.securityLevel === 4);
            }
            WorkItem.prototype.getIsInternalOutgoingIndicator = function () {
                var info = this.getInfo();
                return info.documentClass === 'outgoing' ? indicator.getIsInternalOutgoingIndicator(this.isInternalOutgoing()) : false;
            };
            WorkItem.prototype.isInternalOutgoing = function () {
                var info = this.getInfo();
                return info.documentClass === 'outgoing' && this.generalStepElm.hasOwnProperty('isInternal') && this.generalStepElm.isInternal;
            }
            WorkItem.prototype.getIndicatorOutgoingInternal = function (model) {
                var indicator = model.getIsInternalOutgoingIndicator();
                return indicator ? langService.get(indicator.text) : null;
            };
            WorkItem.prototype.transferInternalOutgoing = function ($event) {
                return correspondenceService.transferInternalOutgoing(this);
            }

            WorkItem.prototype.correspondenceSimpleEdit = function () {
                return correspondenceService.correspondenceSimpleEdit(this);
            }
            WorkItem.prototype.getRefDocumentNumber = function () {
                var info = this.getInfo();
                return info.documentClass.toLowerCase() === 'incoming' ? this.generalStepElm.refDocNumber : null;
            }

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('WorkItem', 'init', this);
        }
    })
};
