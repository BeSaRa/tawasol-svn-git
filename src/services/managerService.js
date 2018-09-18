module.exports = function (app) {
    app.service('managerService', function (dialog,
                                            $q,
                                            cmsTemplate,
                                            _,
                                            generator,
                                            correspondenceService,
                                            outgoingService,
                                            Attachment) {
        'ngInject';
        var self = this;
        self.serviceName = 'managerService';
        var services = {
            outgoing: {
                service: outgoingService,
                byId: 'loadOutgoingById',
                entities: 'getOutgoingLinkedEntitiesByVsId'
            }
        };

        /**
         * to get current service to user it to load document.
         * @param documentClass
         * @return {*}
         * @private
         */
        function _getService(documentClass) {
            return services[documentClass.toLowerCase()];
        }

        function _checkDocumentClass(documentClass) {
            return documentClass.toLowerCase() === 'export' ? 'incoming' : documentClass;
        }

        /**
         * @description manage document tags for any given document
         * @param vsId
         * @param documentClass
         * @param documentSubject
         * @param $event
         */
        self.manageDocumentTags = function (vsId, documentClass, documentSubject, $event) {
            documentClass = _checkDocumentClass(documentClass);

            var defer = $q.defer();
            return dialog.showDialog({
                template: cmsTemplate.getPopup('manage-document-tags'),
                controller: 'manageDocumentTagsPopCtrl',
                targetEvent: $event || false,
                controllerAs: 'ctrl',
                bindToController: true,
                escapeToClose: false,
                locals: {
                    fromDialog: true,
                    vsId: vsId,
                    documentClass: documentClass,
                    documentSubject: documentSubject
                },
                resolve: {
                    tags: function (documentTagService) {
                        'ngInject';
                        return documentTagService.loadDocumentTags(vsId, documentClass).then(function (tags) {
                            defer.resolve(angular.copy(tags));
                            return tags;
                        });
                    },
                    model: function () {
                        'ngInject';
                        var qDefer = $q.defer();
                        defer.promise.then(function (tags) {
                            qDefer.resolve(tags);
                        });
                        return qDefer.promise;
                    }
                }
            });
        };
        /**
         * manage document attachments for given any document.
         * @param document
         * @param vsId
         * @param documentClass
         * @param documentSubject
         * @param $event
         */
        self.manageDocumentAttachments = function (document, vsId, documentClass, documentSubject, $event) {
            var defer = $q.defer();
            var deferDoc = $q.defer();
            documentClass = _checkDocumentClass(documentClass);
            return dialog.showDialog({
                template: cmsTemplate.getPopup('manage-document-attachments'),
                controller: 'manageDocumentAttachmentsPopCtrl',
                targetEvent: $event || false,
                controllerAs: 'ctrl',
                bindToController: true,
                escapeToClose: false,
                locals: {
                    fromDialog: true,
                    vsId: vsId,
                    documentClass: documentClass,
                    documentSubject: documentSubject,
                    document: document
                },
                resolve: {
                    attachments: function (attachmentService) {
                        'ngInject';
                        return attachmentService.loadDocumentAttachments(vsId, documentClass).then(function (attachments) {
                            defer.resolve(attachments);
                            return attachments;
                        });

                    },
                    model: function () {
                        'ngInject';
                        var qDefer = $q.defer();
                        defer.promise.then(function (attachments) {
                            qDefer.resolve(angular.copy(attachments));
                        });
                        return qDefer.promise;
                    },
                    attachmentTypes: function (attachmentTypeService, employeeService) {
                        'ngInject';
                        return !employeeService.isCloudUser() ? attachmentTypeService.getAttachmentTypes() : [];
                    }
                }
            })
        };

        /**
         * @description manage document comment for any given document
         * @param vsId
         * @param documentSubject
         * @param $event
         */
        self.manageDocumentComments = function (vsId, documentSubject, $event) {
            var defer = $q.defer();
            return dialog.showDialog({
                template: cmsTemplate.getPopup('manage-document-comments'),
                controller: 'manageDocumentCommentsPopCtrl',
                targetEvent: $event || false,
                controllerAs: 'ctrl',
                bindToController: true,
                escapeToClose: false,
                locals: {
                    fromDialog: true,
                    vsId: vsId,
                    documentSubject: documentSubject
                },
                resolve: {
                    documentComments: function (documentCommentService) {
                        'ngInject';
                        return documentCommentService.loadDocumentCommentsByVsId(vsId)
                            .then(function (documentComments) {
                                defer.resolve(documentComments);
                                return documentComments;
                            });
                    },
                    model: function () {
                        'ngInject';
                        var qDefer = $q.defer();
                        defer.promise.then(function (documentComments) {
                            qDefer.resolve(angular.copy(documentComments));
                        });
                        return qDefer.promise;
                    },
                    applicationUsers: function (applicationUserService) {
                        'ngInject';
                        return applicationUserService.getApplicationUsers();
                    }
                }

            })
        };
        /**
         * manage document properties
         * @param vsId
         * @param documentClass
         * @param documentSubject
         * @param $event
         * @return {promise}
         */
        self.manageDocumentProperties = function (vsId, documentClass, documentSubject, $event) {
            var defer = $q.defer(), deferCorrespondence = $q.defer();
            var document = null;
            //var firstDefer = $q.defer();
            documentClass = _checkDocumentClass(documentClass);
            return dialog
                .showDialog({
                    template: cmsTemplate.getPopup('manage-document-properties'),
                    controller: 'manageDocumentPropertiesPopCtrl',
                    targetEvent: $event || false,
                    controllerAs: 'ctrl',
                    escapeToClose: false,
                    bindToController: true,
                    locals: {
                        fromDialog: true
                    },
                    resolve: {
                        documentProperties: function () {
                            'ngInject';
                            return deferCorrespondence.promise.then(function () {
                                return correspondenceService
                                    .loadCorrespondenceByVsIdClass(vsId, documentClass)
                                    .then(function (result) {
                                        document = result;
                                        defer.resolve(document);
                                        return result
                                    });
                            })
                        },
                        resolveAll: function (generator,
                                              organizationService,
                                              correspondenceService) {
                            'ngInject';
                            var qDefer = $q.defer();
                            var organizations = organizationService.loadOrganizations();
                            var lookups = correspondenceService.loadCorrespondenceLookups(documentClass);
                            $q.all([organizations, lookups]).then(function (result) {
                                deferCorrespondence.resolve(true);
                                qDefer.resolve(true);
                                return result;
                            });
                            return qDefer.promise;
                        },
                        document: function () {
                            'ngInject';
                            var qDefer = $q.defer();
                            defer.promise.then(function (document) {
                                qDefer.resolve(angular.copy(document));
                            });
                            return qDefer.promise;
                        },
                        model: function () {
                            'ngInject';
                            var qDefer = $q.defer();
                            defer.promise.then(function (document) {
                                qDefer.resolve(angular.copy(document));
                            });
                            return qDefer.promise;
                        },
                        centralArchives: function (organizationService, employeeService) {
                            'ngInject';
                            return employeeService.isCentralArchive() && (documentClass.toLowerCase() === 'incoming' || documentClass.toLowerCase() === 'outgoing') ? organizationService.centralArchiveOrganizations() : false
                        }
                    }
                }).catch(function (e) {
                    console.log(e);
                });
        };

        self.manageDocumentEntities = function (vsId, documentClass, documentSubject, $event) {
            console.log(vsId, documentClass, documentSubject);
            documentClass = _checkDocumentClass(documentClass);
            var defer = $q.defer();
            return dialog.showDialog({
                template: cmsTemplate.getPopup('manage-document-entities'),
                controller: 'manageDocumentEntitiesPopCtrl',
                targetEvent: $event || false,
                controllerAs: 'ctrl',
                bindToController: true,
                escapeToClose: false,
                locals: {
                    fromDialog: true,
                    vsId: vsId,
                    documentClass: documentClass,
                    documentSubject: documentSubject
                },
                resolve: {
                    entityTypes: function (entityTypeService) {
                        'ngInject';
                        return entityTypeService.getEntityTypes();
                    },
                    linkedEntities: function () {
                        'ngInject';
                        return correspondenceService.getLinkedEntitiesByVsIdClass(vsId, documentClass).then(function (linkedEntities) {
                            defer.resolve(angular.copy(linkedEntities));
                            return linkedEntities;
                        });
                    },
                    model: function () {
                        'ngInject';
                        var qDefer = $q.defer();
                        defer.promise.then(function (linkedEntities) {
                            qDefer.resolve(linkedEntities);
                        });
                        return qDefer.promise;
                    }
                }
            });
        };

        self.manageDocumentCorrespondence = function (vsId, documentClass, documentSubject, $event) {
            documentClass = _checkDocumentClass(documentClass);
            var defer = $q.defer();
            return dialog.showDialog({
                template: cmsTemplate.getPopup('manage-document-correspondence'),
                controller: 'manageDocumentCorrespondencePopCtrl',
                targetEvent: $event || false,
                controllerAs: 'ctrl',
                bindToController: true,
                escapeToClose: false,
                locals: {
                    fromDialog: true,
                    vsId: vsId,
                    documentClass: documentClass,
                    documentSubject: documentSubject
                },
                resolve: {
                    correspondence: function () {
                        'ngInject';
                        return correspondenceService
                            .loadCorrespondenceByVsIdClass(vsId, documentClass)
                            .then(function (correspondence) {
                                defer.resolve(correspondence);
                                return correspondence;
                            });
                    },
                    sites: function (correspondenceService) {
                        'ngInject';
                        if (documentClass.toLowerCase() === 'incoming') {
                            return [];
                        }
                        return defer.promise.then(function (correspondence) {
                            return correspondenceService
                                .loadCorrespondenceSites(correspondence)
                        });
                    }
                }
            });
        };
        /**
         * @description manage correspondence sites for outgoing document
         * @param correspondence
         * @param $event
         * @return {promise|*}
         */
        self.manageSitesForDocument = function (correspondence, $event) {
            var info = correspondence.getInfo();
            return dialog.showDialog({
                template: cmsTemplate.getPopup('manage-document-correspondence'),
                controller: 'manageDocumentCorrespondencePopCtrl',
                targetEvent: $event || false,
                controllerAs: 'ctrl',
                bindToController: true,
                escapeToClose: false,
                locals: {
                    fromDialog: true,
                    vsId: info.vsId,
                    documentClass: info.documentClass,
                    documentSubject: info.title,
                    correspondence: correspondence,
                    sites: {}
                }
            });
        };


        self.manageDocumentContent = function (vsId, documentClass, documentSubject, $event) {
            documentClass = _checkDocumentClass(documentClass);
            return dialog.showDialog({
                template: cmsTemplate.getPopup('manage-document-content'),
                controller: 'manageDocumentContentPopCtrl',
                targetEvent: $event || false,
                controllerAs: 'ctrl',
                bindToController: true,
                escapeToClose: false,
                locals: {
                    fromDialog: true,
                    vsId: vsId,
                    documentClass: documentClass,
                    documentSubject: documentSubject
                },
                resolve: {
                    templates: function (documentTemplateService, employeeService) {
                        'ngInject';
                        return documentTemplateService.loadDocumentTemplates(employeeService.getCurrentOUApplicationUser().ouid);
                    },
                    correspondence: function () {
                        'ngInject';
                        return correspondenceService
                            .loadCorrespondenceByVsIdClass(vsId, documentClass);
                    }
                }
            });
        };


        self.manageDocumentLinkedDocuments = function (vsId, documentClass, documentSubject, $event) {
            return dialog.showDialog({
                template: cmsTemplate.getPopup('manage-linked-documents'),
                controller: 'manageLinkedDocumentPopCtrl',
                targetEvent: $event || false,
                controllerAs: 'ctrl',
                bindToController: true,
                escapeToClose: false,
                locals: {
                    fromDialog: true,
                    vsId: vsId,
                    documentClass: documentClass,
                    documentSubject: documentSubject
                },
                resolve: {
                    linkedDocs: function (correspondenceService) {
                        'ngInject';
                        return correspondenceService
                            .getLinkedDocumentsByVsIdClass(vsId, documentClass)
                    },
                    correspondence: function () {
                        'ngInject';
                        return correspondenceService
                            .loadCorrespondenceByVsIdClass(vsId, documentClass);
                    }
                }
            });
        }

    });
};