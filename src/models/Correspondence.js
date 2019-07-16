module.exports = function (app) {
    app.factory('Correspondence', function (CMSModelInterceptor,
                                            employeeService,
                                            $timeout,
                                            generator,
                                            langService,
                                            queueStatusService,
                                            $q,
                                            dialog,
                                            moment,
                                            LinkedObject,
                                            Attachment,
                                            DocumentComment,
                                            Site,
                                            _,
                                            Indicator,
                                            Information,
                                            lookupService,
                                            Lookup,
                                            ResolveDefer,
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
            Correspondence.prototype.updateDocument = function () {
                return correspondenceService.updateCorrespondence(this);
            };
            Correspondence.prototype.createDocument = function () {
                // in case if no ou and has registryOU set the ou as registryOU for document
                if (!this.ou && this.registryOU)
                    this.ou = this.registryOU;
                return correspondenceService.createCorrespondence(this);
            };
            Correspondence.prototype.saveDocument = function (status) {
                if (status)
                    this.docStatus = queueStatusService.getDocumentStatus(status);
                return this.hasVsId() ? this.updateDocument() : this.createDocument();
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
                console.log(correspondence);
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


            Correspondence.prototype.saveDocumentWithContent = function (information, sendToReview) {
                if (sendToReview)
                    this.docStatus = 4;
                return correspondenceService.addCorrespondenceWithTemplate(this, information);
            };

            Correspondence.prototype.addDocumentContentFile = function () {
                return correspondenceService.saveDocumentContentFile(this);
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
            Correspondence.prototype.correspondenceBroadcast = function ($event) {
                return correspondenceService.broadcastCorrespondence(this, $event);
            };
            Correspondence.prototype.needApprove = function () {
                return this.docStatus < 24 && !this.addMethod;
            };
            Correspondence.prototype.approveDocument = function ($event, defer, ignoreMessage) {
                var correspondence = this;
                return correspondenceService
                    .showApprovedDialog(this, $event, ignoreMessage)
                    .then(function (result) {
                        new ResolveDefer(defer);
                        if (result === 'PARIALLY_AUTHORIZED') {
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
            Correspondence.prototype.launchWorkFlow = function ($event, action, tab, isDeptIncoming) {
                return correspondenceService.launchCorrespondenceWorkflow(this, $event, action, tab, isDeptIncoming);
            };

            Correspondence.prototype.launchWorkFlowAndCheckExists = function ($event, action, tab, isDeptIncoming, ignoreConformation) {
                var info = this.getInfo();
                var self = this;

                // electronic not approved
                if (!ignoreConformation && info.docStatus < 24 && !info.isPaper) {
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
             * @return {*}
             */
            Correspondence.prototype.viewFromQueue = function (actions, queueName, $event) {
                return viewDocumentService.viewQueueDocument(this, actions, queueName, $event);
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

            Correspondence.prototype.manageDocumentComments = function ($event) {
                var info = this.getInfo();
                return managerService.manageDocumentComments.apply(managerService, [info.vsId, info.title, $event]);
            };
            Correspondence.prototype.manageDocumentAttachments = function ($event, isSimpleAdd) {
                var info = this.getInfo();
                return managerService.manageDocumentAttachments.apply(managerService, [this, info.vsId, info.documentClass, info.title, $event, isSimpleAdd]);
            };
            Correspondence.prototype.manageDocumentLinkedDocuments = function ($event, isSimpleAdd) {
                var info = this.getInfo();
                return managerService.manageDocumentLinkedDocuments.apply(managerService, [info.vsId, info.documentClass, info.title, $event, this, isSimpleAdd]);
            };
            Correspondence.prototype.manageDocumentEntities = function ($event) {
                var info = this.getInfo();
                return managerService.manageDocumentEntities.apply(managerService, [info.vsId, info.documentClass, info.title, $event]);
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
                var info = this.getInfo();
                return downloadService.controllerMethod
                    .mainDocumentDownload(info.vsId, $event);
            };
            Correspondence.prototype.compositeDocumentDownload = function ($event) {
                var info = this.getInfo();
                return downloadService.controllerMethod
                    .compositeDocumentDownload(info.vsId, $event);
            };

            Correspondence.prototype.rejectDocument = function ($event, ignoreMessage) {
                return correspondenceService.rejectCorrespondence(this, $event, ignoreMessage);
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

            Correspondence.prototype.editCorrespondenceInDesktop = function () {
                return correspondenceService.editWordInDesktop(this);
            };

            Correspondence.prototype.openSendSMSDialog = function ($event) {
                return correspondenceService.openSendSMSDialog(this, $event);
            };

            Correspondence.prototype.addToIcnArchiveDialog = function ($event) {
                return correspondenceService.openIcnArchiveOptionsDialog(this, $event);
            };

            Correspondence.prototype.createReply = function ($event) {
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
            CMSModelInterceptor.runEvent('Correspondence', 'init', this);
        }
    })
};
