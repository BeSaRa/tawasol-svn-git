module.exports = function (app) {
    app.factory('Correspondence', function (CMSModelInterceptor,
                                            employeeService,
                                            $timeout,
                                            generator,
                                            langService,
                                            queueStatusService,
                                            $q,
                                            LinkedObject,
                                            Attachment,
                                            DocumentComment,
                                            Site,
                                            _,
                                            Indicator) {
        'ngInject';
        return function Correspondence(model) {
            var self = this,
                correspondenceService,
                attachmentService,
                documentTagService,
                documentCommentService;

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

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            Correspondence.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated document subject.
             * @param separator
             * @returns {string}
             */
            Correspondence.prototype.getTranslatedName = function (separator) {
                return this.docSubject;
            };

            Correspondence.prototype.getNames = function (separator) {
                return this.docSubject;
            };


            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            Correspondence.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            Correspondence.prototype.getPriorityLevels = function (separator) {
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
                $q.all(promises).then(function (value) {
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
                return this.tags.length ? this.tags.length : 0;
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
                if (!this.creatorInfo)
                    return null;
                return langService.current === 'ar' ? (reverse ? this.creatorInfo.enName : this.creatorInfo.arName) : (reverse ? this.creatorInfo.arName : this.creatorInfo.enName)
            };
            /**
             * @description send correspondence to Ready to export;
             * @returns {*}
             */
            Correspondence.prototype.sendToReadyToExport = function () {
                return correspondenceService.sendCorrespondenceToReadyToExport(this);
            };

            Correspondence.prototype.barcodePrint = function ($event) {
                return correspondenceService.correspondencePrintBarcode(this, $event);
            };

            Correspondence.prototype.barcodeReady = function () {
                return this.outgoing && (this.approvers || this.addMethod);
            };

            Correspondence.prototype.prepareReceivedCorrespondence = function () {
                this.documentComments = _.map(this.linkedCommentsList, function (item) {
                    return generator.interceptReceivedInstance('DocumentComment', new DocumentComment(item));
                });
                this.attachments = _.map([].concat(this.linkedAttachmentList || [], this.linkedAttachmenstList || []), function (item) {
                    return generator.interceptReceivedInstance('Attachment', new Attachment(item))
                });
                this.linkedDocs = correspondenceService.interceptReceivedCollectionBasedOnEachDocumentClass(this.linkedDocList);
                this.linkedEntities = _.map(this.linkedEntitiesList, function (item) {
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
            Correspondence.prototype.hisDocumentClass = function (documentClass) {
                return this.getInfo().documentClass.toLowerCase() === documentClass.toLowerCase();
            };
            Correspondence.prototype.launchWorkFlow = function ($event, action, tab) {
                return correspondenceService.launchCorrespondenceWorkflow(this, $event, action, tab);
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Correspondence', 'init', this);
        }
    })
};