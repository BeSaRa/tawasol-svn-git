module.exports = function (app) {
    app.controller('documentFileNewCtrl', function (lookupService,
                                                    documentFileNewService,
                                                    documentFiles,
                                                    $q,
                                                    $filter,
                                                    DocumentFile,
                                                    langService,
                                                    toast,
                                                    dialog,
                                                    organizations,
                                                    ouDocumentFileService,
                                                    contextHelpService,
                                                    gridService,
                                                    generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'documentFileNewCtrl';
        contextHelpService.setHelpTo('document-files');

        self.documentFiles = documentFileNewService.getParentDocumentFiles(documentFiles);
        self.organizations = organizations;

        self.promise = null;
        self.selectedDocumentFiles = [];

        /**
         * @description
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.documentFile) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.documentFile, self.documentFiles),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.documentFile, limit);
            }
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.documentFiles = $filter('orderBy')(self.documentFiles, self.grid.order);
        };
        self.searchModel = '';
        self.searchMode = false;

        /**
         * @description Reload the grid of document file
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadDocumentFiles = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            self.searchMode = false;
            self.searchModel = '';

            return documentFileNewService
                .loadDocumentFilesWithLimit()
                .then(function (result) {
                    self.selectedDocumentFiles = [];
                    self.documentFiles = result;
                    //self.documentFiles = documentFileNewService.getParentDocumentFiles(result);
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         *@description Contains methods for CRUD operations for document files
         */
        self.statusServices = {
            activate: documentFileNewService.activateBulkDocumentFiles,
            deactivate: documentFileNewService.deactivateBulkDocumentFiles,
            true: documentFileNewService.activateDocumentFile,
            false: documentFileNewService.deactivateDocumentFile
        };

        /**
         * @description Opens dialog for add new document file
         * @param $event
         */
        self.openAddDocumentFileDialog = function ($event) {
            documentFileNewService.controllerMethod
                .documentFileAdd(null, $event)
                .then(function (result) {
                    self.reloadDocumentFiles(self.grid.page);
                })
                .catch(function () {
                    self.reloadDocumentFiles(self.grid.page);
                });
        };

        /**
         * @description Opens dialog for edit document file
         * @param $event
         * @param documentFile
         */
        self.openEditDocumentFileDialog = function (documentFile, $event) {
            documentFileNewService
                .controllerMethod
                .documentFileEdit(documentFile, null, $event)
                .then(function (result) {
                    self.reloadDocumentFiles(self.grid.page);
                })
                .catch(function (result) {
                    self.replaceRecordFromGrid(result);
                })
        };

        /**
         * @description Delete single document file
         * @param documentFile
         * @param $event
         */
        self.removeDocumentFile = function (documentFile, $event) {
            documentFileNewService.controllerMethod
                .documentFileDelete(documentFile, $event)
                .then(function () {
                    self.reloadDocumentFiles(self.grid.page);
                });
        };

        /**
         * @description Delete multiple selected document files
         * @param $event
         */
        self.removeBulkDocumentFiles = function ($event) {
            documentFileNewService.controllerMethod
                .documentFileDeleteBulk(self.selectedDocumentFiles, $event)
                .then(function () {
                    self.reloadDocumentFiles(self.grid.page);
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
            var statusCheck = (status === 'activate');
            if (!generator.checkCollectionStatus(self.selectedDocumentFiles, statusCheck)) {
                toast.success(langService.get(statusCheck ? 'success_activate_selected' : 'success_deactivate_selected'));
                return;
            }
            self.statusServices[status](self.selectedDocumentFiles).then(function () {
                self.reloadDocumentFiles(self.grid.page);
            });
        };

        /**
         * @description show related organization
         */
        self.openOrganizationDialog = function (organization, documentFile, $event) {
            documentFileNewService.controllerMethod
                .openOrganizationPopup(organization, documentFile, $event)
                .then(function () {
                    self.reloadDocumentFiles(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadDocumentFiles(self.grid.page);
                });
        };

        /**
         * @description show child documentFiles
         * @param documentFile
         * @param $event
         */
        self.openChildDocumentFilesDialog = function (documentFile, $event) {
            documentFileNewService.controllerMethod
                .openChildDocumentFilesPopup(documentFile, $event)
                .then(function (result) {
                    self.reloadDocumentFiles();
                })
                .catch(function (error) {
                    self.reloadDocumentFiles();
                })
        };

        /**
         * @description search in document files.
         * @param searchText
         * @return {*}
         */
        self.searchInDocumentFiles = function (searchText) {
            if (!searchText)
                return;
            self.searchMode = true;
            return documentFileNewService
                .documentFileSearch(searchText)
                .then(function (result) {
                    self.documentFiles = result;
                });
        };

        self.replaceRecordFromGrid = function (documentFile) {
            self.documentFiles.splice(_.findIndex(self.documentFiles, function (item) {
                return item.id === documentFile.id;
            }), 1, documentFile);
        };
    });
};