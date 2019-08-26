module.exports = function (app) {
    app.service('managerService', function (dialog,
                                            $q,
                                            cmsTemplate,
                                            _,
                                            generator,
                                            correspondenceService,
                                            outgoingService,
                                            $state,
                                            $http,
                                            urlService,
                                            HREmployee,
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
                templateUrl: cmsTemplate.getPopup('manage-document-tags'),
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
         * @description Deep clone attachments.
         * Uses the angular.copy and handles file objects as well
         * @param attachments
         * @returns {*}
         * @private
         */
        self.deepCopyAttachments = function (attachments) {
            var attachmentFilesOnly = _.map(attachments, 'file'),
                attachmentsCopy = angular.copy(attachments);
            for (var i = 0; i < attachmentsCopy.length; i++) {
                attachmentsCopy[i].file = attachmentFilesOnly[i];
            }
            return attachmentsCopy;
        };

        /**
         * manage document attachments for given any document.
         * @param document
         * @param vsId
         * @param documentClass
         * @param documentSubject
         * @param $event
         * @param isSimpleAdd
         */
        self.manageDocumentAttachments = function (document, vsId, documentClass, documentSubject, $event, isSimpleAdd) {
            var defer = $q.defer();
            documentClass = _checkDocumentClass(documentClass);
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('manage-document-attachments'),
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
                        if (isSimpleAdd && !vsId) {
                            var attachments = self.deepCopyAttachments(document.attachments);
                            defer.resolve(attachments);
                            return attachments;
                        }
                        return attachmentService.loadDocumentAttachments(vsId, documentClass).then(function (attachments) {
                            defer.resolve(attachments);
                            return attachments;
                        });

                    },
                    model: function () {
                        'ngInject';
                        var qDefer = $q.defer();
                        defer.promise.then(function (attachments) {
                            qDefer.resolve(self.deepCopyAttachments(attachments));
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
            var commentsDefer = $q.defer();
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('manage-document-comments'),
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
                                commentsDefer.resolve(documentComments);
                                return documentComments;
                            });
                    },
                    model: function () {
                        'ngInject';
                        var qDefer = $q.defer();
                        commentsDefer.promise.then(function (documentComments) {
                            qDefer.resolve(angular.copy(documentComments));
                        });
                        return qDefer.promise;
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

            var action = ($state.current.name.indexOf('review') !== -1) ? 'review' : null;
            //var firstDefer = $q.defer();
            documentClass = _checkDocumentClass(documentClass);
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('manage-document-properties'),
                    controller: 'manageDocumentPropertiesPopCtrl',
                    targetEvent: $event || false,
                    controllerAs: 'ctrl',
                    escapeToClose: false,
                    bindToController: true,
                    locals: {
                        fromDialog: true,
                        action: action
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
            documentClass = _checkDocumentClass(documentClass);
            var defer = $q.defer();
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('manage-document-entities'),
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
                templateUrl: cmsTemplate.getPopup('manage-document-correspondence'),
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
                templateUrl: cmsTemplate.getPopup('manage-document-correspondence'),
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
                templateUrl: cmsTemplate.getPopup('manage-document-content'),
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
                        return documentTemplateService.loadDocumentTemplates(employeeService.getEmployee().getRegistryOUID(), documentClass);
                    },
                    correspondence: function () {
                        'ngInject';
                        return correspondenceService
                            .loadCorrespondenceByVsIdClass(vsId, documentClass);
                    }
                }
            });
        };

        /**
         * @description Manages the linked documents
         * @param vsId
         * @param documentClass
         * @param documentSubject
         * @param $event
         * @param document
         * @param isSimpleAdd
         * @returns {promise}
         */
        self.manageDocumentLinkedDocuments = function (vsId, documentClass, documentSubject, $event, document, isSimpleAdd) {
            return dialog.showDialog({
                    templateUrl: cmsTemplate.getPopup('manage-linked-documents'),
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
                            if (isSimpleAdd && !vsId) {
                                return angular.copy(document.linkedDocs);
                            }
                            return correspondenceService
                                .getLinkedDocumentsByVsIdClass(vsId, documentClass)
                        },
                        correspondence: function () {
                            'ngInject';
                            if (isSimpleAdd && !vsId) {
                                return angular.copy(document);
                            }
                            return correspondenceService
                                .loadCorrespondenceByVsIdClass(vsId, documentClass);
                        }
                    }
                }
            );
        };

        self.openHREmployeeIntegration = function ($event, linkedEntities, fromApplicationUser) {
            return dialog
                .showDialog({
                    targetEvent: $event,
                    templateUrl: cmsTemplate.getPopup('hr-employee-integration'),
                    controller: 'employeeHRIntegrationPopCtrl',
                    controllerAs: 'ctrl',
                    bindToController: true,
                    locals: {
                        linkedEntities: linkedEntities,
                        fromApplicationUser: fromApplicationUser,
                        attachDomainNameToModel: fromApplicationUser
                    }
                })
        };


        /**
         * @description search for hr employees when hr Enabled
         */
        self.searchForIntegratedHREmployees = function (criteria, attachDomainNameToModel) {
            return $http.post(urlService.hrEmployeeIntegration, generator.interceptSendInstance('HREmployee', criteria))
                .then(function (result) {
                    var employeeLinkedEntity = generator.generateCollection(result.data.rs, HREmployee, self._sharedMethods);
                    if (attachDomainNameToModel) {
                        employeeLinkedEntity = _.map(employeeLinkedEntity, function (item) {
                            item.attachDomainName = true;
                            return item;
                        });
                    }
                    employeeLinkedEntity = generator.interceptReceivedCollection('HREmployee', employeeLinkedEntity);
                    return employeeLinkedEntity;
                })
        }

    });
};
