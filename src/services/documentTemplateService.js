module.exports = function (app) {
    app.service('documentTemplateService', function (urlService,
                                                     $http,
                                                     $q,
                                                     generator,
                                                     DocumentTemplate,
                                                     _,
                                                     dialog,
                                                     langService,
                                                     toast,
                                                     cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'documentTemplateService';

        self.documentTemplates = [];

        /**
         * @description Load the document templates from server.
         * @returns {Promise|documentTemplates}
         */
        self.loadDocumentTemplates = function (organization) {
            organization = organization.hasOwnProperty('id') ? organization.id : organization;
            return $http.get(urlService.documentTemplates + '/ou/' + organization).then(function (result) {
                self.documentTemplates = generator.generateCollection(result.data.rs, DocumentTemplate, self._sharedMethods);
                self.documentTemplates = generator.interceptReceivedCollection('DocumentTemplate', self.documentTemplates);
                return self.documentTemplates;
            });
        };

        /**
         * @description Get document templates from self.documentTemplates if found and if not load it from server again.
         * @returns {Promise|documentTemplates}
         */
        self.getDocumentTemplates = function () {
            return self.documentTemplates.length ? $q.when(self.documentTemplates) : self.loadDocumentTemplates();
        };

        self.getDocumentTemplatesByOU = function (organization) {
            organization = organization.hasOwnProperty('id') ? organization.id : organization;
            return $http.get(urlService.documentTemplates + '/ou/' + organization).then(function (result) {
                self.documentTemplates = generator.generateCollection(result.data.rs, DocumentTemplate, self._sharedMethods);
                self.documentTemplates = generator.interceptReceivedCollection('DocumentTemplate', self.documentTemplates);
                return self.documentTemplates;
            });
        };

        /**
         * @description Contains methods for CRUD operations for document templates
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new document template
             * @param $event
             */
            documentTemplateAdd: function (selectedOrganization, organizations, documentTypes, templateTypes, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('document-template'),
                        controller: 'documentTemplatePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            documentTemplate: new DocumentTemplate({
                                ou: selectedOrganization,
                                isGlobal: (selectedOrganization < 0)
                            }),
                            documentTemplates: self.documentTemplates,
                            organizations: organizations,
                            documentTypes: documentTypes,
                            templateTypes: templateTypes,
                            selectedOrganization: selectedOrganization
                        }
                    });
            },
            /**
             * @description Opens popup to edit document template
             * @param documentTemplate
             * @param $event
             */
            documentTemplateEdit: function (documentTemplate, selectedOrganization, organizations, documentTypes, templateTypes, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('document-template'),
                        controller: 'documentTemplatePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            documentTemplate: documentTemplate,
                            documentTemplates: self.documentTemplates,
                            organizations: organizations,
                            documentTypes: documentTypes,
                            templateTypes: templateTypes,
                            selectedOrganization: selectedOrganization
                        }
                    });
            },
            /**
             * @description Show confirm box and delete document template
             * @param documentTemplate
             * @param $event
             */
            documentTemplateDelete: function (documentTemplate, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: documentTemplate.getSubjectTitle()}), null, null, $event)
                    .then(function () {
                        console.log('documentTemplate', documentTemplate);
                        return self.deleteDocumentTemplate(documentTemplate).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: documentTemplate.getSubjectTitle()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and delete bulk document templates
             * @param documentTemplates
             * @param $event
             */
            documentTemplateDeleteBulk: function (documentTemplates, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkDocumentTemplates(documentTemplates)
                            .then(function (result) {
                                var response = false;
                                if (result.length === documentTemplates.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (documentTemplate) {
                                        return documentTemplate.getSubjectTitle();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("delete_success"));
                                    response = true;
                                }
                                return response;
                            });
                    });
            }/*,
             /!**
             * @description Open dialog to add relation app users to document template
             * @param documentTemplate
             * @param $event
             *!/
             documentTemplateSetGlobalNo: function(documentTemplate, $event){
             return dialog
             .showDialog({
             targetEvent: $event,
             template: cmsTemplate.getPopup('relation-app-user'),
             controller: 'relationAppUserPopCtrl',
             controllerAs: 'ctrl',
             locals: {
             model: documentTemplate,
             propertyToSetValue: 'isGlobal',
             updateMethod: self.updateDocumentTemplate
             }
             });
             }*/
        };

        /**
         * @description Add new document template
         * @param documentTemplate
         * @param docTemplateFile
         * @return {Promise|DocumentTemplate}
         */
        self.addDocumentTemplate = function (documentTemplate, docTemplateFile) {
            documentTemplate = generator.interceptSendInstance('DocumentTemplate', documentTemplate);
            var form = new FormData();
            form.append('entity', JSON.stringify(documentTemplate));
            form.append('content', docTemplateFile);
            return $http.post(urlService.documentTemplates, form, {
                headers: {
                    'Content-Type': undefined
                }
            })
                .then(function (result) {
                    return documentTemplate;
                })
        };

        /**
         * @description Update the given document template.
         * @param documentTemplate
         * @param docTemplateFile
         * @return {Promise|DocumentTemplate}
         */
        self.updateDocumentTemplate = function (documentTemplate, docTemplateFile) {
            documentTemplate = generator.interceptSendInstance('DocumentTemplate', documentTemplate);
            var form = new FormData();
            delete documentTemplate.docClassName;
            form.append('entity', JSON.stringify(documentTemplate));
            form.append('content', docTemplateFile);

            return $http
                .post(urlService.documentTemplates + "/update", form, {
                    headers: {
                        'Content-Type': undefined
                    }
                })
                .then(function () {
                    return documentTemplate;
                });
        };

        /**
         * @description Delete given document template.
         * @param documentTemplate
         * @return {Promise|null}
         */
        self.deleteDocumentTemplate = function (documentTemplate) {
            var id = documentTemplate.hasOwnProperty('id') ? documentTemplate.vsId : documentTemplate;
            return $http.delete(urlService.documentTemplates + '/vsid/' + id);
        };

        /**
         * @description Delete bulk document templates.
         * @param documentTemplates
         * @return {Promise|null}
         */
        self.deleteBulkDocumentTemplates = function (documentTemplates) {
            var bulkIds = documentTemplates[0].hasOwnProperty('id') ? _.map(documentTemplates, 'vsId') : documentTemplates;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.documentTemplates + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedDocumentTemplates = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedDocumentTemplates.push(key);
                });
                return _.filter(documentTemplates, function (documentTemplate) {
                    return (failedDocumentTemplates.indexOf(documentTemplate.vsId) > -1);
                });
            });
        };

        /**
         * @description Get document template by documentTemplateId
         * @param documentTemplateId
         * @returns {DocumentTemplate|undefined} return DocumentTemplate Model or undefined if not found.
         */
        self.getDocumentTemplateById = function (documentTemplateId) {
            documentTemplateId = documentTemplateId instanceof DocumentTemplate ? documentTemplateId.id : documentTemplateId;
            return _.find(self.documentTemplates, function (documentTemplate) {
                return Number(documentTemplate.id) === Number(documentTemplateId);
            });
        };

        /**
         * @description Activate document template
         * @param documentTemplate
         */
        self.activateDocumentTemplate = function (documentTemplate) {
            return $http
                .put((urlService.documentTemplates + '/activate/vsid/' + documentTemplate.vsId))
                .then(function () {
                    return documentTemplate;
                });
        };

        /**
         * @description Deactivate document template
         * @param documentTemplate
         */
        self.deactivateDocumentTemplate = function (documentTemplate) {
            return $http
                .put((urlService.documentTemplates + '/deactivate/vsid/' + documentTemplate.vsId))
                .then(function () {
                    return documentTemplate;
                });
        };

        /**
         * @description Activate bulk of document templates
         * @param documentTemplates
         */
        self.activateBulkDocumentTemplates = function (documentTemplates) {
            var bulkIds = documentTemplates[0].hasOwnProperty('id') ? _.map(documentTemplates, 'vsId') : documentTemplates;
            return $http
                .put((urlService.documentTemplates + '/activate/bulk'), bulkIds)
                .then(function () {
                    return documentTemplates;
                });
        };

        /**
         * @description Deactivate bulk of document templates
         * @param documentTemplates
         */
        self.deactivateBulkDocumentTemplates = function (documentTemplates) {
            var bulkIds = documentTemplates[0].hasOwnProperty('id') ? _.map(documentTemplates, 'vsId') : documentTemplates;
            return $http
                .put((urlService.documentTemplates + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return documentTemplates;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param documentTemplate
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateDocumentTemplate = function (documentTemplate, editMode) {
            var documentTemplatesToFilter = self.documentTemplates;
            if (editMode) {
                documentTemplatesToFilter = _.filter(documentTemplatesToFilter, function (documentTemplateToFilter) {
                    return documentTemplateToFilter.id !== documentTemplate.id;
                });
            }
            return _.some(_.map(documentTemplatesToFilter, function (existingDocumentTemplate) {
                return existingDocumentTemplate.docSubject.toLowerCase() === documentTemplate.docSubject.toLowerCase()
                    || existingDocumentTemplate.documentTitle.toLowerCase() === documentTemplate.documentTitle.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteDocumentTemplate, self.updateDocumentTemplate);
    });
};
