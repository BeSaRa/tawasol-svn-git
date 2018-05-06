module.exports = function (app) {
    app.service('documentStatusService', function (urlService,
                                                   $http,
                                                   $q,
                                                   generator,
                                                   toast,
                                                   DocumentStatus,
                                                   dialog,
                                                   cmsTemplate,
                                                   _,
                                                   langService) {
        'ngInject';
        var self = this;
        self.serviceName = 'documentStatusService';

        self.documentStatuses = [];

        /**
         * @description load documentStatuses from server.
         * @returns {Promise|documentStatuses}
         */
        self.loadDocumentStatuses = function () {
            return $http.get(urlService.documentStatus).then(function (result) {
                self.documentStatuses = generator.generateCollection(result.data.rs, DocumentStatus, self._sahredMethods);
                self.documentStatuses = generator.interceptReceivedCollection('DocumentStatus', self.documentStatuses);
                return self.documentStatuses;
            });
        };
        /**
         * @description get documentStatuses from self.documentStatuses if found and if not load it from server again.
         * @returns {Promise|documentStatuses}
         */
        self.getDocumentStatuses = function () {
            return self.documentStatuses.length ? $q.when(self.documentStatuses) : self.loadDocumentStatuses();
        };
        /**
         * @description add new documentStatus to service
         * @param documentStatus
         * @return {Promise|DocumentStatus}
         */
        self.addDocumentStatus = function (documentStatus) {
            return $http
                .post(urlService.documentStatus,
                    generator.interceptSendInstance('DocumentStatus', documentStatus))
                .then(function (result) {
                    return generator.interceptReceivedInstance('DocumentStatus', generator.generateInstance(result.data.rs, DocumentStatus, self._sahredMethods));
                });
        };

        /**
         * @description make an update for given documentStatus.
         * @param documentStatus
         * @return {Promise|DocumentStatus}
         */
        self.updateDocumentStatus = function (documentStatus) {
            return $http
                .put(urlService.documentStatus,
                    generator.interceptSendInstance('DocumentStatus', documentStatus))
                .then(function (result) {
                    return generator.interceptReceivedInstance('DocumentStatus', generator.generateInstance(result.data.rs, DocumentStatus, self._sahredMethods));
                });
        };

        /**
         * @description delete given selected document statues.
         * @return {Promise}
         * @param documentStatuses
         */
        self.deleteBulkDocumentStatuses = function (documentStatuses) {
            var bulkIds = documentStatuses[0].hasOwnProperty('id') ? _.map(documentStatuses, 'id') : documentStatuses;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.documentStatus + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedDocumentStatuses = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedDocumentStatuses.push(key);
                });
                return _.filter(documentStatuses, function (documentStatus) {
                    return (failedDocumentStatuses.indexOf(documentStatus.id) > -1);
                });
            });
        };
        /**
         * @description create the shred method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sahredMethods = generator.generateSharedMethods(self.deleteDocumentStatus, self.updateDocumentStatus);

        /**
         * @description get documentStatus by documentStatusId
         * @param documentStatusId
         * @returns {DocumentStatus|undefined} return DocumentStatus Model or undefined if not found.
         */
        self.getDocumentStatusById = function (documentStatusId) {
            documentStatusId = documentStatusId instanceof DocumentStatus ? documentStatusId.id : documentStatusId;
            return _.find(self.documentStatuses, function (documentStatus) {
                return Number(documentStatus.id) === Number(documentStatusId)
            });
        };
        /**
         * @description open popup to add new document status
         * @param documentStatusId
         * @returns {DocumentStatus|undefined} return DocumentStatus Model or undefined if not found.
         */
        self.controllerMethod = {
            documentStatusAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('document-status'),
                        controller: 'documentStatusPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            documentStatus: new DocumentStatus(
                                {
                                    itemOrder: generator.createNewID(self.documentStatuses, 'itemOrder')
                                }),
                            documentStatuses: self.documentStatuses
                        }
                    });
            },
            documentStatusEdit: function ($event, documentStatus) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('document-status'),
                        controller: 'documentStatusPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            documentStatus: angular.copy(documentStatus)
                        }
                    });
            },
            documentStatusDelete: function (documentStatus, $event) {
            return dialog.confirmMessage(langService.get('confirm_delete').change({name: documentStatus.getNames()}))
                .then(function () {
                    return self.deleteDocumentStatus(documentStatus).then(function () {
                        toast.success(langService.get("delete_specific_success").change({name: documentStatus.getNames()}));
                        return true;
                    });
                });
        },
        documentStatusDeleteBulk: function (documentStatuses, $event) {
            return dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'))
                .then(function () {
                    return self.deleteBulkDocumentStatuses(documentStatuses).then(function (result) {
                        if(result.length === documentStatuses.length){
                            toast.error(langService.get("failed_delete_selected"));
                            return false;
                        }
                        else if (result.length) {
                            generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (documentStatus) {
                                return documentStatus.getNames();
                            }));
                            return true;
                        }
                        else {
                            toast.success(langService.get("delete_success"));
                            return true;
                        }
                    });
                });
        }

        };
        /**
         * @description open popup to edit
         */
        self.controllerEditMethod = {

        };
        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param documentStatus
         * @returns {boolean}
         */
        self.checkDuplicateDocumentStatus = function (documentStatus, editMode) {
            var matchingRecordIndex = -1;
            var documentStatusToFilter = self.documentStatuses;
            if (editMode) {
                documentStatusToFilter = _.filter(documentStatusToFilter, function (documentStatusToFilter) {
                    return documentStatusToFilter.id !== documentStatus.id;
                });
            }
            return _.some(_.map(documentStatusToFilter, function (existingDocumentStatus) {

                return existingDocumentStatus.arName === documentStatus.arName
                    || existingDocumentStatus.enName.toLowerCase() === documentStatus.enName.toLowerCase();
            }), function (matchingResult, index) {
                matchingRecordIndex = index;
                return matchingResult === true;
            });
        };
        /**
         * activate role
         * @param role
         */
        self.activateDocumentStatus = function (documentStatus) {
            return $http
                .put((urlService.documentStatus + '/'+'activate'+'/' + documentStatus.id))
                .then(function () {
                    return documentStatus;
                });
        };
        /**
         * deactivate role
         * @param role
         */
        self.deactivateDocumentStatus = function (documentStatus) {
            return $http
                .put((urlService.documentStatus + '/'+'deactivate'+'/' + documentStatus.id))
                .then(function () {
                    return documentStatus;
                });
        };
        /**
         * activate bulk of role
         * @param documentStatuses
         */
        self.activateBulkDocumentStatus = function (documentStatuses) {
            return $http
                .put((urlService.documentStatus + '/'+'activate'+'/'+'bulk'), _.map(documentStatuses, 'id'))
                .then(function () {
                    return documentStatuses;
                });
        };
        /**
         * deactivate bulk of role
         * @param documentStatuses
         */
        self.deactivateBulkDocumentStatus = function (documentStatuses) {
            return $http
                .put((urlService.documentStatus + '/' + 'deactivate'+'/'+'bulk'), _.map(documentStatuses, 'id'))
                .then(function () {
                    return documentStatuses;
                });
        };
        self.deleteDocumentStatus = function (jobTitle) {
            var id = jobTitle.hasOwnProperty('id') ? jobTitle.id : jobTitle;
            return $http.delete(urlService.documentStatus + '/' + id).then(function(result){
                return result;
            });
        };

    });
};
