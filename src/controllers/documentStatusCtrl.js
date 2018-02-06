module.exports = function (app) {
    app.controller('documentStatusCtrl', function (lookupService,
                                                   documentStatusService,
                                                   documentStatuses,
                                                   $q,
                                                   $timeout,
                                                   generator,
                                                   toast,
                                                   langService,
                                                   contextHelpService,
                                                   dialog) {
        'ngInject';
        var self = this;
        self.controllerName = 'documentStatusCtrl';
        self.documentStatuses = documentStatuses;

        contextHelpService.setHelpTo('document-status');

        self.selectedDocumentStatus = [];
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.documentStatuses.length + 21);
                    }
                }
            ]
        };

        self.statusServices = {
            'activate': documentStatusService.activateBulkDocumentStatus,
            'deactivate': documentStatusService.deactivateBulkDocumentStatus,
            'true': documentStatusService.activateDocumentStatus,
            'false': documentStatusService.deactivateDocumentStatus
        };

        /**
         * @description this method to reload the grid
         * @return {*|Promise<U>}
         */
        self.reloadDocumentStatuses = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return documentStatusService.loadDocumentStatuses().then(function (result) {
                self.documentStatuses = result;
                self.selectedDocumentStatus = [];
                defer.resolve(true);
                if (pageNumber)
                    self.grid.page = pageNumber;

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