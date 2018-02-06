module.exports = function (app) {
    app.controller('documentTemplateCtrl', function (lookupService,
                                                     documentTemplateService,
                                                     documentTemplates,
                                                     $q,
                                                     langService,
                                                     toast,
                                                     dialog,
                                                     organizations,
                                                     contextHelpService,
                                                     Organization,
                                                     currentEmployee) {
        'ngInject';
        var self = this;

        self.controllerName = 'documentTemplateCtrl';
        self.organizations = (angular.copy(organizations));
        self.organizations.unshift(new Organization({
            id: -1,
            arName: langService.getKey('global_templates', 'ar'),
            enName: langService.getKey('global_templates', 'en')
        }));
        self.progress = null;
        contextHelpService.setHelpTo('document-templates');
        /**
         * @description All document templates
         * @type {*}
         */
        self.documentTemplates = documentTemplates;

        /**
         * @description Contains the selected organization unit to filter grid
         * @type {null}
         */
        self.selectedOrganization = currentEmployee.defaultOUID;

        /**
         * @description Contains the selected document templates
         * @type {Array}
         */
        self.selectedDocumentTemplates = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.documentTemplates.length + 21);
                    }
                }
            ]
        };

        /**
         * @description Contains methods for CRUD operations for document templates
         */
        self.statusServices = {
            'activate': documentTemplateService.activateBulkDocumentTemplates,
            'deactivate': documentTemplateService.deactivateBulkDocumentTemplates,
            'true': documentTemplateService.activateDocumentTemplate,
            'false': documentTemplateService.deactivateDocumentTemplate
        };

        self.documentTypes = [
            {text: "Outgoing", langKey: 'outgoing', value: 0},
            {text: "Internal", langKey: 'internal', value: 2},
            {text: "Both", langKey: 'both', value: null}
        ];

        self.templateTypes = [
            {text: "Type 1", value: 270},
            {text: "Type 2", value: 271}
        ];

        self.getDocumentTypeName = function (documentTypeId) {
            return langService.get(_.find(self.documentTypes, function (documentType) {
                return (documentType.value === documentTypeId);
            }).langKey);
        };

        self.getTemplateTypeName = function (templateId) {
            var matchedTemplateType = _.filter(self.templateTypes, function (templateType) {
                return (templateType.value === templateId);
            });
            if (matchedTemplateType.length)
                return matchedTemplateType[0].text;
        };

        /**
         * @description Gets the document templates for selected organization unit
         */
        self.getDocumentTemplates = function () {
            // documentTemplateService
            //     .getDocumentTemplatesByOU(self.selectedOrganization)
            //     .then(function(result){
            //        self.documentTemplates = result;
            //     });
            self.reloadDocumentTemplates(self.grid.page);
        };

        /**
         * @description Opens dialog for add new document template
         * @param $event
         */
        self.openAddDocumentTemplateDialog = function ($event) {
            documentTemplateService
                .controllerMethod
                .documentTemplateAdd(self.selectedOrganization, self.organizations, self.documentTypes, self.templateTypes, $event)
                .then(function (result) {
                    self.reloadDocumentTemplates(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('add_success').change({name: result.getSubjectTitle()}));
                        });
                });
        };

        /**
         * @description Opens dialog for edit document template
         * @param $event
         * @param documentTemplate
         */
        self.openEditDocumentTemplateDialog = function (documentTemplate, $event) {
            documentTemplateService
                .controllerMethod
                .documentTemplateEdit(documentTemplate, self.selectedOrganization, self.organizations, self.documentTypes, self.templateTypes, $event)
                .then(function (result) {
                    self.reloadDocumentTemplates(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getSubjectTitle()}));
                        });
                });
        };

        /**
         * @description Reload the grid of document template
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadDocumentTemplates = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return documentTemplateService
                .loadDocumentTemplates(self.selectedOrganization)
                .then(function (result) {
                    self.documentTemplates = result;
                    self.selectedDocumentTemplates = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Delete single document template
         * @param documentTemplate
         * @param $event
         */
        self.removeDocumentTemplate = function (documentTemplate, $event) {
            documentTemplateService
                .controllerMethod
                .documentTemplateDelete(documentTemplate, $event)
                .then(function () {
                    self.reloadDocumentTemplates(self.grid.page);
                });
        };

        /**
         * @description Delete multiple selected document templates
         * @param $event
         */
        self.removeBulkDocumentTemplates = function ($event) {
            documentTemplateService
                .controllerMethod
                .documentTemplateDeleteBulk(self.selectedDocumentTemplates, $event)
                .then(function () {
                    self.reloadDocumentTemplates(self.grid.page)
                        .then(function () {
                            toast.success(langService.get("delete_success"));
                        });
                });
        };

        /**
         * @description Change the status of document template
         * @param documentTemplate
         */
        self.changeStatusDocumentTemplate = function (documentTemplate) {
            self.statusServices[documentTemplate.status](documentTemplate)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    documentTemplate.status = !documentTemplate.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected document templates
         * @param status
         */
        self.changeStatusBulkDocumentTemplates = function (status) {
            self.statusServices[status](self.selectedDocumentTemplates)
                .then(function () {
                    self.reloadDocumentTemplates(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('selected_status_updated'));
                        });
                });
        };

        /*/!**
         * @description Change the globalization of document template
         * @param documentTemplate
         *!/
         self.changeGlobalDocumentTemplate = function (documentTemplate) {
         if (documentTemplate.isGlobal) {
         documentTemplateService.updateDocumentTemplate(documentTemplate)
         .then(function () {
         toast.success(langService.get('globalization_success'));
         })
         .catch(function () {
         documentTemplate.isGlobal = !documentTemplate.isGlobal;
         dialog.errorMessage(langService.get('something_happened_when_update_global'));
         });
         }
         else {
         console.log("Open the popup to add relation entities");
         }
         };*/
    });
};