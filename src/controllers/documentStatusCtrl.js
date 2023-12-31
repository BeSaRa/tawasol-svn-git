module.exports = function (app) {
    app.controller('documentStatusCtrl', function (lookupService,
                                                   documentStatusService,
                                                   documentStatuses,
                                                   $q,
                                                   $filter,
                                                   $timeout,
                                                   generator,
                                                   toast,
                                                   langService,
                                                   contextHelpService,
                                                   dialog,
                                                   gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'documentStatusCtrl';
        self.documentStatuses = documentStatuses;
        self.documentStatusesCopy = angular.copy(self.documentStatuses);

        contextHelpService.setHelpTo('document-status');

        self.selectedDocumentStatus = [];

        /**
         * @description
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.documentStatus) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.documentStatus, self.documentStatuses),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.documentStatus, limit);
            },
            searchColumns: {
                arabicName: 'arName',
                englishName: 'enName',
                documentClasses: 'documentClassesString',
                itemOrder: 'itemOrder'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.documentStatuses = gridService.searchGridData(self.grid, self.documentStatusesCopy);
            }
        };

        self.statusServices = {
            'activate': documentStatusService.activateBulkDocumentStatus,
            'deactivate': documentStatusService.deactivateBulkDocumentStatus,
            'true': documentStatusService.activateDocumentStatus,
            'false': documentStatusService.deactivateDocumentStatus
        };
        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.documentStatuses = $filter('orderBy')(self.documentStatuses, self.grid.order);
        };

        /**
         * @description this method to reload the grid
         * @return {*|Promise<U>}
         */
        self.reloadDocumentStatuses = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return documentStatusService.loadDocumentStatuses().then(function (result) {
                self.documentStatuses = result;
                self.documentStatusesCopy = angular.copy(self.documentStatuses);
                self.selectedDocumentStatus = [];
                defer.resolve(true);
                if (pageNumber)
                    self.grid.page = pageNumber;
                self.getSortedData();
                return result;
            });
        };

        /**
         * @description open popup to add document status
         * @param $event
         */
        self.openAddDocumentStatusDialog = function ($event) {
            documentStatusService
                .controllerMethod
                .documentStatusAdd($event)
                .then(function (result) {
                    self.reloadDocumentStatuses(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('add_success').change({name: result.getNames()}));
                        });
                })
        };

        /**
         * @description remove bulk document statuses
         */
        self.removeDocumentStatuses = function ($event) {
            return documentStatusService
                .controllerMethod
                .documentStatusDeleteBulk(self.selectedDocumentStatus, $event)
                .then(function (result) {
                    self.reloadDocumentStatuses(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('add_success').change({name: result.getNames()}));
                        });
                })
        };

        /**
         * @description open popup to add document status
         * @param documentStatus
         * @param $event
         */
        self.openEditDocumentStatusDialog = function (documentStatus, $event) {
            documentStatusService
                .controllerMethod
                .documentStatusEdit(documentStatus, $event)
                .then(function (result) {
                    self.reloadDocumentStatuses(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getNames()}));
                        });
                })
        };

        /**
         * @description delete the document status
         * @param documentStatus
         * @param $event
         */
        self.removeDocumentStatus = function (documentStatus, $event) {
            return documentStatusService
                .controllerMethod
                .documentStatusDelete(documentStatus, $event).then(function () {
                    self.reloadDocumentStatuses(self.grid.page);
                });
        };

        /**
         * @description change the Bulk document statuses
         * @param status
         */
        self.changeBulkStatusDocumentStatuses = function (status) {
            self.statusServices[status](self.selectedDocumentStatus).then(function () {
                self.selectedDocumentStatus = [];
                toast.success(langService.get('selected_status_updated'));
                self.reloadDocumentStatuses(self.grid.page);
            });
        };

        /**
         * @description change the single document status
         * @param documentStatus
         */
        self.changeStatusForDocumentStatus = function (documentStatus) {
            self.statusServices[documentStatus.status](documentStatus)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    documentStatus.status = !documentStatus.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };
    });
};
