module.exports = function (app) {
    app.controller('documentFileChildrenNewPopCtrl', function (lookupService,
                                                               documentFileNewService,
                                                               $q,
                                                               _,
                                                               $filter,
                                                               DocumentFile,
                                                               langService,
                                                               toast,
                                                               subDocumentFiles,
                                                               dialog,
                                                               relatedOUDocumentFileService,
                                                               documentFile,
                                                               generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'documentFileChildrenNewPopCtrl';
        self.parentDocumentFile = documentFile;

        /**
         *@description All child document files of selected parent
         */
        self.subDocumentFiles = subDocumentFiles;
        self.progress = null;
        self.selectedSubDocumentFiles = [];

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.subDocumentFiles = $filter('orderBy')(self.subDocumentFiles, self.grid.order);
        };

        self.searchModel = '';
        self.searchMode = false;

        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.subDocumentFiles.length + 21);
                    }
                }
            ]
        };
        /**
         *@description Contains methods for CRUD operations for document files
         */
        self.statusServices = {
            'activate': documentFileNewService.activateBulkDocumentFiles,
            'deactivate': documentFileNewService.deactivateBulkDocumentFiles,
            'true': documentFileNewService.activateDocumentFile,
            'false': documentFileNewService.deactivateDocumentFile
        };

        /**
         * @description Opens dialog for add sub document file
         * @param $event
         */
        self.openAddSubDocumentFileDialog = function ($event) {
            documentFileNewService.controllerMethod
                .documentFileAdd(self.parentDocumentFile, $event)
                .then(function (result) {
                    self.reloadSubDocumentFiles(self.grid.page);
                })
                .catch(function (result) {
                    self.reloadSubDocumentFiles(self.grid.page);
                });
        };

        /**
         * @description Opens dialog for edit sub document file
         * @param $event
         * @param subDocumentFile
         */
        self.openEditSubDocumentFileDialog = function (subDocumentFile, $event) {
            documentFileNewService.controllerMethod
                .documentFileEdit(subDocumentFile, $event)
                .then(function (result) {
                    self.reloadSubDocumentFiles(self.grid.page);
                })
                .catch(function (result) {
                    self.replaceRecordFromGrid(result);
                });
        };

        /**
         * @description Reload the grid of document file
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadSubDocumentFiles = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            self.searchModel = '';
            self.searchMode = false;

            return documentFileNewService
                .loadSubDocumentFiles(self.parentDocumentFile)
                .then(function (result) {
                    self.selectedSubDocumentFiles = [];
                    self.subDocumentFiles = result;
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Delete single document file
         * @param subDocumentFile
         * @param $event
         */
        self.removeSubDocumentFile = function (subDocumentFile, $event) {
            documentFileNewService.controllerMethod
                .documentFileDelete(subDocumentFile, $event)
                .then(function () {
                    self.reloadSubDocumentFiles(self.grid.page);
                });
        };

        /**
         * @description Delete multiple selected document files
         * @param $event
         */
        self.removeBulkSubDocumentFiles = function ($event) {
            documentFileNewService.controllerMethod
                .documentFileDeleteBulk(self.selectedSubDocumentFiles, $event)
                .then(function () {
                    self.reloadSubDocumentFiles(self.grid.page);
                });
        };

        /**
         * @description Change the status of document file from grid
         * @param subDocumentFile
         */
        self.changeStatusSubDocumentFile = function (subDocumentFile) {
            self.statusServices[subDocumentFile.status](subDocumentFile)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    subDocumentFile.status = !subDocumentFile.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };
        /**
         * @description Change the status of selected document files
         * @param status
         */
        self.changeStatusBulkSubDocumentFiles = function (status) {
            var statusCheck = (status === 'activate');
            if (!generator.checkCollectionStatus(self.selectedSubDocumentFiles, statusCheck)) {
                toast.success(langService.get(statusCheck ? 'success_activate_selected' : 'success_deactivate_selected'));
                return;
            }
            self.statusServices[status](self.selectedSubDocumentFiles).then(function () {
                self.reloadSubDocumentFiles(self.grid.page).then(function () {
                    toast.success(langService.get('selected_status_updated'));
                });
            });
        };
        /**
         * @description show related organization
         */
        self.openOrganizationDialog = function (organization, subDocumentFile, $event) {
            documentFileNewService
                .controllerMethod
                .openOrganizationPopup(organization, subDocumentFile, $event)
                .then(function () {
                    self.reloadSubDocumentFiles(self.grid.page).then(function () {
                    });
                });
        };

        /**
         * @description search in sub document files.
         * @param searchText
         * @return {*}
         */
        self.searchInSubDocumentFiles = function (searchText) {
            if (!searchText)
                return;
            self.searchMode = true;
            return documentFileNewService
                .documentFileSearch(searchText, self.parentDocumentFile.id)
                .then(function (result) {
                    self.subDocumentFiles = result;
                });
        };

        self.replaceRecordFromGrid = function (subDocumentFile) {
            self.subDocumentFiles.splice(_.findIndex(self.subDocumentFiles, function (item) {
                return item.id === subDocumentFile.id;
            }), 1, subDocumentFile);
        };

    });
};