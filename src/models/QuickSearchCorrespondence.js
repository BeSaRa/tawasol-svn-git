module.exports = function (app) {
    app.factory('QuickSearchCorrespondence', function (CMSModelInterceptor,
                                                       langService,
                                                       queueStatusService,
                                                       employeeService,
                                                       $timeout,
                                                       _) {
        'ngInject';
        return function QuickSearchCorrespondence(model) {
            var self = this,
                correspondenceService,
                outgoingService,
                attachmentService,
                documentTagService,
                documentCommentService;

            self.id = null;
            self.docSubject = null;
            self.documentTitle = null;
            self.createdBy = null;
            self.createdOn = null;
            self.lastModified = null;
            self.lastModifier = null;
            self.mimeType = null;
            self.contentSize = null;
            self.minorVersionNumber = null;
            self.majorVersionNumber = null;
            self.vsId = null;
            self.versionStatus = null;
            self.isCurrent = null;
            self.classDescription = null;
            self.contentElementUrl = null;
            self.addMethod = null;
            self.attachments = [];
            self.barcode = null;
            self.docFolder = null;
            self.docFullSerial = null;
            self.docNotes = null;
            self.docSerial = null;
            self.docStatus = null;
            self.docSubjectSrc = null;
            self.docDate = null;
            self.docType = null;
            self.fileCode = null;
            self.fileSerial = null;
            self.fileId = null;
            self.linkedDocs = [];
            self.linkedEntities = [];
            self.mainClassification = null;
            self.subClassification = null;
            self.ou = null;
            self.refNumberElementId = null;
            self.registryOU = null;
            self.securityLevel = null;
            self.tags = [];
            self.priorityLevel = null;
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
            self.attachmentList = null;
            self.linkedEntitiesList = null;
            self.linkedAttachmentList = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            QuickSearchCorrespondence.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for Quick Search Correspondence. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            QuickSearchCorrespondence.prototype.getNames = function (separator) {
                return this.docSubject;
            };

            /**
             * @description Get the translated arabic or english name according to current language for Quick Search Correspondence. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            QuickSearchCorrespondence.prototype.getTranslatedName = function (reverse) {
                return this.docSubject;
            };

            /**
             * @description Get the status of Quick Search Correspondence as Active or Inactive instead of true or false.
             * @returns {string}
             */
            QuickSearchCorrespondence.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            QuickSearchCorrespondence.prototype.setOutgoingService = function (service) {
                outgoingService = service;
                return this;
            };

            QuickSearchCorrespondence.prototype.setAttachmentService = function (service) {
                attachmentService = service;
                return this;
            };

            QuickSearchCorrespondence.prototype.setDocumentCommentService = function (service) {
                documentCommentService = service;
                return this;
            };

            QuickSearchCorrespondence.prototype.setDocumentTagService = function (service) {
                documentTagService = service;
                return this;
            };

            QuickSearchCorrespondence.prototype.setCorrespondenceService = function (service) {
                correspondenceService = service;
                return this;
            };

            QuickSearchCorrespondence.prototype.getPriorityLevels = function (separator) {
                var lang = langService.current.charAt(0).toUpperCase() + langService.current.substr(1);
                return (this.priorityLevel) ? this.priorityLevel['default' + lang + 'Name'] : "";
            };

            QuickSearchCorrespondence.prototype.getSecurityLevels = function (separator) {
                var lang = langService.current.charAt(0).toUpperCase() + langService.current.substr(1);
                return _.map(this.securityLevel, ('default' + lang + 'Name')).join(separator || ',  ');
            };
            QuickSearchCorrespondence.prototype.getSecurityLevelsArray = function () {
                var lang = langService.current.charAt(0).toUpperCase() + langService.current.substr(1);
                return _.map(this.securityLevel, ('default' + lang + 'Name'));
            };
            QuickSearchCorrespondence.prototype.getMethodType = function () {
                return !this.addMethod ? langService.get('outgoing_electronic') : langService.get('outgoing_paper');
            };

            QuickSearchCorrespondence.prototype.hasVsId = function () {
                return !!this.vsId;
            };

            QuickSearchCorrespondence.prototype.hasContent = function () {
                return this.contentSize;
            };

            QuickSearchCorrespondence.prototype.addComment = function (documentComment) {
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

            QuickSearchCorrespondence.prototype.saveComment = function (documentComment) {
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

            QuickSearchCorrespondence.prototype.deleteComment = function (documentComment) {
                var self = this;
                return documentCommentService.deleteDocumentComment(documentComment).then(function () {
                    self.documentComments = _.filter(self.documentComments, function (comment) {
                        return documentComment.id !== comment.id;
                    });
                    return self.documentComments;
                });
            };
            QuickSearchCorrespondence.prototype.deleteBulkComments = function (documentComments) {
                var self = this;
                return documentCommentService.deleteBulkDocumentComments(documentComments).then(function () {
                    var ids = _.map(documentComments, 'id');
                    self.documentComments = _.filter(self.documentComments, function (comment) {
                        return ids.indexOf(comment.id) === -1;
                    });
                    return self.documentComments;
                })
            };


            QuickSearchCorrespondence.prototype.addDocumentEntity = function (entity) {
                var self = this;
                self.linkedEntities.push(entity);
                return correspondenceService.addLinkedObject(this);
            };

            QuickSearchCorrespondence.prototype.removeDocumentEntities = function (entities) {
                var selfVersion = angular.copy(this), self = this;
                for (var i = 0; i < entities.length; i++) {
                    selfVersion.linkedEntities.splice(selfVersion.linkedEntities.indexOf(entities[i]), 1);
                }
                return correspondenceService.addLinkedObject(selfVersion).then(function () {
                    self.linkedEntities = selfVersion.linkedEntities;
                    return self;
                });
            };


            QuickSearchCorrespondence.prototype.saveDocumentWithContent = function (information) {
                return correspondenceService.addCorrespondenceWithTemplate(this, information);
            };

            QuickSearchCorrespondence.prototype.saveDocumentEntities = function (entity, index) {
                if (entity && index) {
                    this.linkedEntities[index] = entity;
                }
                return correspondenceService.addLinkedObject(this);
            };

            /**
             * @description to get documentClass,vsId.
             * @return {{documentClass: *, vsId: *}}
             */
            QuickSearchCorrespondence.prototype.getInfo = function () {
                return correspondenceService.getCorrespondenceInformation(this);
            };

            QuickSearchCorrespondence.prototype.getTagsCount = function ($event) {
                return this.tags.length ? this.tags.length : 0;
            };

            QuickSearchCorrespondence.prototype.getCommentsCount = function ($event) {
                //return this.documentComments.length ? this.documentComments.length : 0;

                //TODO: return the actual comment count when it will be implemented in backend
                return 0;
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('QuickSearchCorrespondence', 'init', this);
        }
    })
};