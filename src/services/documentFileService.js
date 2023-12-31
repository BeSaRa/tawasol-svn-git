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
                                                 cmsTemplate,
                                                 OUDocumentFile,
                                                 employeeService,
                                                 errorCode) {
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
         * @description search in document files .
         * @param searchText
         * @param parent
         * @return {*}
         */
        self.documentFileSearch = function (searchText, parent) {
            return $http.get(urlService.documentFiles + '/criteria', {
                params: {
                    criteria: searchText,
                    parent: typeof parent !== 'undefined' ? (parent.hasOwnProperty('id') ? parent.id : parent) : null
                }
            }).then(function (result) {
                return generator.interceptReceivedCollection('DocumentFile', generator.generateCollection(result.data.rs, DocumentFile, self._sharedMethods));
            });
        };

        /**
         * @description load classifications with limit up to 50
         * @param limit
         * @return {*}
         */
        self.loadDocumentFilesWithLimit = function (limit) {
            return $http
                .get(urlService.entityWithlimit.replace('{entityName}', 'document-file').replace('{number}', limit ? limit : 50))
                .then(function (result) {
                    self.documentFiles = generator.generateCollection(result.data.rs, DocumentFile, self._sharedMethods);
                    self.documentFiles = generator.interceptReceivedCollection('DocumentFile', self.documentFiles);
                    return self.documentFiles;
                });
        };
        /**
         * @description load sub correspondence sites for the given correspondence site.
         * @param documentFile
         * @return {*}
         */

        self.loadSubDocumentFiles = function (documentFile) {
            //console.log('sub documentFile', documentFile);
            var id = documentFile.hasOwnProperty('id') ? documentFile.id : documentFile;
            return $http
                .get(urlService.childrenEntities.replace('{entityName}', 'document-file').replace('{entityId}', id))
                .then(function (result) {
                    return generator.interceptReceivedCollection('DocumentFile', generator.generateCollection(result.data.rs, DocumentFile, self._sharedMethods));
                });
        };

        /**
         * @description load document files(global and private to current OU) with searchText
         * @param searchText
         * @param securityLevel
         * @param parent
         * @param ignoreStatus
         * @return {*}
         */
        self.loadDocumentFilesBySearchText = function (searchText, securityLevel, parent, ignoreStatus) {
            if (typeof securityLevel === 'undefined' || securityLevel == null) {
                securityLevel = null;
            } else {
                if (securityLevel.hasOwnProperty('lookupKey'))
                    securityLevel = securityLevel.lookupKey;
            }
            if (typeof parent === 'undefined' || parent == null) {
                parent = null;
            } else {
                if (parent.hasOwnProperty('id'))
                    parent = parent.id;
            }
            return $http.get(urlService.entityBySearchText.replace('{entityName}', 'document-file'), {
                params: {
                    criteria: searchText,
                    parent: parent,
                    securityLevel: securityLevel,
                    ignoreStatus: ignoreStatus
                }
            }).then(function (result) {
                result = result.data.rs;
                result.first = generator.interceptReceivedCollection('DocumentFile', generator.generateCollection(result.first, DocumentFile, self._sharedMethods));
                result.second = generator.interceptReceivedCollection('OUDocumentFile', generator.generateCollection(result.second, OUDocumentFile));
                return result;
            });
        };

        /**
         * @description Contains methods for CRUD operations for document files
         */
        self.controllerMethod = {
            documentFileAdd: function (parentDocumentFile, $event, documentClassFromUser) {
                var documentFile = new DocumentFile({
                    itemOrder: generator.createNewID(self.documentFiles, 'itemOrder'),
                    securityLevels: parentDocumentFile ? parentDocumentFile.securityLevels : null,
                    parent: parentDocumentFile,
                    global: (!!documentClassFromUser || !employeeService.isSuperAdminUser() ? false : (parentDocumentFile ? parentDocumentFile.global : true))
                });

                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('document-file'),
                        controller: 'documentFilePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            documentFile: documentFile,
                            documentClassFromUser: documentClassFromUser || null
                        }
                    });
            },
            documentFileEdit: function (documentFile, parentDocumentFile, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('document-file'),
                        controller: 'documentFilePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            documentFile: documentFile,
                            documentClassFromUser: null
                        },
                        resolve: {
                            ouDocumentFiles: function (ouDocumentFileService) {
                                'ngInject';
                                if (documentFile.id && !documentFile.global) {
                                    return ouDocumentFileService.loadOUDocumentFilesByDocumentFileId(documentFile)
                                        .then(function (result) {
                                            documentFile.relatedOus = result;
                                        })
                                }
                                return [];
                            }
                        }
                    });
            },
            openSelectOrganizationPopup: function (documentFile, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('document-file-select-related-ou'),
                        controller: 'documentFileSelectRelatedOUPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            documentFile: angular.copy(documentFile)
                        }
                    });
            },
            openOrganizationPopup: function (organizations, documentFile, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('document-file-related-ou'),
                        controller: 'documentFileRelatedOUPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            documentFileRelatedOU: organizations,
                            documentFile: documentFile
                        }
                    });
            },
            openChildDocumentFilesPopup: function (documentFile, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('document-file-child'),
                        controller: 'documentFileChildrenPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            documentFile: documentFile
                        },
                        resolve: {
                            subDocumentFiles: function () {
                                return self.loadSubDocumentFiles(documentFile);
                            }
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
                        return self.deleteBulkDocumentFiles(documentFiles);
                    });
            }
        };

        /**
         * @description add new document file
         * @param documentFile
         * @return {Promise|DocumentFile}
         */
        self.addDocumentFile = function (documentFile) {
            return $http.post(urlService.documentFiles, generator.interceptSendInstance('DocumentFile', documentFile))
                .then(function (result) {
                    documentFile.id = result.data.rs;
                    return documentFile;
                })
                .catch(function (error) {
                    return errorCode.checkIf(error, 'DUPLICATE_ENTRY', function () {
                        dialog.errorMessage(langService.get('record_already_exists').change({entity: langService.get('document_file')}));
                        return $q.reject('DUPLICATE_ENTRY');
                    });
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
                    return documentFile;
                    //return generator.interceptReceivedInstance('DocumentFile', generator.generateInstance(documentFile, DocumentFile, self._sharedMethods));
                });
        };
        /**
         * @description delete given document file.
         * @param documentFile
         * @return {Promise|null}
         */
        self.deleteDocumentFile = function (documentFile) {
            var id = documentFile.hasOwnProperty('id') ? documentFile.id : documentFile;
            return $http.delete(urlService.documentFiles + '/' + id);
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
                return generator.getBulkActionResponse(result, documentFiles, false, 'failed_delete_selected', 'delete_success', 'delete_success_except_following');
            });
        };

        /**
         * @description get document file by documentFileId
         * @param documentFileId
         * @returns {DocumentFile|undefined} return DocumentFile Model or undefined if not found.
         */
        self.getDocumentFileById = function (documentFileId) {
            documentFileId = documentFileId instanceof DocumentFile ? documentFileId.id : documentFileId;
            return _.find(self.documentFiles, function (documentFile) {
                return Number(documentFile.id) === Number(documentFileId)
            });
        };
        /**
         * @description get document file by lookupKey
         * @returns {DocumentFile|undefined} return DocumentFile Model or undefined if not found.
         * @param lookupKey
         */
        self.getDocumentFileByLookupKey = function (lookupKey) {
            lookupKey = lookupKey instanceof DocumentFile ? lookupKey.lookupKey : lookupKey;
            return _.find(self.documentFiles, function (documentFile) {
                return Number(documentFile.lookupKey) === Number(lookupKey)
            });
        };
        /**
         * @description activate document file
         * @param documentFile
         */
        self.activateDocumentFile = function (documentFile) {
            return $http.put(urlService.documentFiles + '/activate/' + documentFile.id)
                .then(function () {
                    return documentFile;
                });
        };

        /**
         * @description Deactivate document file
         * @param documentFile
         */
        self.deactivateDocumentFile = function (documentFile) {
            return $http.put(urlService.documentFiles + '/deactivate/' + documentFile.id)
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
                    return generator.getBulkActionResponse(result, documentFiles, false, 'failed_activate_selected', 'success_activate_selected', 'success_activate_selected_except_following');
                });
        };

        /**
         * @description Deactivate bulk of document files
         * @param documentFiles
         */
        self.deactivateBulkDocumentFiles = function (documentFiles) {
            return $http
                .put((urlService.documentFiles + '/deactivate/bulk'), _.map(documentFiles, 'id'))
                .then(function (result) {
                    return generator.getBulkActionResponse(result, documentFiles, false, 'failed_deactivate_selected', 'success_deactivate_selected', 'success_deactivate_selected_except_following');
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

        /**
         * @description get parent document files
         */
        self.getParentDocumentFiles = function (documentFiles) {
            return _.filter(documentFiles, function (documentFile) {
                return !documentFile.parent;
            })
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
                } else {
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
        };


        /**
         * @description create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteDocumentFile, self.updateDocumentFile);

    });
};
