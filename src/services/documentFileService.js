module.exports = function (app) {
    app.service('documentFileService', function (urlService,
                                                 $http,
                                                 $q,
                                                 generator,
                                                 DocumentFile,
                                                 _,
                                                 dialog,
                                                 langService,
                                                 toast,
                                                 cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'documentFileService';
        self.documentFiles = [];

        /**
         * @description load document files from server.
         * @returns {Promise|documentFiles}
         */
        self.loadDocumentFiles = function () {
            return $http.get(urlService.documentFiles).then(function (result) {
                self.documentFiles = generator.generateCollection(result.data.rs, DocumentFile, self._sharedMethods);
                self.documentFilesCopy = angular.copy(self.documentFiles);
                self.documentFiles = generator.interceptReceivedCollection('DocumentFile', self.documentFiles);
                return self.documentFiles;
            });
        };
        /**
         * @description get document files from self.documentFiles if found and if not load it from server again.
         * @returns {Promise|documentFiles}
         */
        self.getDocumentFiles = function () {
            return self.documentFiles.length ? $q.when(self.documentFiles) : self.loadDocumentFiles();
        };

        /**
         * @description Contains methods for CRUD operations for document files
         */
        self.controllerMethod = {
            documentFileAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('document-file'),
                        controller: 'documentFilePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            documentFile: new DocumentFile(
                                {
                                    itemOrder: generator.createNewID(self.documentFiles, 'itemOrder')
                                }),
                            documentFiles: self.documentFile,
                            parent: self.documentFiles,
                            sub: false
                        }
                    });
            },
            documentFileEdit: function (documentFile, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('document-file'),
                        controller: 'documentFilePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            documentFile: documentFile,
                            parent: self.documentFiles,
                            sub: false
                        }
                    });
            },
            openOrganizationPopup: function (organizations, documentFile, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('document-file-related-ou'),
                        controller: 'documentFileRelatedOUPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            documentFileRelatedOU: organizations,
                            documentFile: documentFile
                        }
                    });
            },
            openChildDocumentFilesPopup: function (documentFiles, documentFile, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('document-file-child'),
                        controller: 'documentFileChildrenPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            documentFiles: documentFiles,
                            documentFileParent: documentFile
                        }
                    });
            },
            documentFileDelete: function (documentFile, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: documentFile.getNames()}))
                    .then(function () {
                        return self.deleteDocumentFile(documentFile).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: documentFile.getNames()}));
                            return true;
                        })
                    });
            },
            documentFileDeleteBulk: function (documentFiles, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'))
                    .then(function (result) {
                        return self.deleteBulkDocumentFiles(documentFiles).then(function (result) {
                            var response = false;
                            if (result.length === documentFiles.length) {
                                toast.error(langService.get("failed_delete_selected"));
                                response = false;
                            }
                            else if (result.length) {
                                generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (documentFile) {
                                    return documentFile.getNames();
                                }));
                                response = true;
                            }
                            else {
                                toast.success(langService.get("delete_success"));
                                response = true;
                            }
                            return response;
                        });
                    });
            }
        };
        /**
         * @description add new document file
         * @param documentFile
         * @return {Promise|DocumentFile}
         */
        self.addDocumentFile = function (documentFile) {
            return $http
                .post(urlService.documentFiles,
                    generator.interceptSendInstance('DocumentFile', documentFile))
                .then(function (result) {
                    documentFile.id = result.data.rs;
                    return documentFile;
                    //return generator.interceptReceivedInstance('DocumentFile', generator.generateInstance(result.data.rs, DocumentFile, self._sharedMethods));
                });
        };
        /**
         * @description make an update for given document file.
         * @param documentFile
         * @return {Promise|DocumentFile}
         */
        self.updateDocumentFile = function (documentFile) {
            return $http
                .put(urlService.documentFiles,
                    generator.interceptSendInstance('DocumentFile', documentFile))
                .then(function () {
                    return generator.interceptReceivedInstance('DocumentFile', generator.generateInstance(documentFile, DocumentFile, self._sharedMethods));
                });
        };
        /**
         * @description delete given document file.
         * @param documentFile
         * @return {Promise|null}
         */
        self.deleteDocumentFile = function (documentFile) {
            var id = documentFile.hasOwnProperty('id') ? documentFile.id : documentFile;
            return $http.delete((urlService.documentFiles + '/' + id));
        };

        /**
         * @description delete bulk document files.
         * @param documentFiles
         * @return {Promise|null}
         */
        self.deleteBulkDocumentFiles = function (documentFiles) {
            var bulkIds = documentFiles[0].hasOwnProperty('id') ? _.map(documentFiles, 'id') : documentFiles;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.documentFiles + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedDocumentFiles = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedDocumentFiles.push(key);
                });
                return _.filter(documentFiles, function (documentFile) {
                    return (failedDocumentFiles.indexOf(documentFile.id) > -1);
                });
            });
        };

        /**
         * @description get document file by documentFileId
         * @param documentFileId
         * @returns {DocumentFile|undefined} return DocumentFile Model or undefined if not found.
         */
        self.getDocumentFileById = function (documentFileId) {
            documentFileId = documentFileId instanceof DocumentFile ? documentFileId.id : documentFileId;
            return _.find(self.documentFilesCopy, function (documentFile) {
                return Number(documentFile.id) === Number(documentFileId)
            });
        };
        /**
         * @description get document file by lookupKey
         * @param documentFileId
         * @returns {DocumentFile|undefined} return DocumentFile Model or undefined if not found.
         */
        self.getDocumentFileByLookupKey = function (lookupKey) {
            lookupKey = lookupKey instanceof DocumentFile ? lookupKey.lookupKey : lookupKey;
            return _.find(self.documentFilesCopy, function (documentFile) {
                return Number(documentFile.lookupKey) === Number(lookupKey)
            });
        };
        /**
         * @description activate document file
         * @param documentFile
         */
        self.activateDocumentFile = function (documentFile) {
            return $http
                .put((urlService.documentFiles + '/activate/' + documentFile.id))
                .then(function () {
                    return documentFile;
                });
        };

        /**
         * @description Deactivate document file
         * @param documentFile
         */
        self.deactivateDocumentFile = function (documentFile) {
            return $http
                .put((urlService.documentFiles + '/deactivate/' + documentFile.id))
                .then(function () {
                    return documentFile;
                });
        };
        /**
         * @description Activate bulk of document files
         * @param documentFiles
         */
        self.activateBulkDocumentFiles = function (documentFiles) {
            return $http
                .put((urlService.documentFiles + '/activate/bulk'), _.map(documentFiles, 'id'))
                .then(function (result) {
                    return result;
                });
        };

        /**
         * @description Deactivate bulk of document files
         * @param documentFiles
         */
        self.deactivateBulkDocumentFiles = function (documentFiles) {
            return $http
                .put((urlService.documentFiles + '/deactivate/bulk'), _.map(documentFiles, 'id'))
                .then(function () {
                    return documentFiles;
                });
        };
        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param documentFile
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateDocumentFile = function (documentFile, editMode) {
            var documentFilesToFilter = self.documentFiles;
            if (editMode) {
                documentFilesToFilter = _.filter(documentFilesToFilter, function (documentFileToFilter) {
                    return documentFileToFilter.id !== documentFile.id;
                });
            }
            return _.some(_.map(documentFilesToFilter, function (existingDocumentFile) {
                return existingDocumentFile.arName === documentFile.arName
                    || existingDocumentFile.enName.toLowerCase() === documentFile.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };
        self.prepareRelationWithOrganizations = function (organizations, documentFiles, relatedOrgnization) {
            return _.map(documentFiles, function (site) {
                site = _.map(_.filter(relatedOrgnization, function (relation) {
                    return relation.documentFiles.id === site;
                }), function (relation) {
                    //return _.find(organizations, ['id', relation.ouid]);
                    var relationModel = {};
                    relationModel.relationId = relation.id;
                    relationModel.arName = _.find(organizations, ['id', relation.ouid]).arName;
                    relationModel.enName = _.find(organizations, ['id', relation.ouid]).enName;
                    relationModel.id = _.find(organizations, ['id', relation.ouid]).id;
                    return relationModel;
                });
                return site;
            });
        };
        self.saveRelatedOrganizationDocumentFile = function (relatedOrganizations) {
            return $http
                .post(urlService.relatedOUDocumentFiles, relatedOrganizations)
                .then(function (result) {
                    return result.data.rs;
                });
        };
        /**
         * @description check related organization.
         */
        self.checkIfRelatedOrganizationsExist = function (documentFile) {
            if (documentFile.relatedOus) {
                if (documentFile.global)
                    if (documentFile.relatedOus.length === 0) {
                        return false;
                    }
            }
            return true;
        };
        /**
         * @description create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteDocumentFile, self.updateDocumentFile);
        /**
         * @description get parent document files
         */
        self.getParentDocumentFiles = function (documentFiles) {
            return _.filter(documentFiles, function (documentFile) {
                return !documentFile.parent;
            })
        };
        /**
         * @description get parent document files
         */
        self.getParentDocumentFilesExcludeCurrentChild = function (documentFileCurrent) {
            var allChildrenOfDocumentFile = self.getDocumentFileChildren(documentFileCurrent);
            var resultFoundInDocumentFiles = self.documentFiles.filter(self.comparerArray(allChildrenOfDocumentFile));
            return _.filter(resultFoundInDocumentFiles, function (documentFile) {
                return documentFile.id !== documentFileCurrent.id;
            });
        };
        /**
         * @description compare array and return the unique array object
         * @param otherArray
         * @return array
         */
        self.comparerArray = function (otherArray) {
            return function (current) {
                return otherArray.filter(function (other) {
                    return other.id == current.id
                }).length == 0;
            }
        };
        /**
         * @description include all children of hierarchy
         * @param documentFile
         * @return documentFiles
         */
        self.getDocumentFileChildren = function (documentFile, array) {
            if (!array)
                array = [];

            _.map(self.documentFiles, function (doc) {
                if (doc.parent) {
                    if (documentFile.id === doc.parent.id && !_.find(array, function (x) {
                            return x.id === doc.id
                        })) {
                        array.push(doc);
                        self.getDocumentFileChildren(doc, array);
                    }
                }
            });
            return array;
        };
        /**
         * get children for given documentFile
         * @param parentDocumentFile
         * @return {Array}
         */
        self.getChildren = function (parentDocumentFile) {
            var parentID = parentDocumentFile.hasOwnProperty('id') ? parentDocumentFile.id : parentDocumentFile;
            return _.filter(self.documentFiles, function (documentFile) {
                if ((typeof documentFile.parent) === 'number') {
                    return Number(documentFile.parent) === Number(parentID);
                }
                else {
                    return Number(documentFile.parent ? documentFile.parent.id : null) === Number(parentID);
                }
            });
        };
        self.getChildrenDocumentFiles = function (parentDocumentFile) {
            var parentID = parentDocumentFile.hasOwnProperty('id') ? parentDocumentFile.id : parentDocumentFile;
            return _.filter(self.documentFiles, function (documentFile) {
                return Number(documentFile.parent ? documentFile.parent.id : null) === Number(parentID);
            });
        };
        /**
         * @description get parent documentFiles
         * @param documentFileToExclude
         * @return {Array}
         */
        self.getParentDocumentFilesOfChild = function (documentFileToExclude) {
            return _.filter(self.documentFile, function (documentFile) {
                if (documentFileToExclude)
                    return !documentFile.parent && documentFileToExclude.id !== documentFile.id;
                else
                    return !documentFile.parent;
            });
        };

        self.getChildrenFromDocumentFile = function (documentFile) {
            var fileId = documentFile.hasOwnProperty('id') ? documentFile.id : documentFile;
            return _.filter(self.documentFiles, function (item) {
                var parentId = (item.parent && item.parent.hasOwnProperty('id')) ? item.parent.id : item.parent;
                return Number(parentId) === Number(fileId);
            });
        }
    });
};
