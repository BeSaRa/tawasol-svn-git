module.exports = function (app) {
    app.controller('documentTypeCtrl', function (lookupService,
                                                 documentTypeService,
                                                 documentTypes,
                                                 $q,
                                                 $filter,
                                                 langService,
                                                 errorCode,
                                                 toast,
                                                 contextHelpService,
                                                 dialog,
                                                 gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'documentTypeCtrl';
        contextHelpService.setHelpTo('document-types');

        /**
         * @description All document  types
         * @type {*}
         */
        self.documentTypes = documentTypes;
        self.documentTypesCopy = angular.copy(self.documentTypes);

        /**
         * @description Contains the selected document types
         * @type {Array}
         */
        self.selectedDocumentTypes = [];

        /**
         * @description
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.documentType) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.documentType, self.documentTypes),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.documentType, limit);
            },
            searchColumns: {
                arabicName: 'arName',
                englishName: 'enName',
                documentClasses: 'documentClassesString',
                itemOrder: 'itemOrder'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.documentTypes = gridService.searchGridData(self.grid, self.documentTypesCopy);
            }
        };

        self.statusServices = {
            'activate': documentTypeService.activateBulkDocumentTypes,
            'deactivate': documentTypeService.deactivateBulkDocumentTypes,
            'true': documentTypeService.activateDocumentType,
            'false': documentTypeService.deactivateDocumentType
        };

        /**
         * @description Opens dialog for add new document type
         * @param $event
         */
        self.openAddDocumentTypeDialog = function ($event) {
            documentTypeService
                .controllerMethod
                .documentTypeAdd($event)
                .then(function (result) {
                    self.reloadDocumentTypes(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('add_success').change({name: result.getNames()}));
                        });
                })
        };

        /**
         * @description Opens dialog for edit document type
         * @param documentType
         * @param $event
         */
        self.openEditDocumentTypeDialog = function (documentType, $event) {
            documentTypeService
                .controllerMethod
                .documentTypeEdit(documentType, $event)
                .then(function (result) {
                    self.reloadDocumentTypes(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getNames()}));
                        });
                });
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.documentTypes = $filter('orderBy')(self.documentTypes, self.grid.order);
        };

        /**
         * @description this method to reload the grid
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadDocumentTypes = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return documentTypeService
                .loadDocumentTypes()
                .then(function (result) {
                    self.documentTypes = result;
                    self.documentTypesCopy = angular.copy(self.documentTypes);
                    self.selectedDocumentTypes = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Delete single document type
         * @param documentType
         * @param $event
         */
        self.removeDocumentType = function (documentType, $event) {
            documentTypeService
                .controllerMethod
                .documentTypeDelete(documentType, $event)
                .then(function () {
                    self.reloadDocumentTypes(self.grid.page);
                })
                .catch(function (error) {
                    errorCode.checkIf(error, 'CAN_NOT_DELETE_LOOKUP', function () {
                        dialog.errorMessage(langService.get('cannot_delete_lookup').change({
                            lookup: langService.get('label_document_type'),
                            used: langService.get('other_places')
                        }), null, null, $event);
                    });
                });
        };

        /**
         * @description Delete multiple selected document types
         * @param $event
         */
        self.removeBulkDocumentTypes = function ($event) {
            documentTypeService
                .controllerMethod
                .documentTypeDeleteBulk(self.selectedDocumentTypes, $event)
                .then(function () {
                    self.reloadDocumentTypes(self.grid.page);
                });
        };

        /**
         * @description Change the status of document type
         * @param documentType
         */
        self.changeStatusDocumentType = function (documentType) {
            self.statusServices[documentType.status](documentType)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    documentType.status = !documentType.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                });
        };

        /**
         * @description Change the status of selected document types
         * @param status
         */
        self.changeStatusBulkDocumentTypes = function (status) {
            self.statusServices[status](self.selectedDocumentTypes)
                .then(function () {
                    self.reloadDocumentTypes(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('selected_status_updated'));
                        });
                });
        };

        /*/!**
         * @description Opens dialog for add distribution workflow
         * @param $event
         *!/
         self.openDistributionWorkflowDialog = function ($event) {
         documentTypeService
         .controllerMethod
         .distributionWorkflowAdd($event)
         /!*.then(function (result) {
         self.reloadDocumentTypes(self.grid.page)
         .then(function () {
         toast.success(langService.get('add_success').change({name: result.getNames()}));
         });
         })*!/
         };*/

    });
};
