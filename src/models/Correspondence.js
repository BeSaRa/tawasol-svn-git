module.exports = function (app) {
    app.factory('Correspondence', function (CMSModelInterceptor,
                                            employeeService,
                                            $timeout,
                                            generator,
                                            langService,
                                            counterService,
                                            queueStatusService,
                                            PSPDFKit,
                                            $q,
                                            dialog,
                                            moment,
                                            taskService,
                                            LinkedObject,
                                            Attachment,
                                            DocumentComment,
                                            Site,
                                            _,
                                            Indicator,
                                            Information,
                                            lookupService,
                                            rootEntity,
                                            Lookup,
                                            ResolveDefer,
                                            SignDocumentModel,
                                            sequentialWorkflowService,
                                            encryptionService,
                                            arabicNormalizerService,
                                            cmsTemplate) {
        'ngInject';
        return function Correspondence(model) {
            var self = this,
                correspondenceService,
                managerService,
                attachmentService,
                documentTagService,
                downloadService,
                documentCommentService,
                followUpUserService,
                viewDocumentService;

            self.docSubject = null;
            self.documentTitle = null;
            self.id = null;
            self.createdBy = null;
            self.createdOn = null;
            self.lastModified = null;
            self.lastModifier = null;
            self.mimeType = null;
            self.addMethod = null;
            self.barcode = null;
            self.docFolder = null;
            self.docFullSerial = null;
            self.docNotes = null;
            self.docSerial = null;
            self.docStatus = null; // by default wil be the first Queue the prepare.
            self.docDate = null;
            self.docSubjectSrc = null;
            self.docType = null;
            self.fileCode = null;
            self.fileSerial = null;
            self.fileId = null;
            self.linkedDocs = [];
            self.mainClassification = null;
            self.subClassification = null;
            self.ou = null;
            self.refNumberElementId = null;
            self.registryOU = null;
            self.securityLevel = null;
            self.tags = [];
            self.vsId = null;
            self.approvers = null;
            self.signaturesCount = null;
            self.exportInfo = null;
            self.docClassName = null;
            self.contentSize = 0;
            self.minorVersionNumber = null;
            self.majorVersionNumber = null;
            self.versionStatus = null;
            self.priorityLevel = null;
            self.attachments = [];
            self.reservedDate1 = null;
            self.reservedDate2 = null;
            self.reservedDate3 = null;
            self.reservedStr1 = null;
            self.reservedStr2 = null;
            self.reservedStr3 = null;
            self.reservedStr4 = null;
            self.reservedStr5 = null;
            self.reservedStr6 = null;
            self.reservedInt1 = null;
            self.reservedInt2 = null;
            self.reservedInt3 = null;
            self.reservedInt4 = null;
            self.reservedInt5 = null;
            self.reservedInt6 = null;
            // new properties for GTG
            self.g2gRefNO = null;
            self.g2gVSID = null;
            // not related to the object
            self.documentComments = [];
            self.linkedEntities = [];
            self.linkedEntitiesList = [];
            self.linkedCommentsList = [];
            self.linkedDocList = [];
            self.linkedAttachmenstList = [];
            self.linkedExportedDocsList = [];
            self.isMigrated = false;
            self.seqWFId = null;
            self.isOfficial = false;
            // azure
            self.azureResultItem = null;
            self.highlights = null;
            self.transfered = false;
            self.copyAllAttachments = false;
            self.additionalRegistryOUs = [];

            self.externalImportData = null; // set the value from external data source import popup. used in upload content

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];
            var indicator = new Indicator();

            if (model)
                angular.extend(this, model);

            Correspondence.prototype.setCorrespondenceService = function (service) {
                correspondenceService = service;
                return this;
            };

            Correspondence.prototype.setViewDocumentService = function (service) {
                viewDocumentService = service;
                return this;
            };

            Correspondence.prototype.setFollowUpUserService = function (service) {
                followUpUserService = service;
                return this;
            };

            Correspondence.prototype.getCorrespondenceService = function () {
                return correspondenceService;
            };

            Correspondence.prototype.setAttachmentService = function (service) {
                attachmentService = service;
                return this;
            };
            Correspondence.prototype.setDocumentTagService = function (service) {
                documentTagService = service;
                return this;
            };
            Correspondence.prototype.setDocumentCommentService = function (service) {
                documentCommentService = service;
                return this;
            };
            Correspondence.prototype.setManagerService = function (service) {
                managerService = service;
                return this;
            };
            Correspondence.prototype.setDownloadService = function (service) {
                downloadService = service;
                return this;
            };

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            Correspondence.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated document subject.
             * @returns {string}
             */
            Correspondence.prototype.getTranslatedName = function () {
                return this.docSubject;
            };
            Correspondence.prototype.getTranslatedYesNo = function (fieldName) {
                return this[fieldName] ? langService.get('yes') : langService.get('no');
            };

            Correspondence.prototype.getNames = function () {
                return this.docSubject;
            };

            Correspondence.prototype.getSubject = function () {
                return this.docSubject;
            };

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            Correspondence.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            Correspondence.prototype.getSeqWFId = function () {
                return this.seqWFId;
            };

            Correspondence.prototype.getSeqWFNextStepId = function () {
                return this.seqWFNextStepId;
            };

            /**
             * @description Checks if correspondence already has any active sequential workflow
             * @returns {boolean}
             */
            Correspondence.prototype.hasActiveSeqWF = function () {
                return !!this.getSeqWFId();
            };

            /**
             * @description Show seqWF status
             */
            Correspondence.prototype.showSeqWFStatusSteps = function ($event) {
                return sequentialWorkflowService.openWFStatusStepsDialog(this.getSeqWFId(), $event);
            };

            /**
             * @description Returns the security level lookup based on value from database
             * @returns {*}
             */
            Correspondence.prototype.getSecurityLevelLookup = function () {
                var securityLevel = this.securityLevel;
                if (securityLevel.hasOwnProperty('lookupKey')) {
                    return securityLevel;
                } else if (securityLevel.hasOwnProperty('id')) {
                    return lookupService.getLookupByLookupKey(lookupService.securityLevel, securityLevel.id);
                }
                return lookupService.getLookupByLookupKey(lookupService.securityLevel, securityLevel);
            };


            Correspondence.prototype.getPriorityLevels = function () {
                var lang = langService.current.charAt(0).toUpperCase() + langService.current.substr(1);
                return (this.priorityLevel) ? this.priorityLevel['default' + lang + 'Name'] : "";
                // return _.map(this.priorityLevel, ('default' + lang + 'Name')).join(separator || ',  ');
            };

            Correspondence.prototype.getSecurityLevels = function (separator) {
                var lang = langService.current.charAt(0).toUpperCase() + langService.current.substr(1);
                return _.map(this.securityLevel, ('default' + lang + 'Name')).join(separator || ',  ');
            };
            Correspondence.prototype.getSecurityLevelsArray = function () {
                var lang = langService.current.charAt(0).toUpperCase() + langService.current.substr(1);
                return _.map(this.securityLevel, ('default' + lang + 'Name'));
            };
            Correspondence.prototype.getMethodType = function () {
                return !this.addMethod ? langService.get('outgoing_electronic') : langService.get('outgoing_paper');
            };

            Correspondence.prototype.getMethodTypeInternal = function () {
                return !this.addMethod ? langService.get('internal_electronic') : langService.get('internal_paper');
            };

            Correspondence.prototype.hasVsId = function () {
                return !!this.vsId;
            };
            Correspondence.prototype.hasContent = function () {
                return !!this.contentSize;
            };
            Correspondence.prototype.isCorrespondenceApprovedBefore = function () {
                return !!this.isApprovedBefore;
            };
            Correspondence.prototype.updateDocument = function (skipCheck) {
                return correspondenceService.updateCorrespondence(this, skipCheck);
            };
            Correspondence.prototype.createDocument = function (skipCheck) {
                // in case if no ou and has registryOU set the ou as registryOU for document
                if (!this.ou && this.registryOU)
                    this.ou = this.registryOU;
                return correspondenceService.createCorrespondence(this, skipCheck);
            };
            Correspondence.prototype.saveDocument = function (status, skipCheck) {
                if (status)
                    this.docStatus = queueStatusService.getDocumentStatus(status);
                return this.hasVsId() ? this.updateDocument(skipCheck) : this.createDocument(skipCheck);
            };
            Correspondence.prototype.saveDocumentWithContent = function (information, sendToReview) {
                if (sendToReview)
                    this.docStatus = 4;
                return correspondenceService.addCorrespondenceWithTemplate(this, information);
            };

            Correspondence.prototype.saveDocumentTags = function () {
                if (this.hasVsId()) {
                    return documentTagService.saveDocumentTagsByVsId(this);
                }
                return this.saveDocument();
            };
            Correspondence.prototype.attachmentNameExists = function (name) {
                return _.find(this.attachments, function (attachment) {
                    return attachment.documentTitle === name
                });
            };
            Correspondence.prototype.setNameToAttachment = function (attachment) {
                var name = langService.get('attachment_file');

                if (attachment.documentTitle.trim() === '') {
                    var count = 1;
                    while (this.attachmentNameExists(name + ' ' + count)) {
                        count++;
                    }
                    attachment.documentTitle = name + ' ' + count;
                }
                return attachment;
            };
            Correspondence.prototype.addAttachedFile = function (attachment) {
                var self = this;
                attachment = this.setNameToAttachment(attachment);
                return attachmentService.addAttachment(this, attachment).then(function (result) {
                    self.attachments.push(result);
                    return result;
                });
            };
            //TODO: check with backend if they will make it as ui just or not.
            Correspondence.prototype.deleteAttachedFile = function (attachment) {
                var defer = $q.defer();
                var vsId = attachment.vsId;
                _.remove(this.attachments, function (attachment) {
                    return vsId === attachment.vsId;
                });

                $timeout(function () {
                    defer.resolve(true);
                });
                return defer.promise;
            };
            Correspondence.prototype.deleteBulkAttachedFiles = function (attachments) {
                var self = this, defer = $q.defer(), promises = [];
                for (var i = 0; i < attachments.length; i++) {
                    (function (attachment) {
                        promises.push(self.deleteAttachedFile(attachment));
                    })(attachments[i])
                }
                $q.all(promises).then(function () {
                    defer.resolve(true);
                });
                return defer.promise;
            };
            Correspondence.prototype.loadDocumentAttachments = function (correspondence) {
                var self = this;
                return attachmentService.loadDocumentAttachmentsByVsId(correspondence || this).then(function (attachments) {
                    self.attachments = attachments;
                    return self.attachments;
                });
            };
            Correspondence.prototype.viewAttachedFile = function (attachment, $event) {
                //return attachmentService.viewAttachment(attachment, $event);
            };
            Correspondence.prototype.loadDocumentComments = function (document) {
                var self = this;
                return documentCommentService.loadDocumentCommentsByVsId(document || this).then(function (documentComments) {
                    self.documentComments = documentComments;
                    return documentComments;
                });
            };
            Correspondence.prototype.addComment = function (documentComment) {
                var self = this;
                documentComment
                    .setCreationDate()
                    .setVsId(this.vsId)
                    .setCreator(employeeService.getEmployee());
                return documentCommentService.addDocumentComment(documentComment).then(function (result) {
                    self.documentComments.push(result);
                    return result;
                });
            };

            Correspondence.prototype.saveComment = function (documentComment) {
                var self = this;
                return documentCommentService.updateDocumentComment(documentComment).then(function (result) {
                    self.documentComments = _.map(self.documentComments, function (comment) {
                        if (comment.id === documentComment.id)
                            comment = documentComment;
                        return comment;
                    });
                    return result;
                });
            };

            Correspondence.prototype.deleteComment = function (documentComment) {
                var self = this;
                return documentCommentService.deleteDocumentComment(documentComment).then(function () {
                    self.documentComments = _.filter(self.documentComments, function (comment) {
                        return documentComment.id !== comment.id;
                    });
                    return self.documentComments;
                });
            };
            Correspondence.prototype.deleteBulkComments = function (documentComments) {
                var self = this;
                return documentCommentService.deleteBulkDocumentComments(documentComments).then(function () {
                    var ids = _.map(documentComments, 'id');
                    self.documentComments = _.filter(self.documentComments, function (comment) {
                        return ids.indexOf(comment.id) === -1;
                    });
                    return self.documentComments;
                })
            };

            Correspondence.prototype.addDocumentEntity = function (entity) {
                var self = this;
                self.linkedEntities.push(entity);
                return correspondenceService.addLinkedObject(this);
            };

            Correspondence.prototype.removeDocumentEntities = function (entities) {
                var selfVersion = angular.copy(this), self = this;
                for (var i = 0; i < entities.length; i++) {
                    selfVersion.linkedEntities.splice(selfVersion.linkedEntities.indexOf(entities[i]), 1);
                }
                return correspondenceService.addLinkedObject(selfVersion).then(function () {
                    self.linkedEntities = selfVersion.linkedEntities;
                    return self;
                });
            };

            Correspondence.prototype.addDocumentContentFile = function (content) {
                return correspondenceService.saveDocumentContentFile(this, content);
            };

            Correspondence.prototype.updateDocumentContentByAnnotation = function (content, annotationType) {
                return correspondenceService.updateContentByAnnotation(this, content, annotationType);
            };

            Correspondence.prototype.saveDocumentEntities = function (entity, index) {
                if (entity && index) {
                    this.linkedEntities[index] = entity;
                }
                return correspondenceService.addLinkedObject(this);
            };
            /**
             * @description to get documentClass,vsId.
             * @return {{documentClass: *, vsId: *}}
             */
            Correspondence.prototype.getInfo = function () {
                return correspondenceService.getCorrespondenceInformation(this);
            };

            /**
             * @description Checks if the security level is private/personal for given document
             * @returns {boolean}
             */
            Correspondence.prototype.isPrivateSecurityLevel = function () {
                if (this.securityLevel instanceof Lookup) {
                    return this.securityLevel.lookupKey === 4
                }
                return this.securityLevel === 4;
            };

            Correspondence.prototype.getSecurityLevelIndicator = function (securityLevel) {
                return indicator.getSecurityLevelIndicator(securityLevel);
            };

            Correspondence.prototype.getPriorityLevelIndicator = function (priorityLevel) {
                return indicator.getPriorityLevelIndicator(priorityLevel);
            };

            Correspondence.prototype.getAttachmentsIndicator = function () {
                return indicator.getAttachmentsIndicator();
            };

            Correspondence.prototype.getLinkedDocumentsIndicator = function () {
                return indicator.getLinkedDocumentsIndicator();
            };

            Correspondence.prototype.getFollowUpStatusIndicator = function (correspondence) {
                return indicator.getFollowUpStatusIndicator(correspondence);
            };

            Correspondence.prototype.getDueDateStatusIndicator = function (correspondence) {
                return indicator.getDueDateStatusIndicator(correspondence);
            };

            Correspondence.prototype.getTagsIndicator = function (tagsCount) {
                return indicator.getTagsIndicator(tagsCount);
            };

            Correspondence.prototype.getBroadcastIndicator = function () {
                return indicator.getIsBroadcastedIndicator(this.isBroadcasted());
            };

            Correspondence.prototype.getIsTransferredDocumentIndicator = function () {
                return indicator.getIsTransferredDocumentIndicator(this.isTransferredDocument());
            };

            /**
             * @description Checks if the document is transferred
             * @returns {boolean}
             */
            Correspondence.prototype.isTransferredDocument = function () {
                return this.transfered;
            };

            Correspondence.prototype.getSequentialWFIndicator = function () {
                return indicator.getSequentialWFIndicator();
            };

            Correspondence.prototype.getSiteFollowupDueDateIndicator = function ($event) {
                var info = this.getInfo();
                if (info.documentClass !== 'outgoing' && info.documentClass !== 'incoming') {
                    return false;
                }
                // if endFollowDate has value or follow date is missing, no indicator
                if (this.getSiteFollowupEndDate() || !this.getSiteMaxFollowupDate()) {
                    return false;
                }
                return indicator.getSiteFollowUpDueDateIndicator(this.getSiteMaxFollowupDate());
            };

            Correspondence.prototype.getSiteFollowupEndedIndicator = function ($event) {
                var info = this.getInfo();
                if (info.documentClass !== 'outgoing' && info.documentClass !== 'incoming') {
                    return false;
                }
                // if endFollowDate has value, show indicator
                if (this.getSiteFollowupEndDate()) {
                    return indicator.getSiteFollowUpEndedIndicator(true);
                }
                return false;
            };

            Correspondence.prototype.getTagsCount = function ($event) {
                return this.tags && this.tags.length ? this.tags.length : 0;
            };

            Correspondence.prototype.getCommentsCount = function ($event) {
                //return this.documentComments.length ? this.documentComments.length : 0;

                //TODO: return the actual comment count when it will be implemented in backend
                return 0;
            };

            Correspondence.prototype.setDocClassName = function (docClassName) {
                this.docClassName = docClassName;
                return this;
            };

            Correspondence.prototype.setLinkedDocs = function (linkedDocs) {
                this.linkedDocs = linkedDocs;
                return this;
            };

            Correspondence.prototype.saveLinkedDocuments = function () {
                return correspondenceService.updateLinkedDocuments(this)
            };

            Correspondence.prototype.getTranslatedCreator = function (reverse) {
                if (this.creatorInfo && !this.creatorInfo.isEmpty()) {
                    return langService.current === 'ar' ? (reverse ? this.creatorInfo.enName : this.creatorInfo.arName) : (reverse ? this.creatorInfo.arName : this.creatorInfo.enName)
                } else if (this.createdBy) {
                    return this.createdBy;
                } else {
                    return null;
                }
            };
            /**
             * @description send correspondence to Ready to export;
             * @returns {*}
             */
            Correspondence.prototype.sendToReadyToExport = function ($event) {
                return correspondenceService.sendCorrespondenceToReadyToExport(this, $event);
            };

            Correspondence.prototype.barcodePrint = function ($event) {
                return correspondenceService.correspondencePrintBarcode(this, $event);
            };

            Correspondence.prototype.barcodeReady = function () {
                return this.outgoing && (this.approvers || this.addMethod);
            };

            Correspondence.prototype.prepareReceivedCorrespondence = function () {
                var documentClass = this.getInfo().documentClass;
                this.documentComments = _.map(this.linkedCommentsList, function (item) {
                    return generator.interceptReceivedInstance('DocumentComment', new DocumentComment(item));
                });
                this.attachments = _.map([].concat(this.linkedAttachmentList || [], this.linkedAttachmenstList || [], this.linkedExportedDocsList || []), function (item) {
                    return generator.interceptReceivedInstance('Attachment', new Attachment(item))
                });
                this.linkedDocs = correspondenceService.interceptReceivedCollectionBasedOnEachDocumentClass(this.linkedDocList);
                this.linkedEntities = _.map(this.linkedEntitiesList, function (item) {
                    item.documentClass = documentClass;
                    return generator.interceptReceivedInstance('LinkedObject', new LinkedObject(item));
                });
                return this;
            };

            Correspondence.prototype.filterLinkedDocuments = function (attachments) {
                var attach = _.filter(attachments, function (item) {
                    return item.classDescription !== 'TawasolLinkedAttachment';
                });

                var linked = _.map(this.linkedExportedDocsList, function (item) {
                    return generator.interceptReceivedInstance('Attachment', new Attachment(item))
                });

                return [].concat(attach, linked);
            };

            Correspondence.prototype.correspondenceBroadcast = function ($event) {
                return correspondenceService.broadcastCorrespondence(this, $event);
            };
            Correspondence.prototype.needApprove = function () {
                return this.docStatus < 24 && !this.addMethod;
            };
            Correspondence.prototype.approveDocument = function ($event, defer, ignoreMessage, ignoreLaunch) {
                var correspondence = this;
                return correspondenceService
                    .showApprovedDialog(this, $event, ignoreMessage)
                    .then(function (result) {
                        new ResolveDefer(defer);
                        if (result === correspondenceService.authorizeStatus.PARTIALLY_AUTHORIZED.text && !ignoreLaunch) {
                            return dialog.confirmMessage(langService.get('book_needs_more_signatures_launch_to_user').change({name: correspondence.getTranslatedName()}))
                                .then(function () {
                                    return correspondence.launchWorkFlow($event, 'forward', 'favorites');
                                });
                        }
                        return result;
                    });
            };
            Correspondence.prototype.hasDocumentClass = function (documentClass) {
                return this.getInfo().documentClass.toLowerCase() === documentClass.toLowerCase();
            };
            Correspondence.prototype.launchWorkFlow = function ($event, action, tab, isDeptIncoming, reloadCallback) {
                return correspondenceService.launchCorrespondenceWorkflow(this, $event, action, tab, isDeptIncoming, null, null, [], reloadCallback);
            };
            Correspondence.prototype.launchWorkFlowFromPredefinedAction = function ($event, action, tab, isDeptIncoming, isDeptSent, actionMembers) {
                return correspondenceService.launchCorrespondenceWorkflow(this, $event, action, tab, isDeptIncoming, isDeptSent, false, actionMembers);
            };
            Correspondence.prototype.quickSendLaunchWorkflow = function ($event, tab, action, isDeptIncoming, isDeptSent, fromLaunchPopup) {
                action = action || 'forward';
                return correspondenceService.openQuickSendDialog(this, tab, action, isDeptIncoming, isDeptSent, fromLaunchPopup, $event);
            };
            Correspondence.prototype.openLaunchSequentialWorkflowDialog = function ($event) {
                return correspondenceService.openLaunchSeqWFDialog(this, $event);
            };

            Correspondence.prototype.launchWorkFlowAndCheckExists = function ($event, action, tab, isDeptIncoming, ignoreConfirmation) {
                var info = this.getInfo();
                var self = this;

                if (info.documentClass === 'outgoing' && info.isPaper) {
                    return correspondenceService.launchCorrespondenceWorkflow(self, $event, action, tab, isDeptIncoming);
                }

                // electronic not approved
                if (!ignoreConfirmation && info.docStatus < 24 && !info.isPaper) {
                    return dialog.confirmMessage(langService.get("confirm_launch_document_has_active_workflow")).then(function () {
                        correspondenceService.launchCorrespondenceWorkflow(self, $event, action, tab, isDeptIncoming);
                    })
                }

                return correspondenceService.checkWorkFlowForVsId(info.vsId).then(function (result) {
                    return result ? dialog.infoMessage(langService.get('cannot_launch_document_has_active_workflow')) : correspondenceService.launchCorrespondenceWorkflow(self, $event, action, tab, isDeptIncoming);
                })
            };

            Correspondence.prototype.addToFavorite = function (ignoreMessage) {
                return correspondenceService.addCorrespondenceToFavorite(this, ignoreMessage);
            };

            Correspondence.prototype.removeFromFavorite = function (ignoreMessage) {
                return correspondenceService.deleteCorrespondenceFromFavorite(this, ignoreMessage);
            };
            Correspondence.prototype.view = function () {
                return correspondenceService.viewCorrespondence.apply(correspondenceService, arguments);
            };
            /**
             * @description view from queue as full view.
             * @param actions
             * @param queueName
             * @param $event
             * @param viewOnly
             * @param allowedEditProperties
             * @return {*}
             */
            Correspondence.prototype.viewFromQueue = function (actions, queueName, $event, viewOnly, allowedEditProperties) {
                return viewDocumentService.viewQueueDocument(this, actions, queueName, $event, viewOnly, allowedEditProperties);
            };

            /**
             * @description view from queue as full view.
             * @param actions
             * @param queueName
             * @param $event
             * @param viewOnly
             * @param reloadCallback
             * @return {*}
             */
            Correspondence.prototype.viewReturnedCentralArchiveDocument = function (actions, queueName, $event, viewOnly, reloadCallback) {
                return viewDocumentService.viewReturnedCentralArchiveDocument(this, actions, queueName, $event, viewOnly, reloadCallback);
            };

            /**
             * @description view from queue as full view.
             * @param actions
             * @param queueName
             * @param $event
             * @param viewOnly
             * @return {*}
             */
            Correspondence.prototype.viewFromDeletedQueue = function (actions, queueName, $event, viewOnly) {
                return viewDocumentService.viewDeletedDocument(this, actions, queueName, $event, viewOnly);
            };
            /**
             * @description view from queue as full view by Id
             * @param actions
             * @param queueName
             * @param $event
             * @return {*}
             */
            Correspondence.prototype.viewFromQueueById = function (actions, queueName, $event) {
                return viewDocumentService.viewQueueDocumentById(this, actions, queueName, $event);
            };
            /**
             * @description view from favorite documents as full view.
             * @param actions
             * @param queueName
             * @param $event
             * @return {*}
             */
            Correspondence.prototype.viewFavoriteDocument = function (actions, queueName, $event) {
                return viewDocumentService.viewFavoriteDocument(this, actions, queueName, $event);
            };
            /***
             * @description view document before approve as signed document with draft watermark
             * @param actions
             * @param queueName
             * @param $event
             * @returns {*}
             */
            Correspondence.prototype.viewDocumentAsApproved = function (actions, queueName, $event) {
                return viewDocumentService.viewDocumentAsApproved(this, actions, queueName, $event);
            }

            Correspondence.prototype.manageDocumentComments = function ($event) {
                var info = this.getInfo();
                return managerService.manageDocumentComments.apply(managerService, [this, info.vsId, info.title, $event]);
            };
            Correspondence.prototype.manageDocumentAttachments = function ($event, isSimpleAdd, allowAddFromCorrespondence, selectedAttachmentIds) {
                var info = this.getInfo();
                return managerService.manageDocumentAttachments.apply(managerService, [this, info.vsId, info.documentClass, info.title, $event, isSimpleAdd, allowAddFromCorrespondence, selectedAttachmentIds]);
            };
            Correspondence.prototype.manageDocumentLinkedDocuments = function ($event, isSimpleAdd) {
                var info = this.getInfo();
                return managerService.manageDocumentLinkedDocuments.apply(managerService, [info.vsId, info.documentClass, info.title, $event, this, isSimpleAdd]);
            };
            Correspondence.prototype.manageDocumentEntities = function ($event, isSimpleAdd) {
                var info = this.getInfo();
                return managerService.manageDocumentEntities.apply(managerService, [info.vsId, info.documentClass, info.title, $event, this, isSimpleAdd]);
            };
            Correspondence.prototype.manageDocumentCorrespondence = function ($event) {
                var info = this.getInfo();
                return managerService.manageDocumentCorrespondence.apply(managerService, [info.vsId, info.documentClass, info.title, $event]);
            };
            Correspondence.prototype.manageDocumentContent = function ($event) {
                var info = this.getInfo();
                return managerService.manageDocumentContent.apply(managerService, [info.vsId, info.documentClass, info.title, $event])
            };
            Correspondence.prototype.mainDocumentDownload = function ($event) {
                return downloadService.controllerMethod
                    .mainDocumentDownload(this, $event);
            };
            Correspondence.prototype.compositeDocumentDownload = function ($event) {
                return downloadService.controllerMethod
                    .compositeDocumentDownload(this, $event);
            };
            Correspondence.prototype.getMainDocumentEmailContent = function ($event) {
                var info = this.getInfo();
                downloadService.getMainDocumentEmailContent(info.vsId, info.docClassId);
            };
            Correspondence.prototype.getCompositeDocumentEmailContent = function ($event) {
                var info = this.getInfo();
                downloadService.getCompositeDocumentEmailContent(info.vsId, info.docClassId);
            };

            Correspondence.prototype.rejectDocument = function ($event, ignoreMessage) {
                return correspondenceService.rejectCorrespondence(this, $event, ignoreMessage);
            };

            Correspondence.prototype.archiveDocument = function ($event, ignoreMessage) {
                return correspondenceService.archiveCorrespondence(this, $event, ignoreMessage);
            };

            Correspondence.prototype.removePermanentlyDocument = function ($event) {
                return correspondenceService.removePermanentlyCorrespondence(this, $event);
            };

            Correspondence.prototype.emptyOrganizations = function () {
                this.registryOU = null;
                this.ou = null;
                return this;
            };
            Correspondence.prototype.fromCentralArchive = function () {
                return !!this.centralArchiveId;
            };

            Correspondence.prototype.fromCentralArchiveWhileAdd = function (ouId) {
                return this.ou !== ouId;
            };
            Correspondence.prototype.sendToCentralArchive = function (ignoreMessage, $event) {
                return correspondenceService.sendToCentralArchiveReadyToExport(this, ignoreMessage, $event);
            };
            Correspondence.prototype.getMainProperties = function () {
                return [
                    'ou',
                    'securityLevel',
                    'docDate',
                    'mainClassification',
                    'subClassification',
                    'docSubject',
                    'priorityLevel',
                    'docType',
                    'fileId',
                    'fileCode',
                    'fileSerial'
                ];
            };
            Correspondence.prototype.isWorkItem = function () {
                return false;
            };

            Correspondence.prototype.getFullSerial = function () {
                return this.docFullSerial || this.refDocNumber;
            };

            Correspondence.prototype.getDocumentDate = function () {
                return this.docDate ? moment(this.docDate).format(langService.current === 'ar' ? 'DD-MM-YYYY' : 'YYYY-MM-DD') : '';
            };

            /**
             * @description Get the translated correspondence site info.
             * @returns {string}
             */
            Correspondence.prototype.getTranslatedCorrespondenceSiteInfo = function () {
                /*var mainSite, subSite;
                if (this.siteInfo) {
                    mainSite = new Information(this.siteInfo.mainSite);
                    subSite = (this.siteInfo.subSite) ? new Information(this.siteInfo.subSite) : null;

                    return  mainSite.getTranslatedName() + (subSite ? (' - ' + subSite.getTranslatedName()) : '');
                }
                return '';*/
                return this.mainSiteSubSiteString.getTranslatedName();
            };

            /**
             * @description Set the main site sub site string to display/sort in the grid
             * @returns {*}
             */
            Correspondence.prototype.setMainSiteSubSiteString = function () {
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

            Correspondence.prototype.checkIncomingSites = function () {
                return !!this.mainSiteId || !!(this.site && this.site.mainSiteId);
            };
            Correspondence.prototype.checkOutgoingSites = function () {
                return (angular.isArray(this.ccSitesList) && this.ccSitesList.length) ||
                    (angular.isArray(this.toSitesList) && this.toSitesList.length) ||
                    (angular.isArray(this.sitesInfoTo) && this.sitesInfoTo.length) ||
                    (angular.isArray(this.sitesInfoCC) && this.sitesInfoCC.length)
            };

            Correspondence.prototype.hasSite = function () {
                var value = false, classDescription = this.classDescription.toLowerCase();
                switch (classDescription) {
                    case 'incoming':
                        value = this.checkIncomingSites();
                        break;
                    case 'outgoing':
                        value = this.checkOutgoingSites();
                        break;
                    default:
                        value = true;
                }
                return value;
            };

            Correspondence.prototype.getFirstSite = function () {
                return this.classDescription.toLowerCase() === 'outgoing' ? (this.sitesInfoTo[0] || this.sitesInfoCC[0]) : null;
            };

            Correspondence.prototype.isInternalG2G = function () {
                return this.internalG2G;
            };

            Correspondence.prototype.hasExternalSite = function () {
                var info = this.getInfo();
                if (info.documentClass === 'internal') {
                    return false;
                } else if (info.documentClass === 'outgoing') {
                    return !!(_.find([].concat(this.sitesInfoTo, this.sitesInfoCC), function (item) {
                        return correspondenceService.isExternalSite(item.subSiteId);
                    }));
                } else if (info.documentClass === 'incoming') {
                    if (this.site && this.site.subSiteId) {
                        return correspondenceService.isExternalSite(this.site.subSiteId);
                    }
                    return false;
                }
            }
            Correspondence.prototype.hasG2GSite = function () {
                var info = this.getInfo();
                if (info.documentClass === 'internal') {
                    return false;
                } else if (info.documentClass === 'outgoing') {
                    return !!(_.find([].concat(this.sitesInfoTo, this.sitesInfoCC), function (item) {
                        return correspondenceService.isG2GSite(item.subSiteId);
                    }));
                } else if (info.documentClass === 'incoming') {
                    if (this.site && this.site.subSiteId) {
                        return correspondenceService.isG2GSite(this.site.subSiteId);
                    }
                    return false;
                }
            }
            Correspondence.prototype.hasInternalSite = function () {
                var info = this.getInfo();
                if (info.documentClass === 'internal') {
                    return false;
                } else if (info.documentClass === 'outgoing') {
                    return !!(_.find([].concat(this.sitesInfoTo, this.sitesInfoCC), function (item) {
                        return correspondenceService.isInternalSite(item.subSiteId);
                    }));
                } else if (info.documentClass === 'incoming') {
                    if (this.site && this.site.subSiteId) {
                        return correspondenceService.isInternalSite(this.site.subSiteId);
                    }
                    return false;
                }
            }

            Correspondence.prototype.getExternalSiteIndicator = function () {
                return this.hasExternalSite() ? indicator.getExternalSiteIndicator() : null;
            };

            Correspondence.prototype.getInternalSiteIndicator = function () {
                return this.hasInternalSite() ? indicator.getInternalSiteIndicator() : null;
            };

            Correspondence.prototype.getG2GSiteIndicator = function () {
                return this.hasG2GSite() ? indicator.getG2GSiteIndicator() : null;
            };

            Correspondence.prototype.loadThumbnails = function () {
                return correspondenceService.loadDocumentThumbnails(this);
            };
            Correspondence.prototype.loadVersions = function () {
                return correspondenceService.loadDocumentVersions(this);
            };
            Correspondence.prototype.isCurrentVersion = function () {
                return this.isCurrent;
            };

            Correspondence.prototype.isBroadcasted = function () {
                return false;
            };

            Correspondence.prototype.viewSpecificVersion = function ($event) {
                return correspondenceService.viewSpecificCorrespondenceVersion(this, false, $event);
            };
            Correspondence.prototype.duplicateVersion = function ($event) {
                return correspondenceService.duplicateCurrentCorrespondenceVersion(this, $event);
            };
            Correspondence.prototype.duplicateSpecificVersion = function ($event) {
                return correspondenceService.duplicateSpecificCorrespondenceVersion(this, $event);
            };

            Correspondence.prototype.attacheContentUrl = function (contentInformation) {
                return correspondenceService.updateContentInformation(this, contentInformation);
            };

            Correspondence.prototype.editCorrespondenceInDesktop = function (officeOnlineCallback) {
                return correspondenceService.editWordInDesktop(this, officeOnlineCallback);
            };

            Correspondence.prototype.editCorrespondenceInOfficeOnline = function ($event) {
                return correspondenceService.editDocumentInOfficeOnline(this);
            };

            Correspondence.prototype.openSendSMSDialog = function ($event) {
                return correspondenceService.openSendSMSDialog(this, null, $event);
            };

            Correspondence.prototype.openSendDocumentURLDialog = function ($event) {
                return correspondenceService.openSendDocumentURLDialog(this, $event);
            };

            Correspondence.prototype.addToIcnArchiveDialog = function ($event) {
                return correspondenceService.openIcnArchiveOptionsDialog(this, $event);
            };

            Correspondence.prototype.createReply = function ($event, isSpecificVersion) {
                var docClass = this.getInfo().documentClass,
                    record = angular.copy(this);
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

            Correspondence.prototype.createDocumentTask = function ($event) {
                return taskService
                    .controllerMethod
                    .addCorrespondenceTask(this, $event);
            };


            Correspondence.prototype.canSendByFax = function () {
                return rootEntity.returnRootEntity().rootEntity.faxEnabled;
            };

            Correspondence.prototype.setMajorVersionNumber = function (majorVersionNumber) {
                this.majorVersionNumber = majorVersionNumber;
                return this;
            };

            Correspondence.prototype.setMinorVersionNumber = function (minorVersionNumber) {
                this.minorVersionNumber = minorVersionNumber;
                return this;
            };

            Correspondence.prototype.updateDocumentVersion = function () {
                return correspondenceService.updateDocumentVersion(this);
            };

            Correspondence.prototype.endFollowup = function ($event) {
                return correspondenceService.endCorrespondenceFollowup(this, $event);
            };

            Correspondence.prototype.getCorrespondenceSitesCount = function () {
                var info = this.getInfo(),
                    sitesTo = [], sitesCC = [];
                if (info.documentClass === 'outgoing') {
                    sitesTo = this.sitesInfoTo || [];
                    sitesCC = this.sitesInfoCC || [];
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

            Correspondence.prototype.getSiteFollowupStatus = function () {
                var info = this.getInfo();
                // followupStatus for outgoing document represents the followup status of all sites for end followup only
                if (info.documentClass === 'outgoing') {
                    return this.followupStatus;
                } else if (info.documentClass === 'incoming') {
                    return this.followupStatus;
                }
            };

            Correspondence.prototype.getSiteFollowupEndDate = function () {
                var info = this.getInfo();
                // followupEndDate for outgoing document represents the followup date of all sites for end followup only
                if (info.documentClass === 'outgoing') {
                    return this.followupEndDate;
                } else if (info.documentClass === 'incoming') {
                    return this.followupEndDate;
                }
            };

            Correspondence.prototype.getSiteMaxFollowupDate = function () {
                var info = this.getInfo();
                // maxFollowupDate for outgoing document represents the maximum followup date of all sites
                if (info.documentClass === 'outgoing') {
                    return this.maxFollowupDate;
                } else if (info.documentClass === 'incoming') {
                    return this.followupDate;
                }
            };

            Correspondence.prototype.addToMyDirectFollowUp = function () {
                return followUpUserService.addCorrespondenceToMyFollowUp(this).then(function () {
                    return counterService.loadCounters();
                });
            };

            Correspondence.prototype.addToUserFollowUp = function () {
                return followUpUserService.addCorrespondenceToEmployeeFollowUp(this).then(function () {
                    return counterService.loadCounters();
                });
            };

            Correspondence.prototype.addToBroadcastFollowUp = function () {
                return followUpUserService.addCorrespondenceToBroadcastFollowUp(this).then(function () {
                    return counterService.loadCounters();
                });
            };

            /**
             * @description Check if correspondence has create reply permission
             * @param isSpecificVersion
             * @returns {boolean|boolean}
             */
            Correspondence.prototype.checkCreateReplyPermission = function (isSpecificVersion) {
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
             * @description Handles the change followup status of document
             * @param $event
             * @returns {*}
             */
            Correspondence.prototype.changeFollowupStatus = function ($event) {
                return managerService.manageCorrespondenceSiteFollowupStatus(this, $event)
            };

            Correspondence.prototype.openForAnnotation = function ($event) {
                return correspondenceService.annotateCorrespondence(this);
            };
            Correspondence.prototype.openSequentialDocument = function (annotationType, seqWF) {
                var self = this;
                if (seqWF) {
                    return correspondenceService.annotateCorrespondence(self, typeof annotationType !== 'undefined' ? annotationType : null, null, seqWF);
                }
                return sequentialWorkflowService.loadSequentialWorkflowById(self.getSeqWFId()).then(function (seqWF) {
                    return correspondenceService.annotateCorrespondence(self, typeof annotationType !== 'undefined' ? annotationType : null, null, seqWF);
                });
            };
            Correspondence.prototype.prepareSignatureModel = function (pinCode, isComposite, ignoreValidateMultiSignature) {
                return (new SignDocumentModel())
                    .setSignature(this, null)
                    .setIsComposite(isComposite)
                    .setPinCode(pinCode ? encryptionService.encrypt(pinCode) : null)
                    .setValidateMultiSignature(!ignoreValidateMultiSignature);
            };

            Correspondence.prototype.authorizeDocumentByAnnotation = function (signatureModel, content) {
                return correspondenceService.authorizeCorrespondenceByAnnotation(this, signatureModel, content);
            };

            Correspondence.prototype.displayCompositeMessage = function (pinCode) {
                var composite = this.isCompositeSites();
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

            Correspondence.prototype.displayPinCodeMessage = function () {
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

            Correspondence.prototype.handlePinCodeAndCompositeThenCompleteAuthorization = function (content, ignoreValidationSignature) {
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

            Correspondence.prototype.handlePinCodeAndComposite = function () {
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


            Correspondence.prototype.addAnnotationAsAttachment = function (content) {
                var self = this, info = self.getInfo();
                var attachment = new Attachment({
                    docSubject: langService.get('attached_annotation') + ' - ' + (self.attachments.length + 1),
                    documentTitle: langService.get('attached_annotation') + ' - ' + (self.attachments.length + 1),
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

            Correspondence.prototype.userCanAnnotate = function () {
                var info = this.getInfo();
                if (!info.isPaper || info.docStatus === 25) {
                    if ((info.documentClass === 'outgoing' && info.docStatus === 24)) {
                        return employeeService.hasPermissionTo('EDIT_OUTGOING_CONTENT');
                    } else if (info.documentClass === 'internal' && info.docStatus === 24) {
                        return employeeService.hasPermissionTo('EDIT_INTERNAL_CONTENT');
                    } else {
                        return employeeService.hasPermissionTo('MANAGE_ATTACHMENTS');
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
            Correspondence.prototype.getAuthorizeByAnnotationStatus = function () {
                return this.authorizeByAnnotation;
            };

            Correspondence.prototype.isTerminatedSEQ = function () {
                var info = this.getInfo();
                return info.docStatus === 21 && this.hasActiveSeqWF();
            };

            Correspondence.prototype.isNotPaperAndNotTerminatedSEQ = function () {
                var info = this.getInfo();
                return !info.isPaper && info.docStatus !== 21;
            };


            Correspondence.prototype.getLinesHighlights = function (keyword) {
                function hasAnyKeyword(word, keyWords) {
                    return keyWords.some(function (key) {
                        return word.indexOf(key) !== -1;
                    });
                }

                if (!keyword) {
                    return null;
                }
                var words = Array.from(new Set(keyword.split(" ").filter(Boolean))).map(item => item.toLowerCase());
                var keywords = [];

                words.forEach(word => {
                    var normalized = arabicNormalizerService.normalize(word, ' ');
                    if (normalized !== word) {
                        keywords.push(normalized);
                    }
                    keywords.push(word);
                })


                var self = this
                self.highlights = [];

                self.azureResultItem.forEach(item => {
                    var highlightedWords = [];
                    item.lines.forEach(function (line) {
                        if (hasAnyKeyword(line.lineString.toLowerCase(), keywords)) {
                            highlightedWords = highlightedWords.concat(line.words.filter(function (word) {
                                return hasAnyKeyword(word.wordstring.toLowerCase(), keywords);
                            }).map(function (word) {
                                let [left, top, width, height] = word.boundingBox.split(',').map(item => Number(item));
                                return {
                                    left: (left * 100) / item.imgW,
                                    top: (top * 100) / item.imgH,
                                    width: (width * 100) / item.imgW,
                                    height: (height * 100) / item.imgH
                                }
                            }))
                        }
                    });

                    if (highlightedWords.length) {
                        self.highlights.push({
                            pageIndex: item.pageNum - 1,
                            reacts: highlightedWords,
                            dimensions: {
                                width: item.imgW,
                                height: item.imgH,
                                dpi: [item.dpiX, item.dpiY]
                            }
                        })
                    }
                });
                return self.highlights;
            }

            Correspondence.prototype.hasNormalOrPersonalPrivateSecurityLevel = function () {
                return this.securityLevel.hasOwnProperty('id') ?
                    (this.securityLevel.lookupKey === 1 || this.securityLevel.lookupKey === 4) :
                    (this.securityLevel === 1 || this.securityLevel === 4);
            }

            Correspondence.prototype.isLimitedCentralUnitAccess = function () {
                return correspondenceService.isLimitedCentralUnitAccess(this);
            }

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Correspondence', 'init', this);
        }
    });
};
