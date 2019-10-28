module.exports = function (app) {
    app.service('documentTypeService', function (urlService,
                                                 $http,
                                                 $q,
                                                 generator,
                                                 DocumentType,
                                                 dialog,
                                                 cmsTemplate,
                                                 _,
                                                 langService,
                                                 toast,
                                                 lookupService) {
        'ngInject';
        var self = this;
        self.serviceName = 'documentTypeService';

        self.documentTypes = [];

        /**
         * @description Load the document types from server.
         * @returns {Promise|documentTypes}
         */
        self.loadDocumentTypes = function () {
            return $http.get(urlService.documentTypes).then(function (result) {
                self.documentTypes = generator.generateCollection(result.data.rs, DocumentType, self._sharedMethods);
                self.documentTypes = generator.interceptReceivedCollection('DocumentType', self.documentTypes);
                return self.documentTypes;
            });
        };
        /**
         * @description Get document types from self.documentTypes if found and if not load it from server again.
         * @returns {Promise|documentTypes}
         */
        self.getDocumentTypes = function () {
            return self.documentTypes.length ? $q.when(self.documentTypes) : self.loadDocumentTypes();
        };

        /**
         * @description Contains methods for CRUD operations for document types
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new document type
             * @param $event
             * @param documentClassFromUser
             */
            documentTypeAdd: function ($event, documentClassFromUser) {
                var documentClassLookup,defer = $q.defer();
                if (documentClassFromUser) {
                    documentClassLookup = _.filter(lookupService.returnLookups(lookupService.documentClass), function (lookup) {
                        return lookup.lookupStrKey.toLowerCase() === documentClassFromUser.toLowerCase();
                    });
                }

              defer.resolve(documentClassFromUser ? self.loadDocumentTypes(): self.documentTypes);

                return defer.promise.then(function (documentTypes) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('document-type'),
                        controller: 'documentTypePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            documentType: new DocumentType(
                                {
                                    itemOrder: generator.createNewID(documentTypes, 'itemOrder'),
                                    lookupStrKey: documentClassFromUser ? documentClassLookup : null
                                }),
                            documentTypes: documentTypes,
                            documentClassFromUser: documentClassLookup
                        }
                    });
                })
            },
            /**
             * @description Opens popup to edit document type
             * @param documentType
             * @param $event
             */
            documentTypeEdit: function (documentType, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('document-type'),
                        controller: 'documentTypePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            documentType: documentType,
                            documentTypes: self.documentTypes,
                            documentClassFromUser: null
                        }
                    });
            },
            /**
             * @description Show confirm box and delete bulk document type
             * @param documentType
             * @param $event
             */
            documentTypeDelete: function (documentType, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete').change({name: documentType.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deleteDocumentType(documentType)
                            .then(function () {
                                toast.success(langService.get("delete_specific_success").change({name: documentType.getNames()}));
                                return true;
                            });
                    });
            },
            /**
             * @description Show confirm box and delete bulk document types
             * @param documentTypes
             * @param $event
             */
            documentTypeDeleteBulk: function (documentTypes, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkDocumentTypes(documentTypes)
                            .then(function (result) {
                                var response = false;
                                if (result.length === documentTypes.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (documentType) {
                                        return documentType.getNames();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("delete_success"));
                                    response = true;
                                }
                                return response;
                            });
                    });
            }


        };

        /**
         * @description Add new document type
         * @param documentType
         * @return {Promise|DocumentType}
         */
        self.addDocumentType = function (documentType) {
            return $http
                .post(urlService.documentTypes,
                    generator.interceptSendInstance('DocumentType', documentType))
                .then(function () {
                    return documentType;
                });
        };
        /**
         * @description Update the given document type.
         * @param documentType
         * @return {Promise|DocumentType}
         */
        self.updateDocumentType = function (documentType) {
            return $http
                .put(urlService.documentTypes,
                    generator.interceptSendInstance('DocumentType', documentType))
                .then(function () {

                    return documentType;
                });
        };

        /**
         * @description Delete given document type.
         * @param documentType
         * @return {Promise|null}
         */
        self.deleteDocumentType = function (documentType) {
            var id = documentType.hasOwnProperty('id') ? documentType.id : documentType;
            return $http.delete((urlService.documentTypes + '/' + id));
        };

        /**
         * @description Delete bulk document types.
         * @param documentTypes
         * @return {Promise|null}
         */
        self.deleteBulkDocumentTypes = function (documentTypes) {
            var bulkIds = documentTypes[0].hasOwnProperty('id') ? _.map(documentTypes, 'id') : documentTypes;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.documentTypes + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failureCollection = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failureCollection.push(Number(key));
                });
                return _.filter(documentTypes, function (documentType) {
                    return (failureCollection.indexOf(documentType.id) > -1);
                });
            });
        };

        /**
         * @description Get document type by documentTypeId
         * @param documentTypeId
         * @returns {DocumentType|undefined} return DocumentType Model or undefined if not found.
         */
        self.getDocumentTypeById = function (documentTypeId) {
            documentTypeId = documentTypeId instanceof DocumentType ? documentTypeId.id : documentTypeId;
            return _.find(self.documentTypes, function (documentType) {
                return Number(documentType.id) === Number(documentTypeId)
            });
        };
        /**
         * @description Get document type by lookupKey
         * @param documentTypeId
         * @returns {DocumentType|undefined} return DocumentType Model or undefined if not found.
         */
        self.getDocumentTypeByLookupKey = function (lookupKey) {
            lookupKey = lookupKey instanceof DocumentType ? lookupKey.lookupKey : lookupKey;
            return _.find(self.documentTypes, function (documentType) {
                return Number(documentType.lookupKey) === Number(lookupKey)
            });
        };

        /**
         * @description Activate document type
         * @param documentType
         */
        self.activateDocumentType = function (documentType) {
            return $http
                .put((urlService.documentTypes + '/activate/' + documentType.id))
                .then(function () {
                    return documentType;
                });
        };

        /**
         * @description Deactivate document type
         * @param documentType
         */
        self.deactivateDocumentType = function (documentType) {
            return $http
                .put((urlService.documentTypes + '/deactivate/' + documentType.id))
                .then(function () {
                    return documentType;
                });
        };

        /**
         * @description Activate bulk document types
         * @param documentTypes
         */
        self.activateBulkDocumentTypes = function (documentTypes) {
            var bulkIds = documentTypes[0].hasOwnProperty('id') ? _.map(documentTypes, 'id') : documentTypes;
            return $http
                .put((urlService.documentTypes + '/activate/bulk'), bulkIds)
                .then(function () {
                    return documentTypes;
                });
        };

        /**
         * @description Deactivate bulk of document types
         * @param documentTypes
         */
        self.deactivateBulkDocumentTypes = function (documentTypes) {
            var bulkIds = documentTypes[0].hasOwnProperty('id') ? _.map(documentTypes, 'id') : documentTypes;
            return $http
                .put((urlService.documentTypes + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return documentTypes;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param documentType
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateDocumentType = function (documentType, editMode) {
            var documentTypesToFilter = self.documentTypes;
            if (editMode) {
                documentTypesToFilter = _.filter(documentTypesToFilter, function (documentTypeToFilter) {
                    return documentTypeToFilter.id !== documentType.id;
                });
            }
            return _.some(_.map(documentTypesToFilter, function (existingDocumentType) {
                return existingDocumentType.arName === documentType.arName
                    || existingDocumentType.enName.toLowerCase() === documentType.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteDocumentType, self.updateDocumentType);

    });
};
