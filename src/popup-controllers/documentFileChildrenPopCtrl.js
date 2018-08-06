module.exports = function (app) {
    app.controller('documentFileChildrenPopCtrl', function (lookupService,
                                                            documentFileService,
                                                            documentFiles,
                                                            $q,
                                                            $filter,
                                                            DocumentFile,
                                                            langService,
                                                            toast,
                                                            dialog,
                                                            relatedOUDocumentFileService,
                                                            documentFileParent,
                                                            organizationService) {
        'ngInject';
        var self = this;
        self.controllerName = 'documentFileChildrenPopCtrl';
        self.organizations = organizationService.loadOrganizations();
        self.documentFile = documentFileParent;

        /**
         *@description All child document files of selected parent
         */
        self.documentFiles = angular.copy(documentFiles);
        self.promise = null;
        self.selectedDocumentFiles = [];

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.documentFiles = $filter('orderBy')(self.documentFiles, self.grid.order);
        };

        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.documentFiles.length + 21);
                    }
                }
            ]
        };
        /**
         *@description Contains methods for CRUD operations for document files
         */
        self.statusServices = {
            'activate': documentFileService.activateBulkDocumentFiles,
            'deactivate': documentFileService.deactivateBulkDocumentFiles,
            'true': documentFileService.activateDocumentFile,
            'false': documentFileService.deactivateDocumentFile
        };
        /**
         * @description Opens dialog for add new document file
         * @param $event
         */
        self.openAddDocumentFileDialog = function ($event) {
            documentFileService
                .controllerMethod
                .documentFileAdd($event)
                .then(function (result) {
                    self.reloadDocumentFiles()
                        .then(function () {
                            toast.success(langService.get('add_success').change({name: result.getTranslatedName()}));
                        });
                })
        };

        /**
         * @description Opens dialog for edit document file
         * @param $event
         * @param documentFile
         */
        self.openEditDocumentFileDialog = function (documentFile, $event) {
            documentFileService
                .controllerMethod
                .documentFileEdit(documentFile, $event)
                .then(function (result) {
                    self.reloadDocumentFiles()
                        .then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getTranslatedName()}));
                        });
                }).catch(function () {
                self.reloadDocumentFiles();
            });
        };

        /**
         * @description Reload the grid of document file
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadDocumentFiles = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return relatedOUDocumentFileService
                .loadRelatedOUDocumentFiles()
                .then(function () {
                    return documentFileService
                        .loadDocumentFiles()
                        .then(function (result) {
                            self.selectedDocumentFiles = [];
                            self.documentFiles = documentFileService.getChildrenDocumentFiles(self.documentFile);

                            defer.resolve(true);
                            if (pageNumber)
                                self.grid.page = pageNumber;
                            self.getSortedData();
                            // return result;
                        });
                });
        };

        /**
         * @description Delete single document file
         * @param documentFile
         * @param $event
         */
        self.removeDocumentFile = function (documentFile, $event) {
            documentFileService
                .controllerMethod
                .documentFileDelete(documentFile, $event)
                .then(function () {
                    self.reloadDocumentFiles();
                });
        };

        /**
         * @description Delete multiple selected document files
         * @param $event
         */
        self.removeBulkDocumentFiles = function ($event) {
            documentFileService
                .controllerMethod
                .documentFileDeleteBulk(self.selectedDocumentFiles, $event)
                .then(function () {
                    self.reloadDocumentFiles().then(function (result) {
                        toast.success(langService.get('edit_success').change({name: result.getNames()}));
                    });
                });
        };

        /**
         * @description Change the status of document file from grid
         * @param documentFile
         */
        self.changeStatusDocumentFile = function (documentFile) {
            self.statusServices[documentFile.status](documentFile)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    documentFile.status = !documentFile.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };
        /**
         * @description Change the status of selected document files
         * @param status
         */
        self.changeStatusBulkDocumentFiles = function (status) {
            self.statusServices[status](self.selectedDocumentFiles).then(function () {
                self.reloadDocumentFiles(self.grid.page).then(function () {
                    toast.success(langService.get('selected_status_updated'));
                });
            });
        };
        /**
         * @description get organization arabic name
         * @param ouId
         */
        self.getOrganizationARName = function (ouId) {
            var isExist = self.organizations.filter(function (organization) {
                return organization.id === ouId;
            })[0];
            return isExist ? isExist["arName"] : null;
        };
        /**
         * @description show related organization
         * @param ouId
         */
        self.getOrganizationENName = function (ouId) {
            var isExist = self.organizations.filter(function (organization) {
                return organization.id === ouId;
            })[0];
            return isExist ? isExist["enName"] : null;
        };
        /**
         * @description show related organization
         */
        self.openOrganizationDialog = function (organization, documentfile, $event) {
            documentFileService
                .controllerMethod
                .openOrganizationPopup(organization, documentfile, $event)
                .then(function () {
                    self.reloadDocumentFiles().then(function () {
                    });
                });
        };
        /**
         * @description show child documentFiles
         */
        self.openChildDocumentFilesDialog = function (documentFiles, documentfile, $event) {
            documentFileService
                .controllerMethod
                .openChildDocumentFilesPopup(documentFiles, documentfile, $event)
                .then(function () {
                    self.reloadDocumentFiles().then(function () {
                    });
                }).catch(function () {
                self.reloadDocumentFiles().then(function () {
                });
            });
        };
    });
};